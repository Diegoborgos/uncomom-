/**
 * Unified city data layer for the Overview tab.
 * Merges: City + CitySignals + city_data_sources + personalization
 * into a single object where every field carries provenance.
 */

import { City, FISDimensionKey, PersonalFISResult, FISResult } from "./types"
import { calculateDefaultFIS, calculatePersonalFIS, DIMENSION_LABELS, getFISColor, getFISLabel } from "./fis"
import { personalizedCost, PersonalizedCost, personalizedVisa, PersonalizedVisa } from "./personalize"
import { Family } from "./database.types"

// ============================================================
// Core types — every data point carries provenance
// ============================================================

export type DataSource = {
  name: string          // "Open-Meteo", "World Bank", "Family reports", "manual"
  type: string          // "public_api", "field_report", "manual", "estimated"
  confidence: number    // 0-100
  updatedAt: string | null  // ISO timestamp
  url: string | null    // link to source
  reportCount?: number  // number of family reports behind this
}

export type SourcedValue<T> = {
  value: T
  source: DataSource | null
  isPersonalized: boolean
  personalizationReason?: string  // "Adjusted for toddlers", "Based on Brazilian passport"
}

// ============================================================
// Overview data shape — one object, everything the tab needs
// ============================================================

export type FISDimensionData = {
  key: FISDimensionKey
  label: string
  score: number
  color: string
  weightPercent: number       // 0-100
  personalAdjustment: number  // e.g. +26, -1, 0
  isPersonalized: boolean
}

export type CityOverviewData = {
  // Identity
  slug: string
  name: string
  country: string
  countryCode: string
  continent: string
  description: string
  tags: string[]
  photo: string
  bestMonths: string[]

  // FIS Score
  fis: {
    score: number
    label: string       // "Good", "Great", "Excellent"
    color: string
    isPersonalized: boolean
    adjustedFor: string[]     // ["toddlers", "slow travel", "medium passport"]
    personalizedInsight: string | null
    dimensions: FISDimensionData[]
  }

  // Costs
  cost: PersonalizedCost & {
    sources: DataSource[]
  }

  // Meta info
  meta: {
    timezone: SourcedValue<string>
    languages: SourcedValue<string[]>
    kidsAgeIdeal: SourcedValue<string>
    homeschoolLegal: SourcedValue<string> & {
      isRelevant: boolean  // true if family homeschools
    }
    visa: SourcedValue<string> & {
      tier: string | null         // "Medium passport"
      processingDays: number | null
      details: PersonalizedVisa | null
    }
    familiesNow: number
    familiesBeen: number
    returnRate: number
  }

  // Data health
  dataHealth: {
    totalSignals: number
    totalSources: number
    fieldReportCount: number
    lastUpdated: string | null
    sources: DataSource[]
  }
}

// ============================================================
// Builder — assembles the overview data object
// ============================================================

