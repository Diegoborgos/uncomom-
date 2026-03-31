import {
  City,
  CitySignals,
  FISDimensionKey,
  FISWeights,
  FISResult,
  PersonalFISResult,
} from "./types"
import { Family } from "./database.types"

// ============================================================
// Default weights (sum to 1.0)
// ============================================================

export const DEFAULT_WEIGHTS: FISWeights = {
  childSafety: 0.22,
  educationAccess: 0.20,
  familyCost: 0.18,
  healthcare: 0.12,
  nature: 0.10,
  community: 0.08,
  remoteWork: 0.05,
  visa: 0.03,
  lifestyle: 0.02,
}

// ============================================================
// Dimension labels
// ============================================================

export const DIMENSION_LABELS: Record<FISDimensionKey, string> = {
  childSafety: "Child Safety",
  educationAccess: "Education Access",
  familyCost: "Family Cost",
  healthcare: "Healthcare",
  nature: "Nature & Outdoor",
  community: "Family Community",
  remoteWork: "Remote Work",
  visa: "Visa & Legal",
  lifestyle: "Lifestyle & Culture",
}

// ============================================================
// Score color and label
// ============================================================

export function getFISColor(score: number): string {
  if (score >= 70) return "#4ADE80"
  if (score >= 50) return "#EBFF00"
  return "#FF4444"
}

export function getFISLabel(score: number): string {
  if (score >= 90) return "Exceptional"
  if (score >= 80) return "Excellent"
  if (score >= 70) return "Good"
  if (score >= 60) return "Fair"
  return "Challenging"
}

// ============================================================
// Calculate dimension score from raw signals
// ============================================================

