export type HomeschoolStatus = "Yes" | "Yes (grey area)" | "Restricted" | "No"
export type VisaFriendliness = "Excellent" | "Good" | "OK" | "Difficult"
export type KidsAgeIdeal = "All ages" | "Under 10" | "Teens" | "Young children"

export type City = {
  id: string
  slug: string
  name: string
  country: string
  countryCode: string
  continent: string
  photo: string
  coords: { lat: number; lng: number }

  scores: {
    family: number
    childSafety: number
    schoolAccess: number
    nature: number
    internet: number
    healthcare: number
  }

  cost: {
    familyMonthly: number
    rent2br: number
    internationalSchool: number
    localSchool: number
    childcare: number
  }

  meta: {
    familiesNow: number
    familiesBeen: number
    returnRate: number
    bestMonths: string[]
    timezone: string
    language: string[]
    homeschoolLegal: HomeschoolStatus
    visaFriendly: VisaFriendliness
    kidsAgeIdeal: KidsAgeIdeal
  }

  tags: string[]
  description: string
}

export type SortOption =
  | "family"
  | "cost"
  | "childSafety"
  | "nature"
  | "internet"
  | "familiesNow"
  | "returnRate"

export type CostRange = "under-2k" | "2-3k" | "3-4k" | "over-4k"
export type ClimateTag = "warm" | "tropical" | "mediterranean" | "variable"

export type Filters = {
  search: string
  sort: SortOption
  continents: string[]
  costRange: CostRange[]
  climate: ClimateTag[]
  homeschool: string[]
  tags: string[]
}