export async function buildCityOverviewData(
  city: City,
  family: Family | null,
  isPaid: boolean,
  dataSources: Array<{
    source_name: string
    source_type: string
    source_url: string | null
    signal_key: string
    confidence: number
    fetched_at: string
    report_count?: number
  }>,
  fieldReportCount: number,
): Promise<CityOverviewData> {

  // --- FIS ---
  const defaultFIS = calculateDefaultFIS(city)
  const fis: FISResult | PersonalFISResult = family && isPaid
    ? calculatePersonalFIS(city, family)
    : defaultFIS

  const isPersonalFIS = "adjustedFor" in fis
  const personalFIS = isPersonalFIS ? (fis as PersonalFISResult) : null

  const dimensionKeys: FISDimensionKey[] = [
    "childSafety", "educationAccess", "familyCost", "healthcare",
    "nature", "community", "remoteWork", "visa", "lifestyle",
  ]

  const dimensions: FISDimensionData[] = dimensionKeys.map(key => {
    const personalScore = fis.dimensionScores[key]
    const defaultScore = defaultFIS.dimensionScores[key]
    const adjustment = isPersonalFIS ? personalScore - defaultScore : 0

    return {
      key,
      label: DIMENSION_LABELS[key],
      score: personalScore,
      color: getFISColor(personalScore),
      weightPercent: Math.round(fis.weights[key] * 100),
      personalAdjustment: adjustment,
      isPersonalized: adjustment !== 0,
    }
  })

  // --- Costs ---
  const cost = personalizedCost(city, isPaid ? family : null)

  // Find cost-related data sources
  const costSources = dataSources
    .filter(s => s.signal_key.startsWith("familyCost") || s.signal_key.startsWith("cost"))
    .map(toDataSource)

  // --- Meta ---
  const isHomeschooler = family?.education_approach?.toLowerCase().includes("homeschool") ||
    family?.education_approach?.toLowerCase().includes("unschool") ||
    family?.education_approach?.toLowerCase().includes("worldschool") || false

  const visa = isPaid ? personalizedVisa(city, family) : null

  const metaSource = dataSources.find(s => s.signal_key === "meta.country")

  // --- Data Health ---
  const grouped: Record<string, DataSource> = {}
  for (const s of dataSources) {
    if (!grouped[s.source_name]) {
      grouped[s.source_name] = toDataSource(s)
      grouped[s.source_name].reportCount = 0
    }
    grouped[s.source_name].reportCount = (grouped[s.source_name].reportCount || 0) + 1
  }
  const sourceList = Object.values(grouped)

  const latestUpdate = dataSources.length > 0
    ? dataSources.reduce((latest, s) =>
        s.fetched_at > latest ? s.fetched_at : latest, dataSources[0].fetched_at)
    : null

  // --- Assemble ---
  return {
    slug: city.slug,
    name: city.name,
    country: city.country,
    countryCode: city.countryCode,
    continent: city.continent,
    description: city.description,
    tags: city.tags,
    photo: city.photo,
    bestMonths: city.meta.bestMonths,

    fis: {
      score: fis.score,
      label: getFISLabel(fis.score),
      color: getFISColor(fis.score),
      isPersonalized: isPersonalFIS,
      adjustedFor: personalFIS?.adjustedFor || [],
      personalizedInsight: personalFIS?.personalizedInsight || null,
      dimensions,
    },

    cost: {
      ...cost,
      sources: costSources.length > 0 ? costSources : [{
        name: "Estimated",
        type: "estimated",
        confidence: 60,
        updatedAt: null,
        url: null,
      }],
    },

    meta: {
      timezone: sourced(city.meta.timezone, metaSource),
      languages: sourced(city.meta.language, metaSource),
      kidsAgeIdeal: sourced(city.meta.kidsAgeIdeal, null),
      homeschoolLegal: {
        ...sourced(city.meta.homeschoolLegal, null),
        isRelevant: isHomeschooler,
      },
      visa: {
        ...sourced(visa?.friendliness || city.meta.visaFriendly, null, !!visa, visa ? `Based on ${visa.tierLabel}` : undefined),
        tier: visa?.tierLabel || null,
        processingDays: visa?.processingDays || null,
        details: visa,
      },
      familiesNow: city.meta.familiesNow,
      familiesBeen: city.meta.familiesBeen,
      returnRate: city.meta.returnRate,
    },

    dataHealth: {
      totalSignals: dataSources.length,
      totalSources: sourceList.length + (fieldReportCount > 0 ? 1 : 0),
      fieldReportCount,
      lastUpdated: latestUpdate,
      sources: fieldReportCount > 0
        ? [...sourceList, { name: "Family reports", type: "field_report", confidence: 85, updatedAt: latestUpdate, url: null, reportCount: fieldReportCount }]
        : sourceList,
    },
  }
}

// ============================================================
// Helpers
// ============================================================

function toDataSource(raw: {
  source_name: string
  source_type: string
  source_url?: string | null
  confidence: number
  fetched_at: string
  report_count?: number
}): DataSource {
  return {
    name: raw.source_name,
    type: raw.source_type,
    confidence: raw.confidence,
    updatedAt: raw.fetched_at,
    url: raw.source_url || null,
    reportCount: raw.report_count,
  }
}

function sourced<T>(
  value: T,
  rawSource: { source_name: string; source_type: string; source_url?: string | null; confidence: number; fetched_at: string } | undefined | null,
  isPersonalized: boolean = false,
  personalizationReason?: string,
): SourcedValue<T> {
  return {
    value,
    source: rawSource ? toDataSource(rawSource as Parameters<typeof toDataSource>[0]) : null,
    isPersonalized,
    personalizationReason,
  }
}
