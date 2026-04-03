import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  findSimilarTrajectories,
  generateTrajectoryInsights,
  generateTrajectoryNarrative
} from "@/lib/trajectory-engine"

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")

  let family = null

  if (token) {
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } }
    )
    const { data: { user } } = await userClient.auth.getUser()
    if (user) {
      const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
      const { data } = await db.from("families").select("*").eq("user_id", user.id).single()
      family = data
    }
  }

  const body = await req.json().catch(() => ({}))
  const profile = {
    kidsAges: family?.kids_ages || body.kidsAges,
    budgetMax: family?.real_budget_max || body.budgetMax,
    passportTier: family?.passport_tier || body.passportTier,
    primaryAnxiety: family?.primary_anxiety || body.primaryAnxiety,
    educationApproach: family?.education_approach || body.educationApproach,
    travelStyle: family?.travel_style || body.travelStyle,
  }

  const [insights, trajectories] = await Promise.all([
    generateTrajectoryInsights(profile),
    findSimilarTrajectories(profile, 10),
  ])

  const narrative = insights.length > 0
    ? await generateTrajectoryNarrative(profile, insights)
    : ""

  const advice = trajectories
    .filter(t => t.adviceForFamiliesLikeUs)
    .map(t => t.adviceForFamiliesLikeUs!)
    .slice(0, 3)

  const surprises = trajectories
    .filter(t => t.biggestSurprise)
    .map(t => t.biggestSurprise!)
    .slice(0, 3)

  return NextResponse.json({
    narrative,
    insights,
    advice,
    surprises,
    sampleSize: trajectories.length,
    profile,
  })
}
