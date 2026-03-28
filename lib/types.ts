export type HomeschoolStatus = "Yes" | "Yes (grey area)" | "Restricted" | "No"
export type VisaFriendliness = "Excellent" | "Good" | "OK" | "Difficult"
export type KidsAgeIdeal = "All ages" | "Under 10" | "Teens" | "Young children"

// ============================================================
// FIS™ Signal Architecture — 9 Dimensions, 1000+ signals
// ============================================================

export type CitySignals = {
  // DIMENSION 1 — Child Safety (weight: 22%)
  childSafety: {
    overall: number
    streetCrime: number
    trafficSafety: number
    environmentalSafety: number
    airQuality: number
    waterQuality: number
    dengueRisk: "none" | "low" | "medium" | "high"
    malariaRisk: "none" | "low" | "medium" | "high"
    naturalDisasterRisk: "low" | "medium" | "high"
    politicalStability: number
    memberSafetyRating: number
    strollerAccessibility: number
  }

  // DIMENSION 2 — Education Access (weight: 20%)
  educationAccess: {
    overall: number
    internationalSchoolCount: number
    internationalSchoolAvgFee: number
    ibAvailable: boolean
    britishCurriculumAvailable: boolean
    americanCurriculumAvailable: boolean
    montessoriAvailable: boolean
    democraticSchoolAvailable: boolean
    homeschoolLegal: "yes" | "grey_area" | "restricted" | "no"
    homeschoolEnforcementReality: "relaxed" | "moderate" | "strict"
    englishMediumEducation: number
    worldschoolingHubPresent: boolean
    memberSchoolRating: number
    enrollmentDifficulty: number
    onlineSchoolFriendly: number
  }

  // DIMENSION 3 — Family Cost (weight: 18%)
  familyCost: {
    overall: number
    familyMonthlyEstimate: number
    rent2br: number
    rent3br: number
    internationalSchoolFee: number
    localSchoolFee: number
    childcareMonthly: number
    groceryIndex: number
    restaurantFamilyMeal: number
    memberActualSpend: number
    housingAvailability: number
  }

  // DIMENSION 4 — Healthcare (weight: 12%)
  healthcare: {
    overall: number
    systemQuality: number
    paediatricAccess: number
    englishSpeakingDoctors: number
    appointmentSpeed: number
    emergencyCareQuality: number
    internationalInsuranceAccepted: boolean
    memberHealthcareRating: number
    nearestChildrensHospital: number
  }

  // DIMENSION 5 — Nature & Outdoor (weight: 10%)
  nature: {
    overall: number
    beachAccess: boolean
    beachQuality: number
    mountainAccess: boolean
    parkDensity: number
    playgroundQuality: number
    outdoorMonthsComfortable: number
    cyclingInfrastructure: number
    environmentalQuality: number
    memberOutdoorRating: number
  }

  // DIMENSION 6 — Family Community (weight: 8%)
  community: {
    overall: number
    uncomonFamiliesNow: number
    uncomonFamiliesBeen: number
    uncomonReturnRate: number
    worldschoolingActivity: number
    expatFamilyDensity: number
    memberCommunityRating: number
    meetupsPerMonth: number
    localFamilyAttitude: number
  }

  // DIMENSION 7 — Remote Work (weight: 5%)
  remoteWork: {
    overall: number
    avgDownloadSpeed: number
    avgUploadSpeed: number
    internetReliability: number
    coworkingCount: number
    memberInternetRating: number
    timezoneEU: number
    timezoneUSEast: number
  }

  // DIMENSION 8 — Visa & Legal (weight: 3%)
  visa: {
    overall: number
    nomadVisaAvailable: boolean
    nomadVisaIncludesDependents: boolean
    nomadVisaIncomeRequired: number
    nomadVisaDurationMonths: number
    processingDays: number
    processingDifficulty: number
    memberVisaRating: number
  }

  // DIMENSION 9 — Lifestyle (weight: 2%)
  lifestyle: {
    overall: number
    englishProficiency: number
    cityPace: "fast" | "medium" | "slow"
    restaurantQuality: number
    culturalActivitiesForKids: number
    internationalFoodAvailability: number
    memberLifestyleRating: number
  }

  // META
  dataQuality: {
    fieldReportCount: number
    lastUpdated: string
    dataCompleteness: number
  }
}

// ============================================================
// City type — backwards compatible with existing code
// ============================================================

export type City = {
  id: string
  slug: string
  name: string
  country: string
  countryCode: string
  continent: string
  photo: string
  coords: { lat: number; lng: number }

  // Legacy scores — kept for backward compatibility
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

  // FIS™ signal data — the full architecture
  signals?: CitySignals
}

// ============================================================
// Filter types
// ============================================================

export type SortOption =
  | "family"
  | "fis"
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

// ============================================================
// FIS™ types
// ============================================================

export type FISDimensionKey =
  | "childSafety"
  | "educationAccess"
  | "familyCost"
  | "healthcare"
  | "nature"
  | "community"
  | "remoteWork"
  | "visa"
  | "lifestyle"

export type FISWeights = Record<FISDimensionKey, number>

export type FISResult = {
  score: number
  weights: FISWeights
  dimensionScores: Record<FISDimensionKey, number>
  topStrengths: { dimension: FISDimensionKey; score: number; label: string }[]
  topWeaknesses: { dimension: FISDimensionKey; score: number; label: string }[]
}

export type PersonalFISResult = FISResult & {
  personalizedInsight: string
  adjustedFor: string[]
  topReason: string
  watchOut: string
}
