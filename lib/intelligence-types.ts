import { FISDimensionKey } from "./types"

// ============================================================
// Classified article from GDELT
// ============================================================

export type ClassifiedArticle = {
  title: string
  url: string
  sourceDomain: string
  publishDate: string
  dimension: FISDimensionKey | null  // null = not family-relevant
  sentiment: "positive" | "negative" | "neutral"
  relevanceScore: number  // 0-10
  familySummary: string   // one-line summary for parents
}

// ============================================================
// Top signal — the most important change this period
// ============================================================

export type TopSignal = {
  type: "news" | "api" | "family_report" | "legal_change"
  source: string
  headline: string
  detail?: string
  dimension: FISDimensionKey | null
  sentiment: "positive" | "negative" | "neutral"
}

// ============================================================
// Data gap — fields that need family reports
// ============================================================

export type DataGap = {
  field: string              // e.g. "healthcare.emergencyNarrative"
  label: string              // e.g. "Emergency care experience"
  dimension: FISDimensionKey
  priority: "high" | "medium" | "low"
}

// ============================================================
// City intelligence — weekly engine output
// ============================================================

export type CityIntelligenceRecord = {
  id: string
  citySlug: string
  dimensionModifiers: Partial<Record<FISDimensionKey, number>>
  cityNarrative: string | null
  trend: "heating" | "cooling" | "stable"
  trendReason: string | null
  arrivalCurve: "emerging" | "established" | "trending" | "saturated"
  topSignals: TopSignal[]
  classifiedArticles: ClassifiedArticle[]
  dataGaps: DataGap[]
  periodStart: string
  periodEnd: string
  generatedAt: string
}

// ============================================================
// Family briefing item
// ============================================================

export type BriefingItem = {
  type: "visa" | "education" | "cost" | "safety" | "activity" | "legal" | "community" | "general"
  headline: string
  detail: string
  dimension: FISDimensionKey | null
  relevance: "high" | "medium" | "low"
  reason: string  // why this matters to THIS family
}

export type CityBriefing = {
  citySlug: string
  cityName: string
  items: BriefingItem[]
}

export type FamilyBriefing = {
  id: string
  familyId: string
  headline: string
  totalItems: number
  cities: CityBriefing[]
  periodStart: string
  periodEnd: string
  generatedAt: string
  readAt: string | null
}
