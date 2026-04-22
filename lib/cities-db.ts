import { supabase, isSupabaseConfigured } from "./supabase"
import { cities as staticCities } from "@/data/cities"
import { City } from "./types"
import { createClient } from "@supabase/supabase-js"

function rowToCity(row: Record<string, unknown>): City {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    country: row.country as string,
    countryCode: row.country_code as string,
    continent: row.continent as string,
    photo: (row.photo as string) || "",
    coords: {
      lat: row.lat as number,
      lng: row.lng as number,
    },
    scores: {
      family: (row.score_family as number) || 0,
      childSafety: (row.score_child_safety as number) || 0,
      schoolAccess: (row.score_school_access as number) || 0,
      nature: (row.score_nature as number) || 0,
      internet: (row.score_internet as number) || 0,
      healthcare: (row.score_healthcare as number) || 0,
    },
    cost: {
      familyMonthly: (row.cost_family_monthly as number) || 0,
      rent2br: (row.cost_rent_2br as number) || 0,
      internationalSchool: (row.cost_international_school as number) || 0,
      localSchool: (row.cost_local_school as number) || 0,
      childcare: (row.cost_childcare as number) || 0,
    },
    meta: {
      familiesNow: (row.families_now as number) || 0,
      familiesBeen: (row.families_been as number) || 0,
      returnRate: (row.return_rate as number) || 0,
      bestMonths: (row.best_months as string[]) || [],
      timezone: (row.timezone as string) || "",
      language: (row.languages as string[]) || [],
      homeschoolLegal: (row.homeschool_legal as City["meta"]["homeschoolLegal"]) || "Yes",
      visaFriendly: (row.visa_friendly as City["meta"]["visaFriendly"]) || "Good",
      kidsAgeIdeal: (row.kids_age_ideal as City["meta"]["kidsAgeIdeal"]) || "All ages",
    },
    tags: (row.tags as string[]) || [],
    description: (row.description as string) || "",
    signals: row.signals as City["signals"],
  }
}

/**
 * Get all cities. Falls back to static data if Supabase unavailable.
 * Legacy shape; most callers should use getAllCitiesWithMeta to learn
 * whether the result came from fallback (for banners/telemetry).
 */
export async function getAllCities(): Promise<City[]> {
  return (await getAllCitiesWithMeta()).data
}

export async function getAllCitiesWithMeta(): Promise<{ data: City[]; fromFallback: boolean }> {
  if (!isSupabaseConfigured) return { data: staticCities, fromFallback: true }

  try {
    const { data, error } = await supabase
      .from("cities")
      .select("*")
      .order("name")

    if (error || !data || data.length === 0) {
      return { data: staticCities, fromFallback: true }
    }

    return { data: data.map(rowToCity), fromFallback: false }
  } catch {
    return { data: staticCities, fromFallback: true }
  }
}

/**
 * Get a single city by slug. Falls back to static data.
 */
export async function getCityBySlug(slug: string): Promise<City | null> {
  return (await getCityBySlugWithMeta(slug)).data
}

export async function getCityBySlugWithMeta(slug: string): Promise<{ data: City | null; fromFallback: boolean }> {
  if (!isSupabaseConfigured) {
    return { data: staticCities.find((c) => c.slug === slug) || null, fromFallback: true }
  }

  try {
    const { data, error } = await supabase
      .from("cities")
      .select("*")
      .eq("slug", slug)
      .single()

    if (error || !data) {
      return { data: staticCities.find((c) => c.slug === slug) || null, fromFallback: true }
    }

    return { data: rowToCity(data), fromFallback: false }
  } catch {
    return { data: staticCities.find((c) => c.slug === slug) || null, fromFallback: true }
  }
}

/**
 * Update a city field via service role. Used by admin panel.
 */
export async function updateCityField(
  slug: string,
  field: string,
  value: unknown,
  changedBy: string,
  reason: string
): Promise<{ error: string | null }> {
  const client = createServiceClient()
  if (!client) return { error: "Service client not configured" }

  const { data: current } = await client
    .from("cities")
    .select("*")
    .eq("slug", slug)
    .single()

  const oldValue = current ? JSON.stringify((current as unknown as Record<string, unknown>)[field]) : null

  const { error } = await client
    .from("cities")
    .update({
      [field]: value,
      updated_at: new Date().toISOString(),
      last_manual_update: new Date().toISOString(),
    })
    .eq("slug", slug)

  if (error) return { error: error.message }

  await client.from("city_data_changelog").insert({
    city_slug: slug,
    field_changed: field,
    old_value: oldValue,
    new_value: JSON.stringify(value),
    change_source: "manual",
    changed_by: changedBy,
    change_reason: reason,
  })

  return { error: null }
}

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}
