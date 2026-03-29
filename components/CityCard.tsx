"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { City } from "@/lib/types"
import { countryCodeToFlag, formatEuro } from "@/lib/scores"
import { track } from "@/lib/tracking"
import { calculateDefaultFIS, getFISColor, DIMENSION_LABELS } from "@/lib/fis"

export default function CityCard({ city, rank }: { city: City; rank?: number }) {
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
      className="group rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent-green)] hover:-translate-y-1 transition-all duration-200 cursor-pointer"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {/* City photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={city.photo}
          alt={city.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = "none"
            target.parentElement!.style.background = "linear-gradient(135deg, var(--surface-elevated), var(--surface))"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Ranking number — top left, prominent */}
        {rank != null && (
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-black/50 text-white font-mono text-xs font-bold">
              {rank}
            </span>
          </div>
        )}

        {/* FIS badge — top right */}
        <div className="absolute top-3 right-3 flex flex-col items-center">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-sm font-mono font-bold"
            style={{ backgroundColor: getFISColor(fis.score) + "dd", color: "#fff" }}
          >
            {fis.score}
          </span>
          <span className="text-[7px] text-white/50 mt-0.5 tracking-widest">FIS&trade;</span>
        </div>

        {/* City name + country + cost — bottom */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-serif text-xl font-bold text-white">
            {flag} {city.name}
          </h3>
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/80">{city.country}</p>
            <p className="text-xs font-mono text-white/60">{formatEuro(city.cost.familyMonthly)}/mo</p>
          </div>
        </div>

        {/* HOVER/TAP OVERLAY — FIS dimension bars */}
        <div className={`absolute inset-0 transition-opacity duration-200 ${
          showPreview ? "opacity-100" : "opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
        }`} style={{ backgroundColor: "rgba(6,61,48,0.92)" }}>

          {/* Heart button — top left, offset if rank exists */}
          <div className={`absolute top-3 ${rank != null ? "left-12" : "left-3"}`}>
            <button
              onClick={toggleSave}
              className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill={saved ? "white" : "none"} stroke="white" strokeWidth="1.5">
                <path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z" />
              </svg>
            </button>
          </div>
          {showPreview && (
            <div className="absolute top-3 right-3">
              <button
                onClick={dismissPreview}
                className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition-colors"
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
