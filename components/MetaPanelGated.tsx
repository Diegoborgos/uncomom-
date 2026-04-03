"use client"

import { City } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { getVisaBadgeColor, getHomeschoolBadgeColor } from "@/lib/scores"
import { PaywallBlur } from "./Paywall"
import { personalizedVisa } from "@/lib/personalize"

export default function MetaPanelGated({ city }: { city: City }) {
  const { family, isPaid } = useAuth()

  const visa = isPaid ? personalizedVisa(city, family) : null
  const isHomeschooler = family?.education_approach?.toLowerCase().includes("homeschool") ||
    family?.education_approach?.toLowerCase().includes("unschool") ||
    family?.education_approach?.toLowerCase().includes("worldschool")

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
      <MetaRow emoji="⏰" label="Timezone" value={city.meta.timezone} />
      <MetaRow emoji="🗣" label="Languages" value={city.meta.language.join(", ")} />
      <MetaRow emoji="👶" label="Ideal for kids" value={city.meta.kidsAgeIdeal} />

      {isPaid ? (
        <>
          {city.meta.familiesNow > 0 && <MetaRow emoji="🏠" label="Families here now" value={`${city.meta.familiesNow}`} highlight />}
          {city.meta.familiesBeen > 0 && <MetaRow emoji="📊" label="Families have been here" value={`${city.meta.familiesBeen}`} />}
          {city.meta.returnRate > 0 && <MetaRow emoji="🔄" label="Return rate" value={`${city.meta.returnRate}%`} />}

          {/* Homeschool — highlighted if user homeschools */}
          <div className="flex items-start gap-3">
            <span className="text-sm">📚</span>
            <div className="flex-1">
              <p className="text-xs text-[var(--text-secondary)]">
                Homeschool legal
                {isHomeschooler && <span className="text-[var(--accent-green)] ml-1">· Relevant to you</span>}
              </p>
              <span
                className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 ${
                  isHomeschooler ? "ring-2 ring-[var(--accent-green)]/30" : ""
                }`}
                style={{
                  backgroundColor: getHomeschoolBadgeColor(city.meta.homeschoolLegal) + "22",
                  color: getHomeschoolBadgeColor(city.meta.homeschoolLegal),
                }}
              >
                {city.meta.homeschoolLegal}
              </span>
            </div>
          </div>

          {/* Visa — personalized for their passport */}
          <div className="flex items-start gap-3">
            <span className="text-sm">🛂</span>
            <div className="flex-1">
              <p className="text-xs text-[var(--text-secondary)]">
                Visa friendly
                {visa && <span className="text-[var(--accent-green)] ml-1">· {visa.tierLabel}</span>}
              </p>
              <span
                className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-0.5"
                style={{
                  backgroundColor: getVisaBadgeColor(visa?.friendliness || city.meta.visaFriendly) + "22",
                  color: getVisaBadgeColor(visa?.friendliness || city.meta.visaFriendly),
                }}
              >
                {visa?.friendliness || city.meta.visaFriendly}
              </span>
              {visa?.processingDays && (
                <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                  ~{visa.processingDays} days processing for your passport
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        <PaywallBlur>
          <div className="space-y-4">
            {city.meta.familiesNow > 0 && <MetaRow emoji="🏠" label="Families here now" value={`${city.meta.familiesNow}`} />}
            {city.meta.familiesBeen > 0 && <MetaRow emoji="📊" label="Families have been here" value={`${city.meta.familiesBeen}`} />}
            {city.meta.returnRate > 0 && <MetaRow emoji="🔄" label="Return rate" value={`${city.meta.returnRate}%`} />}
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
