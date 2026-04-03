"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

type SourceSummary = {
  source_name: string
  source_type: string
  signal_count: number
  latest_fetch: string
  avg_confidence: number
}

export default function DataFreshness({ citySlug }: { citySlug: string }) {
  const [sources, setSources] = useState<SourceSummary[]>([])
  const [fieldReportCount, setFieldReportCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    async function load() {
      // Get all data sources for this city
      const { data: rawSources } = await supabase
        .from("city_data_sources")
        .select("source_name, source_type, confidence, fetched_at")
        .eq("city_slug", citySlug)
        .order("fetched_at", { ascending: false })

      // Get field report count
      const { count } = await supabase
        .from("city_field_reports")
        .select("id", { count: "exact", head: true })
        .eq("city_slug", citySlug)
        .in("status", ["complete", "reviewed"])

      setFieldReportCount(count || 0)

      // Group by source_name
      if (rawSources && rawSources.length > 0) {
        const grouped: Record<string, SourceSummary> = {}
        for (const s of rawSources) {
          if (!grouped[s.source_name]) {
            grouped[s.source_name] = {
              source_name: s.source_name,
              source_type: s.source_type,
              signal_count: 0,
              latest_fetch: s.fetched_at,
              avg_confidence: 0,
            }
          }
          grouped[s.source_name].signal_count++
          grouped[s.source_name].avg_confidence += s.confidence || 0
          if (s.fetched_at > grouped[s.source_name].latest_fetch) {
            grouped[s.source_name].latest_fetch = s.fetched_at
          }
        }
        // Calculate avg confidence
        for (const g of Object.values(grouped)) {
          g.avg_confidence = Math.round(g.avg_confidence / g.signal_count)
        }
        setSources(Object.values(grouped).sort((a, b) => b.signal_count - a.signal_count))
      }

      setLoading(false)
    }
    load()
  }, [citySlug])

  if (loading) return null

  const totalSignals = sources.reduce((sum, s) => sum + s.signal_count, 0)
  const totalSources = sources.length + (fieldReportCount > 0 ? 1 : 0)
  const latestUpdate = sources.length > 0
    ? new Date(Math.max(...sources.map(s => new Date(s.latest_fetch).getTime())))
    : null

  if (totalSources === 0 && fieldReportCount === 0) return null

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div>
          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-medium mb-0.5">
            Data sources
          </p>
          <p className="text-sm text-[var(--text-primary)]">
            {totalSignals} signals from {totalSources} source{totalSources !== 1 ? "s" : ""}
            {fieldReportCount > 0 && ` + ${fieldReportCount} family report${fieldReportCount !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {latestUpdate && (
            <span className="text-[9px] text-[var(--text-secondary)]">
              Updated {getTimeAgo(latestUpdate)}
            </span>
          )}
          <span className="text-[var(--text-secondary)] text-xs">
            {expanded ? "▲" : "▼"}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-2">
          {sources.map(s => (
            <div key={s.source_name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  s.source_type === "public_api" ? "bg-[var(--accent-green)]" :
                  s.source_type === "field_report" ? "bg-[var(--accent-warm)]" :
                  "bg-[var(--text-secondary)]"
                }`} />
                <span className="text-[var(--text-primary)]">{s.source_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[var(--text-secondary)]">
                  {s.signal_count} signal{s.signal_count !== 1 ? "s" : ""}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--accent-green)]/10 text-[var(--accent-green)]">
                  {s.avg_confidence}%
                </span>
              </div>
            </div>
          ))}
          {fieldReportCount > 0 && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-warm)]" />
                <span className="text-[var(--text-primary)]">Family reports</span>
              </div>
              <span className="text-[var(--text-secondary)]">
                {fieldReportCount} report{fieldReportCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          <p className="text-[9px] text-[var(--text-secondary)] pt-1">
            Tap any data point on this page to see its specific source.
          </p>
        </div>
      )}
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
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}
