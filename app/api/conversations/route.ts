import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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

// GET — list my conversations with last message + unread count + other family info
export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: { user } } = await userClient(token).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = adminClient()
  const { data: myFamily } = await db.from("families").select("id").eq("user_id", user.id).maybeSingle()
  if (!myFamily) return NextResponse.json({ conversations: [] })

  // Get all conversations I'm part of
  const { data: convos } = await db
    .from("conversations")
    .select("*")
    .or(`family_a_id.eq.${myFamily.id},family_b_id.eq.${myFamily.id}`)
    .order("last_message_at", { ascending: false, nullsFirst: false })

  if (!convos || convos.length === 0) return NextResponse.json({ conversations: [] })

  // Get other family info + unread counts
  const result = []
  for (const convo of convos) {
    const otherId = convo.family_a_id === myFamily.id ? convo.family_b_id : convo.family_a_id

    const { data: otherFamily } = await db
      .from("families")
      .select("id, family_name, username, avatar_url, country_code")
      .eq("id", otherId)
      .single()

    const { count: unread } = await db
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", convo.id)
      .neq("sender_id", myFamily.id)
      .is("read_at", null)

    result.push({
      id: convo.id,
      otherFamily: otherFamily || { id: otherId, family_name: "Unknown", username: null, avatar_url: null, country_code: "" },
      lastMessageText: convo.last_message_text,
      lastMessageAt: convo.last_message_at,
      unreadCount: unread || 0,
    })
  }

  return NextResponse.json({ conversations: result, myFamilyId: myFamily.id })
}

// POST — get or create a conversation with a target family
export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: { user } } = await userClient(token).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { targetFamilyId } = await req.json()
  if (!targetFamilyId) return NextResponse.json({ error: "targetFamilyId required" }, { status: 400 })

  const db = adminClient()
  const { data: myFamily } = await db.from("families").select("id").eq("user_id", user.id).maybeSingle()
  if (!myFamily) return NextResponse.json({ error: "No family" }, { status: 404 })
  if (myFamily.id === targetFamilyId) return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 })

  // Check if conversation already exists (either direction)
  const { data: existing } = await db
    .from("conversations")
    .select("id")
    .or(`and(family_a_id.eq.${myFamily.id},family_b_id.eq.${targetFamilyId}),and(family_a_id.eq.${targetFamilyId},family_b_id.eq.${myFamily.id})`)
    .maybeSingle()

  if (existing) return NextResponse.json({ conversationId: existing.id })

  // Create new conversation (alphabetically ordered to prevent duplicates)
  const [a, b] = [myFamily.id, targetFamilyId].sort()
  const { data: newConvo, error } = await db
    .from("conversations")
    .insert({ family_a_id: a, family_b_id: b })
    .select("id")
    .single()

  if (error) {
    // Race condition — conversation was created between check and insert
    if (error.code === "23505") {
      const { data: retry } = await db
        .from("conversations")
        .select("id")
        .or(`and(family_a_id.eq.${myFamily.id},family_b_id.eq.${targetFamilyId}),and(family_a_id.eq.${targetFamilyId},family_b_id.eq.${myFamily.id})`)
        .single()
      return NextResponse.json({ conversationId: retry?.id })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ conversationId: newConvo.id })
}
