import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const ADMIN_EMAILS = ["hello@uncomun.com", "diego@diegoborgo.com"]
const BUCKET = "city-photos"

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const userClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: { user } } = await userClient.auth.getUser()
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

  // Get all cities with their current photo URLs
  const { data: cities } = await supabase
    .from("cities")
    .select("slug, photo")
    .order("name")

  if (!cities) return NextResponse.json({ error: "No cities found" }, { status: 404 })

  let success = 0
  let skipped = 0
  let failed = 0
  const results: Array<{ slug: string; status: string; url?: string }> = []

  for (const city of cities) {
    // Skip if already on Supabase Storage
    if (city.photo?.includes("supabase.co/storage")) {
      skipped++
      results.push({ slug: city.slug, status: "skipped (already on Supabase)" })
      continue
    }

    // Skip if no photo URL
    if (!city.photo) {
      skipped++
      results.push({ slug: city.slug, status: "skipped (no photo)" })
      continue
    }

    try {
      // Download from current URL (Unsplash or Google)
      const res = await fetch(city.photo, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Uncomun/1.0)" },
      })
      if (!res.ok) throw new Error(`Download failed: ${res.status}`)

      const buffer = await res.arrayBuffer()
      const bytes = new Uint8Array(buffer)

      // Upload to Supabase Storage
      const filename = `${city.slug}.jpg`
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filename, bytes, {
          contentType: "image/jpeg",
          upsert: true,
          cacheControl: "31536000",
        })

      if (uploadError) throw new Error(`Upload: ${uploadError.message}`)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filename)

      // Update DB
      await supabase
        .from("cities")
        .update({ photo: publicUrl, updated_at: new Date().toISOString() })
        .eq("slug", city.slug)

      success++
      results.push({ slug: city.slug, status: "migrated", url: publicUrl })

      // Rate limit
      await new Promise((r) => setTimeout(r, 300))
    } catch (err) {
      failed++
      results.push({ slug: city.slug, status: `failed: ${String(err)}` })
    }
  }

  return NextResponse.json({ success, skipped, failed, total: cities.length, results })
}
