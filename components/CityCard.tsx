"use client"

import Link from "next/link"
import { City } from "@/lib/types"
import { countryCodeToFlag, formatEuro, getScoreColor } from "@/lib/scores"
import ScorePill from "./ScorePill"

export default function CityCard({ city }: { city: City }) {
  const flag = countryCodeToFlag(city.countryCode)

  return (
    <Link href={`/cities/${city.slug}`}>
      <div className="group rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent-green)] hover:-translate-y-1 transition-all duration-200 cursor-pointer">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={city.photo}
            alt={city.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Family Score pill */}
          <div className="absolute top-3 right-3">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-mono font-bold"
              style={{
                backgroundColor: getScoreColor(city.scores.family) + "dd",
                color: "#fff",
              }}
            >
              {city.scores.family}
            </span>
          </div>

          {/* City name overlay */}
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-serif text-xl font-bold text-white">
              {flag} {city.name}
            </h3>
            <p className="text-sm text-white/80">{city.country}</p>
          </div>
        </div>

        {/* Card body */}
        <div className="p-4 space-y-3">
          {/* Mini score pills */}
          <div className="flex flex-wrap gap-1.5">
            <ScorePill label="Safety" score={city.scores.childSafety} />
            <ScorePill label="Schools" score={city.scores.schoolAccess} />
            <ScorePill label="Nature" score={city.scores.nature} />
            <ScorePill label="Internet" score={city.scores.internet} />
          </div>

          {/* Cost */}
          <p className="text-sm text-[var(--text-secondary)]">
            ~{formatEuro(city.cost.familyMonthly)}/mo · family of 4
          </p>

          {/* Families now */}
          <p className="text-sm text-[var(--accent-warm)] pulse-live">
            🏠 {city.meta.familiesNow} families here now
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {city.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-elevated)] text-[var(--text-secondary)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}
