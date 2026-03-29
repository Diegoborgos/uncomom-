import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { textSearch } from "@/lib/google-places"

const ADMIN_EMAILS = ["hello@uncomun.com", "diego@diegoborgo.com"]

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

  let authorized = false
  if (token) {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user } } = await userClient.auth.getUser()
    if (user?.email && ADMIN_EMAILS.includes(user.email)) authorized = true
  }

  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return NextResponse.json({ error: "GOOGLE_PLACES_API_KEY not set" }, { status: 500 })

  const { citySlug } = await req.json()
  if (!citySlug) return NextResponse.json({ error: "citySlug required" }, { status: 400 })

  const { data: city } = await supabase
    .from("cities")
    .select("slug, lat, lng, name, country")
    .eq("slug", citySlug)
    .single()

  if (!city?.lat || !city?.lng) return NextResponse.json({ error: "City not found" }, { status: 404 })

  try {
    const results = await textSearch(`${city.name} ${city.country}`, city.lat, city.lng, 20000)

    if (!results.length) {
      return NextResponse.json({ error: "No Google results for this city", query: `${city.name} ${city.country}` }, { status: 404 })
    }

    const photo = results[0]?.photos?.[0]
    if (!photo) {
      return NextResponse.json({ error: "Google result has no photo", place: results[0]?.name }, { status: 404 })
    }

    await supabase
      .from("cities")
      .update({ photo, updated_at: new Date().toISOString() })
      .eq("slug", citySlug)

    return NextResponse.json({ success: true, photo, place: results[0]?.name })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
