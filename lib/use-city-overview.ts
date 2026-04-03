"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { supabase } from "./supabase"
import { City } from "./types"
import { useAuth } from "./auth-context"
import { buildCityOverviewData, CityOverviewData } from "./city-overview-data"

export function useCityOverview(city: City): {
  data: CityOverviewData | null
  loading: boolean
} {
  const { family, isPaid } = useAuth()
  const [data, setData] = useState<CityOverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      // Fetch data sources for this city
      const { data: sources } = await supabase
        .from("city_data_sources")
        .select("source_name, source_type, source_url, signal_key, confidence, fetched_at, report_count")
        .eq("city_slug", city.slug)
        .order("fetched_at", { ascending: false })

      // Fetch field report count
      const { count: reportCount } = await supabase
        .from("city_field_reports")
        .select("id", { count: "exact", head: true })
        .eq("city_slug", city.slug)
        .in("status", ["complete", "reviewed"])

      if (cancelled) return

      const overview = await buildCityOverviewData(
        city,
        family,
        isPaid,
        sources || [],
        reportCount || 0,
      )

      if (!cancelled) {
        setData(overview)
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [city, family, isPaid])

  return { data, loading }
}

// Context for deep component trees — avoids duplicate Supabase calls
export const CityOverviewContext = createContext<CityOverviewData | null>(null)

export function useCityOverviewContext(): CityOverviewData | null {
  return useContext(CityOverviewContext)
}