export function calculateDimensionScores(signals: CitySignals): Record<FISDimensionKey, number> {
  const childSafety = Math.round(
    signals.childSafety.streetCrime * 0.20 +
    signals.childSafety.trafficSafety * 0.15 +
    signals.childSafety.memberKidSafetyRating * 0.20 +
    signals.childSafety.airQuality * 0.12 +
    signals.childSafety.waterQuality * 0.08 +
    signals.childSafety.politicalStability * 0.10 +
    signals.childSafety.memberSafetyRating * 0.10 +
    signals.childSafety.pedestrianInfrastructure * 0.05 +
    (signals.childSafety.dengueRisk === "high" ? -8 :
     signals.childSafety.dengueRisk === "medium" ? -4 : 0) +
    (signals.childSafety.malariaRisk === "high" ? -6 :
     signals.childSafety.malariaRisk === "medium" ? -3 : 0) +
    (signals.childSafety.politicalStabilityTrend === "deteriorating" ? -5 : 0)
  )

  const educationAccess = Math.round(
    signals.educationAccess.enrollmentDifficulty * 0.25 +
    signals.educationAccess.memberSchoolRating * 0.20 +
    signals.educationAccess.englishMediumEducation * 0.12 +
    signals.educationAccess.newStudentIntegrationRating * 0.10 +
    signals.educationAccess.onlineSchoolFriendly * 0.08 +
    signals.educationAccess.memberEnrollmentRating * 0.10 +
    (signals.educationAccess.ibAvailable ? 5 : 0) +
    (signals.educationAccess.britishCurriculumAvailable ? 3 : 0) +
    (signals.educationAccess.americanCurriculumAvailable ? 3 : 0) +
    (signals.educationAccess.worldschoolingHubPresent ? 4 : 0) +
    (signals.educationAccess.augustArrivalSeptemberEnrollPossible ? 5 : -5) +
    (signals.educationAccess.midYearEntryPossible ? 3 : -3) +
    (signals.educationAccess.homeschoolLegal === "no" ? -8 :
     signals.educationAccess.homeschoolLegal === "restricted" ? -4 : 0)
  )

  const familyCost = Math.round(
    Math.max(0, 100 - (signals.familyCost.familyMonthlyEstimate / 60)) * 0.25 +
    signals.familyCost.housingAvailability * 0.15 +
    signals.familyCost.housingForeignerFriendly * 0.10 +
    signals.familyCost.groceryIndex * 0.10 +
    (signals.familyCost.memberCostSurprise === "cheaper_than_expected" ? 85 :
     signals.familyCost.memberCostSurprise === "as_expected" ? 70 : 50) * 0.15 +
    (signals.familyCost.costTrend === "rising_fast" ? -10 :
     signals.familyCost.costTrend === "rising" ? -5 : 0) +
    (signals.familyCost.averageMinimumLease <= 1 ? 5 :
     signals.familyCost.averageMinimumLease <= 3 ? 3 : 0)
  )

  const healthcare = Math.round(
    signals.healthcare.paediatricAccess * 0.20 +
    signals.healthcare.memberPaediatricRating * 0.15 +
    signals.healthcare.systemQuality * 0.10 +
    signals.healthcare.emergencyCareQuality * 0.15 +
    signals.healthcare.memberEmergencyExperienceRating * 0.10 +
    signals.healthcare.englishSpeakingDoctors * 0.10 +
    signals.healthcare.memberHealthcareRating * 0.10 +
    signals.healthcare.vaccineAvailability * 0.05 +
    signals.healthcare.pharmacyAccessibility * 0.05 +
    (signals.healthcare.englishSpeakingPaediatrician ? 5 : -8) +
    (signals.healthcare.paediatricEmergencyResponseTime <= 15 ? 5 :
     signals.healthcare.paediatricEmergencyResponseTime <= 30 ? 0 : -5)
  )

  const nature = Math.round(
    signals.nature.outdoorMonthsComfortable * (100 / 12) * 0.20 +
    signals.nature.parkQuality * 0.15 +
    signals.nature.playgroundQuality * 0.12 +
    signals.nature.kidsOutdoorActivities * 0.15 +
    signals.nature.memberOutdoorRating * 0.15 +
    signals.nature.environmentalQuality * 0.08 +
    signals.nature.natureImmersionRating * 0.10 +
    (signals.nature.beachAccess ? signals.nature.beachSafetyForKids * 0.05 : 0) +
    (signals.nature.mountainAccess ? signals.nature.hikingForKids * 0.05 : 0)
  )

  // Arrival curve modifier — how hard is it to actually land and settle?
  // Fast setup (≤2 weeks) = +8 to community. Brutal setup (8+ weeks) = -8.
  const setupModifier =
    signals.setupDifficulty.memberSetupTimelineWeeks <= 2 ? 8 :
    signals.setupDifficulty.memberSetupTimelineWeeks <= 4 ? 4 :
    signals.setupDifficulty.memberSetupTimelineWeeks <= 6 ? 0 :
    signals.setupDifficulty.memberSetupTimelineWeeks <= 8 ? -4 : -8

  // First community connection speed modifier
  const communitySpeedModifier =
    signals.community.daysToFirstCommunityConnection <= 3 ? 5 :
    signals.community.daysToFirstCommunityConnection <= 7 ? 2 :
    signals.community.daysToFirstCommunityConnection <= 14 ? 0 :
    signals.community.daysToFirstCommunityConnection <= 30 ? -3 : -6

  const community = Math.round(
    signals.community.memberCommunityRating * 0.20 +
    signals.community.kidsIntegrationSpeed * 0.20 +
    signals.community.memberOnboardingRating * 0.15 +
    signals.community.kidsActivitiesForNewcomers * 0.10 +
    signals.community.expatFamilyDensity * 0.10 +
    signals.community.localFamilyAttitude * 0.08 +
    signals.community.worldschoolingActivity * 0.07 +
    (signals.community.meetupsPerMonth >= 4 ? 5 :
     signals.community.meetupsPerMonth >= 2 ? 3 : 0) +
    (signals.community.whatsappGroupsAccessible ? 5 : 0) +
    (signals.community.uncomonFamiliesNow >= 20 ? 5 :
     signals.community.uncomonFamiliesNow >= 10 ? 3 : 0) +
    setupModifier +
    communitySpeedModifier
  )

  const remoteWork = Math.round(
    signals.remoteWork.internetReliability * 0.25 +
    signals.remoteWork.memberInternetRating * 0.20 +
    signals.remoteWork.memberWorkSetupRating * 0.15 +
    Math.min(100, signals.remoteWork.avgDownloadSpeed * 1.2) * 0.15 +
    signals.remoteWork.cafeWorkFriendly * 0.10 +
    signals.remoteWork.coworkingKidFriendly * 0.10 +
    (signals.remoteWork.vpnFriendly ? 5 : -10)
  )

  const visa = Math.round(
    signals.visa.processingDifficulty * 0.25 +
    signals.visa.memberVisaRating * 0.20 +
    signals.visa.memberStrongPassportRating * 0.15 +
    (signals.visa.nomadVisaAvailable ? 10 : 0) +
    (signals.visa.nomadVisaIncludesDependents ? 8 : 0) +
    (signals.visa.nomadVisaRenewable ? 5 : 0) +
    (signals.visa.requiresLocalLawyer ? -8 : 0) +
    (signals.visa.borderRunRequired ? -5 : 0) +
    signals.visa.strongPassportApprovalRate * 0.10
  )

  const lifestyle = Math.round(
    signals.lifestyle.englishInDailyLife * 0.25 +
    signals.lifestyle.restaurantFamilyFriendly * 0.15 +
    signals.lifestyle.culturalActivitiesForKids * 0.20 +
    signals.lifestyle.kidsEntertainment * 0.15 +
    signals.lifestyle.memberLifestyleRating * 0.15 +
    signals.lifestyle.internationalFoodAvailability * 0.10
  )

  return {
    childSafety: Math.min(100, Math.max(0, childSafety)),
    educationAccess: Math.min(100, Math.max(0, educationAccess)),
    familyCost: Math.min(100, Math.max(0, familyCost)),
    healthcare: Math.min(100, Math.max(0, healthcare)),
    nature: Math.min(100, Math.max(0, nature)),
    community: Math.min(100, Math.max(0, community)),
    remoteWork: Math.min(100, Math.max(0, remoteWork)),
    visa: Math.min(100, Math.max(0, visa)),
    lifestyle: Math.min(100, Math.max(0, lifestyle)),
  }
}

