import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cities } from "@/data/cities"
import { classifyArticles, GdeltArticle } from "@/lib/article-classifier"
import { extractionCompletion } from "@/lib/llm"
import { FISDimensionKey } from "@/lib/types"
import { DIMENSION_LABELS } from "@/lib/fis"

export const maxDuration = 600

const ADMIN_EMAILS = ["hello@uncomun.com", "diego@diegoborgo.com"]

const ALL_DIMENSIONS: FISDimensionKey[] = [
  "childSafety", "educationAccess", "familyCost", "healthcare",
  "nature", "community", "remoteWork", "visa", "lifestyle",
]

// Stub until GDELT integration is added to api-integrations.ts
async function fetchGdelt(cityName: string, country: string): Promise<{ articles: GdeltArticle[] }> {
  const query = encodeURIComponent(`${cityName} ${country}`)
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=artlist&maxrecords=20&format=json`
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return { articles: [] }
    const data = await res.json()
    return {
      articles: (data.articles || []).map((a: Record<string, string>) => ({
        title: a.title || "",
        url: a.url || "",
        source: a.domain || a.source || "",
        publishDate: a.seendate || a.dateadded || "",
      })),
    }
  } catch {
    return { articles: [] }
  }
}

export async function GET(req: NextRequest) { return POST(req) }

export async function POST(req: NextRequest) {
  // Auth: same pattern as /api/intelligence/update
  const cronSecret = req.headers.get("x-cron-secret")
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

  let authorized = cronSecret === process.env.CRON_SECRET || token === process.env.CRON_SECRET
  if (!authorized && token) {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user } } = await userClient.auth.getUser()
    if (user?.email && ADMIN_EMAILS.includes(user.email)) authorized = true
  }

  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const targetSlug = body.citySlug

  const citiesToProcess = targetSlug
    ? cities.filter(c => c.slug === targetSlug)
    : cities

  const periodEnd = new Date()
  const periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const results: Record<string, { status: string; signals?: number; articles?: number; error?: string }> = {}

  for (const city of citiesToProcess) {
    try {
      console.log(`[engine] Processing ${city.slug}...`)

      // 1. Get recent data source changes
      const { data: recentSources } = await supabase
        .from("city_data_sources")
        .select("signal_key, signal_value, source_name, fetched_at")
        .eq("city_slug", city.slug)
        .gte("fetched_at", periodStart.toISOString())
        .order("fetched_at", { ascending: false })

      // 2. Fetch and classify GDELT articles
      let classifiedArticles: Awaited<ReturnType<typeof classifyArticles>> = []
      try {
        const gdelt = await fetchGdelt(city.name, city.country)
        if (gdelt.articles.length > 0) {
          classifiedArticles = await classifyArticles(gdelt.articles, city.name, city.country)

          // Store classified articles
          for (const article of classifiedArticles) {
            await supabase.from("classified_articles").upsert({
              city_slug: city.slug,
              title: article.title,
              url: article.url,
              source_domain: article.sourceDomain,
              publish_date: article.publishDate || null,
              dimension: article.dimension,
              sentiment: article.sentiment,
              relevance_score: article.relevanceScore,
              family_summary: article.familySummary,
            }, { onConflict: "city_slug,url" })
          }
        }
      } catch (err) {
        console.warn(`[engine][${city.slug}] GDELT/classification failed:`, err)
      }

      // 3. Get recent family reports
      const { data: recentReports } = await supabase
        .from("city_field_reports")
        .select("fields_extracted, created_at, source")
        .eq("city_slug", city.slug)
        .gte("created_at", periodStart.toISOString())
        .in("status", ["complete", "reviewed"])

      // 4. Build context for LLM synthesis
      const dataChanges = (recentSources || []).map((s: Record<string, string>) =>
        `- ${s.source_name}: ${s.signal_key} = ${s.signal_value} (${s.fetched_at})`
      ).join("\n") || "No data source changes this period."

      const articleSummaries = classifiedArticles.map(a =>
        `- [${a.dimension || "general"}/${a.sentiment}] ${a.familySummary} (relevance: ${a.relevanceScore}/10)`
      ).join("\n") || "No family-relevant news articles this period."

      const reportSummaries = (recentReports || []).map((r: Record<string, string>) =>
        `- Family report (${r.source}): ${JSON.stringify(r.fields_extracted || {}).slice(0, 200)}`
      ).join("\n") || "No new family reports this period."

      // 5. LLM synthesis — dimension modifiers + narrative + trend
      const synthesisResponse = await extractionCompletion([
        {
          role: "system",
          content: `You are the Uncomun city intelligence engine. Analyze this week's data for ${city.name}, ${city.country} and produce a structured intelligence output.

You must respond with ONLY valid JSON, no markdown, no backticks. The JSON object must have these exact keys:

{
  "dimensionModifiers": {
    "childSafety": 0, "educationAccess": 0, "familyCost": 0, "healthcare": 0,
    "nature": 0, "community": 0, "remoteWork": 0, "visa": 0, "lifestyle": 0
  },
  "cityNarrative": "2-3 sentence update for parents considering this city. Be specific and actionable. Mention concrete changes.",
  "trend": "stable",
  "trendReason": "One sentence explaining the trend.",
  "arrivalCurve": "established",
  "topSignals": [
    {"type": "news|api|family_report|legal_change", "source": "source name", "headline": "short headline", "dimension": "dimensionKey", "sentiment": "positive|negative|neutral"}
  ],
  "dataGaps": [
    {"field": "healthcare.emergencyNarrative", "label": "Emergency care experience", "dimension": "healthcare", "priority": "high|medium|low"}
  ]
}

Rules for dimensionModifiers:
- Range: -10 to +10 per dimension
- 0 = no change. Only non-zero when there's clear evidence.
- Negative = worse for families. Positive = better for families.
- Be conservative. A single news article about crime doesn't warrant -5.

Rules for trend:
- "heating" = increasing interest, new facilities, improving conditions
- "cooling" = rising costs, declining safety, families leaving
- "stable" = no significant directional change

Rules for arrivalCurve:
- "emerging" = few families, basic infrastructure, pioneering
- "established" = solid community, good infrastructure, known quantity
- "trending" = rapid growth, prices may be moving, buzz
- "saturated" = crowded, expensive, may be past peak

Rules for dataGaps:
- Identify the 2-3 most important missing data points that family reports could fill
- Focus on fields where API data can't reach: real emergency experiences, school enrollment reality, actual visa processing times`,
        },
        {
          role: "user",
          content: `City: ${city.name}, ${city.country}

DATA SOURCE CHANGES THIS WEEK:
${dataChanges}

FAMILY-RELEVANT NEWS:
${articleSummaries}

NEW FAMILY REPORTS:
${reportSummaries}

Current city tags: ${city.tags.join(", ")}
Current FIS dimensions: ${ALL_DIMENSIONS.map(d => `${DIMENSION_LABELS[d]}: ${city.signals?.[d] !== undefined ? "has data" : "no data"}`).join(", ")}

Generate the intelligence output.`,
        },
      ])

      // Parse LLM response
      const cleaned = synthesisResponse.replace(/```json\s*|```/g, "").trim()
      let synthesis
      try {
        synthesis = JSON.parse(cleaned)
      } catch {
        console.error(`[engine][${city.slug}] Failed to parse LLM response:`, cleaned.slice(0, 200))
        results[city.slug] = { status: "parse_error", error: "LLM response not valid JSON" }
        continue
      }

      // 6. Store in city_intelligence
      await supabase.from("city_intelligence").upsert({
        city_slug: city.slug,
        dimension_modifiers: synthesis.dimensionModifiers || {},
        city_narrative: synthesis.cityNarrative || null,
        trend: synthesis.trend || "stable",
        trend_reason: synthesis.trendReason || null,
        arrival_curve: synthesis.arrivalCurve || "established",
        top_signals: synthesis.topSignals || [],
        classified_articles: classifiedArticles.slice(0, 10),
        data_gaps: synthesis.dataGaps || [],
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
      }, { onConflict: "city_slug,period_start" })

      results[city.slug] = {
        status: "ok",
        signals: (recentSources || []).length,
        articles: classifiedArticles.length,
      }

      // Rate limit between cities
      await new Promise(resolve => setTimeout(resolve, 3000))

    } catch (err) {
      console.error(`[engine][${city.slug}] FAILED:`, String(err))
      results[city.slug] = { status: "error", error: String(err) }
    }
  }

  return NextResponse.json({
    cities: citiesToProcess.length,
    processed: Object.values(results).filter(r => r.status === "ok").length,
    results,
  })
}
