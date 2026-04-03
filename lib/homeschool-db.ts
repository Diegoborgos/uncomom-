import { supabase, isSupabaseConfigured } from "./supabase"
import { homeschoolLaws as staticLaws, HomeschoolLaw } from "@/data/homeschool-laws"

function rowToLaw(row: Record<string, unknown>): HomeschoolLaw {
  return {
    country: row.country as string,
    countryCode: row.country_code as string,
    status: row.status as HomeschoolLaw["status"],
    summary: row.summary as string,
    requirements: row.requirements as string,
    notes: (row.notes as string) || "",
    popularCities: (row.popular_cities as string[]) || [],
  }
}

export async function getAllHomeschoolLaws(): Promise<HomeschoolLaw[]> {
  if (!isSupabaseConfigured) return staticLaws

  try {
    const { data, error } = await supabase
      .from("homeschool_laws")
      .select("*")
      .order("country")

    if (error || !data || data.length === 0) return staticLaws
    return data.map(rowToLaw)
  } catch {
    return staticLaws
  }
}
