"use client"

import { City } from "@/lib/types"
import { formatEuro } from "@/lib/scores"

export default function FamilyCostPanel({ city }: { city: City }) {
  const rows = [
    { label: "Furnished 2BR Rent", value: city.cost.rent2br },
    { label: "International School (per child)", value: city.cost.internationalSchool },
    { label: "Local School (per child)", value: city.cost.localSchool },
    { label: "Childcare", value: city.cost.childcare },
  ]

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h3 className="font-serif text-lg font-bold mb-4">Family of 4 — Monthly Cost</h3>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between text-sm">
            <span className="text-[var(--text-secondary)]">{row.label}</span>
            <span className="font-mono">{formatEuro(row.value)}</span>
          </div>
        ))}
        <div className="border-t border-[var(--border)] pt-3 flex justify-between font-bold">
          <span>Total Estimated</span>
          <span className="font-mono text-[var(--accent-warm)]">
            {formatEuro(city.cost.familyMonthly)}
          </span>
        </div>
      </div>
    </div>
  )
}
