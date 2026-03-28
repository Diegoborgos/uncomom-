"use client"

import { City } from "@/lib/types"
import { countryCodeToFlag, getScoreColor } from "@/lib/scores"

export default function CityHero({ city }: { city: City }) {
  const flag = countryCodeToFlag(city.countryCode)
  const scoreColor = getScoreColor(city.scores.family)

  return (
    <div className="relative w-full h-[50vh] min-h-[400px] overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={city.photo}
        alt={city.name}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-black/40 to-transparent" />
      <div className="absolute bottom-8 left-0 right-0 max-w-5xl mx-auto px-4 flex items-end justify-between">
        <div>
          <p className="text-sm text-white/70 mb-1">
            {city.continent} &rsaquo; {city.country}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white">
            {flag} {city.name}
          </h1>
        </div>
        {/* Family Score gauge */}
        <div className="flex flex-col items-center">
          <div
            className="w-20 h-20 rounded-full border-4 flex items-center justify-center"
            style={{ borderColor: scoreColor }}
          >
            <span className="font-mono text-2xl font-bold" style={{ color: scoreColor }}>
              {city.scores.family}
            </span>
          </div>
          <span className="text-xs text-white/70 mt-1">Family Score</span>
        </div>
      </div>
    </div>
  )
}
