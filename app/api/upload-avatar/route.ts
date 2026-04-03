import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const familyId = formData.get("familyId") as string | null

  if (!file || !familyId) return NextResponse.json({ error: "Missing file or familyId" }, { status: 400 })
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Max 5MB" }, { status: 400 })

  const adminClient = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

  // Upload to storage using service role
  const filename = `avatars/${familyId}.jpg`
  const { error: uploadError } = await adminClient.storage
    .from("city-photos")
    .upload(filename, file, { contentType: file.type, upsert: true, cacheControl: "31536000" })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = adminClient.storage.from("city-photos").getPublicUrl(filename)

  // Update family record
  await adminClient.from("families").update({
    avatar_url: publicUrl,
    updated_at: new Date().toISOString(),
  }).eq("id", familyId)

  return NextResponse.json({ url: publicUrl })
}