// ============================================================
// Normalise weights to always sum to 1.0
// ============================================================

function normaliseWeights(weights: FISWeights): FISWeights {
  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  if (total === 0) return { ...DEFAULT_WEIGHTS }
  const normalised = { ...weights }
  for (const key of Object.keys(normalised) as FISDimensionKey[]) {
    normalised[key] = normalised[key] / total
  }
  return normalised
}

// ============================================================
// Calculate default FIS (for anonymous users)
// ============================================================

export function calculateDefaultFIS(city: City): FISResult {
  if (!city.signals) {
    // Fallback: use legacy scores to generate a basic FIS
    return calculateFISFromLegacy(city)
  }

  const dimensionScores = calculateDimensionScores(city.signals)
  const weights = DEFAULT_WEIGHTS

  const score = Math.round(
    Object.entries(weights).reduce((sum, [key, weight]) => {
      return sum + dimensionScores[key as FISDimensionKey] * weight
    }, 0)
  )

  const ranked = Object.entries(dimensionScores)
    .map(([key, val]) => ({ dimension: key as FISDimensionKey, score: val, label: DIMENSION_LABELS[key as FISDimensionKey] }))
    .sort((a, b) => b.score - a.score)

  return {
    score,
    weights,
    dimensionScores,
    topStrengths: ranked.slice(0, 3),
    topWeaknesses: ranked.slice(-2).reverse(),
  }
}

// ============================================================
// Calculate FIS from legacy scores (backward compatibility)
// ============================================================

