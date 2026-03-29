import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || ""
const ADMIN_EMAILS = ["hello@uncomun.com", "diego@diegoborgo.com"]

const SCHOOL_SEARCHES = [
  "international school",
  "private school",
  "montessori school",
  "waldorf school",
  "bilingual school",
  "british school",
  "american school",
  "IB school",
  "forest school",
  "alternative school",
]

async function searchSchools(keyword: string, lat: number, lng: number) {
  const body = {
    textQuery: `${keyword}`,
    locationBias: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: 15000, // 15km — schools can be further out
      },
    },
    maxResultCount: 10,
    languageCode: "en",
    includedType: "school",
  }

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName,places.rating,places.userRatingCount,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.photos,places.location,places.types,places.editorialSummary,places.reviews",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Places API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.places || []
}

// Infer school type from name and search keyword
function inferSchoolType(name: string, keyword: string): string {
  const lower = name.toLowerCase() + " " + keyword.toLowerCase()
  if (lower.includes("montessori")) return "Montessori"
  if (lower.includes("waldorf") || lower.includes("steiner")) return "Waldorf"
  if (lower.includes("forest")) return "Forest School"
  if (lower.includes("bilingual")) return "Bilingual"
  if (lower.includes("british")) return "British"
  if (lower.includes("american")) return "American"
  if (lower.includes("international") || lower.includes("ib")) return "International"
  if (lower.includes("alternative") || lower.includes("democratic")) return "Alternative"
  if (lower.includes("private")) return "Private"
  return "International"
}

// Infer curriculum from name
function inferCurriculum(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes("ib") || lower.includes("international baccalaureate")) return "IB"
  if (lower.includes("british") || lower.includes("cambridge")) return "British"
  if (lower.includes("american") || lower.includes("us curriculum")) return "American"
  if (lower.includes("montessori")) return "Montessori"
  if (lower.includes("waldorf") || lower.includes("steiner")) return "Waldorf"
  if (lower.includes("french") || lower.includes("lycée")) return "French"
  return ""
}

export async function POST(req: NextRequest) {
  // Auth: accept cron secret OR admin session token
  const cronSecret = req.headers.get("x-cron-secret")
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

  let authorized = cronSecret === process.env.CRON_SECRET

  if (!authorized && token) {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user } } = await userClient.auth.getUser()
    if (user?.email && ADMIN_EMAILS.includes(user.email)) authorized = true
  }

  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!API_KEY) return NextResponse.json({ error: "GOOGLE_PLACES_API_KEY not set" }, { status: 500 })

  const { citySlug } = await req.json()
  if (!citySlug) return NextResponse.json({ error: "citySlug required" }, { status: 400 })

  const { data: city } = await supabase
    .from("cities")
    .select("slug, lat, lng, name")
    .eq("slug", citySlug)
    .single()

  if (!city?.lat || !city?.lng) return NextResponse.json({ error: "City not found" }, { status: 404 })

  try {
    // Rate limit: skip if this city was refreshed in the last 24 hours
    const { data: existing } = await supabase
      .from("city_schools")
      .select("cached_at")
      .eq("city_slug", citySlug)
      .order("cached_at", { ascending: false })
      .limit(1)
      .single()

    if (existing?.cached_at) {
      const hoursSince = (Date.now() - new Date(existing.cached_at).getTime()) / (1000 * 60 * 60)
      if (hoursSince < 24) {
        return NextResponse.json({
          error: `Schools were refreshed ${Math.round(hoursSince)}h ago. Wait 24h between refreshes to control API costs.`,
          city: citySlug,
          lastRefresh: existing.cached_at,
        }, { status: 429 })
      }
    }

    const seenIds = new Set<string>()
    let inserted = 0
    let errors = 0

    for (const keyword of SCHOOL_SEARCHES) {
      try {
        const results = await searchSchools(`${keyword} ${city.name}`, city.lat, city.lng)

        for (const p of results) {
          if (seenIds.has(p.id)) continue
          seenIds.add(p.id)

          const name = p.displayName?.text || ""
          const photos = (p.photos || []).slice(0, 5).map(
            (photo: { name: string }) => `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=800&key=${API_KEY}`
          )

          const { error } = await supabase.from("city_schools").upsert({
            city_slug: citySlug,
            google_place_id: p.id,
            name,
            school_type: inferSchoolType(name, keyword),
            curriculum: inferCurriculum(name),
            rating: p.rating || null,
            review_count: p.userRatingCount || 0,
            address: p.formattedAddress || null,
            phone: p.nationalPhoneNumber || null,
            website: p.websiteUri || null,
            google_maps_url: p.googleMapsUri || null,
            photo_urls: photos,
            latitude: p.location?.latitude || null,
            longitude: p.location?.longitude || null,
            description: p.editorialSummary?.text || null,
            tags: p.types || [],
            google_reviews: (p.reviews || []).slice(0, 5).map((r: Record<string, unknown>) => ({
              author: (r.authorAttribution as Record<string, unknown>)?.displayName || "Anonymous",
              rating: r.rating,
              text: (r.text as Record<string, unknown>)?.text || "",
              time: r.publishTime,
            })),
            cached_at: new Date().toISOString(),
          }, { onConflict: "google_place_id" })

          if (error) { errors++; console.error(`Failed ${name}:`, error.message) }
          else inserted++
        }
      } catch (err) {
        console.error(`Search "${keyword}" failed:`, err)
      }
    }

    return NextResponse.json({
      city: citySlug,
      total: seenIds.size,
      inserted,
      errors,
    })
  } catch (error) {
    console.error("Schools refresh error:", error)
    return NextResponse.json({ error: "Failed to fetch schools" }, { status: 500 })
  }
}
