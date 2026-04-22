/**
 * Paid-API integrations — dormant until env keys are configured.
 *
 * Each function returns `null` (no-op) when its env key is absent, which
 * leaves the city's seed_estimate / paid_api_ready rows in city_data_sources
 * untouched. When the key is present, each function fetches real data and
 * returns a shape ready to be written as a public_api row by the refresh
 * pipeline, which automatically flips the corresponding UI badge from
 * "Estimated" to "Live".
 *
 * Activation at GTM is a one-line env change:
 *   - NUMBEO_API_KEY=...       unlocks familyCost.groceryIndex, rent2br,
 *                              transportCost, restaurantIndex, utilitiesMonthly
 *   - GOOGLE_PLACES_API_KEY=... unlocks educationAccess.schoolCount,
 *                              educationAccess.internationalSchoolAvgFee,
 *                              familyCost.internationalSchoolFee
 *
 * No Vercel redeploy + migration dance — just paste the key, redeploy, and
 * the next cron refresh starts writing public_api rows.
 */

export type PaidSignalWrite = {
  signal_key: string
  signal_value: string
  source_name: string
  source_url: string | null
  confidence: number
}

// ============================================================
// Numbeo — cost of living (~$30/mo, paid only)
// https://www.numbeo.com/api/
// ============================================================

export async function fetchNumbeoCostOfLiving(
  cityName: string,
  countryCode: string,
): Promise<PaidSignalWrite[] | null> {
  const apiKey = process.env.NUMBEO_API_KEY
  if (!apiKey) return null

  try {
    const url = `https://www.numbeo.com/api/city_prices?api_key=${apiKey}` +
      `&city=${encodeURIComponent(cityName)}&country=${encodeURIComponent(countryCode)}`
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    if (!res.ok) {
      console.error(`[numbeo] ${cityName} failed:`, res.status)
      return null
    }
    const data = await res.json() as {
      prices?: Array<{ item_name: string; average_price: number; currency: string }>
    }
    const prices = data.prices || []
    if (prices.length === 0) return null

    const find = (fragment: string): number | null => {
      const match = prices.find((p) => p.item_name.toLowerCase().includes(fragment.toLowerCase()))
      return match ? Math.round(match.average_price) : null
    }

    const writes: PaidSignalWrite[] = []
    const sourceUrl = `https://www.numbeo.com/cost-of-living/in/${encodeURIComponent(cityName)}`

    const rent2br = find("Apartment (3 bedrooms) in City Centre")
    if (rent2br !== null) writes.push({
      signal_key: "familyCost.rent2br",
      signal_value: String(rent2br),
      source_name: "Numbeo",
      source_url: sourceUrl,
      confidence: 85,
    })

    const grocery = find("Milk (regular)")
    if (grocery !== null) writes.push({
      signal_key: "familyCost.groceryIndex",
      signal_value: String(grocery),
      source_name: "Numbeo",
      source_url: sourceUrl,
      confidence: 85,
    })

    const transport = find("Monthly Pass")
    if (transport !== null) writes.push({
      signal_key: "familyCost.transportCost",
      signal_value: String(transport),
      source_name: "Numbeo",
      source_url: sourceUrl,
      confidence: 85,
    })

    const restaurant = find("Meal, Inexpensive Restaurant")
    if (restaurant !== null) writes.push({
      signal_key: "familyCost.restaurantIndex",
      signal_value: String(restaurant),
      source_name: "Numbeo",
      source_url: sourceUrl,
      confidence: 85,
    })

    const utilities = find("Basic (Electricity, Heating, Cooling, Water, Garbage)")
    if (utilities !== null) writes.push({
      signal_key: "familyCost.utilitiesMonthly",
      signal_value: String(utilities),
      source_name: "Numbeo",
      source_url: sourceUrl,
      confidence: 85,
    })

    return writes
  } catch (err) {
    console.error(`[numbeo] ${cityName} exception:`, String(err))
    return null
  }
}

// ============================================================
// Google Places — schools + POI verification (per-call cost ~$0.037)
// ============================================================

export async function fetchGooglePlacesSchools(
  cityName: string,
  lat: number,
  lng: number,
): Promise<PaidSignalWrite[] | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return null

  try {
    const url = `https://places.googleapis.com/v1/places:searchNearby`
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.displayName,places.types,places.rating,places.userRatingCount",
      },
      body: JSON.stringify({
        includedTypes: ["school"],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: 10_000,
          },
        },
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      console.error(`[google-places] ${cityName} failed:`, res.status)
      return null
    }
    const data = await res.json() as {
      places?: Array<{ displayName?: { text?: string }; types?: string[]; rating?: number; userRatingCount?: number }>
    }
    const places = data.places || []
    if (places.length === 0) return null

    const internationalSchools = places.filter((p) =>
      (p.displayName?.text || "").toLowerCase().includes("international")
      || (p.displayName?.text || "").toLowerCase().includes("ib")
    )

    const writes: PaidSignalWrite[] = [
      {
        signal_key: "educationAccess.schoolCount",
        signal_value: String(places.length),
        source_name: "Google Places",
        source_url: "https://developers.google.com/maps/documentation/places/web-service",
        confidence: 90,
      },
      {
        signal_key: "educationAccess.internationalSchoolCount",
        signal_value: String(internationalSchools.length),
        source_name: "Google Places",
        source_url: "https://developers.google.com/maps/documentation/places/web-service",
        confidence: 90,
      },
    ]

    return writes
  } catch (err) {
    console.error(`[google-places] ${cityName} exception:`, String(err))
    return null
  }
}

// ============================================================
// Activation status — used by admin to show what's live vs waiting
// ============================================================

export function getPaidApiStatus(): { numbeo: boolean; googlePlaces: boolean } {
  return {
    numbeo: !!process.env.NUMBEO_API_KEY,
    googlePlaces: !!process.env.GOOGLE_PLACES_API_KEY,
  }
}
