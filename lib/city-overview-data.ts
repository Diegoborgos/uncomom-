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
  signalCount: number         // signals matching this dimension prefix
  sourceCount: number         // unique sources for this dimension
  lastUpdated: string | null  // most recent fetch for this dimension
  /** Top sources contributing to this dimension, with citation URLs. */
  sources: Array<{ name: string; url: string | null; type: string }>
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
    /** Per-source_type signal counts. Drives the admin Data Coverage view. */
    coverageByType: {
      public_api: number
      field_report: number
      admin_manual: number
      researched: number
      seed_estimate: number
      paid_api_ready: number
    }
  }
  /** Per-signal provenance lookup: signal_key → source citation. */
  signalSources: Record<string, {
    source_name: string
    source_url: string | null
    source_type: string
    confidence: number
    fetched_at: string
  }>
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
  dimensionModifiers?: Partial<Record<FISDimensionKey, number>> | null,
): Promise<CityOverviewData> {

  // --- FIS ---
  const defaultFIS = calculateDefaultFIS(city, dimensionModifiers)
  const fis: FISResult | PersonalFISResult = family && isPaid
    ? calculatePersonalFIS(city, family, null, dimensionModifiers)
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

    // Per-dimension source stats: match signal_key prefix before the first dot
    const dimSources = dataSources.filter(s => {
      const prefix = s.signal_key.split(".")[0]
      return prefix === key
    })
    const uniqueSourceNames = new Set(dimSources.map(s => s.source_name))
    const dimLastUpdated = dimSources.length > 0
      ? dimSources.reduce((latest, s) => s.fetched_at > latest ? s.fetched_at : latest, dimSources[0].fetched_at)
      : null

    // Top sources for this dimension with citation URLs (deduped by name).
    const seenNames = new Set<string>()
    const sourcesForDim: Array<{ name: string; url: string | null; type: string }> = []
    for (const s of dimSources) {
      if (seenNames.has(s.source_name)) continue
      seenNames.add(s.source_name)
      sourcesForDim.push({ name: s.source_name, url: s.source_url ?? null, type: s.source_type })
    }

    return {
      key,
      label: DIMENSION_LABELS[key],
      score: personalScore,
      color: getFISColor(personalScore),
      weightPercent: Math.round(fis.weights[key] * 100),
      personalAdjustment: adjustment,
      isPersonalized: adjustment !== 0,
      signalCount: dimSources.length,
      sourceCount: uniqueSourceNames.size,
      lastUpdated: dimLastUpdated,
      sources: sourcesForDim,
    }
  })

  // Build per-signal source lookup (signal_key → most-recent provenance row)
  const signalSources: CityOverviewData["signalSources"] = {}
  for (const s of dataSources) {
    const existing = signalSources[s.signal_key]
    if (!existing || s.fetched_at > existing.fetched_at) {
      signalSources[s.signal_key] = {
        source_name: s.source_name,
        source_url: s.source_url ?? null,
        source_type: s.source_type,
        confidence: s.confidence,
        fetched_at: s.fetched_at,
      }
    }
  }

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
      coverageByType: countByType(dataSources),
    },
    signalSources,
  }
}

function countByType(
  rows: Array<{ source_type: string }>,
): { public_api: number; field_report: number; admin_manual: number; researched: number; seed_estimate: number; paid_api_ready: number } {
  const counts = {
    public_api: 0,
    field_report: 0,
    admin_manual: 0,
    researched: 0,
    seed_estimate: 0,
    paid_api_ready: 0,
  }
  for (const r of rows) {
    // accept both new and legacy names
    const key = (r.source_type === "manual" ? "admin_manual"
      : r.source_type === "estimated" ? "seed_estimate"
      : r.source_type) as keyof typeof counts
    if (key in counts) counts[key]++
  }
  return counts
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
