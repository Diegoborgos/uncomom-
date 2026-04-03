"use client"

import { useState } from "react"
import Link from "next/link"
import { useCityOverviewContext } from "@/lib/use-city-overview"
import { FISDimensionData } from "@/lib/city-overview-data"

export default function FISBreakdownV2() {
  const overview = useCityOverviewContext()
  const [expandedDim, setExpandedDim] = useState<string | null>(null)

  if (!overview) return <FISBreakdownSkeleton />

  const { fis, dataHealth } = overview

  return (
    <div className="space-y-5">
      {/* Personalization tags */}
      {fis.isPersonalized && fis.adjustedFor.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-[var(--text-secondary)]">Adjusted for:</span>
          {fis.adjustedFor.map((a) => (
            <span
              key={a}
              className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-green)]/15 text-[var(--accent-green)]"
            >
              {a}
            </span>
          ))}
        </div>
      )}

      {/* Dimension rows — tappable */}
      <div className="space-y-2.5">
        {fis.dimensions.map((dim, i) => (
          <DimensionRow
            key={dim.key}
            dim={dim}
            index={i}
            isExpanded={expandedDim === dim.key}
            onTap={() => setExpandedDim(expandedDim === dim.key ? null : dim.key)}
          />
        ))}
      </div>

      {/* Personal insight */}
      {fis.personalizedInsight && (
        <p className="text-sm text-[var(--accent-green)] italic leading-relaxed">
          {fis.personalizedInsight}
        </p>
      )}

      {/* Trust line — replaces both "Based on public data sources" and the DataFreshness widget */}
      <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
        <span>
          {dataHealth.totalSignals > 0
            ? `${dataHealth.totalSignals} signals from ${dataHealth.totalSources} source${dataHealth.totalSources !== 1 ? "s" : ""}${dataHealth.fieldReportCount > 0 ? ` + ${dataHealth.fieldReportCount} family report${dataHealth.fieldReportCount !== 1 ? "s" : ""}` : ""}`
            : "Based on public data sources"}
          {dataHealth.lastUpdated && ` \u00b7 Updated ${getTimeAgo(new Date(dataHealth.lastUpdated))}`}
        </span>
        <Link href="/methodology" className="text-[var(--accent-green)] hover:underline shrink-0 ml-3">
          How this works &rarr;
        </Link>
      </div>
    </div>
  )
}

function DimensionRow({
  dim,
  index,
  isExpanded,
  onTap,
}: {
  dim: FISDimensionData
  index: number
  isExpanded: boolean
  onTap: () => void
}) {
  const adjustmentText = dim.personalAdjustment > 0
    ? `+${dim.personalAdjustment}`
    : dim.personalAdjustment < 0
    ? `${dim.personalAdjustment}`
    : null

  return (
    <div>
      <button
        onClick={onTap}
        className="w-full flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
      >
        <span className="text-xs text-[var(--text-secondary)] w-28 shrink-0">
          {dim.label}
        </span>
        <div className="flex-1 h-2.5 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${dim.score}%`,
              backgroundColor: dim.color,
              transition: `width 0.8s ease-out ${index * 0.08}s`,
            }}
          />
        </div>
        <span className="w-8 text-right text-xs font-mono" style={{ color: dim.color }}>
          {dim.score}
        </span>
        {adjustmentText && (
          <span className={`w-10 text-right text-[9px] font-mono ${
            dim.personalAdjustment > 0 ? "text-[var(--accent-green)]" : "text-red-400"
          }`}>
            {adjustmentText}%
          </span>
        )}
      </button>

      {/* Expanded detail — shows on tap */}
      {isExpanded && (
        <div className="ml-[7.5rem] mt-1.5 mb-1 px-3 py-2 rounded-lg bg-[var(--surface-elevated)] text-[10px] text-[var(--text-secondary)]">
          <p>
            {dim.isPersonalized
              ? `Score adjusted ${dim.personalAdjustment > 0 ? "up" : "down"} for your family profile`
              : "Base score \u2014 not personalized"}
          </p>
          <p className="mt-0.5">
            Weight: {dim.weightPercent}% of total FIS&trade;
          </p>
        </div>
      )}
    </div>
  )
}

function FISBreakdownSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-28 h-3 rounded bg-[var(--surface-elevated)] animate-pulse" />
          <div className="flex-1 h-2.5 rounded-full bg-[var(--surface-elevated)] animate-pulse" />
          <div className="w-8 h-3 rounded bg-[var(--surface-elevated)] animate-pulse" />
        </div>
      ))}
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
