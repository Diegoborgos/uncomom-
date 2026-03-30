"use client"

import { City } from "@/lib/types"
import { countryCodeToFlag } from "@/lib/scores"
import { FISDetailGauge } from "./FISScore"

export default function CityHero({ city }: { city: City }) {
  const flag = countryCodeToFlag(city.countryCode)

  return (
    <div className="relative w-full h-[50vh] min-h-[400px] overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={city.photo || ""}
        alt={`${city.name}, ${city.country}`}
        className="w-full h-full object-cover"
        fetchPriority="high"
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.style.display = "none"
          target.parentElement!.style.background = "linear-gradient(135deg, var(--surface-elevated), var(--surface))"
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-black/40 to-transparent" />
      <div className="absolute bottom-8 left-0 right-0 max-w-6xl mx-auto px-4 flex items-end justify-between">
        <div>
          <p className="text-sm text-white/70 mb-1">
            {city.continent} &rsaquo; {city.country}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white">
            {flag} {city.name}
          </h1>
        </div>
        <FISDetailGauge city={city} />
      </div>
    </div>
  )
}
