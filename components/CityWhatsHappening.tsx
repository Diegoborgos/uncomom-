"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import PersonalBadge from "./ui/PersonalBadge"

type IntelligenceData = {
  city_narrative: string | null
  trend: string
  trend_reason: string | null
  arrival_curve: string
  top_signals: Array<{ type: string; source: string; headline: string; dimension: string; sentiment: string }>
  generated_at: string
}

const TREND_LABELS: Record<string, { label: string; color: string }> = {
  heating: { label: "Trending up", color: "text-[var(--accent-green)]" },
  cooling: { label: "Cooling down", color: "text-red-400" },
  stable: { label: "Stable", color: "text-[var(--text-secondary)]" },
}

const CURVE_LABELS: Record<string, string> = {
  emerging: "Emerging destination",
  established: "Established",
  trending: "Trending",
  saturated: "Saturated",
}

export default function CityWhatsHappening({ citySlug }: { citySlug: string }) {
  const [data, setData] = useState<IntelligenceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: intel } = await supabase
        .from("city_intelligence")
        .select("city_narrative, trend, trend_reason, arrival_curve, top_signals, generated_at")
        .eq("city_slug", citySlug)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      setData(intel)
      setLoading(false)
    }
    load()
  }, [citySlug])

  if (loading || !data || !data.city_narrative) return null

  const trendInfo = TREND_LABELS[data.trend] || TREND_LABELS.stable
  const curveLabel = CURVE_LABELS[data.arrival_curve] || ""

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif text-lg font-bold">What's happening</h3>
        <div className="flex items-center gap-2">
          {data.arrival_curve !== "established" && (
            <PersonalBadge label={curveLabel} />
          )}
          <span className={`text-xs font-medium ${trendInfo.color}`}>
            {trendInfo.label}
          </span>
        </div>
      </div>

      <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
        {data.city_narrative}
      </p>

      {data.top_signals && data.top_signals.length > 0 && (
        <div className="space-y-1.5">
          {data.top_signals.slice(0, 3).map((signal, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className={`shrink-0 mt-0.5 ${
                signal.sentiment === "positive" ? "text-[var(--accent-green)]" :
                signal.sentiment === "negative" ? "text-red-400" :
                "text-[var(--text-secondary)]"
              }`}>
                {signal.sentiment === "positive" ? "↑" : signal.sentiment === "negative" ? "↓" : "→"}
              </span>
              <span className="text-[var(--text-secondary)]">{signal.headline}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-[9px] text-[var(--text-secondary)] mt-3">
        Updated {getTimeAgo(new Date(data.generated_at))}
      </p>
    </section>
  )
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}
