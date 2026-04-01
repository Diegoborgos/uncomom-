"use client"

import Link from "next/link"
import { City } from "@/lib/types"
import { countryCodeToFlag } from "@/lib/scores"

export default function CostCard({ cities, budget }: { cities: City[]; budget: number }) {
  const maxCost = Math.max(budget, ...cities.map((c) => c.cost.familyMonthly))

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-[10px] text-[var(--accent-green)] font-medium uppercase tracking-wider mb-1">💰 Budget match</p>
      <p className="text-sm font-medium mb-4">Cities that fit your budget</p>

      {/* Budget line */}
      <div className="space-y-3 mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-secondary)] w-24 shrink-0 truncate">Your budget</span>
          <div className="flex-1 relative h-5">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[var(--accent-green)]/20 border border-dashed border-[var(--accent-green)]/40"
              style={{ width: `${(budget / maxCost) * 100}%` }}
            />
            <span className="absolute right-2 top-0.5 text-[10px] font-mono text-[var(--accent-green)]">
              ${budget.toLocaleString()}/mo
            </span>
          </div>
        </div>

        {cities.slice(0, 3).map((city) => {
          const pct = (city.cost.familyMonthly / maxCost) * 100
          const flag = countryCodeToFlag(city.countryCode)
          const withinBudget = city.cost.familyMonthly <= budget
          return (
            <Link key={city.slug} href={`/cities/${city.slug}`} className="flex items-center gap-3 group">
              <span className="text-xs text-[var(--text-primary)] w-24 shrink-0 truncate group-hover:text-[var(--accent-green)]">
                {flag} {city.name}
              </span>
              <div className="flex-1 relative h-5">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-colors ${
                    withinBudget ? "bg-[var(--accent-green)]/30" : "bg-red-500/20"
                  }`}
                  style={{ width: `${pct}%` }}
                />
                <span className={`absolute right-2 top-0.5 text-[10px] font-mono ${
                  withinBudget ? "text-[var(--accent-green)]" : "text-red-400"
                }`}>
                  ${city.cost.familyMonthly.toLocaleString()}/mo
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
