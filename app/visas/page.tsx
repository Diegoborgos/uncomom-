"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { visas as staticVisas } from "@/data/visas"
import { cities } from "@/data/cities"
import { countryCodeToFlag, formatEuro } from "@/lib/scores"
import { VisaInfo, VisaType } from "@/lib/visa-types"

const VISA_TYPES: VisaType[] = ["Tourist", "Digital Nomad", "Freelancer", "Residency", "Business", "Student"]

function rowToVisa(row: Record<string, unknown>): VisaInfo {
  return {
    id: row.id as string, country: row.country as string, countryCode: row.country_code as string,
    visaName: row.visa_name as string, type: row.type as string, durationDays: row.duration_days as number,
    renewable: row.renewable as boolean, familyFriendly: row.family_friendly as boolean,
    costEUR: row.cost_eur as number, processingDays: row.processing_days as number,
    incomeRequirement: row.income_requirement as number, requirements: (row.requirements as string[]) || [],
    notes: (row.notes as string) || "", bestFor: (row.best_for as string) || "", citySlugs: (row.city_slugs as string[]) || [],
  }
}

function formatDuration(days: number): string {
  if (days >= 365) {
    const years = Math.floor(days / 365)
    return years === 1 ? "1 year" : `${years} years`
  }
  return `${days} days`
}

export default function VisasPage() {
  const [visas, setVisas] = useState<VisaInfo[]>(staticVisas)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [familyOnly, setFamilyOnly] = useState(false)
  const [sort, setSort] = useState<"duration" | "cost" | "income">("duration")

  useEffect(() => {
    supabase.from("visas").select("*").order("country").then(({ data }) => {
      if (data && data.length > 0) setVisas(data.map(rowToVisa))
    })
  }, [])

  const filtered = useMemo(() => {
    let result = [...visas]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (v) =>
          v.country.toLowerCase().includes(q) ||
          v.visaName.toLowerCase().includes(q) ||
          v.notes.toLowerCase().includes(q)
      )
    }
    if (typeFilter) result = result.filter((v) => v.type === typeFilter)
    if (familyOnly) result = result.filter((v) => v.familyFriendly)

    result.sort((a, b) => {
      if (sort === "duration") return b.durationDays - a.durationDays
      if (sort === "cost") return a.costEUR - b.costEUR
      return a.incomeRequirement - b.incomeRequirement
    })

    return result
  }, [search, typeFilter, familyOnly, sort])

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-bold mb-2">Visa Guide</h1>
        <p className="text-[var(--text-secondary)]">
          Visa options for traveling families. Sorted by what matters: duration, cost, and whether your kids are covered.
        </p>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-20 bg-[var(--bg)] py-4 mb-6 border-b border-[var(--border)] space-y-3">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search country or visa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-green)] w-full sm:w-64"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
          >
            <option value="">All visa types</option>
            {VISA_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
          >
            <option value="duration">Sort: Longest stay</option>
            <option value="cost">Sort: Lowest cost</option>
            <option value="income">Sort: Lowest income req.</option>
          </select>
          <button
            onClick={() => setFamilyOnly(!familyOnly)}
            className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
              familyOnly
                ? "bg-[var(--accent-green)] border-[var(--accent-green)] text-[var(--bg)]"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)]"
            }`}
          >
            Family-friendly only
          </button>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          {filtered.length} visa {filtered.length === 1 ? "option" : "options"}
        </p>
      </div>

      {/* Visa list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[var(--text-secondary)]">No visas match your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((visa) => (
            <div
              key={visa.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{countryCodeToFlag(visa.countryCode)}</span>
                    <h3 className="font-serif text-xl font-bold">{visa.visaName}</h3>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">{visa.country}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--accent-green)]/15 text-[var(--accent-green)] font-medium">
                    {visa.type}
                  </span>
                  {visa.familyFriendly && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--accent-warm)]/15 text-[var(--accent-warm)] font-medium">
                      Includes dependents
                    </span>
                  )}
                  {visa.renewable && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--surface-elevated)] text-[var(--text-secondary)]">
                      Renewable
                    </span>
                  )}
                </div>
              </div>

              {/* Key stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Duration</p>
                  <p className="font-mono font-bold">{formatDuration(visa.durationDays)}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Application cost</p>
                  <p className="font-mono font-bold">
                    {visa.costEUR === 0 ? "Free" : formatEuro(visa.costEUR)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Income required</p>
                  <p className="font-mono font-bold">
                    {visa.incomeRequirement === 0 ? "None" : `${formatEuro(visa.incomeRequirement)}/mo`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Processing</p>
                  <p className="font-mono font-bold">
                    {visa.processingDays === 0 ? "Instant" : `~${visa.processingDays} days`}
                  </p>
                </div>
              </div>

              {/* Notes */}
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
                {visa.notes}
              </p>

              {/* Best for */}
              <p className="text-sm mb-3">
                <span className="text-[var(--accent-green)] font-medium">Best for: </span>
                {visa.bestFor}
              </p>

              {/* Requirements */}
              <details className="group">
                <summary className="text-sm text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors">
                  Requirements ({visa.requirements.length})
                </summary>
                <ul className="mt-2 space-y-1 ml-4">
                  {visa.requirements.map((req, i) => (
                    <li key={i} className="text-sm text-[var(--text-secondary)] list-disc">
                      {req}
                    </li>
                  ))}
                </ul>
              </details>

              {/* Linked cities */}
              {visa.citySlugs.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[var(--border)] flex flex-wrap gap-2">
                  <span className="text-xs text-[var(--text-secondary)] self-center">Cities:</span>
                  {visa.citySlugs.map((slug) => {
                    const city = cities.find((c) => c.slug === slug)
                    if (!city) return null
                    return (
                      <Link
                        key={slug}
                        href={`/cities/${slug}`}
                        className="text-xs px-2.5 py-1 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)] hover:text-[var(--accent-green)] transition-colors"
                      >
                        {countryCodeToFlag(city.countryCode)} {city.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
