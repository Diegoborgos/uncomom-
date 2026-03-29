/**
 * Google Places API client — fetches family-relevant places near a city.
 * Uses Nearby Search (New) + Place Details (New) APIs.
 */

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || ""

export type PlaceCategory = {
  keyword: string
  label: string
  types: string[]
}

export const PLACE_CATEGORIES: PlaceCategory[] = [
  { keyword: "family restaurant", label: "Restaurants", types: ["restaurant"] },
  { keyword: "cafe", label: "Cafes", types: ["cafe"] },
  { keyword: "playground", label: "Playgrounds", types: ["playground"] },
  { keyword: "park", label: "Parks", types: ["park"] },
  { keyword: "coworking space", label: "Coworking", types: ["coworking_space"] },
  { keyword: "surf school kids", label: "Surf Schools", types: [] },
  { keyword: "kids activities", label: "Kids Activities", types: ["tourist_attraction"] },
  { keyword: "swimming pool", label: "Swimming", types: ["swimming_pool"] },
  { keyword: "martial arts kids", label: "Martial Arts", types: ["gym"] },
  { keyword: "international school", label: "Schools", types: ["school"] },
]

export type GooglePlace = {
  place_id: string
  name: string
  category: string
  rating?: number
  user_ratings_total?: number
  price_level?: number
  vicinity?: string
  formatted_address?: string
  formatted_phone_number?: string
  website?: string
  url?: string // Google Maps URL
  photos?: string[]
  lat?: number
  lng?: number
  opening_hours?: string
  types?: string[]
}

/**
 * Search for places near a location using the Places API (legacy).
 * Uses Nearby Search which is simpler and well-documented.
 */
export async function searchNearby(
  lat: number,
  lng: number,
  keyword: string,
  radius: number = 5000
): Promise<GooglePlace[]> {
  if (!API_KEY) throw new Error("GOOGLE_PLACES_API_KEY not set")

  const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json")
  url.searchParams.set("location", `${lat},${lng}`)
  url.searchParams.set("radius", String(radius))
  url.searchParams.set("keyword", keyword)
  url.searchParams.set("key", API_KEY)

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Google Places API error: ${res.status}`)

  const data = await res.json()

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Google Places API status: ${data.status} — ${data.error_message || ""}`)
  }

  return (data.results || []).map((r: Record<string, unknown>) => ({
    place_id: r.place_id as string,
    name: r.name as string,
    rating: r.rating as number | undefined,
    user_ratings_total: r.user_ratings_total as number | undefined,
    price_level: r.price_level as number | undefined,
    vicinity: r.vicinity as string | undefined,
    lat: (r.geometry as Record<string, Record<string, number>>)?.location?.lat,
    lng: (r.geometry as Record<string, Record<string, number>>)?.location?.lng,
    photos: ((r.photos as Array<Record<string, unknown>>) || []).slice(0, 3).map(
      (p) => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photo_reference}&key=${API_KEY}`
    ),
    types: r.types as string[] | undefined,
  }))
}

/**
 * Get detailed info for a specific place.
 */
export async function getPlaceDetails(placeId: string): Promise<Partial<GooglePlace>> {
  if (!API_KEY) throw new Error("GOOGLE_PLACES_API_KEY not set")

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json")
  url.searchParams.set("place_id", placeId)
  url.searchParams.set("fields", "name,formatted_address,formatted_phone_number,website,url,opening_hours,rating,user_ratings_total,price_level,photos")
  url.searchParams.set("key", API_KEY)

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Google Places Details API error: ${res.status}`)

  const data = await res.json()
  const r = data.result || {}

  return {
    name: r.name,
    formatted_address: r.formatted_address,
    formatted_phone_number: r.formatted_phone_number,
    website: r.website,
    url: r.url,
    rating: r.rating,
    user_ratings_total: r.user_ratings_total,
    price_level: r.price_level,
    opening_hours: r.opening_hours?.weekday_text?.join(" | "),
    photos: (r.photos || []).slice(0, 5).map(
      (p: Record<string, unknown>) => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photo_reference}&key=${API_KEY}`
    ),
  }
}

/**
 * Fetch all place categories for a city and return combined results.
 * Limits to top 5 per category to control API costs.
 */
export async function fetchPlacesForCity(
  lat: number,
  lng: number,
  categories: PlaceCategory[] = PLACE_CATEGORIES
): Promise<(GooglePlace & { category: string })[]> {
  const allPlaces: (GooglePlace & { category: string })[] = []
  const seenIds = new Set<string>()

  for (const cat of categories) {
    try {
      const results = await searchNearby(lat, lng, cat.keyword)
      const top = results.slice(0, 5)

      for (const place of top) {
        if (seenIds.has(place.place_id)) continue
        seenIds.add(place.place_id)

        // Get details for each place
        try {
          const details = await getPlaceDetails(place.place_id)
          allPlaces.push({
            ...place,
            ...details,
            category: cat.label,
          })
        } catch {
          // If details fail, still include basic data
          allPlaces.push({ ...place, category: cat.label })
        }
      }
    } catch (err) {
      console.error(`Failed to fetch ${cat.label}:`, err)
    }
  }

  return allPlaces
}
