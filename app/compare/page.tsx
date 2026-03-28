"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Suspense, useMemo } from "react"
import Link from "next/link"
import { cities } from "@/data/cities"
import { countryCodeToFlag, formatEuro, getScoreColor } from "@/lib/scores"

function CompareContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const slugs = useMemo(
    () => (searchParams.get("cities") || "").split(",").filter(Boolean),
    [searchParams]
  )

  const selected = useMemo(
    () => slugs.map((s) => cities.find((c) => c.slug === s)).filter(Boolean),
    [slugs]
  )

  const addCity = (slug: string) => {
    if (slugs.includes(slug) || slugs.length >= 4) return
    const next = [...slugs, slug].join(",")
    router.replace(`/compare?cities=${next}`, { scroll: false })
  }

  const removeCity = (slug: string) => {
    const next = slugs.filter((s) => s !== slug).join(",")
    router.replace(next ? `/compare?cities=${next}` : "/compare", { scroll: false })
  }

  const scoreRows = [
    { key: "family" as const, label: "Family Score" },
    { key: "childSafety" as const, label: "Child Safety" },
    { key: "schoolAccess" as const, label: "School Access" },
    { key: "nature" as const, label: "Nature" },
    { key: "internet" as const, label: "Internet" },
    { key: "healthcare" as const, label: "Healthcare" },
  ]

  const available = cities.filter((c) => !slugs.includes(c.slug))

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-serif text-4xl font-bold mb-2">Compare Cities</h1>
      <p className="text-[var(--text-secondary)] mb-8">
        Select up to 4 cities to compare side by side.
      </p>

      {/* City selector */}
      {slugs.length < 4 && (
        <div className="mb-8">
          <select
            onChange={(e) => { if (e.target.value) addCity(e.target.value); e.target.value = "" }}
            className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
            defaultValue=""
          >
            <option value="" disabled>Add a city...</option>
            {available.map((c) => (
              <option key={c.slug} value={c.slug}>
                {countryCodeToFlag(c.countryCode)} {c.name}, {c.country}
              </option>
            ))}
          </select>
        </div>
      )}

      {selected.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
          <p className="text-[var(--text-secondary)] mb-4">No cities selected yet.</p>
          <p className="text-sm text-[var(--text-secondary)]">
            Use the dropdown above or try:{" "}
            <Link href="/compare?cities=lisbon,valencia,bali-canggu" className="text-[var(--accent-green)] hover:underline">
              Lisbon vs Valencia vs Bali
            </Link>
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="text-left p-3 text-sm text-[var(--text-secondary)] font-normal w-40" />
                {selected.map((city) => (
                  <th key={city!.slug} className="p-3 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Link href={`/cities/${city!.slug}`} className="hover:text-[var(--accent-green)] transition-colors">
                        <span className="font-serif text-lg font-bold block">
                          {countryCodeToFlag(city!.countryCode)} {city!.name}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)]">{city!.country}</span>
                      </Link>
                      <button
                        onClick={() => removeCity(city!.slug)}
                        className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--score-low)] transition-colors"
                      >
                        remove
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Scores */}
              <tr>
                <td colSpan={selected.length + 1} className="pt-6 pb-2 px-3">
                  <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Scores</span>
                </td>
              </tr>
              {scoreRows.map((row) => {
                const values = selected.map((c) => c!.scores[row.key])
                const max = Math.max(...values)
                return (
                  <tr key={row.key} className="border-t border-[var(--border)]">
                    <td className="p-3 text-sm text-[var(--text-secondary)]">{row.label}</td>
                    {selected.map((city) => {
                      const val = city!.scores[row.key]
                      const isMax = val === max && selected.length > 1
                      return (
                        <td key={city!.slug} className="p-3 text-center">
                          <span
                            className={`font-mono text-lg font-bold ${isMax ? "ring-2 ring-offset-2 ring-offset-[var(--surface)] rounded-full px-2 py-0.5" : ""}`}
                            style={{
                              color: getScoreColor(val),
                              ...(isMax ? { ringColor: getScoreColor(val) } : {}),
                            }}
                          >
                            {val}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}

              {/* Cost */}
              <tr>
                <td colSpan={selected.length + 1} className="pt-6 pb-2 px-3">
                  <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Monthly Cost (Family of 4)</span>
                </td>
              </tr>
              {[
                { key: "familyMonthly" as const, label: "Total" },
                { key: "rent2br" as const, label: "Rent (2BR)" },
                { key: "internationalSchool" as const, label: "Int'l School" },
                { key: "childcare" as const, label: "Childcare" },
              ].map((row) => {
                const values = selected.map((c) => c!.cost[row.key])
                const min = Math.min(...values)
                return (
                  <tr key={row.key} className="border-t border-[var(--border)]">
                    <td className="p-3 text-sm text-[var(--text-secondary)]">{row.label}</td>
                    {selected.map((city) => {
                      const val = city!.cost[row.key]
                      const isCheapest = val === min && selected.length > 1
                      return (
                        <td key={city!.slug} className="p-3 text-center">
                          <span className={`font-mono ${isCheapest ? "text-[var(--accent-green)] font-bold" : ""}`}>
                            {formatEuro(val)}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}

              {/* Meta */}
              <tr>
                <td colSpan={selected.length + 1} className="pt-6 pb-2 px-3">
                  <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Details</span>
                </td>
              </tr>
              {[
                { label: "Families now", render: (c: typeof selected[0]) => `${c!.meta.familiesNow}` },
                { label: "Visa", render: (c: typeof selected[0]) => c!.meta.visaFriendly },
                { label: "Homeschool", render: (c: typeof selected[0]) => c!.meta.homeschoolLegal },
                { label: "Best for", render: (c: typeof selected[0]) => c!.meta.kidsAgeIdeal },
                { label: "Languages", render: (c: typeof selected[0]) => c!.meta.language.join(", ") },
                { label: "Timezone", render: (c: typeof selected[0]) => c!.meta.timezone },
              ].map((row) => (
                <tr key={row.label} className="border-t border-[var(--border)]">
                  <td className="p-3 text-sm text-[var(--text-secondary)]">{row.label}</td>
                  {selected.map((city) => (
                    <td key={city!.slug} className="p-3 text-center text-sm">
                      {row.render(city)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-20 text-center text-[var(--text-secondary)]">
          Loading comparison...
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  )
}
