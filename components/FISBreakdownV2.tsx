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
            dataHealth={dataHealth}
          />
        ))}
      </div>

      {/* Personal insight */}
      {fis.personalizedInsight && (
        <p className="text-sm text-[var(--accent-green)] italic leading-relaxed">
          {fis.personalizedInsight}
        </p>
      )}

      {/* Trust line — only render when we have actual signals */}
      {dataHealth.totalSignals > 0 && (
        <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
          <span>
            {`${dataHealth.totalSignals} signals from ${dataHealth.totalSources} source${dataHealth.totalSources !== 1 ? "s" : ""}${dataHealth.fieldReportCount > 0 ? ` + ${dataHealth.fieldReportCount} family report${dataHealth.fieldReportCount !== 1 ? "s" : ""}` : ""}`}
            {dataHealth.lastUpdated && ` \u00b7 Updated ${getTimeAgo(new Date(dataHealth.lastUpdated))}`}
          </span>
          <Link href="/methodology" className="text-[var(--accent-green)] hover:underline shrink-0 ml-3">
            How this works &rarr;
          </Link>
        </div>
      )}
    </div>
  )
}

function DimensionRow({
  dim,
  index,
  isExpanded,
  onTap,
  dataHealth,
}: {
  dim: FISDimensionData
  index: number
  isExpanded: boolean
  onTap: () => void
  dataHealth: { totalSignals: number; totalSources: number; fieldReportCount: number; lastUpdated: string | null }
}) {
  const adjustmentText = dim.personalAdjustment > 0
    ? `+${dim.personalAdjustment}`
    : dim.personalAdjustment < 0
    ? `${dim.personalAdjustment}`
    : null

  return (
    <div className="relative">
      <button
        onClick={onTap}
        className="w-full flex items-center gap-3 text-left group hover:opacity-80 transition-opacity"
      >
        <span className="text-xs text-[var(--text-secondary)] w-28 shrink-0">
          {dim.label} <span className="text-[9px] text-[var(--text-secondary)]/40 group-hover:text-[var(--text-secondary)] transition-colors">&#9432;</span>
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

      {/* Tooltip — absolute positioned, floats above without shifting layout */}
      {isExpanded && (
        <div className="absolute left-8 sm:left-32 bottom-full mb-1.5 z-40 max-w-[280px]">
          <div className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-[10px] text-[var(--text-secondary)] shadow-lg">
            {dim.isPersonalized && (
              <p className="text-[var(--accent-green)] mb-1">
                Adjusted {dim.personalAdjustment > 0 ? "up" : "down"} for your family
              </p>
            )}
            <p>
              {dataHealth.totalSignals > 0
                ? `${dataHealth.totalSignals} signals \u00b7 ${dataHealth.totalSources} source${dataHealth.totalSources !== 1 ? "s" : ""}${dataHealth.lastUpdated ? ` \u00b7 Updated ${getTimeAgo(new Date(dataHealth.lastUpdated))}` : ""}`
                : "Estimated data"}
            </p>
          </div>
          {/* Arrow pointing down */}
          <div className="ml-6 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[var(--surface-elevated)]" />
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
