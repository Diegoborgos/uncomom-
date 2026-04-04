"use client"

import { City } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { getVisaBadgeColor, getHomeschoolBadgeColor } from "@/lib/scores"
import { PaywallBlur } from "./Paywall"
import { personalizedVisa } from "@/lib/personalize"
import { useCityOverviewContext } from "@/lib/use-city-overview"
import PersonalBadge from "./ui/PersonalBadge"

export default function MetaPanelGated({ city }: { city: City }) {
  const { family, isPaid } = useAuth()
  const overview = useCityOverviewContext()

  // Use context if available, fallback to direct calculation
  const meta = overview?.meta
  const visa = meta?.visa?.details || (isPaid ? personalizedVisa(city, family) : null)
  const isHomeschooler = meta?.homeschoolLegal?.isRelevant ||
    family?.education_approach?.toLowerCase().includes("homeschool") ||
    family?.education_approach?.toLowerCase().includes("unschool") ||
    family?.education_approach?.toLowerCase().includes("worldschool") || false

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
      <MetaRow emoji="⏰" label="Timezone" value={city.meta.timezone} />
      <MetaRow emoji="🗣" label="Languages" value={city.meta.language.join(", ")} />
      <MetaRow emoji="👶" label="Ideal for kids" value={city.meta.kidsAgeIdeal} />

      {isPaid ? (
        <>
          {/* Homeschool — highlighted if relevant */}
          <div className="flex items-start gap-3">
            <span className="text-sm">📚</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs text-[var(--text-secondary)]">Homeschool legal</p>
                {isHomeschooler && <PersonalBadge />}
              </div>
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

          {/* Visa — personalized */}
          <div className="flex items-start gap-3">
            <span className="text-sm">🛂</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs text-[var(--text-secondary)]">Visa friendly</p>
                {visa && <PersonalBadge label={visa.tierLabel} />}
              </div>
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
            <MetaRow emoji="📚" label="Homeschool legal" value={city.meta.homeschoolLegal} />
            <MetaRow emoji="🛂" label="Visa friendly" value={city.meta.visaFriendly} />
          </div>
        </PaywallBlur>
      )}
    </div>
  )
}

function MetaRow({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-sm">{emoji}</span>
      <div className="flex-1">
        <p className="text-xs text-[var(--text-secondary)]">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  )
}
