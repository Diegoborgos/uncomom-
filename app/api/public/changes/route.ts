import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const daysParam = parseInt(searchParams.get("days") || "7", 10)
  const days = Math.min(30, Math.max(1, daysParam))
  const cityFilter = searchParams.get("city") || null

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

  // Fetch recent data source changes
  let query = supabase
    .from("city_data_sources")
    .select("city_slug, signal_key, signal_value, source_name, fetched_at, confidence")
    .gte("fetched_at", since)
    .order("fetched_at", { ascending: false })

  if (cityFilter) {
    query = query.eq("city_slug", cityFilter)
  }

  const { data: changes } = await query

  // Group changes by city
  const byCityMap: Record<string, Array<{
    signal: string
    value: string
    source: string
    confidence: number
    fetchedAt: string
  }>> = {}

  for (const row of changes || []) {
    if (!byCityMap[row.city_slug]) byCityMap[row.city_slug] = []
    byCityMap[row.city_slug].push({
      signal: row.signal_key,
      value: row.signal_value,
      source: row.source_name,
      confidence: row.confidence,
      fetchedAt: row.fetched_at,
    })
  }

  // Fetch news article counts per city
  let newsQuery = supabase
    .from("city_data_sources")
    .select("city_slug, signal_value, fetched_at")
    .eq("signal_key", "news.weeklyArticleCount")
    .gte("fetched_at", since)

  if (cityFilter) {
    newsQuery = newsQuery.eq("city_slug", cityFilter)
  }

  const { data: newsRows } = await newsQuery

  const newsUpdates = (newsRows || []).map((row: Record<string, string>) => ({
    citySlug: row.city_slug,
    articleCount: parseInt(row.signal_value, 10) || 0,
    fetchedAt: row.fetched_at,
  }))

  const citiesAffected = Object.keys(byCityMap).length

  return NextResponse.json(
    {
      period: {
        days,
        since,
        until: new Date().toISOString(),
      },
      totalSignalUpdates: (changes || []).length,
      citiesAffected,
      changes: byCityMap,
      newsUpdates,
      _meta: {
        generatedAt: new Date().toISOString(),
        apiVersion: "1.0",
        params: { days, city: cityFilter },
      },
    },
    { headers: CORS_HEADERS }
  )
}
