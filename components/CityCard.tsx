"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { City } from "@/lib/types"
import { countryCodeToFlag, formatEuro, getScoreColor } from "@/lib/scores"
import ScorePill from "./ScorePill"

function jitter(base: number): number {
  const delta = Math.floor(base * 0.3)
  return base + Math.floor(Math.random() * delta * 2) - delta
}

export default function CityCard({ city }: { city: City }) {
  const flag = countryCodeToFlag(city.countryCode)
  const [familiesNow, setFamiliesNow] = useState(city.meta.familiesNow)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setFamiliesNow(Math.max(2, jitter(city.meta.familiesNow)))
    const bookmarks: string[] = JSON.parse(localStorage.getItem("uncomun_bookmarks") || "[]")
    setSaved(bookmarks.includes(city.slug))
  }, [city.meta.familiesNow, city.slug])

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const bookmarks: string[] = JSON.parse(localStorage.getItem("uncomun_bookmarks") || "[]")
    const next = saved ? bookmarks.filter((s) => s !== city.slug) : [...bookmarks, city.slug]
    localStorage.setItem("uncomun_bookmarks", JSON.stringify(next))
    setSaved(!saved)
  }

  return (
    <Link href={`/cities/${city.slug}`}>
      <div className="group rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent-green)] hover:-translate-y-1 transition-all duration-200 cursor-pointer">
        {/* Image */}
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

          {/* Hover overlay — quick stats preview */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
            <div className="grid grid-cols-2 gap-3 text-center px-6">
              <QuickStat label="Family Score" value={`${city.scores.family}`} color={getScoreColor(city.scores.family)} />
              <QuickStat label="Monthly Cost" value={formatEuro(city.cost.familyMonthly)} />
              <QuickStat label="Safety" value={`${city.scores.childSafety}`} color={getScoreColor(city.scores.childSafety)} />
              <QuickStat label="Internet" value={`${city.scores.internet}`} color={getScoreColor(city.scores.internet)} />
            </div>
          </div>

          {/* Heart bookmark — always visible on hover */}
          <button
            onClick={toggleSave}
            className={`absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
              saved
                ? "bg-[var(--accent-warm)] text-white opacity-100"
                : "bg-black/40 text-white/70 opacity-0 group-hover:opacity-100 hover:bg-black/60 hover:text-white"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
              <path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z" />
            </svg>
          </button>

          {/* Family Score pill */}
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

          {/* City name overlay */}
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-serif text-xl font-bold text-white">
              {flag} {city.name}
            </h3>
            <p className="text-sm text-white/80">{city.country}</p>
          </div>
        </div>

        {/* Card body */}
        <div className="p-4 space-y-3">
          {/* Mini score pills */}
          <div className="flex flex-wrap gap-1.5">
            <ScorePill label="Safety" score={city.scores.childSafety} />
            <ScorePill label="Schools" score={city.scores.schoolAccess} />
            <ScorePill label="Nature" score={city.scores.nature} />
            <ScorePill label="Internet" score={city.scores.internet} />
          </div>

          {/* Cost */}
          <p className="text-sm text-[var(--text-secondary)]">
            ~{formatEuro(city.cost.familyMonthly)}/mo · family of 4
          </p>

          {/* Families now */}
          <p className="text-sm text-[var(--accent-warm)] pulse-live">
            🏠 {familiesNow} families here now
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {city.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-elevated)] text-[var(--text-secondary)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}

function QuickStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-[10px] text-white/60 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-mono font-bold" style={{ color: color || "#fff" }}>{value}</p>
    </div>
  )
}
