"use client"

import { City } from "@/lib/types"
import { formatEuro } from "@/lib/scores"
import { PaywallBlur } from "./Paywall"

export default function CostPanelGated({ city }: { city: City }) {
  return (
    <PaywallBlur>
      <div className="space-y-3">
        <CostLine emoji="🏠" label="2br furnished apartment" value={city.cost.rent2br} />
        <CostLine emoji="🎓" label="International school (per child)" value={city.cost.internationalSchool} />
        <CostLine emoji="🏫" label="Local/alternative school" value={city.cost.localSchool} />
        <CostLine emoji="👶" label="Childcare" value={city.cost.childcare} />
      </div>
      <p className="text-[10px] text-[var(--text-secondary)] mt-4 leading-relaxed">
        Estimates only. Costs vary significantly by neighbourhood and season.
      </p>
    </PaywallBlur>
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
