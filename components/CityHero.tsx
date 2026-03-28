"use client"

import { useEffect, useState } from "react"
import { City } from "@/lib/types"
import { countryCodeToFlag, getScoreColor } from "@/lib/scores"

function ScoreGauge({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0)
  const color = getScoreColor(score)
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (animated / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 100)
    return () => clearTimeout(timer)
  }, [score])

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {/* Background circle */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="6"
          />
          {/* Score arc */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-2xl font-bold" style={{ color }}>
            {score}
          </span>
        </div>
      </div>
      <span className="text-xs text-white/70 mt-1">Family Score</span>
    </div>
  )
}

export default function CityHero({ city }: { city: City }) {
  const flag = countryCodeToFlag(city.countryCode)

  return (
    <div className="relative w-full h-[50vh] min-h-[400px] overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={city.photo}
        alt={city.name}
        className="w-full h-full object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.style.display = "none"
          target.parentElement!.style.background = "linear-gradient(135deg, var(--surface-elevated), var(--surface))"
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-black/40 to-transparent" />
      <div className="absolute bottom-8 left-0 right-0 max-w-5xl mx-auto px-4 flex items-end justify-between">
        <div>
          <p className="text-sm text-white/70 mb-1">
            {city.continent} &rsaquo; {city.country}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white">
            {flag} {city.name}
          </h1>
        </div>
        <ScoreGauge score={city.scores.family} />
      </div>
    </div>
  )
}
