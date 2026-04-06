import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { chatCompletion } from "@/lib/llm"
import { BriefingItem, CityBriefing } from "@/lib/intelligence-types"

export const maxDuration = 300

const ADMIN_EMAILS = ["hello@uncomun.com", "diego@diegoborgo.com"]

export async function GET(req: NextRequest) { return POST(req) }

export async function POST(req: NextRequest) {
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
  const targetFamilyId = body.familyId

  // Get families to process
  let families
  if (targetFamilyId) {
    const { data } = await supabase
      .from("families")
      .select("*")
      .eq("id", targetFamilyId)
      .single()
    families = data ? [data] : []
  } else {
    // Get ALL families that have at least one saved city
    const { data: familiesWithSaved } = await supabase
      .from("saved_cities")
      .select("family_id")

    const uniqueFamilyIds = Array.from(new Set((familiesWithSaved || []).map((r: { family_id: string }) => r.family_id)))

    if (uniqueFamilyIds.length > 0) {
      const { data } = await supabase
        .from("families")
        .select("*")
        .in("id", uniqueFamilyIds)
      families = data || []
    } else {
      families = []
    }
  }

  console.log(`[briefing] Found ${families.length} families:`, families.map((f: { id: string; family_name: string }) => ({ id: f.id, name: f.family_name })))

  const periodEnd = new Date()
  const periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const results: Record<string, { status: string; cities?: number; items?: number; error?: string }> = {}

  for (const family of families) {
    try {
      // Get this family's saved cities
      const { data: savedCities } = await supabase
        .from("saved_cities")
        .select("city_slug")
        .eq("family_id", family.id)

      // Also include next_destination_candidates from profile
      const watchedSlugs = new Set([
        ...(savedCities || []).map((sc: Record<string, string>) => sc.city_slug),
        ...(family.next_destination_candidates || []),
      ])

      console.log(`[briefing][${family.family_name}] Saved cities:`, savedCities?.map((sc: Record<string, string>) => sc.city_slug), 'next_dest:', family.next_destination_candidates)
      console.log(`[briefing][${family.family_name}] Watched slugs:`, Array.from(watchedSlugs))

      if (watchedSlugs.size === 0) {
        results[family.id] = { status: "no_watched_cities" }
        continue
      }

      // Get latest intelligence for watched cities
      const { data: intelligence } = await supabase
        .from("city_intelligence")
        .select("*")
        .in("city_slug", Array.from(watchedSlugs))
        .gte("generated_at", periodStart.toISOString())
        .order("generated_at", { ascending: false })

      if (!intelligence || intelligence.length === 0) {
        results[family.id] = { status: "no_intelligence" }
        continue
      }

      // Build family context for LLM
      const familyContext = [
        `Family: ${family.family_name}`,
        `Passports: ${family.passport_tier || "unknown"} (country: ${family.home_country})`,
        `Kids ages: ${(family.kids_ages || []).join(", ")}`,
        `Education: ${family.education_approach || "not specified"}`,
        `Travel style: ${family.travel_style || "not specified"}`,
        `Interests: ${(family.interests || []).join(", ")}`,
        `Budget: ${family.real_budget_min ? `€${family.real_budget_min}-€${family.real_budget_max}/mo` : "not specified"}`,
        `Top priorities: ${(family.top_priorities || []).join(", ")}`,
        `Deal breakers: ${(family.deal_breakers || []).join(", ")}`,
        `Departure horizon: ${family.departure_horizon || "not specified"}`,
      ].join("\n")

      // Build intelligence summaries per city
      const cityIntelSummaries = intelligence.map((intel: Record<string, unknown>) => {
        const mods = intel.dimension_modifiers as Record<string, number>
        const nonZeroMods = Object.entries(mods).filter(([, v]) => v !== 0).map(([k, v]) => `${k}: ${v > 0 ? "+" : ""}${v}`).join(", ")
        return [
          `## ${intel.city_slug}`,
          `Narrative: ${intel.city_narrative || "No update"}`,
          `Trend: ${intel.trend} (${intel.trend_reason || "no reason"})`,
          `Arrival curve: ${intel.arrival_curve}`,
          `Dimension changes: ${nonZeroMods || "none"}`,
          `Top signals: ${JSON.stringify((intel.top_signals as unknown[])?.slice(0, 3) || [])}`,
        ].join("\n")
      }).join("\n\n")

      // LLM generates personalized briefing
      const briefingResponse = await chatCompletion([
        {
          role: "system",
          content: `You create personalized weekly city intelligence briefings for traveling families.
Given a family's profile and intelligence data for their watched cities, create briefing items specifically relevant to THIS family.
Rules:
- Only include items that matter to this specific family (their passport, kids ages, education approach, interests, budget)
- Write each item as if speaking directly to the family
- Be concise and actionable
- Generate 3-8 items total

CRITICAL: Your entire response must be a valid JSON array and nothing else. No markdown, no backticks, no explanation, no preamble. Start with [ and end with ].
Each item in the array: {"citySlug":"slug","type":"visa|education|cost|safety|activity|legal|community|general","headline":"short headline","detail":"2-3 sentence explanation","dimension":"dimensionKey or null","relevance":"high|medium|low","reason":"why this matters to this family"}`,
        },
        {
          role: "user",
          content: `FAMILY PROFILE:\n${familyContext}\n\nCITY INTELLIGENCE:\n${cityIntelSummaries}\n\nGenerate the personalized briefing items.`,
        },
      ])

      // Parse response
      let items: BriefingItem[] = []
      let parseError: string | null = null

      const raw = briefingResponse.trim()

      // Attempt 1: direct parse
      try {
        items = JSON.parse(raw)
      } catch {
        // Attempt 2: strip markdown fences
        try {
          const cleaned = raw.replace(/```json\s*|```/g, "").trim()
          items = JSON.parse(cleaned)
        } catch {
          // Attempt 3: extract first [...] from response
          const firstBracket = raw.indexOf('[')
          const lastBracket = raw.lastIndexOf(']')
          if (firstBracket !== -1 && lastBracket > firstBracket) {
            try {
              items = JSON.parse(raw.slice(firstBracket, lastBracket + 1))
            } catch {
              parseError = `All 3 parse attempts failed. Raw (first 300 chars): ${raw.slice(0, 300)}`
            }
          } else {
            parseError = `No JSON array found in response. Raw (first 300 chars): ${raw.slice(0, 300)}`
          }
        }
      }

      if (parseError || items.length === 0) {
        console.error(`[briefing][${family.id}] ${parseError || "Empty items array"}`)
        results[family.id] = { status: "parse_error", error: parseError || "Empty result" }
        continue
      }

      // Group by city
      const byCityMap: Record<string, BriefingItem[]> = {}
      for (const item of items) {
        const slug = (item as unknown as { citySlug: string }).citySlug || "general"
        if (!byCityMap[slug]) byCityMap[slug] = []
        byCityMap[slug].push(item)
      }

      const cityBriefings: CityBriefing[] = Object.entries(byCityMap).map(([slug, cityItems]) => ({
        citySlug: slug,
        cityName: slug, // will be resolved in UI
        items: cityItems,
      }))

      // Store briefing
      await supabase.from("family_briefings").upsert({
        family_id: family.id,
        briefing_items: cityBriefings,
        headline: `${items.length} update${items.length !== 1 ? "s" : ""} across your watched cities`,
        total_items: items.length,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
      }, { onConflict: "family_id,period_start" })

      results[family.id] = { status: "ok", cities: watchedSlugs.size, items: items.length }

      await new Promise(resolve => setTimeout(resolve, 3000))

    } catch (err) {
      console.error(`[briefing][${family.id}] FAILED:`, String(err))
      results[family.id] = { status: "error", error: String(err) }
    }
  }

  return NextResponse.json({
    families: families.length,
    processed: Object.values(results).filter(r => r.status === "ok").length,
    results,
  })
}
