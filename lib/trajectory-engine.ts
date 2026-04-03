// lib/trajectory-engine.ts
// Finds what families like yours actually did.
// Mines trips, field reports, and family profiles to build real paths.

import { createClient } from "@supabase/supabase-js"
import { chatCompletion } from "./llm"

export type FamilyProfile = {
  kidsAges?: number[]
  budgetMax?: number
  passportTier?: string
  primaryAnxiety?: string
  educationApproach?: string
  travelStyle?: string
}

export type Trajectory = {
  citySequence: string[]
  durationsMonths: number[]
  budgetTier: string
  passportTier: string
  primaryAnxiety: string
  kidsAgesAtMove: number[]
  wouldDoAgain: boolean | null
  biggestSurprise: string | null
  adviceForFamiliesLikeUs: string | null
  stillTraveling: boolean
}

export type TrajectoryInsight = {
  statement: string
  confidence: number
  basedOn: number
}

function budgetTier(max?: number): string {
  if (!max) return "unknown"
  if (max < 2500) return "tight"
  if (max < 3500) return "comfortable"
  if (max < 6000) return "generous"
  return "premium"
}

function dbClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// Build trajectory records from existing trip data
export async function buildTrajectoriesFromTrips(): Promise<void> {
  const supabase = dbClient()

  const { data: families } = await supabase
    .from("families")
    .select("id, kids_ages, real_budget_max, passport_tier, primary_anxiety, education_approach, travel_style")
    .not("id", "is", null)

  if (!families) return

  for (const family of families) {
    const { data: trips } = await supabase
      .from("trips")
      .select("*")
      .eq("family_id", family.id)
      .order("arrived_at", { ascending: true })

    if (!trips || trips.length < 2) continue

    const citySequence = trips.map(t => t.city_slug)
    const durationsMonths = trips.map(t => {
      if (!t.arrived_at) return 0
      const end = t.left_at ? new Date(t.left_at) : new Date()
      const start = new Date(t.arrived_at)
      return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))
    })

    await supabase.from("family_trajectories").upsert({
      family_id: family.id,
      kids_ages_at_move: family.kids_ages || [],
      budget_tier: budgetTier(family.real_budget_max),
      passport_tier: family.passport_tier || "unknown",
      education_approach: family.education_approach || "unknown",
      primary_anxiety: family.primary_anxiety || "unknown",
      travel_style: family.travel_style || "unknown",
      city_sequence: citySequence,
      durations_months: durationsMonths,
      first_city: citySequence[0] || null,
      second_city: citySequence[1] || null,
      third_city: citySequence[2] || null,
      still_traveling: trips.some(t => t.status === "here_now"),
      updated_at: new Date().toISOString(),
    }, { onConflict: "family_id" })
  }
}

// Find trajectories similar to a given family profile
export async function findSimilarTrajectories(
  profile: FamilyProfile,
  limit = 50
): Promise<Trajectory[]> {
  const supabase = dbClient()

  let query = supabase
    .from("family_trajectories")
    .select("*")
    .limit(limit)

  if (profile.passportTier) {
    query = query.eq("passport_tier", profile.passportTier)
  }
  if (profile.primaryAnxiety) {
    query = query.eq("primary_anxiety", profile.primaryAnxiety)
  }
  if (profile.budgetMax) {
    query = query.eq("budget_tier", budgetTier(profile.budgetMax))
  }

  const { data } = await query

  return (data || []).map(row => ({
    citySequence: row.city_sequence || [],
    durationsMonths: row.durations_months || [],
    budgetTier: row.budget_tier,
    passportTier: row.passport_tier,
    primaryAnxiety: row.primary_anxiety,
    kidsAgesAtMove: row.kids_ages_at_move || [],
    wouldDoAgain: row.would_do_again,
    biggestSurprise: row.biggest_surprise,
    adviceForFamiliesLikeUs: row.advice_for_families_like_us,
    stillTraveling: row.still_traveling,
  }))
}

