import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Get family_id
  const { data: family } = await supabase.from("families").select("id").eq("user_id", user.id).maybeSingle()
  if (!family) return NextResponse.json({ notifications: [], unread: 0 })

  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20")
  const unreadOnly = req.nextUrl.searchParams.get("unread") === "true"

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("family_id", family.id)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (unreadOnly) {
    query = query.eq("read", false)
  }

  const { data: notifications } = await query

  // Get unread count
  const { count: unread } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("family_id", family.id)
    .eq("read", false)

  return NextResponse.json({ notifications: notifications || [], unread: unread || 0 })
}

export async function PATCH(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  if (body.markAllRead) {
    // Mark all as read
    const { data: family } = await supabase.from("families").select("id").eq("user_id", user.id).maybeSingle()
    if (family) {
      await supabase.from("notifications").update({ read: true }).eq("family_id", family.id).eq("read", false)
    }
  } else if (body.notificationId) {
    // Mark single as read
    await supabase.from("notifications").update({ read: true }).eq("id", body.notificationId)
  }

  return NextResponse.json({ ok: true })
}
