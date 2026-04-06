"use client"

import Link from "next/link"
import { useCityOverviewContext } from "@/lib/use-city-overview"
import { FISDimensionData } from "@/lib/city-overview-data"
import SourceTooltip from "./ui/SourceTooltip"
import PersonalBadge from "./ui/PersonalBadge"

export default function FISBreakdownV2() {
  const overview = useCityOverviewContext()

  if (!overview) return <FISBreakdownSkeleton />

  const { fis, dataHealth } = overview

  return (
    <div className="space-y-5">
      {/* Personalization tags */}
      {fis.isPersonalized && fis.adjustedFor.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-[var(--text-secondary)]">Adjusted for:</span>
          {fis.adjustedFor.map((a) => (
            <PersonalBadge key={a} label={a} />
          ))}
        </div>
      )}

      {/* Dimension rows — hover to preview, tap to pin */}
      <div className="space-y-2.5">
        {fis.dimensions.map((dim, i) => (
          <DimensionRow
            key={dim.key}
            dim={dim}
            index={i}
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
}: {
  dim: FISDimensionData
  index: number
}) {
  const adjustmentText = dim.personalAdjustment > 0
    ? `+${dim.personalAdjustment}`
    : dim.personalAdjustment < 0
    ? `${dim.personalAdjustment}`
    : null

  const tooltipContent = dim.signalCount > 0
    ? `${dim.signalCount} signal${dim.signalCount !== 1 ? "s" : ""} · ${dim.sourceCount} source${dim.sourceCount !== 1 ? "s" : ""}${dim.lastUpdated ? ` · Updated ${getTimeAgo(new Date(dim.lastUpdated))}` : ""}`
    : "Estimated data"

  return (
    <SourceTooltip content={tooltipContent} showIcon={false}>
      <div className="flex items-center gap-3 w-full">
        <span className="text-xs text-[var(--text-secondary)] w-28 shrink-0 flex items-center gap-1">
          {dim.label}
          <span className="text-[9px] opacity-30 group-hover:opacity-70 transition-opacity">&#9432;</span>
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
      </div>
    </SourceTooltip>
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
