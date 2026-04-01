import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { chatCompletion } from "@/lib/llm"

const CRON_SECRET = process.env.CRON_SECRET

export async function POST(req: NextRequest) {
  // Auth: cron secret or admin bearer token
  const cronSecret = req.headers.get("x-cron-secret")
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")

  let authorized = cronSecret === CRON_SECRET

  if (!authorized && token) {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } }
    )
    const { data: { user } } = await userClient.auth.getUser()
    if (user) {
      const { data: family } = await db.from("families").select("user_id").eq("user_id", user.id).single()
      authorized = !!family
    }
  }

  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: families } = await db
    .from("families")
    .select("id, family_name, kids_ages, real_budget_max, passport_tier, primary_anxiety, education_approach, travel_style, ai_profile_summary, next_destination_candidates, decision_stage, open_to_introductions")
    .eq("open_to_introductions", true)
    .not("primary_anxiety", "is", null)

  if (!families || families.length < 2) {
    return NextResponse.json({ message: "Not enough families", matched: 0 })
  }

  let matchCount = 0

  for (let i = 0; i < families.length; i++) {
    const a = families[i]
    let bestMatch: { family: typeof a; reasons: string[]; score: number } | null = null
    let bestScore = 0

    for (let j = 0; j < families.length; j++) {
      if (i === j) continue
      const b = families[j]

      // Check if already matched
      const { data: existing } = await db
        .from("family_matches")
        .select("id")
        .or(`and(family_a_id.eq.${a.id},family_b_id.eq.${b.id}),and(family_a_id.eq.${b.id},family_b_id.eq.${a.id})`)
        .limit(1)
        .maybeSingle()

      if (existing) continue

      let score = 0
      const reasons: string[] = []

      // Same primary anxiety
      if (a.primary_anxiety === b.primary_anxiety) {
        score += 30
        reasons.push(`both worry about ${a.primary_anxiety}`)
      }

      // Similar kids ages
      if (a.kids_ages?.length && b.kids_ages?.length) {
        const avgA = a.kids_ages.reduce((x: number, y: number) => x + y, 0) / a.kids_ages.length
        const avgB = b.kids_ages.reduce((x: number, y: number) => x + y, 0) / b.kids_ages.length
        if (Math.abs(avgA - avgB) <= 3) {
          score += 25
          reasons.push("kids similar ages")
        }
      }

      // Overlapping destination candidates
      const aDestinations = a.next_destination_candidates || []
      const bDestinations = b.next_destination_candidates || []
      const overlap = aDestinations.filter((d: string) => bDestinations.includes(d))
      if (overlap.length > 0) {
        score += 20
        reasons.push(`both considering ${overlap[0].replace(/-/g, " ")}`)
      }

      // Same passport tier (non-strong)
      if (a.passport_tier === b.passport_tier && a.passport_tier !== "strong") {
        score += 15
        reasons.push(`same passport tier (${a.passport_tier})`)
      }

      // Decision stage difference (mentorship potential)
      const stages = ["dreaming", "planning", "decided", "moving", "already-there"]
      const stageA = stages.indexOf(a.decision_stage || "")
      const stageB = stages.indexOf(b.decision_stage || "")
      if (stageA >= 0 && stageB >= 0 && Math.abs(stageA - stageB) >= 2) {
        score += 20
        reasons.push(`${b.family_name || "they"} are further ahead on this journey`)
      }

      if (score > bestScore) {
        bestScore = score
        bestMatch = { family: b, reasons, score }
      }
    }

    if (bestMatch && bestScore >= 40) {
      let matchReason = bestMatch.reasons.join(", ")
      try {
        matchReason = await chatCompletion([
          {
            role: "system",
            content: "Write one warm sentence explaining why these two families should meet. Be specific. Max 1 sentence."
          },
          {
            role: "user",
            content: `Family A: ${a.ai_profile_summary || a.family_name}, worries about ${a.primary_anxiety}, stage: ${a.decision_stage}
Family B: ${bestMatch.family.ai_profile_summary || bestMatch.family.family_name}, stage: ${bestMatch.family.decision_stage}
Shared: ${bestMatch.reasons.join(", ")}`
          }
        ])
      } catch {
        // Use fallback
      }

      await db.from("family_matches").insert({
        family_a_id: a.id,
        family_b_id: bestMatch.family.id,
        match_reason: matchReason.trim(),
        match_score: bestScore,
        match_type: bestMatch.reasons[0]?.includes("anxiety") ? "anxiety" :
                    bestMatch.reasons[0]?.includes("considering") ? "destination" : "trajectory",
        shared_context: bestMatch.reasons.join("; "),
      })

      matchCount++
    }
  }

  return NextResponse.json({ matched: matchCount, families: families.length })
}
