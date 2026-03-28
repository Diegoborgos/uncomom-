"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Suspense, useMemo, useCallback } from "react"
import { cities } from "@/data/cities"
import { filterCities, filtersToParams, paramsToFilters } from "@/lib/filters"
import { Filters } from "@/lib/types"
import FilterBar from "@/components/FilterBar"
import CityGrid from "@/components/CityGrid"

function HomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

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
      <FilterBar filters={filters} onChange={handleFilterChange} resultCount={filtered.length} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <CityGrid cities={filtered} />
      </div>
    </>
  )
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-20 text-center text-[var(--text-secondary)]">
          Loading cities...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  )
}