function calculateFISFromLegacy(city: City): FISResult {
  // Cost score: scale so €1000/mo = 95, €2500/mo = 75, €4000/mo = 55, €5000/mo = 40
  const costScore = Math.min(100, Math.max(20, Math.round(110 - (city.cost.familyMonthly / 55))))

  // Community: combine familiesNow (capped), returnRate, and visa friendliness as proxy
  const communityBase = Math.min(40, city.meta.familiesNow * 1.5)
  const communityReturn = city.meta.returnRate * 0.4
  const communityVisa = city.meta.visaFriendly === "Excellent" ? 15 : city.meta.visaFriendly === "Good" ? 10 : 5
  const communityScore = Math.min(100, Math.round(communityBase + communityReturn + communityVisa))

  // Lifestyle: average of available scores as proxy
  const lifestyleScore = Math.round((city.scores.childSafety + city.scores.nature + city.scores.internet) / 3)

  const dimensionScores: Record<FISDimensionKey, number> = {
    childSafety: city.scores.childSafety,
    educationAccess: city.scores.schoolAccess,
    familyCost: costScore,
    healthcare: city.scores.healthcare,
    nature: city.scores.nature,
    community: communityScore,
    remoteWork: city.scores.internet,
    visa: city.meta.visaFriendly === "Excellent" ? 90 : city.meta.visaFriendly === "Good" ? 75 : city.meta.visaFriendly === "OK" ? 60 : 40,
    lifestyle: lifestyleScore,
  }

  const weights = DEFAULT_WEIGHTS
  const score = Math.round(
    Object.entries(weights).reduce((sum, [key, weight]) => {
      return sum + dimensionScores[key as FISDimensionKey] * weight
    }, 0)
  )

  const ranked = Object.entries(dimensionScores)
    .map(([key, val]) => ({ dimension: key as FISDimensionKey, score: val, label: DIMENSION_LABELS[key as FISDimensionKey] }))
    .sort((a, b) => b.score - a.score)

  return {
    score,
    weights,
    dimensionScores,
    topStrengths: ranked.slice(0, 3),
    topWeaknesses: ranked.slice(-2).reverse(),
  }
}

// ============================================================
// Calculate personal FIS (for logged-in members)
// ============================================================

type FamilyIntelligence = {
  primaryAnxiety?: string
  realBudgetMax?: number
}

