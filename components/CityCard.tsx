"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { City } from "@/lib/types"
import { countryCodeToFlag, formatEuro } from "@/lib/scores"
import { track } from "@/lib/tracking"
import { calculateDefaultFIS, getFISColor, DIMENSION_LABELS } from "@/lib/fis"

export default function CityCard({ city }: { city: City }) {
  const flag = countryCodeToFlag(city.countryCode)
  const router = useRouter()
  const [showPreview, setShowPreview] = useState(false)

  const fis = useMemo(() => calculateDefaultFIS(city), [city])

  const handleClick = useCallback((e: React.MouseEvent) => {
    track("city_card_clicked", { citySlug: city.slug, cityName: city.name })
    // Desktop: always navigate
    if (window.matchMedia("(hover: hover)").matches) {
      router.push(`/cities/${city.slug}`)
      return
    }
    // Mobile: first tap → preview, second tap → navigate
    if (!showPreview) {
      e.preventDefault()
      setShowPreview(true)
    } else {
      router.push(`/cities/${city.slug}`)
    }
  }, [showPreview, city.slug, city.name, router])

  const dismissPreview = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowPreview(false)
  }

  // Top 5 FIS dimensions for hover bars
  const dimensionBars = useMemo(() => {
    const keys = ["childSafety", "educationAccess", "familyCost", "healthcare", "nature"] as const
    return keys.map((key) => ({
      label: DIMENSION_LABELS[key],
      value: fis.dimensionScores[key],
    }))
  }, [fis])

  return (
    <div
      onClick={handleClick}
      className="group rounded-3xl overflow-hidden bg-[var(--surface)] hover:-translate-y-1 transition-all duration-200 cursor-pointer"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        {/* City photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={city.photo || ""}
          alt={`${city.name}, ${city.country}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = "none"
            if (target.parentElement) {
              target.parentElement.style.background = "linear-gradient(135deg, var(--surface-elevated), var(--surface))"
            }
          }}
        />
        {/* Stronger gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* FIS score badge — top left */}
        <div className="absolute top-4 left-4">
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-sm font-mono font-bold bg-[var(--accent-green)] text-black">
            ★ {fis.score}
          </span>
        </div>

        {/* Cost — top right */}
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-sm font-mono font-bold bg-black/50 backdrop-blur-sm text-white">
            {formatEuro(city.cost.familyMonthly)}/mo
          </span>
        </div>

        {/* City name + country — bottom */}
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-sm text-white/90 mb-1">{flag} {city.country}</p>
          <h3 className="text-2xl font-bold text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
            {city.name}
          </h3>
        </div>

        {/* HOVER/TAP OVERLAY — FIS dimension bars */}
        <div className={`absolute inset-0 transition-opacity duration-200 ${
          showPreview ? "opacity-100" : "opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
        }`} style={{ backgroundColor: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)" }}>

          {/* City info at top of overlay */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/60">{flag} {city.country}</p>
              <h4 className="text-lg font-bold text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                {city.name}
              </h4>
            </div>
            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-sm font-mono font-bold bg-[var(--accent-green)] text-black">
              {fis.score}
            </span>
          </div>

          {showPreview && (
            <div className="absolute top-4 right-16">
              <button
                onClick={dismissPreview}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>
          )}

          {/* FIS dimension score bars */}
          <div className="absolute bottom-4 left-4 right-4 space-y-2">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Family Intelligence Score</p>
            {dimensionBars.map((d) => (
              <div key={d.label} className="flex items-center gap-3">
                <span className="text-[11px] text-white/70 w-20 shrink-0">{d.label}</span>
                <div className="flex-1 h-3.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${d.value}%`,
                      backgroundColor: getFISColor(d.value),
                    }}
                  />
                </div>
                <span className="text-[10px] font-mono text-white/50 w-6 text-right">{d.value}</span>
              </div>
            ))}

            {showPreview && (
              <p className="text-[10px] text-white/30 text-center pt-2">Tap again to view city →</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
