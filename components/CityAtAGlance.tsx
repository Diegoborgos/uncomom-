"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

const SIGNAL_KEYS = [
  "nature.playgrounds", "nature.parks", "nature.swimmingPools", "nature.sportsCentres",
  "educationAccess.schoolCount", "educationAccess.internationalSchoolCountOSM",
  "healthcare.hospitalCount", "remoteWork.coworkingCount", "community.libraryCount",
  "meta.population", "meta.elevation", "meta.hdi", "meta.climate", "meta.area", "meta.demonym",
]

const POI_ITEMS = [
  { key: "nature.playgrounds", icon: "\u{1F6DD}", label: "Playgrounds" },
  { key: "nature.parks", icon: "\u{1F333}", label: "Parks" },
  { key: "educationAccess.schoolCount", icon: "\u{1F3EB}", label: "Schools" },
  { key: "educationAccess.internationalSchoolCountOSM", icon: "\u{1F30D}", label: "Int\u2019l schools" },
  { key: "healthcare.hospitalCount", icon: "\u{1F3E5}", label: "Hospitals" },
  { key: "remoteWork.coworkingCount", icon: "\u{1F4BB}", label: "Coworking" },
  { key: "community.libraryCount", icon: "\u{1F4DA}", label: "Libraries" },
  { key: "nature.swimmingPools", icon: "\u{1F3CA}", label: "Pools" },
  { key: "nature.sportsCentres", icon: "\u26BD", label: "Sports centres" },
]

export default function CityAtAGlance({ citySlug }: { citySlug: string }) {
  const [signals, setSignals] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [latestFetch, setLatestFetch] = useState<string | null>(null)
  const [totalItems, setTotalItems] = useState(0)
  const [uniqueSources, setUniqueSources] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("city_data_sources")
        .select("signal_key, signal_value, fetched_at, source_name")
        .eq("city_slug", citySlug)
        .in("signal_key", SIGNAL_KEYS)
        .order("fetched_at", { ascending: false })

      const rows = data || []
      const map: Record<string, string> = {}
      let latest: string | null = null
      for (const row of rows) {
        if (!map[row.signal_key]) {
          map[row.signal_key] = row.signal_value
          if (!latest || row.fetched_at > latest) latest = row.fetched_at
        }
      }
      setSignals(map)
      setLatestFetch(latest)
      setTotalItems(rows.length)
      setUniqueSources(Array.from(new Set(rows.map((r: Record<string, string>) => r.source_name))))
      setLoading(false)
    }
    load()
  }, [citySlug])

  if (loading) return null

  const population = parseNum(signals["meta.population"])
  const elevation = parseNum(signals["meta.elevation"])
  const area = parseNum(signals["meta.area"])
  const hdi = parseNum(signals["meta.hdi"])
  const climate = signals["meta.climate"] || null

  const hasFacts = population !== null || elevation !== null || area !== null || hdi !== null || climate !== null
  const hasPois = POI_ITEMS.some((p) => signals[p.key] && parseInt(signals[p.key]) > 0)

  if (!hasFacts && !hasPois) return null

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <h3 className="font-serif text-lg font-bold mb-4">At a glance</h3>

      {hasFacts && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
          {population !== null && (
            <StatBlock label="Population" value={formatPopulation(population)} />
          )}
          {elevation !== null && (
            <StatBlock label="Elevation" value={`${elevation.toLocaleString()}m`} />
          )}
          {area !== null && (
            <StatBlock label="Area" value={`${area.toLocaleString()} km\u00B2`} />
          )}
          {hdi !== null && (
            <StatBlock
              label="HDI"
              value={hdi.toFixed(3)}
              color={hdi >= 0.8 ? "text-[var(--accent-green)]" : hdi >= 0.7 ? "text-yellow-400" : "text-red-400"}
            />
          )}
          {climate && (
            <StatBlock label="Climate" value={climate} />
          )}
        </div>
      )}

      {hasPois && (
        <>
          <p className="text-xs text-[var(--text-secondary)] mb-3">Nearby within 10km</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
            {POI_ITEMS.map((poi) => {
              const count = signals[poi.key] ? parseInt(signals[poi.key]) : null
              if (!count) return null
              return (
                <div key={poi.key} className="flex items-center gap-1.5 text-xs">
                  <span className="text-sm">{poi.icon}</span>
                  <span className="font-mono font-medium text-[var(--text-primary)]">{count}</span>
                  <span className="text-[var(--text-secondary)] truncate">{poi.label}</span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {latestFetch && (
        <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)] mt-4">
          <span>
            {totalItems} signals from {uniqueSources.length} sources &middot; Updated {getTimeAgo(new Date(latestFetch))}
          </span>
        </div>
      )}
    </section>
  )
}

function StatBlock({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg bg-[var(--surface-elevated)] px-3 py-2">
      <p className="text-[10px] text-[var(--text-secondary)]">{label}</p>
      <p className={`text-sm font-medium ${color || "text-[var(--text-primary)]"}`}>{value}</p>
    </div>
  )
}

function parseNum(s: string | undefined): number | null {
  if (!s) return null
  const n = Number(s)
  return isNaN(n) ? null : n
}

function formatPopulation(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return n.toLocaleString()
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
