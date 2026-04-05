"use client"

import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import { Filters, SortOption, CostRange, ClimateTag } from "@/lib/types"
import { track } from "@/lib/tracking"

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "fis", label: "FIS Score" },
  { value: "cost", label: "Family Cost" },
  { value: "childSafety", label: "Child Safety" },
  { value: "nature", label: "Nature" },
  { value: "internet", label: "Internet" },
]

const CONTINENTS = ["Europe", "Asia", "Latin America", "Africa"]
const COST_RANGES: { value: CostRange; label: string }[] = [
  { value: "under-2k", label: "Under €2K" },
  { value: "2-3k", label: "€2–3K" },
  { value: "3-4k", label: "€3–4K" },
  { value: "over-4k", label: "Over €4K" },
]
const CLIMATES: { value: ClimateTag; label: string }[] = [
  { value: "warm", label: "Warm" },
  { value: "tropical", label: "Tropical" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "variable", label: "Variable" },
]
const HOMESCHOOL_OPTIONS: { value: string; label: string }[] = [
  { value: "legal", label: "Legal" },
  { value: "grey", label: "Grey area" },
  { value: "any", label: "Any" },
]
const TAGS = ["solo parent", "surf", "nature", "beach", "mountains", "safe", "expat community", "low cost", "international schools"]

function toggleInArray<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]
}

const activeFilterCount = (filters: Filters): number => {
  return filters.continents.length + filters.costRange.length + filters.climate.length + filters.homeschool.length + filters.tags.length
}

export default function FilterBar({
  filters,
  onChange,
}: {
  filters: Filters
  onChange: (f: Filters) => void
}) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filterCount = activeFilterCount(filters)
  const searchTimer = useRef<NodeJS.Timeout>()

  const handleSearchChange = useCallback((value: string) => {
    onChange({ ...filters, search: value })
    clearTimeout(searchTimer.current)
    if (value.trim()) {
      searchTimer.current = setTimeout(() => {
        track("search_query", { query: value.trim() })
      }, 1000)
    }
  }, [filters, onChange])

  const handleSortChange = useCallback((sort: SortOption) => {
    track("sort_changed", { sortBy: sort })
    onChange({ ...filters, sort })
  }, [filters, onChange])

  // Not using useCallback wrapper — tracking inline in filter pill onClick handlers

  return (
    <div className="sticky top-16 z-30 bg-[var(--bg)] border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 h-14 overflow-x-auto scrollbar-hide">

          {/* Filters toggle — premium pill */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium shrink-0 transition-all ${
              filtersOpen || filterCount > 0
                ? "bg-[var(--accent-green)] border-[var(--accent-green)] text-black"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1 3h14v1.5H1V3zm2 4h10v1.5H3V7zm3 4h4v1.5H6V11z" />
            </svg>
            Filters
            {filterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-black text-[var(--accent-green)] text-[10px] flex items-center justify-center font-bold">
                {filterCount}
              </span>
            )}
          </button>

          {/* Search input */}
          <div className="relative flex-1 min-w-[160px] max-w-[320px]">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="7" cy="7" r="5" />
              <path d="M11 11l3.5 3.5" />
            </svg>
            <input
              type="text"
              placeholder="Search destination..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-full pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-green)] transition-colors"
            />
          </div>

          {/* Compare */}
          <Link
            href="/compare"
            className="px-4 py-2.5 rounded-full border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] transition-all shrink-0"
          >
            Compare
          </Link>

          {/* View toggle */}
          <div className="flex rounded-full border border-[var(--border)] overflow-hidden shrink-0">
            <span className="px-4 py-2.5 text-sm bg-[var(--surface-elevated)] text-[var(--text-primary)] font-medium">
              Grid
            </span>
            <Link
              href="/map"
              className="px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Map view
            </Link>
          </div>

          {/* Separator */}
          <span className="w-px h-5 bg-[var(--border)] shrink-0" />

          {/* Sort */}
          <select
            value={filters.sort}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-full px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)] transition-colors shrink-0 cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Spacer */}
          <div className="flex-1" />
        </div>
      </div>

      {/* Expandable filter panel */}
      {filtersOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--surface)]">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
            {/* Continent */}
            <FilterSection label="Continent">
              {CONTINENTS.map((c) => (
                <FilterPill
                  key={c}
                  label={c}
                  active={filters.continents.includes(c)}
                  onClick={() => onChange({ ...filters, continents: toggleInArray(filters.continents, c) })}
                />
              ))}
            </FilterSection>

            {/* Cost */}
            <FilterSection label="Family Cost">
              {COST_RANGES.map((c) => (
                <FilterPill
                  key={c.value}
                  label={c.label}
                  active={filters.costRange.includes(c.value)}
                  onClick={() => onChange({ ...filters, costRange: toggleInArray(filters.costRange, c.value) })}
                  variant="warm"
                />
              ))}
            </FilterSection>

            {/* Climate */}
            <FilterSection label="Climate">
              {CLIMATES.map((c) => (
                <FilterPill
                  key={c.value}
                  label={c.label}
                  active={filters.climate.includes(c.value)}
                  onClick={() => onChange({ ...filters, climate: toggleInArray(filters.climate, c.value) })}
                />
              ))}
            </FilterSection>

            {/* Homeschool */}
            <FilterSection label="Homeschool">
              {HOMESCHOOL_OPTIONS.map((h) => (
                <FilterPill
                  key={h.value}
                  label={h.label}
                  active={filters.homeschool.includes(h.value)}
                  onClick={() => onChange({ ...filters, homeschool: toggleInArray(filters.homeschool, h.value) })}
                  variant="warm"
                />
              ))}
            </FilterSection>

            {/* Tags */}
            {/* Solo parent */}
            <FilterSection label="Solo parent">
              <FilterPill
                label="Solo parent friendly"
                active={filters.tags.includes("solo parent")}
                onClick={() => onChange({ ...filters, tags: toggleInArray(filters.tags, "solo parent") })}
                variant="warm"
              />
            </FilterSection>

            <FilterSection label="Tags">
              {TAGS.map((t) => (
                <FilterPill
                  key={t}
                  label={t}
                  active={filters.tags.includes(t)}
                  onClick={() => onChange({ ...filters, tags: toggleInArray(filters.tags, t) })}
                />
              ))}
            </FilterSection>

            {/* Clear all */}
            {filterCount > 0 && (
              <button
                onClick={() =>
                  onChange({
                    ...filters,
                    continents: [],
                    costRange: [],
                    climate: [],
                    homeschool: [],
                    tags: [],
                  })
                }
                className="text-xs text-[var(--score-low)] hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--text-secondary)] w-20 shrink-0 font-medium">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function FilterPill({
  label,
  active,
  onClick,
  variant = "green",
}: {
  label: string
  active: boolean
  onClick: () => void
  variant?: "green" | "warm"
}) {
  const activeColor = variant === "warm" ? "var(--accent-warm)" : "var(--accent-green)"
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full border text-xs transition-colors ${
        active
          ? "text-[var(--bg)] font-medium"
          : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]"
      }`}
      style={active ? { backgroundColor: activeColor, borderColor: activeColor } : undefined}
    >
      {label}
    </button>
  )
}