// Generate human-readable trajectory insights
export async function generateTrajectoryInsights(
  profile: FamilyProfile
): Promise<TrajectoryInsight[]> {
  const trajectories = await findSimilarTrajectories(profile, 200)
  if (trajectories.length < 3) return []

  const insights: TrajectoryInsight[] = []

  // First city distribution
  const firstCities: Record<string, number> = {}
  trajectories.forEach(t => {
    if (t.citySequence[0]) {
      firstCities[t.citySequence[0]] = (firstCities[t.citySequence[0]] || 0) + 1
    }
  })
  const topFirst = Object.entries(firstCities).sort((a, b) => b[1] - a[1])[0]
  if (topFirst) {
    const pct = Math.round(topFirst[1] / trajectories.length * 100)
    insights.push({
      statement: `${pct}% of families with your profile start in ${topFirst[0].replace(/-/g, " ")}`,
      confidence: Math.min(95, 50 + trajectories.length),
      basedOn: trajectories.length,
    })
  }

  // Second city after first
  if (topFirst) {
    const secondAfterFirst: Record<string, number> = {}
    trajectories
      .filter(t => t.citySequence[0] === topFirst[0] && t.citySequence[1])
      .forEach(t => {
        const second = t.citySequence[1]
        secondAfterFirst[second] = (secondAfterFirst[second] || 0) + 1
      })
    const topSecond = Object.entries(secondAfterFirst).sort((a, b) => b[1] - a[1])[0]
    if (topSecond) {
      const subGroup = trajectories.filter(t => t.citySequence[0] === topFirst[0]).length
      const pct = Math.round(topSecond[1] / subGroup * 100)
      insights.push({
        statement: `Of those, ${pct}% move to ${topSecond[0].replace(/-/g, " ")} next`,
        confidence: Math.min(90, 40 + subGroup),
        basedOn: subGroup,
      })
    }
  }

  // Average stay duration
  const firstDurations = trajectories
    .map(t => t.durationsMonths[0])
    .filter(d => d > 0)
  if (firstDurations.length > 0) {
    const avg = Math.round(firstDurations.reduce((a, b) => a + b, 0) / firstDurations.length)
    insights.push({
      statement: `Families like yours typically stay ${avg} months in their first city`,
      confidence: Math.min(85, 40 + firstDurations.length),
      basedOn: firstDurations.length,
    })
  }

  // Would do again
  const withOutcome = trajectories.filter(t => t.wouldDoAgain !== null)
  if (withOutcome.length >= 5) {
    const pct = Math.round(withOutcome.filter(t => t.wouldDoAgain).length / withOutcome.length * 100)
    insights.push({
      statement: `${pct}% say they'd do it again`,
      confidence: Math.min(90, 40 + withOutcome.length),
      basedOn: withOutcome.length,
    })
  }

  return insights
}

// Use LLM to generate a narrative from trajectory data
export async function generateTrajectoryNarrative(
  profile: FamilyProfile,
  insights: TrajectoryInsight[]
): Promise<string> {
  if (insights.length === 0) return ""

  const response = await chatCompletion([
    {
      role: "system",
      content: "Write concise family travel insights. 2 sentences max. Specific, warm, data-driven."
    },
    {
      role: "user",
      content: `Write a 2-sentence narrative for a family about what families like theirs actually did.

Family profile: budget ${profile.budgetMax ? "€" + profile.budgetMax + "/mo" : "unknown"}, passport: ${profile.passportTier || "unknown"}, main worry: ${profile.primaryAnxiety || "unknown"}, kids: ${profile.kidsAges?.join(", ") || "unknown"} years old.

Data points:
${insights.map(i => `- ${i.statement} (based on ${i.basedOn} families)`).join("\n")}

Write 2 warm, specific sentences. Start with "Families like yours..." Reference actual data. No generic phrases.`
    }
  ])

  return response.trim()
}
