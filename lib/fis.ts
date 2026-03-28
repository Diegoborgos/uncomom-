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
  if (score >= 90) return "#2d9e6b"
  if (score >= 80) return "#4caf7d"
  if (score >= 70) return "#c8932a"
  if (score >= 60) return "#e07d30"
  return "#c44b2b"
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
  return {
    childSafety: signals.childSafety.overall,
    educationAccess: signals.educationAccess.overall,
    familyCost: signals.familyCost.overall,
    healthcare: signals.healthcare.overall,
    nature: signals.nature.overall,
    community: signals.community.overall,
    remoteWork: signals.remoteWork.overall,
    visa: signals.visa.overall,
    lifestyle: signals.lifestyle.overall,
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
  const dimensionScores: Record<FISDimensionKey, number> = {
    childSafety: city.scores.childSafety,
    educationAccess: city.scores.schoolAccess,
    familyCost: Math.round(100 - (city.cost.familyMonthly / 50)),
    healthcare: city.scores.healthcare,
    nature: city.scores.nature,
    community: Math.min(100, city.meta.familiesNow * 2 + city.meta.returnRate),
    remoteWork: city.scores.internet,
    visa: city.meta.visaFriendly === "Excellent" ? 90 : city.meta.visaFriendly === "Good" ? 75 : city.meta.visaFriendly === "OK" ? 60 : 40,
    lifestyle: 70,
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
    return `Active family community in ${city.name}. You'll find your people here.`
  }
  if (scores.nature >= 85) {
    return `Outstanding outdoor life in ${city.name}. ${kidsDesc ? `Perfect for ${kidsDesc} to explore.` : "Kids thrive outdoors here."}`
  }
  return `${city.name} scores ${Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 9)} on average across all dimensions for your family.`
}