export function calculatePersonalFIS(
  city: City,
  family: Family,
  intelligence?: FamilyIntelligence | null
): PersonalFISResult {
  const base = calculateDefaultFIS(city)
  const weights = { ...base.weights }
  const adjustedFor: string[] = []

  // MODIFIER 1 — Kids age
  const ages = family.kids_ages || []
  const hasToddlers = ages.some((a) => a < 4)
  const hasTeens = ages.some((a) => a > 12)
  const hasSchoolAge = ages.some((a) => a >= 4 && a <= 12)

  if (hasToddlers) {
    weights.healthcare += 0.06
    weights.childSafety += 0.04
    weights.educationAccess -= 0.06
    weights.nature += 0.02
    weights.familyCost -= 0.06
    adjustedFor.push("toddlers")
  }
  if (hasTeens) {
    weights.educationAccess += 0.06
    weights.community += 0.04
    weights.lifestyle += 0.04
    weights.healthcare -= 0.04
    weights.childSafety -= 0.05
    weights.nature -= 0.05
    adjustedFor.push("teens")
  }
  if (hasSchoolAge && !hasToddlers && !hasTeens) {
    weights.educationAccess += 0.08
    weights.community += 0.02
    weights.healthcare -= 0.05
    weights.lifestyle -= 0.05
    adjustedFor.push("school-age kids")
  }

  // MODIFIER 2 — Education approach
  const edu = family.education_approach?.toLowerCase() || ""
  if (edu.includes("unschool") || edu.includes("worldschool")) {
    weights.educationAccess -= 0.08
    weights.nature += 0.05
    weights.lifestyle += 0.03
    adjustedFor.push("unschooling")
  } else if (edu.includes("international") || edu.includes("traditional")) {
    weights.educationAccess += 0.06
    weights.community -= 0.03
    weights.lifestyle -= 0.03
    adjustedFor.push("traditional schooling")
  }

  // MODIFIER 3 — Primary anxiety
  const anxiety = intelligence?.primaryAnxiety || ""
  if (anxiety === "safety") {
    weights.childSafety += 0.08
    weights.lifestyle -= 0.04
    weights.community -= 0.04
    adjustedFor.push("safety-focused")
  } else if (anxiety === "cost") {
    weights.familyCost += 0.08
    weights.lifestyle -= 0.04
    weights.community -= 0.04
    adjustedFor.push("cost-conscious")
  } else if (anxiety === "school") {
    weights.educationAccess += 0.08
    weights.lifestyle -= 0.04
    weights.community -= 0.04
    adjustedFor.push("education-focused")
  } else if (anxiety === "community") {
    weights.community += 0.08
    weights.lifestyle += 0.02
    weights.visa -= 0.04
    weights.remoteWork -= 0.06
    adjustedFor.push("community-seeking")
  }

  // MODIFIER 4 — Travel style
  const style = family.travel_style?.toLowerCase() || ""
  if (style.includes("slow") || style.includes("months")) {
    weights.community += 0.04
    weights.educationAccess += 0.02
    weights.visa -= 0.03
    weights.remoteWork -= 0.03
    adjustedFor.push("slow travel")
  } else if (style.includes("fast") || style.includes("week")) {
    weights.visa += 0.04
    weights.community -= 0.04
    adjustedFor.push("fast travel")
  }

  // MODIFIER 5 — Budget
  const budget = intelligence?.realBudgetMax || 3000
  if (budget < 2500) {
    weights.familyCost += 0.06
    weights.lifestyle -= 0.03
    weights.community -= 0.03
    adjustedFor.push("tight budget")
  }

  // MODIFIER 6 — Passport tier (adjusts visa weight and signals)
  const STRONG_PASSPORT_COUNTRIES = ["US","GB","DE","FR","AU","CA","NZ","SE","DK","NO","NL","BE","AT","FI","PT","ES","IT","JP","SG","IL","CH","LU","IE","IS","LI"]
  const MEDIUM_PASSPORT_COUNTRIES = ["BR","MX","AR","TR","IN","ZA","MY","TH","CO","CL","PE","RO","PL","CZ","UA","RU","HU","SK","HR","RS","GE","AM","AZ","KZ"]
  const countryCode = (family.country_code || "").toUpperCase()

  if (MEDIUM_PASSPORT_COUNTRIES.includes(countryCode)) {
    weights.visa += 0.05
    weights.lifestyle -= 0.03
    weights.remoteWork -= 0.02
    adjustedFor.push("medium passport")
  } else if (!STRONG_PASSPORT_COUNTRIES.includes(countryCode) && countryCode !== "") {
    weights.visa += 0.08
    weights.community -= 0.04
    weights.lifestyle -= 0.04
    adjustedFor.push("limited passport")
  }

  // Normalise
  const normalised = normaliseWeights(weights)

  // Calculate score with adjusted weights
  const score = Math.round(
    Object.entries(normalised).reduce((sum, [key, weight]) => {
      return sum + base.dimensionScores[key as FISDimensionKey] * weight
    }, 0)
  )

  // Generate insights
  const topDimension = Object.entries(normalised)
    .sort(([, a], [, b]) => b - a)[0][0] as FISDimensionKey
  const topScore = base.dimensionScores[topDimension]

  const weakDimension = Object.entries(base.dimensionScores)
    .filter(([key]) => normalised[key as FISDimensionKey] > 0.05)
    .sort(([, a], [, b]) => a - b)[0]

  const topReason = topScore >= 80
    ? `Strong ${DIMENSION_LABELS[topDimension].toLowerCase()} for your family`
    : `${DIMENSION_LABELS[topDimension]} is your top priority here`

  const watchOut = weakDimension
    ? `${DIMENSION_LABELS[weakDimension[0] as FISDimensionKey]} scores ${weakDimension[1]}/100`
    : ""

  const personalizedInsight = generateInsight(city, family, base.dimensionScores, adjustedFor)

  const ranked = Object.entries(base.dimensionScores)
    .map(([key, val]) => ({ dimension: key as FISDimensionKey, score: val, label: DIMENSION_LABELS[key as FISDimensionKey] }))
    .sort((a, b) => b.score - a.score)

  return {
    score,
    weights: normalised,
    dimensionScores: base.dimensionScores,
    topStrengths: ranked.slice(0, 3),
    topWeaknesses: ranked.slice(-2).reverse(),
    personalizedInsight,
    adjustedFor,
    topReason,
    watchOut,
  }
}

