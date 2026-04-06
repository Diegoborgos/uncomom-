import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cities } from "@/data/cities"
import { buildCityOverviewData } from "@/lib/city-overview-data"
import { FISDimensionKey } from "@/lib/types"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const city = cities.find((c) => c.slug === params.slug)

  if (!city) {
    return NextResponse.json(
      {
        error: "City not found",
        availableSlugs: cities.map((c) => c.slug).sort(),
      },
      { status: 404, headers: CORS_HEADERS }
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

  // Fetch data sources
  const { data: dataSources } = await supabase
    .from("city_data_sources")
    .select("source_name, source_type, source_url, signal_key, confidence, fetched_at, report_count")
    .eq("city_slug", city.slug)
    .order("fetched_at", { ascending: false })

  // Fetch field report count
  const { count: fieldReportCount } = await supabase
    .from("city_field_reports")
    .select("id", { count: "exact", head: true })
    .eq("city_slug", city.slug)
    .in("status", ["complete", "reviewed"])

  // Fetch latest dimension modifiers
  const { data: latestIntel } = await supabase
    .from("city_intelligence")
    .select("dimension_modifiers")
    .eq("city_slug", city.slug)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const dimensionModifiers = latestIntel?.dimension_modifiers as Partial<Record<FISDimensionKey, number>> | null

  // Build overview (no family = no personalization)
  const overview = await buildCityOverviewData(
    city,
    null,
    false,
    dataSources || [],
    fieldReportCount || 0,
    dimensionModifiers || null,
  )

  // Reshape into clean public structure
  const response = {
    city: {
      slug: overview.slug,
      name: overview.name,
      country: overview.country,
      countryCode: overview.countryCode,
      continent: overview.continent,
      description: overview.description,
      tags: overview.tags,
      photo: overview.photo,
      coords: city.coords,
      bestMonths: overview.bestMonths,
    },
    fis: {
      score: overview.fis.score,
      label: overview.fis.label,
      dimensions: overview.fis.dimensions.map((d) => ({
        key: d.key,
        label: d.label,
        score: d.score,
        signalCount: d.signalCount,
      })),
    },
    cost: {
      monthlyTotal: city.cost.familyMonthly,
      breakdown: {
        rent2br: city.cost.rent2br,
        internationalSchool: city.cost.internationalSchool,
        localSchool: city.cost.localSchool,
        childcare: city.cost.childcare,
      },
      sources: overview.cost.sources.map((s) => ({
        name: s.name,
        type: s.type,
        confidence: s.confidence,
        updatedAt: s.updatedAt,
      })),
    },
    meta: {
      timezone: overview.meta.timezone.value,
      languages: overview.meta.languages.value,
      kidsAgeIdeal: overview.meta.kidsAgeIdeal.value,
      homeschoolLegal: overview.meta.homeschoolLegal.value,
      visaFriendly: overview.meta.visa.value,
      familiesNow: overview.meta.familiesNow,
      familiesBeen: overview.meta.familiesBeen,
      returnRate: overview.meta.returnRate,
    },
    dataHealth: {
      totalSignals: overview.dataHealth.totalSignals,
      totalSources: overview.dataHealth.totalSources,
      fieldReportCount: overview.dataHealth.fieldReportCount,
      lastUpdated: overview.dataHealth.lastUpdated,
    },
    _meta: {
      generatedAt: new Date().toISOString(),
      apiVersion: "1.0",
      docs: "https://uncomun.com/api",
    },
  }

  return NextResponse.json(response, { headers: CORS_HEADERS })
}
