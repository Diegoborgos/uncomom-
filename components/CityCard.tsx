"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { City } from "@/lib/types"
import { countryCodeToFlag, formatEuro } from "@/lib/scores"
import { track } from "@/lib/tracking"
import { calculateDefaultFIS, DIMENSION_LABELS } from "@/lib/fis"

export default function CityCard({ city }: { city: City }) {
  const flag = countryCodeToFlag(city.countryCode)
  const router = useRouter()
  const [showPreview, setShowPreview] = useState(false)

  const fis = useMemo(() => calculateDefaultFIS(city), [city])

  const handleClick = useCallback((e: React.MouseEvent) => {
    track("city_card_clicked", { citySlug: city.slug, cityName: city.name })
    // First tap/click → show preview. Second → navigate.
    // On desktop, hover already shows the overlay, so click always navigates.
    if (!showPreview) {
      e.preventDefault()
      setShowPreview(true)
    } else {
      router.push(`/cities/${city.slug}`)
    }
  }, [showPreview, city.slug, city.name, router])

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
      onMouseEnter={() => setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
      className="group rounded-3xl overflow-hidden bg-[var(--bg)] hover:-translate-y-1 transition-all duration-200 cursor-pointer"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-black">
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
        {/* Gradient — top and bottom for edge blending */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

        {/* FIS score badge — top left */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-mono font-bold bg-[var(--accent-green)] text-black">
            {fis.score} FIS&trade;
          </span>
        </div>

        {/* City name + country + cost — bottom */}
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-xs text-white/90 mb-0.5">{flag} {city.country}</p>
          <div className="flex items-end justify-between">
            <h3 className="text-xl font-bold text-white leading-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
              {city.name}
            </h3>
            <span className="text-xs font-mono text-white/80 shrink-0 ml-2">
              {formatEuro(city.cost.familyMonthly)}/mo
            </span>
          </div>
        </div>

        {/* HOVER/TAP OVERLAY */}
        <div className={`absolute inset-0 transition-opacity duration-200 flex flex-col justify-center ${
          showPreview ? "opacity-100" : "opacity-0 pointer-events-none"
        }`} style={{ backgroundColor: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)" }}>

          {/* City info + scores — vertically centered */}
          <div className="px-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-white/60">{flag} {city.country}</p>
                <h4 className="text-lg font-bold text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  {city.name}
                </h4>
              </div>
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-sm font-mono font-bold bg-[var(--accent-green)] text-black">
                {fis.score} FIS&trade;
              </span>
            </div>

            <div className="space-y-2">
            {dimensionBars.map((d) => (
              <div key={d.label} className="flex items-center gap-3">
                <span className="text-[11px] text-white/70 w-20 shrink-0">{d.label}</span>
                <div className="flex-1 h-3.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${d.value}%`,
                      backgroundColor: d.value >= 70 ? "#4ADE80" : d.value >= 50 ? "#EBFF00" : "#FF4444",
                    }}
                  />
                </div>
                <span className="text-[10px] font-mono text-white/50 w-6 text-right">{d.value}</span>
              </div>
            ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
