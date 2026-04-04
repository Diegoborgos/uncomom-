"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"

type Source = {
  source_name: string
  source_url: string | null
  source_type: string
  fetched_at: string
  confidence: number
  report_count: number
}

export default function DataPoint({
  citySlug,
  signalKey,
  children,
}: {
  citySlug: string
  signalKey: string
  children: React.ReactNode
}) {
  const [hovered, setHovered] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [source, setSource] = useState<Source | null>(null)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const open = hovered || pinned

  useEffect(() => {
    if (!pinned) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setPinned(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [pinned])

  const fetchSource = async () => {
    if (loaded) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from("city_data_sources")
        .select("source_name, source_url, source_type, fetched_at, confidence, report_count")
        .eq("city_slug", citySlug)
        .eq("signal_key", signalKey)
        .order("fetched_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      setSource(data)
    } catch {
      // query failed — show fallback
    }
    setLoading(false)
    setLoaded(true)
  }

  const handleHoverIn = () => {
    setHovered(true)
    fetchSource()
  }

  const handleTap = () => {
    setPinned(!pinned)
    fetchSource()
  }

  const sourceLabel = source?.source_type === "field_report"
    ? "Family reports"
    : source?.source_type === "public_api"
      ? source.source_name
      : source?.source_type === "manual"
        ? "Manual research"
        : "Estimated"

  const timeAgo = source?.fetched_at
    ? getTimeAgo(new Date(source.fetched_at))
    : null

  return (
    <div
      className="relative inline-block"
      ref={ref}
      onMouseEnter={handleHoverIn}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={handleTap}
        className="text-left w-full cursor-pointer group hover:opacity-80 transition-opacity relative"
      >
        {children}
        <span className="absolute top-1.5 right-1.5 text-[9px] text-[var(--text-secondary)]/40 group-hover:text-[var(--text-secondary)] transition-colors">
          &#9432;
        </span>
      </button>

      {open && !loading && source && (
        <div className="absolute z-30 bottom-full left-0 mb-2 w-56 rounded-lg border border-[var(--border)] bg-[var(--bg)] shadow-xl p-3 text-left">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium text-[var(--text-primary)]">{sourceLabel}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--accent-green)]/15 text-[var(--accent-green)]">
              {source.confidence}%
            </span>
          </div>
          {timeAgo && (
            <p className="text-[9px] text-[var(--text-secondary)] mb-1">Updated {timeAgo}</p>
          )}
          {source.report_count > 1 && (
            <p className="text-[9px] text-[var(--text-secondary)] mb-1">Based on {source.report_count} data points</p>
          )}
          {source.source_url && (
            <a
              href={source.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] text-[var(--accent-green)] hover:underline"
            >
              View source &rarr;
            </a>
          )}
          <div className="absolute bottom-0 left-4 translate-y-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-[var(--border)]" />
        </div>
      )}
      {open && loading && (
        <div className="absolute z-30 bottom-full left-0 mb-2 w-56 rounded-lg border border-[var(--border)] bg-[var(--bg)] shadow-xl p-3 text-left">
          <p className="text-[10px] text-[var(--text-secondary)]">Loading source...</p>
          <div className="absolute bottom-0 left-4 translate-y-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-[var(--border)]" />
        </div>
      )}
      {open && !loading && loaded && !source && (
        <div className="absolute z-30 bottom-full left-0 mb-2 w-56 rounded-lg border border-[var(--border)] bg-[var(--bg)] shadow-xl p-3 text-left">
          <p className="text-[10px] text-[var(--text-secondary)]">Estimated data &mdash; no tracked source yet</p>
          <div className="absolute bottom-0 left-4 translate-y-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-[var(--border)]" />
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
