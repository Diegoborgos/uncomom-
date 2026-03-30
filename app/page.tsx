"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Suspense, useMemo, useCallback } from "react"
import { cities as staticCities } from "@/data/cities"
import { supabase } from "@/lib/supabase"
import { filterCities, filtersToParams, paramsToFilters } from "@/lib/filters"
import { Filters, City } from "@/lib/types"
import FilterBar from "@/components/FilterBar"
import CityGrid from "@/components/CityGrid"
import { GridSkeleton } from "@/components/Skeleton"
import Hero from "@/components/Hero"

function HomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [cities, setCities] = useState<City[]>(staticCities)

  // Fetch fresh city data from Supabase (photos, scores, etc.)
  useEffect(() => {
    supabase
      .from("cities")
      .select("slug, photo")
      .then(({ data }) => {
        if (!data || data.length === 0) return
        // Merge DB photos into static cities
        const photoMap = new Map(data.map((c) => [c.slug, c.photo]))
        setCities(
          staticCities.map((city) => ({
            ...city,
            photo: photoMap.get(city.slug) || city.photo,
          }))
        )
      })
  }, [])

  const hasFilters = searchParams.toString().length > 0
  const filters = useMemo(() => paramsToFilters(searchParams), [searchParams])
  const filtered = useMemo(() => filterCities(cities, filters), [cities, filters])

  const handleFilterChange = useCallback(
    (newFilters: Filters) => {
      const params = filtersToParams(newFilters)
      const qs = params.toString()
      router.replace(qs ? `/?${qs}` : "/", { scroll: false })
    },
    [router]
  )

  return (
    <>
      {!hasFilters && <Hero />}

      <FilterBar filters={filters} onChange={handleFilterChange} />
      <div id="cities" className="max-w-7xl mx-auto px-4 py-6">
        <p className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider mb-4">
          {filtered.length === cities.length ? "Popular" : `${filtered.length} results`}
        </p>
        <CityGrid cities={filtered} />
      </div>
    </>
  )
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-8">
          <GridSkeleton />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  )
}
