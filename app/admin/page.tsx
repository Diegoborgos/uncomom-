"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

type EventCount = { event_type: string; count: number }
type CityView = { city_slug: string; views: number }
type IntelBreakdown = { value: string; count: number }

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [totalEvents, setTotalEvents] = useState(0)
  const [eventsByType, setEventsByType] = useState<EventCount[]>([])
  const [topCities, setTopCities] = useState<CityView[]>([])
  const [totalFamilies, setTotalFamilies] = useState(0)
  const [activeLast7d, setActiveLast7d] = useState(0)
  const [decisionStages, setDecisionStages] = useState<IntelBreakdown[]>([])
  const [anxieties, setAnxieties] = useState<IntelBreakdown[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }
    if (!user) return

    const fetchData = async () => {
      // Total events
      const { count: eventCount } = await supabase
        .from("family_events")
        .select("*", { count: "exact", head: true })
      setTotalEvents(eventCount || 0)

      // Events by type
      const { data: events } = await supabase
        .from("family_events")
        .select("event_type")
      if (events) {
        const counts: Record<string, number> = {}
        events.forEach((e) => {
          counts[e.event_type] = (counts[e.event_type] || 0) + 1
        })
        setEventsByType(
          Object.entries(counts)
            .map(([event_type, count]) => ({ event_type, count }))
            .sort((a, b) => b.count - a.count)
        )
      }

      // Top viewed cities
      const { data: cityEvents } = await supabase
        .from("family_events")
        .select("event_data")
        .in("event_type", ["city_viewed", "city_card_clicked"])
      if (cityEvents) {
        const cityCounts: Record<string, number> = {}
        cityEvents.forEach((e) => {
          const slug = (e.event_data as Record<string, string>)?.citySlug
          if (slug) cityCounts[slug] = (cityCounts[slug] || 0) + 1
        })
        setTopCities(
          Object.entries(cityCounts)
            .map(([city_slug, views]) => ({ city_slug, views }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 10)
        )
      }

      // Total families
      const { count: famCount } = await supabase
        .from("families")
        .select("*", { count: "exact", head: true })
      setTotalFamilies(famCount || 0)

      // Active last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: activeEvents } = await supabase
        .from("family_events")
        .select("family_id")
        .gte("created_at", sevenDaysAgo)
        .not("family_id", "is", null)
      if (activeEvents) {
        const unique = new Set(activeEvents.map((e) => e.family_id))
        setActiveLast7d(unique.size)
      }

      // Intelligence breakdowns
      const { data: intel } = await supabase
        .from("family_intelligence")
        .select("decision_stage, primary_anxiety")
      if (intel) {
        const stages: Record<string, number> = {}
        const anx: Record<string, number> = {}
        intel.forEach((i) => {
          if (i.decision_stage) stages[i.decision_stage] = (stages[i.decision_stage] || 0) + 1
          if (i.primary_anxiety) anx[i.primary_anxiety] = (anx[i.primary_anxiety] || 0) + 1
        })
        setDecisionStages(Object.entries(stages).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count))
        setAnxieties(Object.entries(anx).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count))
      }

      setLoading(false)
    }

    fetchData()
  }, [user, authLoading, router])

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-[var(--text-secondary)]">
        Loading...
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-bold mb-2">Intelligence Dashboard</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-8">
        Behavioral data from family interactions. Updated in real-time.
      </p>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <MetricCard label="Total Events" value={totalEvents.toLocaleString()} />
        <MetricCard label="Families" value={totalFamilies.toString()} />
        <MetricCard label="Active (7d)" value={activeLast7d.toString()} />
        <MetricCard label="Event Types" value={eventsByType.length.toString()} />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Events by type */}
        <section>
          <h2 className="font-serif text-xl font-bold mb-4">Events by Type</h2>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            {eventsByType.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">No events yet. Start using the site to generate data.</p>
            ) : (
              <div className="space-y-2">
                {eventsByType.map((e) => {
                  const maxCount = eventsByType[0]?.count || 1
                  return (
                    <div key={e.event_type} className="flex items-center gap-3">
                      <span className="text-xs text-[var(--text-secondary)] w-36 shrink-0 font-mono truncate">
                        {e.event_type}
                      </span>
                      <div className="flex-1 h-3 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--accent-green)]"
                          style={{ width: `${(e.count / maxCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-[var(--text-secondary)] w-10 text-right">
                        {e.count}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* Top cities */}
        <section>
          <h2 className="font-serif text-xl font-bold mb-4">Most Viewed Cities</h2>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            {topCities.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">No city views yet.</p>
            ) : (
              <div className="space-y-2">
                {topCities.map((c, i) => {
                  const maxViews = topCities[0]?.views || 1
                  return (
                    <div key={c.city_slug} className="flex items-center gap-3">
                      <span className="text-xs text-[var(--text-secondary)] w-6 font-mono">{i + 1}</span>
                      <span className="text-sm w-28 shrink-0 truncate">{c.city_slug}</span>
                      <div className="flex-1 h-3 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--accent-warm)]"
                          style={{ width: `${(c.views / maxViews) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-[var(--text-secondary)] w-10 text-right">
                        {c.views}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* Decision stages */}
        <section>
          <h2 className="font-serif text-xl font-bold mb-4">Decision Stages</h2>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            {decisionStages.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">No intelligence data yet. Run the nightly intelligence job first.</p>
            ) : (
              <div className="space-y-3">
                {decisionStages.map((s) => (
                  <div key={s.value} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{s.value}</span>
                    <span className="font-mono text-sm text-[var(--accent-green)]">{s.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Primary anxieties */}
        <section>
          <h2 className="font-serif text-xl font-bold mb-4">Primary Anxieties</h2>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            {anxieties.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">No intelligence data yet.</p>
            ) : (
              <div className="space-y-3">
                {anxieties.map((a) => (
                  <div key={a.value} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{a.value}</span>
                    <span className="font-mono text-sm text-[var(--accent-warm)]">{a.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-center">
      <p className="font-mono text-3xl font-bold text-[var(--accent-green)]">{value}</p>
      <p className="text-xs text-[var(--text-secondary)] mt-1">{label}</p>
    </div>
  )
}
