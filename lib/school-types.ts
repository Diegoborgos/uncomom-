export type SchoolType = "International" | "Bilingual" | "Local (English)" | "Montessori" | "Waldorf" | "Online/Hybrid"
export type SchoolCurriculum = "IB" | "British" | "American" | "French" | "Local" | "Montessori" | "Waldorf" | "Multiple"

export type School = {
  id: string
  name: string
  citySlug: string
  type: string
  curriculum: string
  ageRange: string
  monthlyFee: number // EUR
  language: string[]
  rating: number // 1-5
  familyReviews: number
  website: string
  description: string
  tags: string[]
}
