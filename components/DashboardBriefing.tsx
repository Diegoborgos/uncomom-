"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import PersonalBadge from "./ui/PersonalBadge"

type BriefingItem = {
  type: string
  headline: string
  detail: string
  dimension: string | null
  relevance: string
  reason: string
  citySlug?: string
}

type CityBriefing = {
  citySlug: string
  cityName: string
  items: BriefingItem[]
}

type Briefing = {
  id: string
  headline: string
  total_items: number
  briefing_items: CityBriefing[]
  period_start: string
  period_end: string
  generated_at: string
  read_at: string | null
}

const TYPE_ICONS: Record<string, string> = {
  visa: "\u{1F6C2}",
  education: "\u{1F393}",
  cost: "\u{1F4B0}",
  safety: "\u{1F6E1}",
  activity: "\u{1F3C4}",
  legal: "\u2696\uFE0F",
  community: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}",
  general: "\u{1F4CD}",
}

const RELEVANCE_COLORS: Record<string, string> = {
  high: "text-[var(--accent-green)]",
  medium: "text-[var(--text-primary)]",
  low: "text-[var(--text-secondary)]",
}

export default function DashboardBriefing({ familyId }: { familyId: string }) {
  const [briefing, setBriefing] = useState<Briefing | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("family_briefings")
        .select("*")
        .eq("family_id", familyId)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      setBriefing(data as Briefing | null)
      setLoading(false)

      // Mark as read
      if (data && !data.read_at) {
        await supabase
          .from("family_briefings")
          .update({ read_at: new Date().toISOString() })
          .eq("id", data.id)
      }
    }
    load()
  }, [familyId])

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 animate-pulse">
        <div className="h-5 w-48 bg-[var(--surface-elevated)] rounded mb-3" />
        <div className="h-3 w-full bg-[var(--surface-elevated)] rounded mb-2" />
        <div className="h-3 w-3/4 bg-[var(--surface-elevated)] rounded" />
      </div>
    )
  }

  if (!briefing || briefing.total_items === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h3 className="font-serif text-lg font-bold mb-2">Your Intelligence Briefing</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-3">
          Save cities you&apos;re considering and we&apos;ll send you personalized intelligence updates weekly.
        </p>
        <Link
          href="/cities"
          className="inline-flex items-center gap-2 text-xs text-[var(--accent-green)] hover:underline"
        >
          Browse cities &rarr;
        </Link>
      </div>
    )
  }

  const cityBriefings = briefing.briefing_items || []
  const periodLabel = `${new Date(briefing.period_start).toLocaleDateString("en-US", { month: "short", day: "numeric" })} \u2013 ${new Date(briefing.period_end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-serif text-lg font-bold">Your Intelligence Briefing</h3>
          <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{periodLabel}</p>
        </div>
        <PersonalBadge label={`${briefing.total_items} update${briefing.total_items !== 1 ? "s" : ""}`} />
      </div>

      <div className="space-y-4">
        {cityBriefings.map((cityBrief) => (
          <div key={cityBrief.citySlug}>
            {/* City header */}
            <Link
              href={`/cities/${cityBrief.citySlug}`}
              className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent-green)] transition-colors"
            >
              {cityBrief.cityName || cityBrief.citySlug}
            </Link>

            {/* Items */}
            <div className="mt-2 space-y-2">
              {cityBrief.items.map((item, i) => {
                const itemKey = `${cityBrief.citySlug}-${i}`
                const isExpanded = expanded === itemKey
                const icon = TYPE_ICONS[item.type] || TYPE_ICONS.general
                const relevanceColor = RELEVANCE_COLORS[item.relevance] || RELEVANCE_COLORS.medium

                return (
                  <button
                    key={itemKey}
                    onClick={() => setExpanded(isExpanded ? null : itemKey)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-sm shrink-0 mt-0.5">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${relevanceColor}`}>
                          {item.headline}
                        </p>
                        {isExpanded && (
                          <div className="mt-1.5 space-y-1">
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                              {item.detail}
                            </p>
                            {item.reason && (
                              <p className="text-[10px] text-[var(--accent-green)] italic">
                                {item.reason}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] text-[var(--text-secondary)] shrink-0 mt-1">
                        {isExpanded ? "\u25B2" : "\u25BC"}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[9px] text-[var(--text-secondary)] mt-4">
        Updated {getTimeAgo(new Date(briefing.generated_at))} &middot; Based on your family profile
      </p>
    </div>
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
