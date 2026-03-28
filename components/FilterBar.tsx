"use client"

import { Filters, SortOption, CostRange } from "@/lib/types"

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "family", label: "Family Score" },
  { value: "cost", label: "Family Cost" },
  { value: "childSafety", label: "Child Safety" },
  { value: "nature", label: "Nature" },
  { value: "internet", label: "Internet" },
  { value: "familiesNow", label: "Families There Now" },
  { value: "returnRate", label: "Return Rate" },
]

const CONTINENTS = ["Europe", "Asia", "Latin America", "Africa"]
const COST_RANGES: { value: CostRange; label: string }[] = [
  { value: "under-2k", label: "Under €2K" },
  { value: "2-3k", label: "€2–3K" },
  { value: "3-4k", label: "€3–4K" },
  { value: "over-4k", label: "Over €4K" },
]
const TAGS = ["surf", "nature", "beach", "mountains", "safe", "expat community", "low cost", "international schools"]

function toggleInArray<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]
}

export default function FilterBar({
  filters,
  onChange,
  resultCount,
}: {
  filters: Filters
  onChange: (f: Filters) => void
  resultCount: number
}) {
  return (
    <div className="sticky top-0 z-30 bg-[var(--surface)] border-b border-[var(--border)] py-3">
      <div className="max-w-7xl mx-auto px-4 space-y-3">
        {/* Row 1: Search + Sort + Count */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search cities..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-green)] w-full sm:w-64 transition-colors"
          />
          <select
            value={filters.sort}
            onChange={(e) => onChange({ ...filters, sort: e.target.value as SortOption })}
            className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)] transition-colors"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>Sort: {o.label}</option>
            ))}
          </select>
          <span className="text-sm text-[var(--text-secondary)] ml-auto">
            {resultCount} {resultCount === 1 ? "city" : "cities"}
          </span>
        </div>

        {/* Row 2: Filter pills */}
        <div className="flex flex-wrap gap-2 text-xs">
          {/* Continents */}
          {CONTINENTS.map((c) => (
            <button
              key={c}
              onClick={() => onChange({ ...filters, continents: toggleInArray(filters.continents, c) })}
              className={`px-3 py-1 rounded-full border transition-colors ${
                filters.continents.includes(c)
                  ? "bg-[var(--accent-green)] border-[var(--accent-green)] text-[var(--bg)]"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]"
              }`}
            >
              {c}
            </button>
          ))}
          <span className="w-px h-5 bg-[var(--border)] self-center" />
          {/* Cost */}
          {COST_RANGES.map((c) => (
            <button
              key={c.value}
              onClick={() => onChange({ ...filters, costRange: toggleInArray(filters.costRange, c.value) })}
              className={`px-3 py-1 rounded-full border transition-colors ${
                filters.costRange.includes(c.value)
                  ? "bg-[var(--accent-warm)] border-[var(--accent-warm)] text-[var(--bg)]"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]"
              }`}
            >
              {c.label}
            </button>
          ))}
          <span className="w-px h-5 bg-[var(--border)] self-center" />
          {/* Tags */}
          {TAGS.map((t) => (
            <button
              key={t}
              onClick={() => onChange({ ...filters, tags: toggleInArray(filters.tags, t) })}
              className={`px-3 py-1 rounded-full border transition-colors ${
                filters.tags.includes(t)
                  ? "bg-[var(--accent-green)] border-[var(--accent-green)] text-[var(--bg)]"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
