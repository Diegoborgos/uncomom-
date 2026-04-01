import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getRecommendations, ConciergeInput } from "@/lib/concierge"

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  // Verify user
  const userClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

  // Get family
  const { data: family } = await supabase.from("families").select("*").eq("user_id", user.id).single()
  if (!family) return NextResponse.json({ error: "No family profile" }, { status: 404 })

  // Get intelligence
  const { data: intelligence } = await supabase
    .from("family_intelligence")
    .select("*")
    .eq("family_id", family.id)
    .single()

  // Get trips
  const { data: trips } = await supabase
    .from("trips")
    .select("city_slug, status")
    .eq("family_id", family.id)

  const currentTrip = trips?.find((t) => t.status === "here_now")

  // Build input
  const input: ConciergeInput = {
    family: {
      name: family.family_name || "",
      country: family.home_country || "",
      kidsAges: family.kids_ages || [],
      education: family.education_approach || "",
      travelStyle: family.travel_style || "",
      interests: family.interests || [],
      languages: family.languages || [],
      bio: family.bio || "",
    },
    intelligence: intelligence ? {
      topCandidateCities: (intelligence.top_candidate_cities as string[]) || [],
      dismissedCities: (intelligence.dismissed_cities as string[]) || [],
      primaryAnxiety: (intelligence.primary_anxiety as string) || "",
      decisionStage: (intelligence.decision_stage as string) || "exploring",
      realBudgetMax: (intelligence.real_budget_max as number) || 3000,
      continentPreference: (intelligence.continent_preference as string) || "",
      engagement: (intelligence.platform_engagement as string) || "new",
    } : null,
    trips: (trips || []).map((t) => ({ citySlug: t.city_slug, status: t.status })),
    currentCity: currentTrip?.city_slug || null,
  }

  const recommendations = await getRecommendations(input)

  return NextResponse.json({ recommendations })
}