function generateInsight(
  city: City,
  family: Family,
  scores: Record<FISDimensionKey, number>,
  adjustedFor: string[]
): string {
  const ages = family.kids_ages || []
  const kidsDesc = ages.length === 0 ? "" : ages.length === 1 ? `your ${ages[0]}-year-old` : `your kids (${ages.join(", ")})`
  const signals = city.signals

  // Passport-specific insight
  if (adjustedFor.includes("limited passport") && signals?.visa.limitedPassportVisaFriendly === "difficult") {
    return `${city.name} may be challenging for families with your passport. Check the visa section carefully — processing reality for your passport tier differs from the headline score.`
  }
  if (adjustedFor.includes("medium passport") && signals?.visa.mediumPassportApprovalRate && signals.visa.mediumPassportApprovalRate < 70) {
    return `Visa approval for your passport in ${city.name} has some friction. Consider getting guidance before committing to a move — processing times may be longer than the default score suggests.`
  }

  // Setup difficulty insight
  if (signals?.setupDifficulty.memberSetupTimelineWeeks && signals.setupDifficulty.memberSetupTimelineWeeks > 8) {
    return `${city.name} takes time to get operational — families typically report ${signals.setupDifficulty.memberSetupTimelineWeeks} weeks to feel settled. Budget for a longer setup period.`
  }

  // School enrollment insight for school-age kids
  if (ages.some(a => a >= 5 && a <= 16) && signals?.educationAccess.augustArrivalSeptemberEnrollPossible === false) {
    return `${city.name} has school enrollment timing to watch — mid-year entry is not always possible. If ${kidsDesc} needs school enrollment, check intake calendars before booking.`
  }

  // Healthcare insight for families with very young kids
  if (ages.some(a => a < 3) && signals?.healthcare.paediatricEmergencyResponseTime && signals.healthcare.paediatricEmergencyResponseTime > 30) {
    return `With ${kidsDesc}, note that paediatric emergency care in ${city.name} is ${signals.healthcare.paediatricEmergencyResponseTime} minutes away. Plan your accommodation location accordingly.`
  }

  // Standard insights
  if (scores.childSafety >= 85 && ages.some((a) => a < 6)) {
    return `${city.name} is one of the safest cities for young children. Great for ${kidsDesc}.`
  }
  if (scores.educationAccess >= 80 && adjustedFor.includes("traditional schooling")) {
    return `Strong international school options in ${city.name} for ${kidsDesc}.`
  }
  if (scores.familyCost >= 85) {
    return `${city.name} is exceptionally affordable for families. Your budget stretches far here.`
  }
  if (scores.community >= 80 && adjustedFor.includes("community-seeking")) {
    return `Active family community in ${city.name}${signals?.community.kidsIntegrationSpeedWeeks ? ` — kids typically make friends within ${signals.community.kidsIntegrationSpeedWeeks} weeks` : ""}. You'll find your people here.`
  }
  if (scores.nature >= 85) {
    return `Outstanding outdoor life in ${city.name}. ${kidsDesc ? `Perfect for ${kidsDesc} to explore.` : "Kids thrive outdoors here."}`
  }
  return `${city.name} scores ${Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 9)} on average across all dimensions for your family.`
}
