"use client"

import { City } from "@/lib/types"
import { formatEuro } from "@/lib/scores"
import SignalCitation from "@/components/ui/SignalCitation"

export default function FamilyCostPanel({ city }: { city: City }) {
  const rows: Array<{ label: string; value: number; signalKey: string }> = [
    { label: "Furnished 2BR Rent", value: city.cost.rent2br, signalKey: "familyCost.rent2br" },
    { label: "International School (per child)", value: city.cost.internationalSchool, signalKey: "familyCost.internationalSchoolFee" },
    { label: "Local School (per child)", value: city.cost.localSchool, signalKey: "familyCost.localSchoolFee" },
    { label: "Childcare", value: city.cost.childcare, signalKey: "familyCost.childcareMonthly" },
  ]

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h3 className="font-serif text-lg font-bold mb-4">Family of 4 — Monthly Cost</h3>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between items-center text-sm gap-3">
            <span className="text-[var(--text-secondary)]">{row.label}</span>
            <SignalCitation signalKey={row.signalKey}>
              <span className="font-mono">{formatEuro(row.value)}</span>
            </SignalCitation>
          </div>
        ))}
        <div className="border-t border-[var(--border)] pt-3 flex justify-between items-center font-bold gap-3">
          <span>Total Estimated</span>
          <SignalCitation signalKey="familyCost.familyMonthlyEstimate">
            <span className="font-mono text-[var(--accent-warm)]">
              {formatEuro(city.cost.familyMonthly)}
            </span>
          </SignalCitation>
        </div>
      </div>
    </div>
  )
}
