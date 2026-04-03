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

// GET — fetch messages for a conversation + mark unread as read
export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: { user } } = await userClient(token).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const conversationId = req.nextUrl.searchParams.get("conversationId")
  if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 })

  const db = adminClient()
  const { data: myFamily } = await db.from("families").select("id").eq("user_id", user.id).maybeSingle()
  if (!myFamily) return NextResponse.json({ error: "No family" }, { status: 404 })

  // Verify user is part of this conversation
  const { data: convo } = await db
    .from("conversations")
    .select("id, family_a_id, family_b_id")
    .eq("id", conversationId)
    .single()

  if (!convo || (convo.family_a_id !== myFamily.id && convo.family_b_id !== myFamily.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Fetch messages
  const { data: messages } = await db
    .from("messages")
    .select("id, sender_id, text, read_at, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(200)

  // Mark unread messages from the other person as read
  await db
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", myFamily.id)
    .is("read_at", null)

  return NextResponse.json({ messages: messages || [], myFamilyId: myFamily.id })
}

// POST — send a message
export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: { user } } = await userClient(token).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { conversationId, text } = await req.json()
  if (!conversationId || !text?.trim()) return NextResponse.json({ error: "conversationId and text required" }, { status: 400 })

  const db = adminClient()
  const { data: myFamily } = await db.from("families").select("id").eq("user_id", user.id).maybeSingle()
  if (!myFamily) return NextResponse.json({ error: "No family" }, { status: 404 })

  // Verify user is part of this conversation
  const { data: convo } = await db
    .from("conversations")
    .select("id, family_a_id, family_b_id")
    .eq("id", conversationId)
    .single()

  if (!convo || (convo.family_a_id !== myFamily.id && convo.family_b_id !== myFamily.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Insert message
  const { data: message, error } = await db
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: myFamily.id,
      text: text.trim(),
    })
    .select("id, sender_id, text, created_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update conversation preview
  await db
    .from("conversations")
    .update({
      last_message_text: text.trim().slice(0, 100),
      last_message_at: new Date().toISOString(),
    })
    .eq("id", conversationId)

  return NextResponse.json({ message })
}
