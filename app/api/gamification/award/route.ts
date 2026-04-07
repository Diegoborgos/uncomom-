import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { POINT_VALUES, BADGES, getLevelForPoints } from "@/lib/gamification"
import type { BadgeDef } from "@/lib/gamification"

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

// Get current ISO week string (e.g. "2026-W15")
function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`
}

// Parse ISO week string to week number for comparison
function parseWeek(w: string): { year: number; week: number } {
  const [year, week] = w.split("-W").map(Number)
  return { year, week }
}

function weeksApart(a: string, b: string): number {
  const pa = parseWeek(a)
  const pb = parseWeek(b)
  return (pa.year - pb.year) * 52 + (pa.week - pb.week)
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: { user } } = await userClient(token).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = adminClient()

  // Get family
  const { data: family } = await db.from("families").select("id, total_points, level").eq("user_id", user.id).single()
  if (!family) return NextResponse.json({ error: "No family" }, { status: 404 })

  const { action, description } = await req.json()
  const pointValue = POINT_VALUES[action]
  if (pointValue === undefined) {
    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  }

  // 1. Insert point record
  await db.from("family_points").insert({
    family_id: family.id,
    amount: pointValue,
    action,
    description: description || null,
  })

  // 2. Calculate new total and level
  const newTotal = (family.total_points || 0) + pointValue
  const oldLevel = family.level || 1
  const levelResult = getLevelForPoints(newTotal)
  const leveledUp = levelResult.current.level > oldLevel

  // 3. Update family
  await db.from("families").update({
    total_points: newTotal,
    level: levelResult.current.level,
  }).eq("id", family.id)

  // 4. Check badge eligibility
  const newBadges: BadgeDef[] = []
  const { data: existingBadges } = await db
    .from("family_badges")
    .select("badge_key")
    .eq("family_id", family.id)
  const earned = new Set((existingBadges || []).map((b: { badge_key: string }) => b.badge_key))

  async function tryAward(key: string) {
    if (earned.has(key)) return
    const badge = BADGES[key]
    if (!badge) return
    const { error } = await db.from("family_badges").insert({
      family_id: family.id,
      badge_key: key,
    })
    if (!error) newBadges.push(badge)
  }

  // Onboarding
  if (action === "complete_onboarding") await tryAward("first_steps")

  // Field reports
  if (action === "field_report") {
    await tryAward("first_report")
    const { count } = await db
      .from("city_field_reports")
      .select("id", { count: "exact", head: true })
      .eq("family_id", family.id)
    if ((count || 0) >= 5) await tryAward("scout")
    if ((count || 0) >= 10) await tryAward("intel_officer")
  }

  // City reviews
  if (action === "city_review") {
    const { count } = await db
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("family_id", family.id)
    if ((count || 0) >= 5) await tryAward("reviewer")
  }

  // Messaging
  if (action === "send_message") await tryAward("connector")

  // Meetups
  if (action === "post_meetup") await tryAward("host")

  // Trips
  if (action === "log_trip") {
    const { count } = await db
      .from("trips")
      .select("id", { count: "exact", head: true })
      .eq("family_id", family.id)
    if ((count || 0) >= 3) await tryAward("globe_trotter")
    if ((count || 0) >= 10) await tryAward("world_citizen")
  }

  // Level-based badges
  if (levelResult.current.level >= 2) await tryAward("pathfinder")
  if (levelResult.current.level >= 5) await tryAward("ambassador")

  // Points-based badges
  if (newTotal >= 2000) await tryAward("top_contributor")

  // 5. Update streak
  const currentWeek = getISOWeek(new Date())
  const { data: streak } = await db
    .from("family_streaks")
    .select("*")
    .eq("family_id", family.id)
    .maybeSingle()

  let currentStreak = 1

  if (streak) {
    if (streak.last_activity_week === currentWeek) {
      // Same week — no streak change
      currentStreak = streak.current_streak
    } else {
      const gap = weeksApart(currentWeek, streak.last_activity_week)
      if (gap === 1) {
        // Consecutive week
        currentStreak = streak.current_streak + 1
      } else if (gap === 2 && streak.streak_freezes_remaining > 0) {
        // One week gap with freeze available
        currentStreak = streak.current_streak + 1
        await db.from("family_streaks").update({
          current_streak: currentStreak,
          longest_streak: Math.max(currentStreak, streak.longest_streak),
          last_activity_week: currentWeek,
          streak_freezes_remaining: streak.streak_freezes_remaining - 1,
        }).eq("family_id", family.id)
      } else {
        // Streak broken
        currentStreak = 1
      }

      if (gap === 1 || (gap > 2) || (gap === 2 && streak.streak_freezes_remaining <= 0)) {
        await db.from("family_streaks").update({
          current_streak: currentStreak,
          longest_streak: Math.max(currentStreak, streak.longest_streak),
          last_activity_week: currentWeek,
        }).eq("family_id", family.id)
      }
    }
  } else {
    // First activity — create streak record
    await db.from("family_streaks").insert({
      family_id: family.id,
      current_streak: 1,
      longest_streak: 1,
      last_activity_week: currentWeek,
      streak_freezes_remaining: 1,
    })
  }

  return NextResponse.json({
    points: pointValue,
    totalPoints: newTotal,
    level: levelResult.current,
    leveledUp,
    newBadges,
    streak: currentStreak,
  })
}
