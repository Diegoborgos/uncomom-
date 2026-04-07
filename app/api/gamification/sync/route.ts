import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { POINT_VALUES, getLevelForPoints } from "@/lib/gamification"

const ADMIN_EMAILS = ["hello@uncomun.com", "diego@diegoborgo.com"]

function userClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } }
  )
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: { user } } = await userClient(token).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = adminClient()

  // Check if admin is syncing a specific family
  let familyId: string | null = null
  try {
    const body = await req.json()
    familyId = body.familyId || null
  } catch {
    // No body — sync own family
  }

  let family
  if (familyId && ADMIN_EMAILS.includes(user.email || "")) {
    // Admin syncing a specific family
    const { data } = await db.from("families").select("*").eq("id", familyId).maybeSingle()
    family = data
  } else {
    // Regular user syncing their own family
    const { data } = await db.from("families").select("*").eq("user_id", user.id).maybeSingle()
    family = data
  }

  if (!family) return NextResponse.json({ error: "No family" }, { status: 404 })

  // Get existing badges
  const { data: existingBadges } = await db.from("family_badges").select("badge_key").eq("family_id", family.id)
  const earned = new Set((existingBadges || []).map((b: { badge_key: string }) => b.badge_key))

  // Count existing activity
  const [tripRes, reviewRes, reportRes, savedRes, totalFamiliesRes] = await Promise.all([
    db.from("trips").select("id", { count: "exact", head: true }).eq("family_id", family.id),
    db.from("reviews").select("id", { count: "exact", head: true }).eq("family_id", family.id),
    db.from("city_field_reports").select("id", { count: "exact", head: true }).eq("family_id", family.id),
    db.from("saved_cities").select("id", { count: "exact", head: true }).eq("family_id", family.id),
    db.from("families").select("id", { count: "exact", head: true }),
  ])

  const tripCount = tripRes.count || 0
  const reviewCount = reviewRes.count || 0
  const reportCount = reportRes.count || 0
  const savedCount = savedRes.count || 0
  const totalFamilies = totalFamiliesRes.count || 0

  // Determine which badges should be awarded
  const newBadges: string[] = []

  function tryAward(key: string) {
    if (!earned.has(key)) newBadges.push(key)
  }

  // Journey badges
  if (family.onboarding_complete) tryAward("first_steps")
  if (tripCount >= 3) tryAward("globe_trotter")
  if (tripCount >= 10) tryAward("world_citizen")
  if ((family.languages?.length || 0) >= 3) tryAward("polyglot")
  if (savedCount >= 10) tryAward("culture_collector")

  // Contribution badges
  if (reportCount >= 1) tryAward("first_report")
  if (reportCount >= 5) tryAward("scout")
  if (reportCount >= 10) tryAward("intel_officer")
  if (reviewCount >= 5) tryAward("reviewer")

  // Status badges
  if (totalFamilies <= 100) tryAward("pioneer")

  // Calculate retroactive points
  let totalPoints = 0
  if (family.onboarding_complete) totalPoints += POINT_VALUES.complete_onboarding
  totalPoints += tripCount * POINT_VALUES.log_trip
  totalPoints += reviewCount * POINT_VALUES.city_review
  totalPoints += reportCount * POINT_VALUES.field_report
  totalPoints += savedCount * POINT_VALUES.save_city

  const levelResult = getLevelForPoints(totalPoints)

  // Level-based badges
  if (levelResult.current.level >= 2) tryAward("pathfinder")
  if (levelResult.current.level >= 5) tryAward("ambassador")
  if (totalPoints >= 2000) tryAward("top_contributor")

  // Award new badges
  for (const key of newBadges) {
    await db.from("family_badges").upsert(
      { family_id: family.id, badge_key: key },
      { onConflict: "family_id,badge_key" }
    )
  }

  // Update family points and level (only if higher than existing)
  const finalPoints = Math.max(totalPoints, family.total_points || 0)
  const finalLevel = getLevelForPoints(finalPoints)

  await db.from("families").update({
    total_points: finalPoints,
    level: finalLevel.current.level,
  }).eq("id", family.id)

  return NextResponse.json({
    synced: true,
    totalPoints: finalPoints,
    level: finalLevel.current,
    badgesAwarded: newBadges,
    existingBadges: earned.size,
    activity: { trips: tripCount, reviews: reviewCount, reports: reportCount, saved: savedCount },
  })
}
