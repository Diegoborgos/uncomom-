"use client"

import { useEffect, useState } from "react"
import { City } from "@/lib/types"
import { calculateDefaultFIS, calculatePersonalFIS, getFISColor, getFISLabel } from "@/lib/fis"
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
          <span className="text-xs text-white/50 tracking-widest uppercase">FIS&trade;</span>
        </div>
      </div>

      {/* Label */}
      <span className="text-sm font-medium mt-1" style={{ color }}>{label}</span>
      <span className="text-xs text-white/50 mt-0.5">
        {isPersonal ? "Your FIS\u2122" : "Family Intelligence Score\u2122"}
      </span>
    </div>
  )
}
