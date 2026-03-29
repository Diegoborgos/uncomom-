import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { fetchPlacesForCity, textSearch, resolvePhotoUrl } from "@/lib/google-places"

const ADMIN_EMAILS = ["hello@uncomun.com", "diego@diegoborgo.com"]

export async function POST(req: NextRequest) {
  // Auth: accept cron secret OR admin session token
  const cronSecret = req.headers.get("x-cron-secret")
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")

  let authorized = cronSecret === process.env.CRON_SECRET

  if (!authorized && token) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const userClient = createClient(url, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user } } = await userClient.auth.getUser()
    if (user?.email && ADMIN_EMAILS.includes(user.email)) {
      authorized = true
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return NextResponse.json({ error: "GOOGLE_PLACES_API_KEY not set" }, { status: 500 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(url, key, { auth: { persistSession: false } })

  const { citySlug } = await req.json()
  if (!citySlug) {
    return NextResponse.json({ error: "citySlug required" }, { status: 400 })
  }

  // Get city coordinates
  const { data: city } = await supabase
    .from("cities")
    .select("slug, lat, lng, name")
    .eq("slug", citySlug)
    .single()

  if (!city || !city.lat || !city.lng) {
    return NextResponse.json({ error: "City not found or no coordinates" }, { status: 404 })
  }

  try {
    // Rate limit: skip if this city was refreshed in the last 24 hours
    const { data: existing } = await supabase
      .from("city_places")
      .select("cached_at")
      .eq("city_slug", citySlug)
      .order("cached_at", { ascending: false })
      .limit(1)
      .single()

    if (existing?.cached_at) {
      const hoursSince = (Date.now() - new Date(existing.cached_at).getTime()) / (1000 * 60 * 60)
      if (hoursSince < 24) {
        return NextResponse.json({
          error: `Places were refreshed ${Math.round(hoursSince)}h ago. Wait 24h between refreshes to control API costs.`,
          city: citySlug,
          lastRefresh: existing.cached_at,
        }, { status: 429 })
      }
    }

    const places = await fetchPlacesForCity(city.lat, city.lng)

    let inserted = 0
    let errors = 0

    for (const place of places) {
      // Resolve photo URLs server-side
      const resolvedPhotos: string[] = []
      for (const photoName of (place.photos || []).slice(0, 3)) {
        const resolved = await resolvePhotoUrl(photoName)
        if (resolved) resolvedPhotos.push(resolved)
      }

      const { error } = await supabase.from("city_places").upsert({
        city_slug: citySlug,
        google_place_id: place.place_id,
        name: place.name,
        category: place.category,
        description: place.address || null,
        rating: place.rating || null,
        review_count: place.user_ratings_total || 0,
        price_level: place.price_level || null,
        address: place.address || null,
        phone: place.phone || null,
        website: place.website || null,
        google_maps_url: place.google_maps_url || null,
        photo_urls: resolvedPhotos,
        latitude: place.lat || null,
        longitude: place.lng || null,
        opening_hours: place.opening_hours || null,
        tags: place.types || [],
        cached_at: new Date().toISOString(),
      }, { onConflict: "google_place_id" })

      if (error) {
        console.error(`Failed to upsert ${place.name}:`, error.message)
        errors++
      } else {
        inserted++
      }
    }

    // Also update the city's main photo from Google
    let cityPhotoUpdated = false
    try {
      const cityResults = await textSearch(`${city.name} city`, city.lat, city.lng, 10000)
      const topPhotoName = cityResults[0]?.photos?.[0]
      const topPhoto = topPhotoName ? await resolvePhotoUrl(topPhotoName) : null
      if (topPhoto) {
        await supabase
          .from("cities")
          .update({ photo: topPhoto, updated_at: new Date().toISOString() })
          .eq("slug", citySlug)
        cityPhotoUpdated = true
      }
    } catch (err) {
      console.error("Failed to update city photo:", err)
    }

    return NextResponse.json({
      city: citySlug,
      fetched: places.length,
      inserted,
      errors,
      cityPhotoUpdated,
    })
  } catch (error) {
    console.error("Places refresh error:", error)
    return NextResponse.json({ error: "Failed to fetch places" }, { status: 500 })
  }
}
