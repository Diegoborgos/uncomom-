"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

const ADMIN_EMAILS = ["hello@uncomun.com", "diego@diegoborgo.com"]

type SourceTypeCounts = {
  public_api: number
  field_report: number
  admin_manual: number
  researched: number
  seed_estimate: number
  paid_api_ready: number
}

type TopSeedSignal = { signal_key: string; city_count: number }

export default function DataHealthPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [counts, setCounts] = useState<SourceTypeCounts | null>(null)
  const [byDimension, setByDimension] = useState<Array<{ dimension: string; total: number; live: number; estimated: number }>>([])
  const [topSeedSignals, setTopSeedSignals] = useState<TopSeedSignal[]>([])
  const [paidStatus, setPaidStatus] = useState<{ numbeo: boolean; googlePlaces: boolean }>({ numbeo: false, googlePlaces: false })
  const [numSignalsReady, setNumSignalsReady] = useState(0)
  const [lastRefreshByRoute, setLastRefreshByRoute] = useState<Array<{ route: string; started_at: string; ok: boolean | null }>>([])

  useEffect(() => {
    if (!loading && (!user || !ADMIN_EMAILS.includes(user.email || ""))) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    (async () => {
      // Aggregate source_type counts
      const { data: sources } = await supabase
        .from("city_data_sources")
        .select("signal_key, source_type")
      const rows = sources || []

      const aggregated: SourceTypeCounts = {
        public_api: 0, field_report: 0, admin_manual: 0, researched: 0, seed_estimate: 0, paid_api_ready: 0,
      }
      for (const r of rows) {
        const key = (r.source_type === "manual" ? "admin_manual"
          : r.source_type === "estimated" ? "seed_estimate"
          : r.source_type) as keyof SourceTypeCounts
        if (key in aggregated) aggregated[key]++
      }
      setCounts(aggregated)
      setNumSignalsReady(aggregated.paid_api_ready)

      // Coverage by FIS dimension
      const dimensionKeys = ["childSafety", "educationAccess", "familyCost", "healthcare", "nature", "community", "remoteWork", "visa", "lifestyle"]
      const byDim = dimensionKeys.map((key) => {
        const dimRows = rows.filter((r) => r.signal_key.startsWith(key + "."))
        const live = dimRows.filter((r) => ["public_api", "field_report", "admin_manual", "manual", "researched"].includes(r.source_type)).length
        const estimated = dimRows.filter((r) => ["seed_estimate", "paid_api_ready", "estimated"].includes(r.source_type)).length
        return { dimension: key, total: dimRows.length, live, estimated }
      })
      setByDimension(byDim)

      // Top 20 seed_estimate / paid_api_ready signals (most cities affected)
      const seedCounts: Record<string, number> = {}
      for (const r of rows) {
        if (r.source_type === "seed_estimate" || r.source_type === "paid_api_ready" || r.source_type === "estimated") {
          seedCounts[r.signal_key] = (seedCounts[r.signal_key] || 0) + 1
        }
      }
      const topSeeds = Object.entries(seedCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([signal_key, city_count]) => ({ signal_key, city_count }))
      setTopSeedSignals(topSeeds)

      // Cron freshness: latest run per route
      const { data: recent } = await supabase
        .from("cron_run_log")
        .select("route, started_at, ok")
        .order("started_at", { ascending: false })
        .limit(30)
      const seenRoutes = new Set<string>()
      const latest: Array<{ route: string; started_at: string; ok: boolean | null }> = []
      for (const r of (recent || [])) {
        if (!seenRoutes.has(r.route)) {
          seenRoutes.add(r.route)
          latest.push(r)
        }
      }
      setLastRefreshByRoute(latest)

      // Paid API status (env-driven, read from API route not exposed here; infer from signals)
      // If any signal_key under paid_api_ready has been written as public_api, that integration is active.
      const numbeoKeys = new Set(["familyCost.groceryIndex", "familyCost.rent2br", "familyCost.transportCost", "familyCost.restaurantIndex", "familyCost.utilitiesMonthly"])
      const gpsKeys = new Set(["educationAccess.schoolCount", "educationAccess.internationalSchoolCount"])
      const numbeoActive = rows.some((r) => numbeoKeys.has(r.signal_key) && r.source_type === "public_api")
      const gpsActive = rows.some((r) => gpsKeys.has(r.signal_key) && r.source_type === "public_api")
      setPaidStatus({ numbeo: numbeoActive, googlePlaces: gpsActive })
    })()
  }, [])

  if (loading || !counts) return <div className="p-8 text-[var(--text-secondary)]">Loading...</div>
  if (!user || !ADMIN_EMAILS.includes(user.email || "")) return null

  const total = counts.public_api + counts.field_report + counts.admin_manual + counts.researched + counts.seed_estimate + counts.paid_api_ready
  const livePct = total === 0 ? 0 : Math.round(((counts.public_api + counts.field_report + counts.admin_manual + counts.researched) / total) * 100)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Data Health</h1>
          <p className="text-xs text-[var(--text-secondary)]">{total} provenance rows · {livePct}% live</p>
        </div>
        <Link href="/admin/cities" className="text-xs text-[var(--accent-green)] hover:underline">&larr; Back to City Editor</Link>
      </div>

      {/* Big numbers */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <MetricTile label="Live APIs" value={counts.public_api} tone="green" />
        <MetricTile label="Family reports" value={counts.field_report} tone="green" />
        <MetricTile label="Verified" value={counts.admin_manual} tone="green" />
        <MetricTile label="Researched" value={counts.researched} tone="green" />
        <MetricTile label="Estimated" value={counts.seed_estimate} tone="warm" />
        <MetricTile label="Paid API ready" value={counts.paid_api_ready} tone="warm" />
      </div>

      {/* GTM readiness */}
      <div className="rounded-xl border border-[rgb(var(--accent-warm-rgb)/0.3)] bg-[rgb(var(--accent-warm-rgb)/0.08)] p-5">
        <p className="text-sm font-medium text-[var(--accent-warm)] mb-2">GTM readiness</p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${paidStatus.numbeo ? "bg-[var(--accent-green)]" : "bg-[var(--accent-warm)]"}`} />
            <span>Numbeo: {paidStatus.numbeo ? "Active" : "Dormant"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${paidStatus.googlePlaces ? "bg-[var(--accent-green)]" : "bg-[var(--accent-warm)]"}`} />
            <span>Google Places: {paidStatus.googlePlaces ? "Active" : "Dormant"}</span>
          </div>
          {numSignalsReady > 0 && (
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              Activating the remaining paid APIs would upgrade <span className="font-mono text-[var(--accent-warm)]">{numSignalsReady}</span> signal rows from Estimated to Live.
            </p>
          )}
        </div>
      </div>

      {/* Per-dimension coverage */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-medium mb-3">Coverage by FIS dimension</p>
        <div className="space-y-2">
          {byDimension.map((d) => {
            const livePct = d.total === 0 ? 0 : Math.round((d.live / d.total) * 100)
            return (
              <div key={d.dimension} className="flex items-center gap-3 text-xs">
                <span className="w-32 text-[var(--text-secondary)]">{d.dimension}</span>
                <div className="flex-1 h-2 rounded-full bg-[var(--surface-elevated)] overflow-hidden flex">
                  <div className="h-full" style={{ width: `${livePct}%`, backgroundColor: "var(--accent-green)" }} />
                  <div className="h-full" style={{ width: `${100 - livePct}%`, backgroundColor: "var(--accent-warm)" }} />
                </div>
                <span className="w-28 text-right font-mono text-[var(--text-secondary)]">
                  {d.live}/{d.total} · {livePct}%
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top 20 seed/paid-ready signals */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-medium mb-3">Top estimated signals (most cities affected)</p>
        <div className="space-y-1">
          {topSeedSignals.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">No estimated signals — everything is live. Ship it.</p>
          ) : topSeedSignals.map((s) => (
            <div key={s.signal_key} className="flex items-center gap-3 text-xs">
              <span className="flex-1 font-mono truncate">{s.signal_key}</span>
              <span className="w-20 text-right text-[var(--text-secondary)]">
                {s.city_count} cit{s.city_count === 1 ? "y" : "ies"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Cron freshness */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-medium mb-3">Most recent cron runs by route</p>
        {lastRefreshByRoute.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">No cron runs logged yet.</p>
        ) : (
          <div className="space-y-1">
            {lastRefreshByRoute.map((r) => (
              <div key={r.route} className="flex items-center gap-3 text-xs font-mono">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${r.ok === false ? "bg-[var(--score-low)]" : r.ok ? "bg-[var(--accent-green)]" : "bg-[var(--accent-warm)]"}`} />
                <span className="w-32 truncate">{r.route}</span>
                <span className="text-[var(--text-secondary)]">{timeAgo(r.started_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MetricTile({ label, value, tone }: { label: string; value: number; tone: "green" | "warm" }) {
  const color = tone === "green" ? "var(--accent-green)" : "var(--accent-warm)"
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
      <p className="font-mono text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{label}</p>
    </div>
  )
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}
