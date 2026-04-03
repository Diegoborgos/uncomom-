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

// POST — follow a family
export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: { user } } = await userClient(token).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { targetFamilyId } = await req.json()
  if (!targetFamilyId) return NextResponse.json({ error: "targetFamilyId required" }, { status: 400 })

  const db = adminClient()
  const { data: myFamily } = await db.from("families").select("id").eq("user_id", user.id).single()
  if (!myFamily) return NextResponse.json({ error: "No family" }, { status: 404 })
  if (myFamily.id === targetFamilyId) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })

  const { error } = await db.from("family_follows").insert({
    follower_id: myFamily.id,
    following_id: targetFamilyId,
  })

  if (error?.code === "23505") return NextResponse.json({ ok: true }) // already following
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

// DELETE — unfollow a family
export async function DELETE(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: { user } } = await userClient(token).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { targetFamilyId } = await req.json()
  if (!targetFamilyId) return NextResponse.json({ error: "targetFamilyId required" }, { status: 400 })

  const db = adminClient()
  const { data: myFamily } = await db.from("families").select("id").eq("user_id", user.id).single()
  if (!myFamily) return NextResponse.json({ error: "No family" }, { status: 404 })

  await db.from("family_follows")
    .delete()
    .eq("follower_id", myFamily.id)
    .eq("following_id", targetFamilyId)

  return NextResponse.json({ ok: true })
}
