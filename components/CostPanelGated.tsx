"use client"

import { City } from "@/lib/types"
import { formatEuro } from "@/lib/scores"
import { useAuth } from "@/lib/auth-context"
import { PaywallBlur } from "./Paywall"
import { personalizedCost } from "@/lib/personalize"

export default function CostPanelGated({ city }: { city: City }) {
  const { family, isPaid } = useAuth()

  const cost = personalizedCost(city, isPaid ? family : null)

  return (
    <div>
      {/* Header — personalized or generic */}
      <h3 className="font-serif text-lg font-bold mb-1">Family Cost Estimate</h3>
      <p className="text-xs text-[var(--text-secondary)] mb-3">
        {cost.isPersonalized && (
          <span className="text-[var(--accent-green)] font-medium">Personalized · </span>
        )}
        {cost.label}
      </p>

      {/* Total — always visible */}
      <div className="flex justify-between items-baseline mb-3">
        <span className="text-sm text-[var(--text-secondary)]">Total monthly</span>
        <span className="font-mono font-bold text-xl text-[var(--accent-warm)]">
          {formatEuro(cost.total)}
        </span>
      </div>

      {/* Line items — gated */}
      <PaywallBlur>
        <div className="space-y-3">
          <CostLine emoji="🏠" label={cost.rent.label} value={cost.rent.amount} />
          {cost.school.amount > 0 ? (
            <CostLine
              emoji="🎓"
              label={`${cost.school.label}${cost.school.kidsCount > 1 ? ` (×${cost.school.kidsCount} kids)` : ""}`}
              value={cost.school.amount}
            />
          ) : cost.isPersonalized ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-secondary)]">🎓 {cost.school.label}</span>
              <span className="font-mono text-[var(--accent-green)]">€0</span>
            </div>
          ) : (
            <CostLine emoji="🎓" label="International school (per child)" value={city.cost.internationalSchool} />
          )}
          {!cost.isPersonalized && (
            <CostLine emoji="🏫" label="Local/alternative school" value={city.cost.localSchool} />
          )}
          {cost.childcare.show && (
            <CostLine emoji="👶" label="Childcare" value={cost.childcare.amount} />
          )}
          {cost.isPersonalized && !cost.childcare.show && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-secondary)]">👶 Childcare</span>
              <span className="font-mono text-[var(--text-secondary)]">Not needed</span>
            </div>
          )}
        </div>
        <p className="text-[10px] text-[var(--text-secondary)] mt-4 leading-relaxed">
          {cost.isPersonalized
            ? "Personalized estimate based on your family profile. Actual costs vary by neighbourhood and season."
            : "Estimates only. Costs vary significantly by neighbourhood and season."}
        </p>
      </PaywallBlur>
    </div>
  )
}

function CostLine({ emoji, label, value }: { emoji: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[var(--text-secondary)]">{emoji} {label}</span>
      <span className="font-mono">{formatEuro(value)}/mo</span>
    </div>
  )
}
