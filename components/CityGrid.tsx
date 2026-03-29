"use client"

import { City } from "@/lib/types"
import CityCard from "./CityCard"

export default function CityGrid({ cities }: { cities: City[] }) {
  if (cities.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--text-secondary)] text-lg">No cities match your filters.</p>
        <p className="text-[var(--text-secondary)] text-sm mt-2">Try adjusting your search or removing some filters.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {cities.map((city, index) => (
        <CityCard key={city.id} city={city} rank={index + 1} />
      ))}
    </div>
  )
}
