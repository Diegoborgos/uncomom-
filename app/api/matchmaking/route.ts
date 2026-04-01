import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Family } from "@/lib/database.types"

export type FamilyMatch = {
  family: Pick<Family, "id" | "family_name" | "country_code" | "kids_ages" | "travel_style" | "education_approach" | "interests" | "bio">
  score: number
  reasons: string[]
  currentCity: string | null
}

function scoreMatch(me: Family, other: Family, myTrips: string[], otherTrips: string[]): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  // Kids age overlap (±2 years) — strongest signal
  const myAges = me.kids_ages || []
  const theirAges = other.kids_ages || []
  let ageMatches = 0
  for (const myAge of myAges) {
    for (const theirAge of theirAges) {
      if (Math.abs(myAge - theirAge) <= 2) ageMatches++
    }
  }
  if (ageMatches > 0) {
    score += ageMatches * 15
    reasons.push(`Kids similar ages`)
  }

  // Education match
  if (me.education_approach && me.education_approach === other.education_approach) {
    score += 20
    reasons.push(`Both ${me.education_approach.toLowerCase()}`)
  }

  // Travel style match
  if (me.travel_style && me.travel_style === other.travel_style) {
    score += 10
    reasons.push(`Same travel pace`)
  }

  // Shared interests
  const myInterests = new Set(me.interests || [])
  const sharedInterests = (other.interests || []).filter((i) => myInterests.has(i))
  if (sharedInterests.length >= 2) {
    score += sharedInterests.length * 5
    reasons.push(`${sharedInterests.length} shared interests`)
  }

  // Same city overlap (trips)
  const myTripSet = new Set(myTrips)
  const sharedCities = otherTrips.filter((c) => myTripSet.has(c))
  if (sharedCities.length > 0) {
    score += sharedCities.length * 8
    reasons.push(`${sharedCities.length} cities in common`)
  }

  // Language overlap
  const myLangs = new Set(me.languages || [])
  const sharedLangs = (other.languages || []).filter((l) => myLangs.has(l))
  if (sharedLangs.length > 0) {
    score += sharedLangs.length * 3
  }

  return { score: Math.min(100, score), reasons }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const userClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

  // Get my family
  const { data: myFamily } = await supabase.from("families").select("*").eq("user_id", user.id).single()
  if (!myFamily) return NextResponse.json({ error: "No family profile" }, { status: 404 })

  // Get my trips
  const { data: myTrips } = await supabase.from("trips").select("city_slug").eq("family_id", myFamily.id)
  const myTripSlugs = (myTrips || []).map((t) => t.city_slug)

  // Get all other families (with onboarding complete)
  const { data: allFamilies } = await supabase
    .from("families")
    .select("id, username, family_name, country_code, kids_ages, travel_style, education_approach, interests, languages, bio")
    .eq("onboarding_complete", true)
    .neq("id", myFamily.id)
    .limit(100)

  if (!allFamilies || allFamilies.length === 0) {
    return NextResponse.json({ matches: [] })
  }

  // Get all trips for matching
  const familyIds = allFamilies.map((f) => f.id)
  const { data: allTrips } = await supabase
    .from("trips")
    .select("family_id, city_slug, status")
    .in("family_id", familyIds)

  const tripsByFamily: Record<string, { slugs: string[]; currentCity: string | null }> = {}
  allTrips?.forEach((t) => {
    if (!tripsByFamily[t.family_id]) tripsByFamily[t.family_id] = { slugs: [], currentCity: null }
    tripsByFamily[t.family_id].slugs.push(t.city_slug)
    if (t.status === "here_now") tripsByFamily[t.family_id].currentCity = t.city_slug
  })

  // Score all families
  const matches: FamilyMatch[] = allFamilies
    .map((other) => {
      const otherTrips = tripsByFamily[other.id]?.slugs || []
      const { score, reasons } = scoreMatch(myFamily as Family, other as Family, myTripSlugs, otherTrips)
      return {
        family: other,
        score,
        reasons,
        currentCity: tripsByFamily[other.id]?.currentCity || null,
      }
    })
    .filter((m) => m.score >= 20) // Minimum match threshold
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)

  return NextResponse.json({ matches })
}
