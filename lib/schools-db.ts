import { supabase, isSupabaseConfigured } from "./supabase"
import { schools as staticSchools } from "@/data/schools"
import { School, SchoolType, SchoolCurriculum } from "./school-types"

function rowToSchool(row: Record<string, unknown>): School {
  return {
    id: row.id as string,
    name: row.name as string,
    citySlug: row.city_slug as string,
    type: row.type as SchoolType,
    curriculum: row.curriculum as SchoolCurriculum,
    ageRange: row.age_range as string,
    monthlyFee: row.monthly_fee as number,
    language: (row.languages as string[]) || [],
    rating: row.rating as number,
    familyReviews: row.family_reviews as number,
    website: row.website as string,
    description: (row.description as string) || "",
    tags: (row.tags as string[]) || [],
  }
}

export async function getAllSchools(): Promise<School[]> {
  if (!isSupabaseConfigured) return staticSchools

  try {
    const { data, error } = await supabase
      .from("schools")
      .select("*")
      .order("name")

    if (error || !data || data.length === 0) return staticSchools
    return data.map(rowToSchool)
  } catch {
    return staticSchools
  }
}

export async function getSchoolsByCity(citySlug: string): Promise<School[]> {
  if (!isSupabaseConfigured) {
    return staticSchools.filter((s) => s.citySlug === citySlug)
  }

  try {
    const { data, error } = await supabase
      .from("schools")
      .select("*")
      .eq("city_slug", citySlug)
      .order("name")

    if (error || !data) {
      return staticSchools.filter((s) => s.citySlug === citySlug)
    }
    return data.map(rowToSchool)
  } catch {
    return staticSchools.filter((s) => s.citySlug === citySlug)
  }
}
