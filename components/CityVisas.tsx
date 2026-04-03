"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { visas as staticVisas } from "@/data/visas"
import { VisaInfo } from "@/lib/visa-types"
import { formatEuro } from "@/lib/scores"

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

export default function CityVisas({ citySlug }: { citySlug: string }) {
  const [cityVisas, setCityVisas] = useState<VisaInfo[]>(
    staticVisas.filter((v) => v.citySlugs.includes(citySlug))
  )

  useEffect(() => {
    supabase.from("visas").select("*").contains("city_slugs", [citySlug]).then(({ data }) => {
      if (data && data.length > 0) setCityVisas(data.map(rowToVisa))
    })
  }, [citySlug])

  if (cityVisas.length === 0) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-2xl font-bold">Visa Options</h2>
        <Link href="/visas" className="text-sm text-[var(--accent-green)] hover:underline">
          All visas →
        </Link>
      </div>
      <div className="space-y-3">
        {cityVisas.map((visa) => (
          <div
            key={visa.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <h3 className="font-medium">{visa.visaName}</h3>
              <div className="flex gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-green)]/15 text-[var(--accent-green)]">
                  {visa.type}
                </span>
                {visa.familyFriendly && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-warm)]/15 text-[var(--accent-warm)]">
                    Includes family
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-[var(--text-secondary)] mb-2">
              <span>
                {visa.durationDays >= 365
                  ? `${Math.floor(visa.durationDays / 365)} year${visa.durationDays >= 730 ? "s" : ""}`
                  : `${visa.durationDays} days`}
              </span>
              <span>{visa.costEUR === 0 ? "Free" : formatEuro(visa.costEUR)}</span>
              <span>
                {visa.incomeRequirement === 0
                  ? "No income req."
                  : `${formatEuro(visa.incomeRequirement)}/mo min`}
              </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">{visa.bestFor}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
