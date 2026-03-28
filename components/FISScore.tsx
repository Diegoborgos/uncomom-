"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { City, FISDimensionKey, FISResult, PersonalFISResult } from "@/lib/types"
import { calculateDefaultFIS, calculatePersonalFIS, getFISColor, getFISLabel, DIMENSION_LABELS } from "@/lib/fis"
import { useAuth } from "@/lib/auth-context"

// ============================================================
// Card variant — used on city grid cards
// ============================================================

export function FISCardBadge({ city }: { city: City }) {
  const fis = calculateDefaultFIS(city)
  const color = getFISColor(fis.score)

  return (
    <div className="flex flex-col items-center">
      <span
        className="inline-flex items-center rounded-full px-2.5 py-1 text-sm font-mono font-bold"
        style={{ backgroundColor: color + "dd", color: "#fff" }}
      >
        {fis.score}
      </span>
      <span className="text-[8px] text-white/60 mt-0.5 tracking-wider">FIS&trade;</span>
    </div>
  )
}

// ============================================================
// Detail variant — used on city detail page hero
// ============================================================

export function FISDetailGauge({ city }: { city: City }) {
  const { family, isPaid } = useAuth()
  const [animated, setAnimated] = useState(0)

  const fis = family && isPaid
    ? calculatePersonalFIS(city, family)
    : calculateDefaultFIS(city)

  const isPersonal = "adjustedFor" in fis
  const color = getFISColor(fis.score)
  const label = getFISLabel(fis.score)

  const radius = 44
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (animated / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(fis.score), 150)
    return () => clearTimeout(timer)
  }, [fis.score])

  return (
    <div className="flex flex-col items-center">
      {/* Gauge */}
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
          <circle
            cx="50" cy="50" r={radius}
            fill="none" stroke={color} strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif text-3xl font-bold" style={{ color }}>{fis.score}</span>
          <span className="text-[8px] text-white/50 tracking-widest uppercase">FIS&trade;</span>
        </div>
      </div>

      {/* Label */}
      <span className="text-xs mt-1" style={{ color }}>{label}</span>
      <span className="text-[10px] text-white/40 mt-0.5">
        {isPersonal ? "Your FIS\u2122" : "Family Intelligence Score\u2122"}
      </span>
    </div>
  )
}

// ============================================================
// Breakdown variant — dimension rows below the gauge
// ============================================================

export function FISBreakdown({ city }: { city: City }) {
  const { family, isPaid } = useAuth()
  const fis: FISResult | PersonalFISResult = family && isPaid
    ? calculatePersonalFIS(city, family)
    : calculateDefaultFIS(city)

  const isPersonal = "adjustedFor" in fis
  const personalFIS = isPersonal ? (fis as PersonalFISResult) : null

  const dimensions: FISDimensionKey[] = [
    "childSafety", "educationAccess", "familyCost", "healthcare",
    "nature", "community", "remoteWork", "visa", "lifestyle",
  ]

  return (
    <div className="space-y-6">
      {/* Personal adjustments */}
      {personalFIS && personalFIS.adjustedFor.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] text-[var(--text-secondary)]">Adjusted for:</span>
          {personalFIS.adjustedFor.map((a) => (
            <span
              key={a}
              className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-green)]/15 text-[var(--accent-green)]"
            >
              {a}
            </span>
          ))}
        </div>
      )}

      {/* Dimension rows */}
      <div className="space-y-3">
        {dimensions.map((key, i) => {
          const score = fis.dimensionScores[key]
          const weight = fis.weights[key]
          const color = getFISColor(score)

          return (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs text-[var(--text-secondary)] w-28 shrink-0">
                {DIMENSION_LABELS[key]}
              </span>
              <div className="flex-1 h-2.5 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${score}%`,
                    backgroundColor: color,
                    transition: `width 0.8s ease-out ${i * 0.1}s`,
                  }}
                />
              </div>
              <span className="w-8 text-right text-xs font-mono" style={{ color }}>
                {score}
              </span>
              {isPersonal && (
                <span className="w-8 text-right text-[9px] text-[var(--text-secondary)]">
                  {Math.round(weight * 100)}%
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Personal insight */}
      {personalFIS?.personalizedInsight && (
        <p className="text-sm text-[var(--accent-green)] italic">
          {personalFIS.personalizedInsight}
        </p>
      )}

      {/* Data source note */}
      <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
        <span>
          {city.signals?.dataQuality.fieldReportCount
            ? `${city.signals.dataQuality.fieldReportCount} field reports + live data`
            : "Based on public data sources"}
        </span>
        <Link href="/methodology" className="text-[var(--accent-green)] hover:underline">
          How we calculate this
        </Link>
      </div>
    </div>
  )
}
