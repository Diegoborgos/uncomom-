export type SchoolType = "International" | "Bilingual" | "Local (English)" | "Montessori" | "Waldorf" | "Online/Hybrid"
export type SchoolCurriculum = "IB" | "British" | "American" | "French" | "Local" | "Montessori" | "Waldorf" | "Multiple"
export type AgeRange = "2-6" | "3-11" | "3-18" | "6-18" | "11-18" | "2-18"

export type School = {
  id: string
  name: string
  citySlug: string
  type: SchoolType
  curriculum: SchoolCurriculum
  ageRange: AgeRange
  monthlyFee: number // EUR
  language: string[]
  rating: number // 1-5
  familyReviews: number
  website: string
  description: string
  tags: string[]
}
