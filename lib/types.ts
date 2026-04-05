export type HomeschoolStatus = "Yes" | "Yes (grey area)" | "Restricted" | "No"
export type VisaFriendliness = "Excellent" | "Good" | "OK" | "Difficult"
export type KidsAgeIdeal = "All ages" | "Under 10" | "Teens" | "Young children"

// ============================================================
// FIS™ Signal Architecture — 9 Dimensions, 250+ data points per city
// ============================================================

export type CitySignals = {

  // ============================================================
  // DIMENSION 1 — Child Safety (weight: 22%)
  // ============================================================
  childSafety: {
    overall: number
    streetCrime: number
    trafficSafety: number
    pedestrianInfrastructure: number
    strollerAccessibility: number
    nightSafetyRating: number
    airQuality: number
    airQualityTrend: "improving" | "stable" | "worsening"
    waterQuality: number
    waterSafety: "tap_safe" | "filter_needed" | "bottled_only"
    environmentalQuality: number
    dengueRisk: "none" | "low" | "medium" | "high"
    malariaRisk: "none" | "low" | "medium" | "high"
    zikaBabyRisk: "none" | "low" | "medium" | "high"
    foodSafetyRating: number
    naturalDisasterRisk: "low" | "medium" | "high"
    floodRisk: "low" | "medium" | "high"
    earthquakeRisk: "low" | "medium" | "high"
    politicalStability: number
    politicalStabilityTrend: "improving" | "stable" | "deteriorating"
    civilUnrestRisk: "low" | "medium" | "high"
    memberSafetyRating: number
    memberKidSafetyRating: number
    memberAloneWithKidsRating: number
    recentSafetyIncidents: number
  }

  // ============================================================
  // DIMENSION 2 — Education Access (weight: 20%)
  // ============================================================
  educationAccess: {
    overall: number
    internationalSchoolCount: number
    internationalSchoolAvgFee: number
    internationalSchoolMaxFee: number
    internationalSchoolMinFee: number
    ibAvailable: boolean
    britishCurriculumAvailable: boolean
    americanCurriculumAvailable: boolean
    montessoriAvailable: boolean
    democraticSchoolAvailable: boolean
    steinerWaldorfAvailable: boolean
    bilingualSchoolAvailable: boolean
    localPrivateSchoolCount: number
    localPrivateSchoolAvgFee: number
    enrollmentDifficulty: number
    waitlistMonthsTypical: number
    midYearEntryPossible: boolean
    augustArrivalSeptemberEnrollPossible: boolean
    enrollmentRequiresLocalAddress: boolean
    enrollmentRequiresLocalTaxNumber: boolean
    processingTimeWeeks: number
    memberEnrollmentRating: number
    memberEnrollmentNarrative: string
    homeschoolLegal: "yes" | "grey_area" | "restricted" | "no"
    homeschoolEnforcementReality: "relaxed" | "moderate" | "strict"
    homeschoolCommunitySize: number
    worldschoolingHubPresent: boolean
    worldschoolingCommunityRating: number
    unschoolingFriendly: boolean
    onlineSchoolFriendly: number
    englishMediumEducation: number
    englishPrimarySchoolCount: number
    newStudentIntegrationRating: number
    internationalKidFriendly: number
    memberSchoolRating: number
  }

  // ============================================================
  // DIMENSION 3 — Family Cost (weight: 18%)
  // ============================================================
  familyCost: {
    overall: number
    familyMonthlyEstimate: number
    familyMonthlyBudget: number
    familyMonthlyComfortable: number
    memberActualSpend: number
    memberSpendVariance: number
    rent2br: number
    rent3br: number
    rent4br: number
    housingAvailability: number
    housingForeignerFriendly: number
    averageMinimumLease: number
    depositMonths: number
    memberHousingRating: number
    internationalSchoolFee: number
    localSchoolFee: number
    childcareMonthly: number
    afterSchoolActivitiesCost: number
    tuitionAvailability: number
    groceryIndex: number
    restaurantFamilyMeal: number
    localTransportMonthly: number
    carRentalMonthly: number
    healthInsuranceMonthly: number
    costTrend: "rising_fast" | "rising" | "stable" | "falling"
    memberCostSurprise: "cheaper_than_expected" | "as_expected" | "more_expensive"
  }

  // ============================================================
  // DIMENSION 4 — Healthcare (weight: 12%)
  // ============================================================
  healthcare: {
    overall: number
    systemQuality: number
    publicHealthcareQuality: number
    privateHealthcareQuality: number
    internationalInsuranceAccepted: boolean
    internationalInsuranceFraction: number
    paediatricAccess: number
    paediatricSpecialistsAvailable: boolean
    englishSpeakingPaediatrician: boolean
    englishSpeakingPaediatricianCount: number
    appointmentSpeedDays: number
    memberPaediatricRating: number
    paediatricEmergencyPath: string
    paediatricEmergencyResponseTime: number
    emergencyCareQuality: number
    memberEmergencyExperienceRating: number
    memberEmergencyNarrative: string
    gpAvailable: boolean
    englishSpeakingDoctors: number
    dentalAccessKids: number
    vaccineAvailability: number
    pharmacyAccessibility: number
    daysToRegisterGP: number
    memberHealthcareRating: number
    nearestChildrensHospital: number
  }

  // ============================================================
  // DIMENSION 5 — Nature & Outdoor (weight: 10%)
  // ============================================================
  nature: {
    overall: number
    beachAccess: boolean
    beachQuality: number
    beachSafetyForKids: number
    mountainAccess: boolean
    hikingForKids: number
    parkDensity: number
    parkQuality: number
    playgroundQuality: number
    playgroundCount: number
    kidsOutdoorActivities: number
    outdoorMonthsComfortable: number
    humidityComfort: "low" | "moderate" | "high" | "very_high"
    sunExposureRisk: "low" | "moderate" | "high"
    cyclingInfrastructure: number
    memberOutdoorRating: number
    greenCoverPercent: number
    environmentalQuality: number
    natureImmersionRating: number
  }

  // ============================================================
  // DIMENSION 6 — Family Community (weight: 8%)
  // ============================================================
  community: {
    overall: number
    uncomonFamiliesNow: number
    uncomonFamiliesBeen: number
    uncomonReturnRate: number
    uncomonSoloParentsNow: number
    uncomonSoloParentsBeen: number
    expatFamilyDensity: number
    worldschoolingActivity: number
    localFamilyAttitude: number
    memberCommunityRating: number
    meetupsPerMonth: number
    kidsIntegrationSpeed: number
    kidsIntegrationSpeedWeeks: number
    kidsActivitiesForNewcomers: number
    internationalKidCommunitySize: number
    kidsPlaygroupAvailability: number
    teenCommunityRating: number
    memberKidsIntegrationRating: number
    soloParentSafetyRating: number
    soloParentCommunityRating: number
    memberSoloParentRating: number
    lgbtqFamilyFriendly: number
    lgbtqLegalProtections: "strong" | "moderate" | "limited" | "hostile"
    memberLgbtqFamilyRating: number
    daysToFirstCommunityConnection: number
    whatsappGroupsAccessible: boolean
    memberOnboardingRating: number
  }

  // ============================================================
  // DIMENSION 7 — Remote Work (weight: 5%)
  // ============================================================
  remoteWork: {
    overall: number
    avgDownloadSpeed: number
    avgUploadSpeed: number
    internetReliability: number
    fiberAvailability: number
    mobileDataQuality: number
    vpnFriendly: boolean
    coworkingCount: number
    coworkingKidFriendly: number
    coworkingAvgCost: number
    cafeWorkFriendly: number
    timezoneEU: number
    timezoneUSEast: number
    timezoneUSWest: number
    timezoneAsia: number
    memberInternetRating: number
    memberWorkSetupRating: number
  }

  // ============================================================
  // DIMENSION 8 — Visa & Legal (weight: 3%)
  // ============================================================
  visa: {
    overall: number
    nomadVisaAvailable: boolean
    nomadVisaIncludesDependents: boolean
    nomadVisaIncomeRequired: number
    nomadVisaDurationMonths: number
    nomadVisaRenewable: boolean
    nomadVisaPathToResidency: boolean
    strongPassportProcessingDays: number
    mediumPassportProcessingDays: number
    limitedPassportProcessingDays: number
    strongPassportApprovalRate: number
    mediumPassportApprovalRate: number
    limitedPassportApprovalRate: number
    strongPassportVisaFriendly: "excellent" | "good" | "ok" | "difficult"
    mediumPassportVisaFriendly: "excellent" | "good" | "ok" | "difficult"
    limitedPassportVisaFriendly: "excellent" | "good" | "ok" | "difficult"
    processingDays: number
    processingDifficulty: number
    requiresLocalLawyer: boolean
    requiresLocalBankAccount: boolean
    requiresProofOfAddress: boolean
    borderRunRequired: boolean
    borderRunFrequencyDays: number
    studentVisaRequired: boolean
    dependentVisaRequired: boolean
    memberVisaRating: number
    memberVisaNarrative: string
    memberStrongPassportRating: number
    memberMediumPassportRating: number
    memberLimitedPassportRating: number
  }

  // ============================================================
  // DIMENSION 9 — Lifestyle & Culture (weight: 2%)
  // ============================================================
  lifestyle: {
    overall: number
    englishProficiency: number
    englishInDailyLife: number
    cityPace: "fast" | "medium" | "slow"
    restaurantQuality: number
    restaurantFamilyFriendly: number
    culturalActivitiesForKids: number
    internationalFoodAvailability: number
    kidsEntertainment: number
    religiousDiversityRating: number
    memberLifestyleRating: number
  }

  // ============================================================
  // SETUP DIFFICULTY — Standalone (not in FIS weighting)
  // ============================================================
  setupDifficulty: {
    overallSetupScore: number
    housingSetupDays: number
    housingScamRisk: "low" | "medium" | "high"
    englishLandlordsAvailable: number
    bankAccountOpenable: boolean
    bankAccountDays: number
    simCardSetupHours: number
    simRequiresLocalAddress: boolean
    schoolEnrollmentSetupDays: number
    schoolEnrollmentBlocks: string[]
    gpRegistrationDays: number
    healthInsuranceActivationDays: number
    firstCommunityConnectionDays: number
    memberSetupRating: number
    memberSetupTimelineWeeks: number
    memberSetupNarrative: string
  }

  // ============================================================
  // DATA QUALITY
  // ============================================================
  dataQuality: {
    fieldReportCount: number
    fieldReportsLast12Mo: number
    lastUpdated: string
    dataCompleteness: number
    signalCount: number
    memberVerifiedSignals: number
    passportDataQuality: {
      strongPassportReports: number
      mediumPassportReports: number
      limitedPassportReports: number
    }
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
