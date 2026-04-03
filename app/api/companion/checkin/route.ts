import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateCompanionCheckin, extractFromConversation } from "@/lib/family-intelligence"

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } }
  )
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { answer, trigger, context } = await req.json()
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

  const { data: family } = await db.from("families").select("*").eq("user_id", user.id).single()
  if (!family) return NextResponse.json({ error: "No family" }, { status: 404 })

  // If this is an answer to a previous question, extract intelligence
  if (answer && family.companion_next_question) {
    const fakeConversation = [
      { role: "assistant", content: family.companion_next_question },
      { role: "user", content: answer },
    ]
    const extracted = await extractFromConversation(fakeConversation, {
      primary_anxiety: family.primary_anxiety,
      decision_stage: family.decision_stage,
    })

    if (Object.keys(extracted).length > 0) {
      await db.from("families").update({
        ...extracted,
        ai_last_extracted: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", family.id)
    }

    await db.from("companion_checkins").insert({
      family_id: family.id,
      trigger_type: trigger || "manual",
      question_asked: family.companion_next_question,
      answer_given: answer,
      intelligence_extracted: extracted,
    })
  }

  // Generate next question
  const nextQuestion = await generateCompanionCheckin(family, trigger || "routine", context)

  await db.from("families").update({
    companion_next_question: nextQuestion,
    companion_last_checkin: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", family.id)

  return NextResponse.json({ question: nextQuestion })
}
