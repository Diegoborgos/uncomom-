import { supabase, isSupabaseConfigured } from "./supabase"
import { visas as staticVisas } from "@/data/visas"
import { VisaInfo } from "./visa-types"

function rowToVisa(row: Record<string, unknown>): VisaInfo {
  return {
    id: row.id as string,
    country: row.country as string,
    countryCode: row.country_code as string,
    visaName: row.visa_name as string,
    type: row.type as string,
    durationDays: row.duration_days as number,
    renewable: row.renewable as boolean,
    familyFriendly: row.family_friendly as boolean,
    costEUR: row.cost_eur as number,
    processingDays: row.processing_days as number,
    incomeRequirement: row.income_requirement as number,
    requirements: (row.requirements as string[]) || [],
    notes: (row.notes as string) || "",
    bestFor: (row.best_for as string) || "",
    citySlugs: (row.city_slugs as string[]) || [],
  }
}

export async function getAllVisas(): Promise<VisaInfo[]> {
  if (!isSupabaseConfigured) return staticVisas

  try {
    const { data, error } = await supabase
      .from("visas")
      .select("*")
      .order("country")

    if (error || !data || data.length === 0) return staticVisas
    return data.map(rowToVisa)
  } catch {
    return staticVisas
  }
}

export async function getVisasByCity(citySlug: string): Promise<VisaInfo[]> {
  if (!isSupabaseConfigured) {
    return staticVisas.filter((v) => v.citySlugs.includes(citySlug))
  }

  try {
    const { data, error } = await supabase
      .from("visas")
      .select("*")
      .contains("city_slugs", [citySlug])

    if (error || !data) {
      return staticVisas.filter((v) => v.citySlugs.includes(citySlug))
    }
    return data.map(rowToVisa)
  } catch {
    return staticVisas.filter((v) => v.citySlugs.includes(citySlug))
  }
}
