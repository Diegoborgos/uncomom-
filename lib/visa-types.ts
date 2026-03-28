export type VisaType = "Tourist" | "Digital Nomad" | "Freelancer" | "Residency" | "Business" | "Student"

export type VisaInfo = {
  id: string
  country: string
  countryCode: string
  visaName: string
  type: VisaType
  durationDays: number // max stay in days
  renewable: boolean
  familyFriendly: boolean // includes dependents
  costEUR: number // application cost
  processingDays: number // estimated processing time
  incomeRequirement: number // EUR/month, 0 if none
  requirements: string[]
  notes: string
  bestFor: string
  citySlugs: string[] // cities in this country
}
