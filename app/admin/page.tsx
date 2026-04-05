"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"

const ADMIN_EMAILS = ["hello@uncomun.com", "diego@diegoborgo.com"]

type Stats = {
  totalEvents: number
  totalFamilies: number
  paidFamilies: number
  activeLast7d: number
  totalTrips: number
  totalReviews: number
  totalFieldReports: number
  totalPlaces: number
  totalSchools: number
  staleCities: number
  eventsByType: { type: string; count: number }[]
  topCities: { slug: string; views: number }[]
  recentSignups: { name: string; created: string }[]
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && (!user || !ADMIN_EMAILS.includes(user.email || ""))) {
      router.push("/")
      return
    }
    if (!user) return

    const fetch = async () => {
      const [
        { count: totalEvents },
        { count: totalFamilies },
        { count: paidFamilies },
        { count: totalTrips },
        { count: totalReviews },
        { count: totalFieldReports },
        { count: totalPlaces },
        { count: totalSchools },
        { count: staleCities },
      ] = await Promise.all([
        supabase.from("family_events").select("*", { count: "exact", head: true }),
        supabase.from("families").select("*", { count: "exact", head: true }),
        supabase.from("families").select("*", { count: "exact", head: true }).eq("membership_tier", "paid"),
        supabase.from("trips").select("*", { count: "exact", head: true }),
        supabase.from("reviews").select("*", { count: "exact", head: true }),
        supabase.from("city_field_reports").select("*", { count: "exact", head: true }),
        supabase.from("city_places").select("*", { count: "exact", head: true }),
        supabase.from("city_schools").select("*", { count: "exact", head: true }),
        supabase.from("cities").select("*", { count: "exact", head: true }).eq("signals_stale", true),
      ])

      // Events by type
      const { data: events } = await supabase.from("family_events").select("event_type")
      const typeCounts: Record<string, number> = {}
      events?.forEach((e) => { typeCounts[e.event_type] = (typeCounts[e.event_type] || 0) + 1 })
      const eventsByType = Object.entries(typeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Top cities
      const { data: cityEvents } = await supabase
        .from("family_events")
        .select("event_data")
        .in("event_type", ["city_viewed", "city_card_clicked"])
      const cityCounts: Record<string, number> = {}
      cityEvents?.forEach((e) => {
        const slug = (e.event_data as Record<string, string>)?.citySlug
        if (slug) cityCounts[slug] = (cityCounts[slug] || 0) + 1
      })
      const topCities = Object.entries(cityCounts)
        .map(([slug, views]) => ({ slug, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 8)

      // Active last 7d
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: activeEvents } = await supabase
        .from("family_events")
        .select("family_id")
        .gte("created_at", sevenDaysAgo)
        .not("family_id", "is", null)
      const activeLast7d = new Set(activeEvents?.map((e) => e.family_id)).size

      // Recent signups
      const { data: recentFams } = await supabase
        .from("families")
        .select("family_name, created_at")
        .order("created_at", { ascending: false })
        .limit(5)

      setStats({
        totalEvents: totalEvents || 0,
        totalFamilies: totalFamilies || 0,
        paidFamilies: paidFamilies || 0,
        activeLast7d,
        totalTrips: totalTrips || 0,
        totalReviews: totalReviews || 0,
        totalFieldReports: totalFieldReports || 0,
        totalPlaces: totalPlaces || 0,
        totalSchools: totalSchools || 0,
        staleCities: staleCities || 0,
        eventsByType,
        topCities,
        recentSignups: recentFams?.map((f) => ({ name: f.family_name, created: f.created_at })) || [],
      })
      setLoading(false)
    }

    fetch()
  }, [user, authLoading, router])

  if (authLoading || loading) {
    return <div className="max-w-5xl mx-auto px-4 py-20 text-center text-[var(--text-secondary)]">Loading...</div>
  }

  if (!stats) return null

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-xs text-[var(--text-secondary)]">{user?.email}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/cities" className="text-xs px-4 py-2 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity">
            City Editor
          </Link>
          <Link href="/" className="text-xs px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            View Site
          </Link>
        </div>
      </div>

      {/* Key metrics — top row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mb-8">
        <MetricCard label="Families" value={stats.totalFamilies} href="/admin/cities" />
        <MetricCard label="Paid Members" value={stats.paidFamilies} accent="warm" />
        <MetricCard label="Active (7d)" value={stats.activeLast7d} />
        <MetricCard label="Events" value={stats.totalEvents} />
        <MetricCard label="Stale Cities" value={stats.staleCities} accent={stats.staleCities > 0 ? "warn" : undefined} />
      </div>

      {/* Content metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        <SmallMetric label="Trips" value={stats.totalTrips} />
        <SmallMetric label="Reviews" value={stats.totalReviews} />
        <SmallMetric label="Field Reports" value={stats.totalFieldReports} />
        <SmallMetric label="Places (Google)" value={stats.totalPlaces} />
        <SmallMetric label="Schools (Google)" value={stats.totalSchools} />
      </div>

      {/* Admin actions */}
      <div className="mb-8">
        <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-medium mb-3">Data Pipeline</p>
        <div className="flex flex-wrap gap-3">
          <AdminAction
            label="Refresh all public data"
            onClick={async (setStatus) => {
              const { data: { session } } = await supabase.auth.getSession()
              if (!session) throw new Error("Not logged in — refresh the page")

              const { data: cities, error: citiesErr } = await supabase
                .from("cities")
                .select("slug, name")
                .order("name")
              if (citiesErr || !cities?.length) throw new Error("Could not load cities")

              let totalSignals = 0
              let totalErrors = 0
              const failed: string[] = []

              for (let i = 0; i < cities.length; i++) {
                const city = cities[i]
                setStatus(`Refreshing ${i + 1}/${cities.length}: ${city.name}...`)
                try {
                  const res = await fetch("/api/refresh-public-data", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({ citySlug: city.slug }),
                  })
                  const data = await res.json()
                  if (!res.ok) {
                    totalErrors++
                    failed.push(city.name)
                  } else {
                    totalSignals += data.signals || 0
                    totalErrors += data.errors || 0
                    // Log per-city error details to browser console
                    if (data.errorsByCity) {
                      for (const [slug, errs] of Object.entries(data.errorsByCity)) {
                        console.warn(`[${slug}]`, (errs as string[]).join(" | "))
                      }
                    }
                    // Only mark as failed if majority of APIs errored (3+)
                    if (data.errors >= 3) {
                      failed.push(city.name)
                    }
                  }
                } catch {
                  totalErrors++
                  failed.push(city.name)
                }
              }

              const errSuffix = failed.length > 0 ? ` | Failed: ${failed.slice(0, 5).join(", ")}` : ""
              setStatus(`Done: ${cities.length} cities, ${totalSignals} signals, ${totalErrors} errors${errSuffix}${totalErrors > 0 ? " — check browser console for details" : ""}`)
            }}
            accent
          />
          <AdminAction
            label="Aggregate field reports"
            onClick={async (setStatus) => {
              const { data: { session } } = await supabase.auth.getSession()
              if (!session) throw new Error("Not logged in — refresh the page")
              const res = await fetch("/api/aggregate-signals", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${session.access_token}`,
                },
              })
              const data = await res.json()
              if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
              setStatus(`Done: ${data.processed} cities — ${data.succeeded} succeeded, ${data.failed} failed`)
            }}
          />
          <AdminAction
            label="Run intelligence engine"
            onClick={async (setStatus) => {
              const { data: { session } } = await supabase.auth.getSession()
              if (!session) throw new Error("Not logged in — refresh the page")

              const { data: cityList, error: citiesErr } = await supabase
                .from("cities")
                .select("slug, name")
                .order("name")
              if (citiesErr || !cityList?.length) throw new Error("Could not load cities")

              let succeeded = 0
              let failed = 0
              const errors: string[] = []

              for (let i = 0; i < cityList.length; i++) {
                const city = cityList[i]
                setStatus(`Processing ${i + 1}/${cityList.length}: ${city.name}...`)
                try {
                  const res = await fetch("/api/intelligence/engine", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({ citySlug: city.slug }),
                  })
                  if (!res.ok) {
                    failed++
                    errors.push(city.name)
                  } else {
                    succeeded++
                  }
                } catch {
                  failed++
                  errors.push(city.name)
                }
              }

              const errSuffix = errors.length > 0 ? ` | Failed: ${errors.slice(0, 5).join(", ")}` : ""
              setStatus(`Done: ${succeeded} cities processed, ${failed} errors${errSuffix}`)
            }}
          />
          <AdminAction
            label="Generate family briefings"
            onClick={async (setStatus) => {
              const { data: { session } } = await supabase.auth.getSession()
              if (!session) throw new Error("Not logged in — refresh the page")

              setStatus("Generating briefings for all families...")
              const res = await fetch("/api/intelligence/briefing", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({}),
              })
              const data = await res.json()
              if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
              setStatus(`Done: ${data.processed || 0} families briefed`)
            }}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Events by type */}
        <div className="lg:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="text-sm font-medium mb-4">Events by Type</h2>
          {stats.eventsByType.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)]">No events yet.</p>
          ) : (
            <div className="space-y-1.5">
              {stats.eventsByType.map((e) => {
                const max = stats.eventsByType[0]?.count || 1
                return (
                  <div key={e.type} className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-[var(--text-secondary)] w-40 shrink-0 truncate">{e.type}</span>
                    <div className="flex-1 h-2 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--accent-green)]" style={{ width: `${(e.count / max) * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-secondary)] w-8 text-right">{e.count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Recent signups */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="text-sm font-medium mb-3">Recent Signups</h2>
            {stats.recentSignups.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)]">No signups yet.</p>
            ) : (
              <div className="space-y-2">
                {stats.recentSignups.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs font-medium">{s.name}</span>
                    <span className="text-[10px] text-[var(--text-secondary)]">{new Date(s.created).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top cities */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h2 className="text-sm font-medium mb-3">Most Viewed Cities</h2>
            {stats.topCities.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)]">No city views yet.</p>
            ) : (
              <div className="space-y-1.5">
                {stats.topCities.map((c, i) => (
                  <div key={c.slug} className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[var(--text-secondary)] w-4">{i + 1}</span>
                    <Link href={`/cities/${c.slug}`} className="text-xs flex-1 truncate hover:text-[var(--accent-green)] transition-colors">
                      {c.slug}
                    </Link>
                    <span className="text-[10px] font-mono text-[var(--text-secondary)]">{c.views}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-8 pt-6 border-t border-[var(--border)]">
        <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-medium mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction href="/admin/cities" label="City Editor" description="Edit scores, costs, meta" />
          <QuickAction href="/schools" label="Schools" description={`${stats.totalSchools} schools loaded`} />
          <QuickAction href="/visas" label="Visas" description="Visa guide data" />
          <QuickAction href="/homeschool-laws" label="Homeschool Laws" description="Legal status by country" />
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, accent, href }: { label: string; value: number; accent?: "warm" | "warn"; href?: string }) {
  const color = accent === "warm" ? "var(--accent-warm)" : accent === "warn" ? "var(--score-low)" : "var(--accent-green)"
  const inner = (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center hover:border-[var(--accent-green)] transition-colors">
      <p className="font-mono text-2xl font-bold" style={{ color }}>{value.toLocaleString()}</p>
      <p className="text-[10px] text-[var(--text-secondary)] mt-1">{label}</p>
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

function SmallMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 flex items-center justify-between">
      <span className="text-[10px] text-[var(--text-secondary)]">{label}</span>
      <span className="text-xs font-mono font-bold">{value}</span>
    </div>
  )
}

function AdminAction({ label, onClick, accent }: { label: string; onClick: (setStatus: (s: string) => void) => Promise<void>; accent?: boolean }) {
  const [status, setStatus] = useState<string | null>(null)
  const [running, setRunning] = useState(false)

  return (
    <div>
      <button
        disabled={running}
        onClick={async () => {
          setRunning(true)
          setStatus(null)
          try {
            await onClick(setStatus)
          } catch (err) {
            setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`)
          }
          setRunning(false)
        }}
        className={`px-4 py-2 text-xs rounded-lg font-medium transition-opacity disabled:opacity-50 ${
          accent
            ? "bg-[var(--accent-green)] text-black hover:opacity-90"
            : "border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]"
        }`}
      >
        {running ? "Running…" : label}
      </button>
      {status && (
        <p className={`text-[10px] mt-1.5 ${status.startsWith("Error") ? "text-[var(--score-low)]" : "text-[var(--accent-green)]"}`}>
          {status}
        </p>
      )}
    </div>
  )
}

function QuickAction({ href, label, description }: { href: string; label: string; description: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-[var(--accent-green)] transition-colors"
    >
      <p className="text-sm font-medium">{label}</p>
      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{description}</p>
    </Link>
  )
}
