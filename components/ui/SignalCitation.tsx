"use client"

import { ReactNode } from "react"
import { useCityOverviewContext } from "@/lib/use-city-overview"
import SignalBadge, { SignalSourceType } from "./SignalBadge"
import SourceTooltip from "./SourceTooltip"

/**
 * SignalCitation — wraps a value (number, label, etc.) with the matching
 * provenance from the city overview context. Renders a SignalBadge pill
 * next to the children, and a SourceTooltip popover that shows the
 * citation URL on hover/tap.
 *
 * Usage:
 *   <SignalCitation signalKey="familyCost.rent2br">
 *     <span>{formatEuro(city.cost.rent2br)}</span>
 *   </SignalCitation>
 */
export default function SignalCitation({
  signalKey,
  children,
  hideBadge = false,
}: {
  signalKey: string
  children: ReactNode
  hideBadge?: boolean
}) {
  const overview = useCityOverviewContext()
  const src = overview?.signalSources?.[signalKey]

  // No provenance row: render value with a quiet "Estimated" pill.
  if (!src) {
    return (
      <span className="inline-flex items-center gap-1.5">
        {children}
        {!hideBadge && <SignalBadge sourceType="seed_estimate" compact />}
      </span>
    )
  }

  const sourceType = src.source_type as SignalSourceType
  const tooltipContent = `${src.confidence}% confidence · Updated ${timeAgoShort(src.fetched_at)}`

  return (
    <SourceTooltip
      title={signalKey}
      content={tooltipContent}
      sources={[{ name: src.source_name, url: src.source_url, type: src.source_type }]}
      showIcon={false}
    >
      <span className="inline-flex items-center gap-1.5">
        {children}
        {!hideBadge && <SignalBadge sourceType={sourceType} fetchedAt={src.fetched_at} compact />}
      </span>
    </SourceTooltip>
  )
}

function timeAgoShort(iso: string): string {
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
