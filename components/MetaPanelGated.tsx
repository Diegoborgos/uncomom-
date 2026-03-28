"use client"

import { City } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { getVisaBadgeColor, getHomeschoolBadgeColor } from "@/lib/scores"
import { PaywallBlur } from "./Paywall"

export default function MetaPanelGated({ city }: { city: City }) {
  const { isPaid } = useAuth()

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
      {/* These are always visible */}
      <MetaRow emoji="⏰" label="Timezone" value={city.meta.timezone} />
      <MetaRow emoji="🗣" label="Languages" value={city.meta.language.join(", ")} />
      <MetaRow emoji="👶" label="Ideal for kids" value={city.meta.kidsAgeIdeal} />

      {/* These are gated */}
      {isPaid ? (
        <>
          <MetaRow emoji="🏠" label="Families here now" value={`${city.meta.familiesNow}`} highlight />
          <MetaRow emoji="📊" label="Families have been here" value={`${city.meta.familiesBeen}`} />
          <MetaRow emoji="🔄" label="Return rate" value={`${city.meta.returnRate}%`} />
          <div className="flex items-start gap-3">
            <span className="text-sm">📚</span>
            <div className="flex-1">
              <p className="text-xs text-[var(--text-secondary)]">Homeschool legal</p>
              <span
                className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-0.5"
                style={{
                  backgroundColor: getHomeschoolBadgeColor(city.meta.homeschoolLegal) + "22",
                  color: getHomeschoolBadgeColor(city.meta.homeschoolLegal),
                }}
              >
                {city.meta.homeschoolLegal}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-sm">🛂</span>
            <div className="flex-1">
              <p className="text-xs text-[var(--text-secondary)]">Visa friendly</p>
              <span
                className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-0.5"
                style={{
                  backgroundColor: getVisaBadgeColor(city.meta.visaFriendly) + "22",
                  color: getVisaBadgeColor(city.meta.visaFriendly),
                }}
              >
                {city.meta.visaFriendly}
              </span>
            </div>
          </div>
        </>
      ) : (
        <PaywallBlur>
          <div className="space-y-4">
            <MetaRow emoji="🏠" label="Families here now" value={`${city.meta.familiesNow}`} />
            <MetaRow emoji="📊" label="Families have been here" value={`${city.meta.familiesBeen}`} />
            <MetaRow emoji="🔄" label="Return rate" value={`${city.meta.returnRate}%`} />
            <MetaRow emoji="📚" label="Homeschool legal" value={city.meta.homeschoolLegal} />
            <MetaRow emoji="🛂" label="Visa friendly" value={city.meta.visaFriendly} />
          </div>
        </PaywallBlur>
      )}
    </div>
  )
}

function MetaRow({ emoji, label, value, highlight }: { emoji: string; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-sm">{emoji}</span>
      <div className="flex-1">
        <p className="text-xs text-[var(--text-secondary)]">{label}</p>
        <p className={`text-sm ${highlight ? "text-[var(--accent-warm)] font-medium" : ""}`}>{value}</p>
      </div>
    </div>
  )
}
