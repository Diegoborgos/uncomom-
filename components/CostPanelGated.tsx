"use client"

import { useState } from "react"
import { useCityOverviewContext } from "@/lib/use-city-overview"
import { useAuth } from "@/lib/auth-context"
import { PaywallBlur } from "./Paywall"
import { formatEuro } from "@/lib/scores"
import { City } from "@/lib/types"
import { personalizedCost } from "@/lib/personalize"

export default function CostPanelGated({ city }: { city: City }) {
  const overview = useCityOverviewContext()
  const { family, isPaid } = useAuth()
  const [tappedLine, setTappedLine] = useState<string | null>(null)

  // Fallback if context not ready yet
  const cost = overview?.cost || personalizedCost(city, isPaid ? family : null)
  const sources = overview?.cost?.sources || []

  const sourceLabel = sources.length > 0 && sources[0].name !== "Estimated"
    ? sources.map(s => s.name).join(", ")
    : null

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="font-serif text-lg font-bold">Family Cost Estimate</h3>
        {cost.isPersonalized && (
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--accent-green)]/15 text-[var(--accent-green)]">
            For you
          </span>
        )}
      </div>
      <p className="text-xs text-[var(--text-secondary)] mb-3">
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
          <CostLine
            emoji="🏠"
            label={cost.rent.label}
            value={cost.rent.amount}
            id="rent"
            tapped={tappedLine}
            onTap={setTappedLine}
            sourceLabel={sourceLabel}
          />
          {cost.school.amount > 0 ? (
            <CostLine
              emoji="🎓"
              label={`${cost.school.label}${cost.school.kidsCount > 1 ? ` (\u00d7${cost.school.kidsCount})` : ""}`}
              value={cost.school.amount}
              id="school"
              tapped={tappedLine}
              onTap={setTappedLine}
              sourceLabel={sourceLabel}
            />
          ) : cost.isPersonalized ? (
            <CostLine
              emoji="🎓"
              label={cost.school.label}
              value={0}
              id="school"
              tapped={tappedLine}
              onTap={setTappedLine}
              note="Based on your education approach"
              isZero
            />
          ) : null}
          {cost.childcare.show && (
            <CostLine
              emoji="👶"
              label="Childcare"
              value={cost.childcare.amount}
              id="childcare"
              tapped={tappedLine}
              onTap={setTappedLine}
              sourceLabel={sourceLabel}
            />
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

function CostLine({
  emoji,
  label,
  value,
  id,
  tapped,
  onTap,
  sourceLabel,
  note,
  isZero,
}: {
  emoji: string
  label: string
  value: number
  id: string
  tapped: string | null
  onTap: (id: string | null) => void
  sourceLabel?: string | null
  note?: string
  isZero?: boolean
}) {
  const isExpanded = tapped === id

  return (
    <div>
      <button
        onClick={() => onTap(isExpanded ? null : id)}
        className="w-full flex items-center justify-between text-sm text-left hover:opacity-80 transition-opacity"
      >
        <span className="text-[var(--text-secondary)]">{emoji} {label}</span>
        <span className={`font-mono ${isZero ? "text-[var(--accent-green)]" : ""}`}>
          {isZero ? "\u20ac0" : `${formatEuro(value)}/mo`}
        </span>
      </button>
      {isExpanded && (
        <p className="text-[9px] text-[var(--text-secondary)] mt-1 ml-6">
          {note || (sourceLabel ? `Source: ${sourceLabel}` : "Estimated from research data")}
        </p>
      )}
    </div>
  )
}
