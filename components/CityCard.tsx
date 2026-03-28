"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { City } from "@/lib/types"
import { countryCodeToFlag, formatEuro, getScoreColor } from "@/lib/scores"

function jitter(base: number): number {
  const delta = Math.floor(base * 0.3)
  return base + Math.floor(Math.random() * delta * 2) - delta
}

export default function CityCard({ city }: { city: City }) {
  const flag = countryCodeToFlag(city.countryCode)
  const router = useRouter()
  const [familiesNow, setFamiliesNow] = useState(city.meta.familiesNow)
  const [saved, setSaved] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    setFamiliesNow(Math.max(2, jitter(city.meta.familiesNow)))
    const bookmarks: string[] = JSON.parse(localStorage.getItem("uncomun_bookmarks") || "[]")
    setSaved(bookmarks.includes(city.slug))
  }, [city.meta.familiesNow, city.slug])

  const toggleSave = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const bookmarks: string[] = JSON.parse(localStorage.getItem("uncomun_bookmarks") || "[]")
    const next = saved ? bookmarks.filter((s) => s !== city.slug) : [...bookmarks, city.slug]
    localStorage.setItem("uncomun_bookmarks", JSON.stringify(next))
    setSaved(!saved)
  }

  // Mobile: first tap shows preview, second tap navigates
  const handleClick = useCallback((e: React.MouseEvent) => {
    // Desktop (hover handles preview) — always navigate
    if (window.matchMedia("(hover: hover)").matches) {
      router.push(`/cities/${city.slug}`)
      return
    }
    // Mobile — toggle preview on first tap, navigate on second
    if (!showPreview) {
      e.preventDefault()
      setShowPreview(true)
    } else {
      router.push(`/cities/${city.slug}`)
    }
  }, [showPreview, city.slug, router])

  // Close preview when tapping outside
  useEffect(() => {
    if (!showPreview) return
    const close = () => setShowPreview(false)
    const timer = setTimeout(() => {
      document.addEventListener("click", close, { once: true })
    }, 100)
    return () => {
      clearTimeout(timer)
      document.removeEventListener("click", close)
    }
  }, [showPreview])

  return (
    <div
      onClick={handleClick}
      className="group rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent-green)] hover:-translate-y-1 transition-all duration-200 cursor-pointer"
    >
      {/* Image with overlays */}
      <div className="relative aspect-[16/10] overflow-hidden">
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

        {/* Family Score pill — always visible */}
        <div className="absolute top-3 right-3">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-mono font-bold"
            style={{
              backgroundColor: getScoreColor(city.scores.family) + "dd",
              color: "#fff",
            }}
          >
            {city.scores.family}
          </span>
        </div>

        {/* Heart bookmark */}
        <button
          onClick={toggleSave}
          className={`absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 z-10 ${
            saved
              ? "bg-[var(--accent-warm)] text-white opacity-100"
              : "bg-black/40 text-white/70 opacity-0 group-hover:opacity-100"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
            <path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z" />
          </svg>
        </button>

        {/* City name — always visible */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-serif text-xl font-bold text-white">
            {flag} {city.name}
          </h3>
          <p className="text-sm text-white/80">{city.country}</p>
        </div>

        {/* HOVER/TAP PREVIEW OVERLAY — solid background, covers everything */}
        <div
          className={`absolute inset-0 flex flex-col justify-end p-4 transition-opacity duration-200 ${
            showPreview ? "opacity-100" : "opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
          }`}
          style={{ backgroundColor: "#132018" }}
        >
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
            <QuickStat label="Family Score" value={`${city.scores.family}`} color={getScoreColor(city.scores.family)} />
            <QuickStat label="Monthly Cost" value={formatEuro(city.cost.familyMonthly)} color="var(--accent-warm)" />
            <QuickStat label="Child Safety" value={`${city.scores.childSafety}`} color={getScoreColor(city.scores.childSafety)} />
            <QuickStat label="Internet" value={`${city.scores.internet}`} color={getScoreColor(city.scores.internet)} />
          </div>

          {/* Families + tags */}
          <p className="text-xs text-[var(--accent-warm)]">
            🏠 {familiesNow} families here now
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            {city.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                {tag}
              </span>
            ))}
          </div>

          {/* Tap hint on mobile */}
          {showPreview && (
            <p className="text-[10px] text-white/40 text-center mt-3">Tap again to view city</p>
          )}
        </div>
      </div>
    </div>
  )
}

function QuickStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-[10px] text-white/50 uppercase tracking-wider leading-none mb-0.5">{label}</p>
      <p className="text-base font-mono font-bold leading-none" style={{ color: color || "#fff" }}>{value}</p>
    </div>
  )
}
