"use client"

import Link from "next/link"
import { City } from "@/lib/types"
import { countryCodeToFlag } from "@/lib/scores"

export default function CityCompareCard({ cityA, cityB, familyEducation }: { cityA: City; cityB: City; familyEducation?: string }) {
  const flagA = countryCodeToFlag(cityA.countryCode)
  const flagB = countryCodeToFlag(cityB.countryCode)

  const metrics = [
    { label: "Family Score", a: cityA.scores.family, b: cityB.scores.family, unit: "" },
    { label: "Monthly Cost", a: cityA.cost.familyMonthly, b: cityB.cost.familyMonthly, unit: "$", lowerBetter: true },
    { label: "Safety", a: cityA.scores.childSafety, b: cityB.scores.childSafety, unit: "" },
    { label: "Schools", a: cityA.scores.schoolAccess, b: cityB.scores.schoolAccess, unit: "" },
    { label: "Healthcare", a: cityA.scores.healthcare, b: cityB.scores.healthcare, unit: "" },
  ]

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div className="p-4 pb-2">
        <p className="text-[10px] text-[var(--accent-green)] font-medium uppercase tracking-wider mb-1">🔍 Compare cities</p>
        {familyEducation && (
          <p className="text-[10px] text-[var(--text-secondary)] mb-2">Based on your {familyEducation.toLowerCase()} preference</p>
        )}
      </div>

      {/* City headers with photos */}
      <div className="grid grid-cols-2 gap-px bg-[var(--border)]">
        <Link href={`/cities/${cityA.slug}`} className="relative h-24 bg-black">
          {cityA.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cityA.photo} alt={cityA.name} className="w-full h-full object-cover opacity-60" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-2 left-3">
            <p className="text-sm font-bold text-white">{flagA} {cityA.name}</p>
            <p className="text-[10px] text-white/60">{cityA.country}</p>
          </div>
        </Link>
        <Link href={`/cities/${cityB.slug}`} className="relative h-24 bg-black">
          {cityB.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cityB.photo} alt={cityB.name} className="w-full h-full object-cover opacity-60" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-2 left-3">
            <p className="text-sm font-bold text-white">{flagB} {cityB.name}</p>
            <p className="text-[10px] text-white/60">{cityB.country}</p>
          </div>
        </Link>
      </div>

      {/* Metrics comparison */}
      <div className="p-4 space-y-2">
        {metrics.map((m) => {
          const aWins = m.lowerBetter ? m.a < m.b : m.a > m.b
          const bWins = m.lowerBetter ? m.b < m.a : m.b > m.a
          const formatVal = m.unit === "$" ? `$${m.a.toLocaleString()}` : `${m.a}`
          const formatValB = m.unit === "$" ? `$${m.b.toLocaleString()}` : `${m.b}`

          return (
            <div key={m.label} className="flex items-center gap-2 text-xs">
              <span className={`w-10 text-right font-mono ${aWins ? "text-[var(--accent-green)]" : "text-[var(--text-secondary)]"}`}>
                {formatVal}
              </span>
              <div className="flex-1 flex items-center gap-1">
                <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-elevated)] overflow-hidden flex justify-end">
                  <div className={`h-full rounded-full ${aWins ? "bg-[var(--accent-green)]" : "bg-[var(--text-secondary)]/30"}`}
                    style={{ width: `${Math.min(100, (m.a / Math.max(m.a, m.b)) * 100)}%` }} />
                </div>
                <span className="text-[10px] text-[var(--text-secondary)] w-16 text-center shrink-0">{m.label}</span>
                <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
                  <div className={`h-full rounded-full ${bWins ? "bg-[var(--accent-green)]" : "bg-[var(--text-secondary)]/30"}`}
                    style={{ width: `${Math.min(100, (m.b / Math.max(m.a, m.b)) * 100)}%` }} />
                </div>
              </div>
              <span className={`w-10 font-mono ${bWins ? "text-[var(--accent-green)]" : "text-[var(--text-secondary)]"}`}>
                {formatValB}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
