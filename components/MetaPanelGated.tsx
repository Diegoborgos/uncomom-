"use client"

import { useState, useEffect } from "react"
import { City } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { getVisaBadgeColor, getHomeschoolBadgeColor } from "@/lib/scores"
import { PaywallBlur } from "./Paywall"
import { personalizedVisa } from "@/lib/personalize"
import { useCityOverviewContext } from "@/lib/use-city-overview"
import PersonalBadge from "./ui/PersonalBadge"

export default function MetaPanelGated({ city }: { city: City }) {
  const { family, isPaid } = useAuth()
  const overview = useCityOverviewContext()
  const [population, setPopulation] = useState<number | null>(null)
  const [demonym, setDemonym] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("city_data_sources")
        .select("signal_key, signal_value")
        .eq("city_slug", city.slug)
        .in("signal_key", ["meta.population", "meta.demonym"])

      for (const row of data || []) {
        if (row.signal_key === "meta.population") setPopulation(parseInt(row.signal_value))
        if (row.signal_key === "meta.demonym") setDemonym(row.signal_value)
      }
    }
    load()
  }, [city.slug])

  // Use context if available, fallback to direct calculation
  const meta = overview?.meta
  const visa = meta?.visa?.details || (isPaid ? personalizedVisa(city, family) : null)
  const isHomeschooler = meta?.homeschoolLegal?.isRelevant ||
    family?.education_approach?.toLowerCase().includes("homeschool") ||
    family?.education_approach?.toLowerCase().includes("unschool") ||
    family?.education_approach?.toLowerCase().includes("worldschool") || false

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
      {population && <MetaRow emoji="👥" label="Population" value={formatPopulation(population)} />}
      <MetaRow emoji="⏰" label="Timezone" value={city.meta.timezone} />
      <MetaRow emoji="🗣" label="Languages" value={city.meta.language.join(", ")} />
      {demonym && (
        <p className="text-[10px] text-[var(--text-secondary)] -mt-2 ml-8">
          Locals are called {demonym}{demonym.endsWith("s") ? "" : "s"}
        </p>
      )}
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

function formatPopulation(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return n.toLocaleString()
}
