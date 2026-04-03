/**
 * Personalization logic — adjusts city data based on family profile.
 * All calculations are deterministic math, no estimation.
 */

import { City } from "./types"
import { Family } from "./database.types"

const STRONG_PASSPORTS = ["US","GB","DE","FR","AU","CA","NZ","SE","DK","NO","NL","BE","AT","FI","PT","ES","IT","JP","SG","IL","CH","LU","IE","IS","LI"]
const MEDIUM_PASSPORTS = ["BR","MX","AR","TR","IN","ZA","MY","TH","CO","CL","PE","RO","PL","CZ","UA","RU","HU","SK","HR","RS","GE","AM","AZ","KZ"]

export type PassportTier = "strong" | "medium" | "limited"

export function getPassportTier(countryCode: string): PassportTier {
  const code = countryCode.toUpperCase()
  if (STRONG_PASSPORTS.includes(code)) return "strong"
  if (MEDIUM_PASSPORTS.includes(code)) return "medium"
  return "limited"
}

// ============================================================
// Cost personalization
// ============================================================

export type PersonalizedCost = {
  label: string                    // "For your family (2 adults + 2 kids)"
  rent: { amount: number; label: string }
  school: { amount: number; label: string; perChild: number; kidsCount: number }
  childcare: { amount: number; show: boolean }
  total: number
  isPersonalized: boolean
}

export function personalizedCost(city: City, family: Family | null): PersonalizedCost {
  if (!family || !family.kids_ages || family.kids_ages.length === 0) {
    // Generic fallback
    return {
      label: "Estimated for a family of 4",
      rent: { amount: city.cost.rent2br, label: "2br apartment" },
      school: { amount: city.cost.internationalSchool, label: "International school (per child)", perChild: city.cost.internationalSchool, kidsCount: 2 },
      childcare: { amount: city.cost.childcare, show: true },
      total: city.cost.familyMonthly,
      isPersonalized: false,
    }
  }

  const ages = family.kids_ages
  const kidsCount = ages.length
  const hasYoungKids = ages.some((a) => a < 5)
  const hasTeens = ages.some((a) => a >= 13)
  const schoolAgeKids = ages.filter((a) => a >= 4 && a <= 18).length

  // Rent: 2br for 1-2 kids, 3br for 3+ or teens wanting own room
  const needsBiggerPlace = kidsCount >= 3 || hasTeens
  const signals = city.signals
  const rent3br = signals?.familyCost?.rent3br || Math.round(city.cost.rent2br * 1.4)
  const rent = needsBiggerPlace
    ? { amount: rent3br, label: "3br apartment" }
    : { amount: city.cost.rent2br, label: "2br apartment" }

  // School: based on education approach
  const edu = (family.education_approach || "").toLowerCase()
  let schoolPerChild = 0
  let schoolLabel = "School"
  if (edu.includes("homeschool") || edu.includes("unschool") || edu.includes("worldschool")) {
    schoolPerChild = 0
    schoolLabel = "Homeschool (no fees)"
  } else if (edu.includes("international")) {
    schoolPerChild = city.cost.internationalSchool
    schoolLabel = "International school"
  } else if (edu.includes("local")) {
    schoolPerChild = city.cost.localSchool
    schoolLabel = "Local school"
  } else if (edu.includes("online")) {
    schoolPerChild = 0
    schoolLabel = "Online school"
  } else {
    // Default: mix
    schoolPerChild = Math.round((city.cost.internationalSchool + city.cost.localSchool) / 2)
    schoolLabel = "School (estimated)"
  }
  const schoolTotal = schoolPerChild * schoolAgeKids

  // Childcare: only if any kid under 5
  const childcareAmount = hasYoungKids ? city.cost.childcare : 0

  // Total
  const livingCosts = (kidsCount + 2) * 400 // rough per-person living costs
  const total = rent.amount + schoolTotal + childcareAmount + livingCosts

  return {
    label: `Estimated for your family (2 adults + ${kidsCount} kid${kidsCount > 1 ? "s" : ""})`,
    rent,
    school: { amount: schoolTotal, label: schoolLabel, perChild: schoolPerChild, kidsCount: schoolAgeKids },
    childcare: { amount: childcareAmount, show: hasYoungKids },
    total,
    isPersonalized: true,
  }
}

// ============================================================
// Visa personalization
// ============================================================

export type PersonalizedVisa = {
  tier: PassportTier
  tierLabel: string
  processingDays: number | null
  approvalRate: number | null
  friendliness: string | null
}

export function personalizedVisa(city: City, family: Family | null): PersonalizedVisa | null {
  if (!family?.country_code || !city.signals?.visa) return null

  const tier = getPassportTier(family.country_code)
  const v = city.signals.visa

  const tierData: Record<PassportTier, { days: number; approval: number; friendly: string }> = {
    strong: { days: v.strongPassportProcessingDays, approval: v.strongPassportApprovalRate, friendly: v.strongPassportVisaFriendly },
    medium: { days: v.mediumPassportProcessingDays, approval: v.mediumPassportApprovalRate, friendly: v.mediumPassportVisaFriendly },
    limited: { days: v.limitedPassportProcessingDays, approval: v.limitedPassportApprovalRate, friendly: v.limitedPassportVisaFriendly },
  }

  const data = tierData[tier]
  return {
    tier,
    tierLabel: tier === "strong" ? "Strong passport" : tier === "medium" ? "Medium passport" : "Limited passport",
    processingDays: data.days,
    approvalRate: data.approval,
    friendliness: data.friendly,
  }
}

// ============================================================
// Education relevance
// ============================================================

export function isEducationRelevant(approach: string, family: Family | null): boolean {
  if (!family?.education_approach) return false
  const edu = family.education_approach.toLowerCase()
  const check = approach.toLowerCase()

  if (edu.includes("homeschool") && (check.includes("homeschool") || check.includes("worldschool"))) return true
  if (edu.includes("international") && check.includes("international")) return true
  if (edu.includes("montessori") && check.includes("montessori")) return true
  if (edu.includes("waldorf") && (check.includes("waldorf") || check.includes("steiner"))) return true
  if (edu.includes("local") && check.includes("local")) return true
  return false
}
