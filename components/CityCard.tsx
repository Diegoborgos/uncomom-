"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { City } from "@/lib/types"
import { countryCodeToFlag, formatEuro } from "@/lib/scores"
import { track } from "@/lib/tracking"
import { calculateDefaultFIS, getFISColor, DIMENSION_LABELS } from "@/lib/fis"

export default function CityCard({ city }: { city: City }) {
  const flag = countryCodeToFlag(city.countryCode)
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const fis = useMemo(() => calculateDefaultFIS(city), [city])

  useEffect(() => {
    const bookmarks: string[] = JSON.parse(localStorage.getItem("uncomun_bookmarks") || "[]")
    setSaved(bookmarks.includes(city.slug))
  }, [city.slug])

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const bookmarks: string[] = JSON.parse(localStorage.getItem("uncomun_bookmarks") || "[]")
    const next = saved ? bookmarks.filter((s) => s !== city.slug) : [...bookmarks, city.slug]
    localStorage.setItem("uncomun_bookmarks", JSON.stringify(next))
    setSaved(!saved)
  }

  const dismissPreview = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowPreview(false)
  }

  const handleClick = useCallback((e: React.MouseEvent) => {
    track("city_card_clicked", { citySlug: city.slug, cityName: city.name })
    if (window.matchMedia("(hover: hover)").matches) {
      router.push(`/cities/${city.slug}`)
      return
    }
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
      className="group rounded-3xl overflow-hidden bg-[var(--surface)] hover:-translate-y-1 transition-all duration-200 cursor-pointer"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        {/* City photo */}
        <img
          src={city.photo || ""}
          alt={`${city.name}, ${city.country}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = "none"
            target.parentElement!.style.background = "linear-gradient(135deg, var(--surface-elevated), var(--surface))"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Heart button — top right */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={toggleSave}
            className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill={saved ? "white" : "none"} stroke="white" strokeWidth="1.5">
              <path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z" />
            </svg>
          </button>
        </div>

        {/* FIS badge — top left, yellow pill */}
        <div className="absolute top-4 left-4 flex items-center gap-1.5">
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-sm font-mono font-bold bg-[var(--accent-green)] text-black">
            ★ {fis.score}
          </span>
        </div>

        {/* City name + country — bottom */}
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-xs text-white/70 mb-1">{flag} {city.country}</p>
          <h3 className="text-2xl font-bold text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
            {city.name}
          </h3>
          <p className="text-xs font-mono text-white/50 mt-0.5">{formatEuro(city.cost.familyMonthly)}/mo</p>
        </div>

        {/* HOVER/TAP OVERLAY — FIS dimension bars */}
        <div className={`absolute inset-0 transition-opacity duration-200 ${
          showPreview ? "opacity-100" : "opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
        }`} style={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>

          {showPreview && (
            <div className="absolute top-4 right-4">
              <button
                onClick={dismissPreview}
                className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>
          )}

          {/* FIS dimension score bars */}
          <div className="absolute bottom-4 left-4 right-4 space-y-2">
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
              <p className="text-[10px] text-white/30 text-center pt-1">Tap again to view city</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
