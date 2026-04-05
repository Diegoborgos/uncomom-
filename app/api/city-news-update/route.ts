import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { fetchGdelt } from "@/lib/api-integrations"
import { chatCompletion } from "@/lib/llm"

export const maxDuration = 300 // 5 minutes

const ADMIN_EMAILS = ["hello@uncomun.com", "diego@diegoborgo.com"]

// Family-relevant topic keywords for filtering
const FAMILY_TOPICS = [
  "school", "education", "children", "family", "safety", "crime",
  "healthcare", "hospital", "visa", "immigration", "expat",
  "cost of living", "rent", "housing", "pollution", "air quality",
  "playground", "park", "transport", "digital nomad", "coworking",
  "homeschool", "international school", "childcare", "kindergarten",
]

export async function GET(req: NextRequest) {
  return POST(req)
}

export async function POST(req: NextRequest) {
  // Auth: same pattern as refresh-public-data
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

  // Get body for optional single-city mode
  const body = await req.json().catch(() => ({}))
  const targetSlug = body.citySlug

  // Get cities to process
  let cities: Array<{ slug: string; name: string; country: string }>
  if (targetSlug) {
    const { data } = await supabase
      .from("cities")
      .select("slug, name, country")
      .eq("slug", targetSlug)
      .single()
    if (!data) return NextResponse.json({ error: "City not found" }, { status: 404 })
    cities = [data]
  } else {
    const { data } = await supabase
      .from("cities")
      .select("slug, name, country")
      .order("name")
    cities = data || []
  }

  const results: Record<string, { articles: number; relevant: number; summary: string | null; error?: string }> = {}

  for (const city of cities) {
    try {
      console.log(`[news] Processing ${city.slug}...`)

      // 1. Fetch GDELT news
      const gdelt = await fetchGdelt(city.name, city.country)

      if (gdelt.articles.length === 0) {
        results[city.slug] = { articles: 0, relevant: 0, summary: null }
        continue
      }

      // 2. Filter for family-relevant articles using title keyword matching
      const relevant = gdelt.articles.filter(article => {
        const titleLower = article.title.toLowerCase()
        return FAMILY_TOPICS.some(topic => titleLower.includes(topic))
      })

      // If no relevant articles, still store the count but skip LLM
      if (relevant.length === 0) {
        results[city.slug] = { articles: gdelt.articles.length, relevant: 0, summary: null }

        // Store raw article count as a signal
        await supabase.from("city_data_sources").upsert({
          city_slug: city.slug,
          signal_key: "news.weeklyArticleCount",
          signal_value: String(gdelt.articles.length),
          source_name: "GDELT",
          source_url: `https://api.gdeltproject.org/api/v2/doc/doc?query="${encodeURIComponent(city.name)}"&mode=ArtList&timespan=7d`,
          source_type: "public_api",
          fetched_at: new Date().toISOString(),
          valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          confidence: 70,
        }, { onConflict: "city_slug,signal_key", ignoreDuplicates: false })

        continue
      }

      // 3. Use LLM to write a family-focused city update
      const articleSummaries = relevant.slice(0, 10).map(a =>
        `- "${a.title}" (${a.source}, ${a.publishDate})`
      ).join("\n")

      const summary = await chatCompletion([
        {
          role: "system",
          content: `You are a city intelligence analyst for traveling families. Write a concise 2-3 sentence update about what's happening in ${city.name}, ${city.country} that would matter to a family considering living there. Focus on: safety changes, cost of living, education, healthcare, visa/immigration policy, environment, community. Be factual and specific. No fluff. If nothing is actionable for families, say so in one sentence.`,
        },
        {
          role: "user",
          content: `Here are this week's relevant news articles about ${city.name}:\n\n${articleSummaries}\n\nWrite the city update.`,
        },
      ])

      results[city.slug] = {
        articles: gdelt.articles.length,
        relevant: relevant.length,
        summary: summary || null,
      }

      // 4. Store the update
      await supabase.from("city_data_sources").upsert({
        city_slug: city.slug,
        signal_key: "news.weeklyUpdate",
        signal_value: JSON.stringify({
          summary,
          articleCount: gdelt.articles.length,
          relevantCount: relevant.length,
          topArticles: relevant.slice(0, 5).map(a => ({ title: a.title, url: a.url, source: a.source })),
          generatedAt: new Date().toISOString(),
        }),
        source_name: "GDELT + Groq",
        source_url: "https://www.gdeltproject.org/",
        source_type: "public_api",
        fetched_at: new Date().toISOString(),
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        confidence: 60, // LLM-generated summaries are lower confidence
      }, { onConflict: "city_slug,signal_key", ignoreDuplicates: false })

      // Store article count separately
      await supabase.from("city_data_sources").upsert({
        city_slug: city.slug,
        signal_key: "news.weeklyArticleCount",
        signal_value: String(gdelt.articles.length),
        source_name: "GDELT",
        source_url: `https://api.gdeltproject.org/api/v2/doc/doc?query="${encodeURIComponent(city.name)}"&mode=ArtList&timespan=7d`,
        source_type: "public_api",
        fetched_at: new Date().toISOString(),
        valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        confidence: 70,
      }, { onConflict: "city_slug,signal_key", ignoreDuplicates: false })

      // Small delay between cities to respect GDELT + Groq rate limits
      await new Promise(resolve => setTimeout(resolve, 2000))

    } catch (err) {
      console.error(`[news][${city.slug}] FAILED:`, String(err))
      results[city.slug] = { articles: 0, relevant: 0, summary: null, error: String(err) }
    }
  }

  const totalWithUpdates = Object.values(results).filter(r => r.summary).length
  console.log(`[news] Done: ${cities.length} cities, ${totalWithUpdates} with updates`)

  return NextResponse.json({
    cities: cities.length,
    withUpdates: totalWithUpdates,
    results,
  })
}
