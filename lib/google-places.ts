/**
 * Google Places API (New) client — fetches family-relevant places near a city.
 * Uses the new Places API endpoints (2024+).
 */

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || ""

export type PlaceCategory = {
  keyword: string
  label: string
  includedTypes: string[]
}

export const PLACE_CATEGORIES: PlaceCategory[] = [
  { keyword: "family restaurant", label: "Restaurants", includedTypes: ["restaurant"] },
  { keyword: "cafe", label: "Cafes", includedTypes: ["cafe"] },
  { keyword: "playground", label: "Playgrounds", includedTypes: ["playground"] },
  { keyword: "park", label: "Parks", includedTypes: ["park"] },
  { keyword: "coworking space", label: "Coworking", includedTypes: [] },
  { keyword: "surf school", label: "Surf Schools", includedTypes: [] },
  { keyword: "kids activities", label: "Kids Activities", includedTypes: [] },
  { keyword: "swimming pool", label: "Swimming", includedTypes: ["swimming_pool"] },
  { keyword: "martial arts", label: "Martial Arts", includedTypes: ["gym"] },
  { keyword: "international school", label: "Schools", includedTypes: ["school"] },
]

export type GooglePlace = {
  place_id: string
  name: string
  category: string
  rating?: number
  user_ratings_total?: number
  price_level?: number
  address?: string
  phone?: string
  website?: string
  google_maps_url?: string
  photos?: string[]
  lat?: number
  lng?: number
  opening_hours?: string
  types?: string[]
}

/**
 * Text Search (New) — search for places by keyword near a location.
 * POST https://places.googleapis.com/v1/places:searchText
 */
export async function textSearch(
  keyword: string,
  lat: number,
  lng: number,
  radius: number = 5000
): Promise<GooglePlace[]> {
  if (!API_KEY) throw new Error("GOOGLE_PLACES_API_KEY not set")

  const body = {
    textQuery: keyword,
    locationBias: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius,
      },
    },
    maxResultCount: 5,
    languageCode: "en",
  }

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName,places.rating,places.userRatingCount,places.priceLevel,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.photos,places.location,places.currentOpeningHours,places.types",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Places API error ${res.status}: ${err}`)
  }

  const data = await res.json()

  return (data.places || []).map((p: Record<string, unknown>) => {
    const displayName = p.displayName as { text: string } | undefined
    const location = p.location as { latitude: number; longitude: number } | undefined
    const photos = (p.photos as Array<{ name: string }>) || []

    // Build photo URLs using the Places Photos API (New)
    const photoUrls = photos.slice(0, 3).map(
      (photo) => `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=800&key=${API_KEY}`
    )

    const priceLevelMap: Record<string, number> = {
      PRICE_LEVEL_FREE: 0,
      PRICE_LEVEL_INEXPENSIVE: 1,
      PRICE_LEVEL_MODERATE: 2,
      PRICE_LEVEL_EXPENSIVE: 3,
      PRICE_LEVEL_VERY_EXPENSIVE: 4,
    }

    return {
      place_id: p.id as string,
      name: displayName?.text || "",
      rating: p.rating as number | undefined,
      user_ratings_total: p.userRatingCount as number | undefined,
      price_level: priceLevelMap[p.priceLevel as string] ?? undefined,
      address: p.formattedAddress as string | undefined,
      phone: p.nationalPhoneNumber as string | undefined,
      website: p.websiteUri as string | undefined,
      google_maps_url: p.googleMapsUri as string | undefined,
      photos: photoUrls,
      lat: location?.latitude,
      lng: location?.longitude,
      types: p.types as string[] | undefined,
      opening_hours: ((p.currentOpeningHours as Record<string, unknown>)?.weekdayDescriptions as string[])?.join(" | "),
    }
  })
}

/**
 * Fetch all place categories for a city and return combined results.
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
      const results = await textSearch(cat.keyword, lat, lng)

      for (const place of results) {
        if (seenIds.has(place.place_id)) continue
        seenIds.add(place.place_id)
        allPlaces.push({ ...place, category: cat.label })
      }
    } catch (err) {
      console.error(`Failed to fetch ${cat.label}:`, err)
    }
  }

  return allPlaces
}
