"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import SourceTooltip from "./ui/SourceTooltip"

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
  const [source, setSource] = useState<Source | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function load() {
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
      } catch { /* fail silently */ }
      setLoaded(true)
    }
    load()
  }, [citySlug, signalKey])

  const sourceLabel = source?.source_type === "field_report"
    ? "Family reports"
    : source?.source_type === "public_api"
      ? source.source_name
      : source?.source_type === "manual"
        ? "Research data"
        : "Estimated data"

  const timeAgo = source?.fetched_at
    ? getTimeAgo(new Date(source.fetched_at))
    : null

  const content = loaded && source
    ? `${sourceLabel}${timeAgo ? ` · Updated ${timeAgo}` : ""}${source.report_count > 1 ? ` · ${source.report_count} data points` : ""}`
    : loaded
    ? "Estimated data"
    : "Loading..."

  return (
    <SourceTooltip content={content} iconPosition="top-right">
      {children}
    </SourceTooltip>
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
