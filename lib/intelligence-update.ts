import type { SupabaseClient } from "@supabase/supabase-js"
import { cities } from "@/data/cities"

export type IntelligenceUpdateResult = {
  processed: number
  total: number
}

export async function runIntelligenceUpdate(
  supabase: SupabaseClient,
): Promise<IntelligenceUpdateResult> {
  const { data: families } = await supabase.from("families").select("id, kids_ages").order("created_at")
  if (!families) return { processed: 0, total: 0 }

  let processed = 0
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  for (const family of families) {
    const { data: events } = await supabase
      .from("family_events")
      .select("event_type, event_data, created_at")
      .eq("family_id", family.id)
      .order("created_at", { ascending: false })
      .limit(500)

    if (!events || events.length === 0) continue

    const { data: trips } = await supabase
      .from("trips")
      .select("city_slug, status")
      .eq("family_id", family.id)

    const hasTrips = (trips?.length || 0) > 0
    const isHereNow = trips?.some((t) => t.status === "here_now")

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

    const topCities = Object.entries(cityViewCounts)
      .filter(([, count]) => count >= 3)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([slug]) => slug)

    const dismissedCities = Object.entries(cityViewCounts)
      .filter(([, count]) => count === 1)
      .map(([slug]) => slug)

    let primaryAnxiety = "unknown"
    const anxietyScores: Record<string, number> = {
      cost: (sectionViewCounts["cost"] || 0) + (sectionViewCounts["calculator"] || 0),
      safety: (sectionViewCounts["safety"] || 0) + (sectionViewCounts["healthcare"] || 0),
      school: (sectionViewCounts["education"] || 0) + (sectionViewCounts["schools"] || 0),
      community: (sectionViewCounts["community"] || 0) + (sectionViewCounts["families"] || 0),
    }
    const topAnxiety = Object.entries(anxietyScores).sort(([, a], [, b]) => b - a)[0]
    if (topAnxiety && topAnxiety[1] > 2) primaryAnxiety = topAnxiety[0]

    let decisionStage = "exploring"
    if (isHereNow) decisionStage = "committed"
    else if (hasTrips) decisionStage = "experienced"
    else if (topCities.length >= 2) decisionStage = "comparing"
    else if (topCities.length >= 1) decisionStage = "researching"

    const viewedCityCosts = Object.keys(cityViewCounts)
      .map((slug) => cities.find((c) => c.slug === slug)?.cost.familyMonthly)
      .filter(Boolean) as number[]
    const realBudgetMax = viewedCityCosts.length > 0
      ? viewedCityCosts.sort((a, b) => a - b)[Math.floor(viewedCityCosts.length / 2)]
      : null

    const continentCounts: Record<string, number> = {}
    Object.keys(cityViewCounts).forEach((slug) => {
      const city = cities.find((c) => c.slug === slug)
      if (city) continentCounts[city.continent] = (continentCounts[city.continent] || 0) + cityViewCounts[slug]
    })
    const continentPreference = Object.entries(continentCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || null

    const engagement = recentEvents > 50 ? "high" : recentEvents > 10 ? "medium" : "low"

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

  return { processed, total: families.length }
}
