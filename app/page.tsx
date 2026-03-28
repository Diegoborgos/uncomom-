"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Suspense, useMemo, useCallback } from "react"
import { cities } from "@/data/cities"
import { filterCities, filtersToParams, paramsToFilters } from "@/lib/filters"
import { Filters } from "@/lib/types"
import FilterBar from "@/components/FilterBar"
import CityGrid from "@/components/CityGrid"
import { GridSkeleton } from "@/components/Skeleton"
import Hero from "@/components/Hero"

function HomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const hasFilters = searchParams.toString().length > 0
  const filters = useMemo(() => paramsToFilters(searchParams), [searchParams])
  const filtered = useMemo(() => filterCities(cities, filters), [filters])

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
      {/* Show hero only when no filters active (landing state) */}
      {!hasFilters && <Hero />}

      <FilterBar filters={filters} onChange={handleFilterChange} resultCount={filtered.length} />
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
