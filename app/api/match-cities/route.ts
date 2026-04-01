import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cities } from "@/data/cities"
import { calculatePersonalFIS, calculateDefaultFIS } from "@/lib/fis"
import { chatCompletion } from "@/lib/llm"

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

  const isPersonalised = !!(family?.primary_anxiety)

  const ranked = cities.map(city => {
    const result = isPersonalised && city.signals
      ? calculatePersonalFIS(city, family, {
          primaryAnxiety: family.primary_anxiety,
          realBudgetMax: family.real_budget_max,
        })
      : calculateDefaultFIS(city)

    return {
      slug: city.slug,
      name: city.name,
      country: city.country,
      countryCode: city.countryCode,
      continent: city.continent,
      photo: city.photo,
      tags: city.tags,
      cost: city.cost,
      score: result.score,
      topStrengths: result.topStrengths,
      personalizedInsight: "personalizedInsight" in result ? result.personalizedInsight : null,
      adjustedFor: "adjustedFor" in result ? result.adjustedFor : [],
      isPersonal: isPersonalised,
    }
  }).sort((a, b) => b.score - a.score)

  // LLM writes personalised intro for top cities
  let personalIntro = ""
  if (isPersonalised && ranked.length > 0) {
    try {
      personalIntro = await chatCompletion([
        {
          role: "system",
          content: "Write a 2-sentence personalised intro for city recommendations. Warm, specific, reference their situation. No generic phrases."
        },
        {
          role: "user",
          content: `Family: kids ${family.kids_ages?.join(", ")} yo, budget €${family.real_budget_max}/mo, worry: ${family.primary_anxiety}, passport: ${family.passport_tier}, style: ${family.travel_style}.
Top city: ${ranked[0]?.name} (score ${ranked[0]?.score}). Why: ${ranked[0]?.personalizedInsight}

2 sentences. Reference their actual situation.`
        }
      ])
    } catch {
      // Non-critical
    }
  }

  return NextResponse.json({
    cities: ranked,
    top5: ranked.slice(0, 5),
    personalIntro: personalIntro.trim(),
    isPersonalised,
    familyProfile: family ? {
      name: family.family_name,
      kidsAges: family.kids_ages,
      budget: family.real_budget_max,
      primaryAnxiety: family.primary_anxiety,
      passportTier: family.passport_tier,
      decisionStage: family.decision_stage,
      aiSummary: family.ai_profile_summary,
    } : null,
  })
}
