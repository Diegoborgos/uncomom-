import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { uploadCityPhoto } from "@/lib/storage"

const ADMIN_EMAILS = ["hello@uncomun.com", "diego@diegoborgo.com"]

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
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const citySlug = formData.get("citySlug") as string | null

  if (!file || !citySlug) return NextResponse.json({ error: "Missing file or citySlug" }, { status: 400 })
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 })
  if (!["image/jpeg", "image/webp", "image/png"].includes(file.type)) {
    return NextResponse.json({ error: "Use JPEG, WebP, or PNG" }, { status: 400 })
  }

  const { url, error } = await uploadCityPhoto(citySlug, file, file.type)
  if (error) return NextResponse.json({ error }, { status: 500 })

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  await adminClient
    .from("cities")
    .update({ photo: url, updated_at: new Date().toISOString() })
    .eq("slug", citySlug)

  return NextResponse.json({ url, citySlug })
}
