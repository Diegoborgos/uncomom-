import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cities } from "@/data/cities"

/**
 * Nightly intelligence pipeline.
 * Reads family_events → updates family_intelligence for each family.
 * Trigger via cron or admin panel.
 */

// GET handler for Vercel Cron
export async function GET(req: NextRequest) {
  return POST(req)
}

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get("x-cron-secret")
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

  // Auth: cron secret (header or bearer) or admin session
  let authorized = cronSecret === process.env.CRON_SECRET || token === process.env.CRON_SECRET
  if (!authorized && token) {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user } } = await userClient.auth.getUser()
    if (user?.email && ["hello@uncomun.com", "diego@diegoborgo.com"].includes(user.email)) authorized = true
  }
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Get all families
  const { data: families } = await supabase.from("families").select("id, kids_ages").order("created_at")
  if (!families) return NextResponse.json({ error: "No families" }, { status: 404 })

  let processed = 0
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  for (const family of families) {
    // Get all events for this family
    const { data: events } = await supabase
      .from("family_events")
      .select("event_type, event_data, created_at")
      .eq("family_id", family.id)
      .order("created_at", { ascending: false })
      .limit(500)

    if (!events || events.length === 0) continue

    // Get trips
    const { data: trips } = await supabase
      .from("trips")
      .select("city_slug, status")
      .eq("family_id", family.id)

    const hasTrips = (trips?.length || 0) > 0
    const isHereNow = trips?.some((t) => t.status === "here_now")

    // Analyze city views
    const cityViewCounts: Record<string, number> = {}
    const sectionViewCounts: Record<string, number> = {}
    let recentEvents = 0

    for (const event of events) {
      const data = event.event_data as Record<string, string> | null
      if (new Date(event.created_at) > new Date(thirtyDaysAgo)) recentEvents++

      if (event.event_type === "city_viewed" && data?.citySlug) {
        cityViewCounts[data.citySlug] = (cityViewCounts[data.citySlug] || 0) + 1
      }
      if (event.event_type === "city_card_clicked" && data?.citySlug) {
        cityViewCounts[data.citySlug] = (cityViewCounts[data.citySlug] || 0) + 1
      }
      if (event.event_type === "section_viewed" && data?.section) {
        sectionViewCounts[data.section] = (sectionViewCounts[data.section] || 0) + 1
      }
    }

    // Top candidate cities (viewed 3+ times)
    const topCities = Object.entries(cityViewCounts)
      .filter(([, count]) => count >= 3)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([slug]) => slug)

    // Dismissed cities (viewed once, never returned)
    const dismissedCities = Object.entries(cityViewCounts)
      .filter(([, count]) => count === 1)
      .map(([slug]) => slug)

    // Primary anxiety — inferred from section views and search patterns
    let primaryAnxiety = "unknown"
    const anxietyScores: Record<string, number> = {
      cost: (sectionViewCounts["cost"] || 0) + (sectionViewCounts["calculator"] || 0),
      safety: (sectionViewCounts["safety"] || 0) + (sectionViewCounts["healthcare"] || 0),
      school: (sectionViewCounts["education"] || 0) + (sectionViewCounts["schools"] || 0),
      community: (sectionViewCounts["community"] || 0) + (sectionViewCounts["families"] || 0),
    }
    const topAnxiety = Object.entries(anxietyScores).sort(([, a], [, b]) => b - a)[0]
    if (topAnxiety && topAnxiety[1] > 2) primaryAnxiety = topAnxiety[0]

    // Decision stage
    let decisionStage = "exploring"
    if (isHereNow) decisionStage = "committed"
    else if (hasTrips) decisionStage = "experienced"
    else if (topCities.length >= 2) decisionStage = "comparing"
    else if (topCities.length >= 1) decisionStage = "researching"

    // Real budget — median cost of viewed cities
    const viewedCityCosts = Object.keys(cityViewCounts)
      .map((slug) => cities.find((c) => c.slug === slug)?.cost.familyMonthly)
      .filter(Boolean) as number[]
    const realBudgetMax = viewedCityCosts.length > 0
      ? viewedCityCosts.sort((a, b) => a - b)[Math.floor(viewedCityCosts.length / 2)]
      : null

    // Continent preference
    const continentCounts: Record<string, number> = {}
    Object.keys(cityViewCounts).forEach((slug) => {
      const city = cities.find((c) => c.slug === slug)
      if (city) continentCounts[city.continent] = (continentCounts[city.continent] || 0) + cityViewCounts[slug]
    })
    const continentPreference = Object.entries(continentCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || null

    // Engagement level
    const engagement = recentEvents > 50 ? "high" : recentEvents > 10 ? "medium" : "low"

    // Upsert intelligence
    await supabase.from("family_intelligence").upsert({
      family_id: family.id,
      top_candidate_cities: topCities,
      dismissed_cities: dismissedCities.slice(0, 10),
      primary_anxiety: primaryAnxiety,
      decision_stage: decisionStage,
      real_budget_max: realBudgetMax,
      continent_preference: continentPreference,
      platform_engagement: engagement,
      last_active_at: events[0]?.created_at || null,
      sessions_last_30d: recentEvents,
      updated_at: new Date().toISOString(),
    }, { onConflict: "family_id" })

    processed++
  }

  return NextResponse.json({ processed, total: families.length })
}
