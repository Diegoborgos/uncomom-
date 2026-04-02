import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return NextResponse.json({ count: 0 })

  const userSupa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } }
  )
  const { data: { user } } = await userSupa.auth.getUser()
  if (!user) return NextResponse.json({ count: 0 })

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: myFamily } = await db.from("families").select("id").eq("user_id", user.id).maybeSingle()
  if (!myFamily) return NextResponse.json({ count: 0 })

  // Get all conversations I'm in
  const { data: convos } = await db
    .from("conversations")
    .select("id")
    .or(`family_a_id.eq.${myFamily.id},family_b_id.eq.${myFamily.id}`)

  if (!convos || convos.length === 0) return NextResponse.json({ count: 0 })

  const convoIds = convos.map(c => c.id)

  // Count unread messages across all conversations (not sent by me)
  const { count } = await db
    .from("messages")
    .select("id", { count: "exact", head: true })
    .in("conversation_id", convoIds)
    .neq("sender_id", myFamily.id)
    .is("read_at", null)

  return NextResponse.json({ count: count || 0 })
}
