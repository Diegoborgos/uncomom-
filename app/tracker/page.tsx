"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Trip } from "@/lib/database.types"
import { cities } from "@/data/cities"
import { countryCodeToFlag } from "@/lib/scores"
import Link from "next/link"

type CountryDays = {
  country: string
  countryCode: string
  days: number
  trips: { citySlug: string; arrived: string; left: string | null; days: number }[]
}

function daysBetween(a: string, b: string | null): number {
  const start = new Date(a)
  const end = b ? new Date(b) : new Date()
  return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
}

export default function TrackerPage() {
  const { user, family, loading } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    if (family) {
      supabase
        .from("trips")
        .select("*")
        .eq("family_id", family.id)
        .order("arrived_at", { ascending: false })
        .then(({ data }) => setTrips(data || []))
    }
  }, [family])

  const countryData = useMemo(() => {
    const yearStart = `${year}-01-01`
    const yearEnd = `${year}-12-31`

    const relevantTrips = trips.filter((t) => {
      if (!t.arrived_at) return false
      const arrived = t.arrived_at.slice(0, 10)
      const left = t.left_at?.slice(0, 10) || new Date().toISOString().slice(0, 10)
      return arrived <= yearEnd && left >= yearStart
    })

    const byCountry: Record<string, CountryDays> = {}

    relevantTrips.forEach((trip) => {
      const city = cities.find((c) => c.slug === trip.city_slug)
      if (!city || !trip.arrived_at) return

      const clampedStart = trip.arrived_at.slice(0, 10) < yearStart ? yearStart : trip.arrived_at.slice(0, 10)
      const clampedEnd = (trip.left_at?.slice(0, 10) || new Date().toISOString().slice(0, 10))
      const end = clampedEnd > yearEnd ? yearEnd : clampedEnd
      const days = daysBetween(clampedStart, end)

      if (!byCountry[city.country]) {
        byCountry[city.country] = {
          country: city.country,
          countryCode: city.countryCode,
          days: 0,
          trips: [],
        }
      }
      byCountry[city.country].days += days
      byCountry[city.country].trips.push({
        citySlug: trip.city_slug,
        arrived: clampedStart,
        left: trip.left_at ? end : null,
        days,
      })
    })

    return Object.values(byCountry).sort((a, b) => b.days - a.days)
  }, [trips, year])

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-[var(--text-secondary)]">Loading...</div>
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="font-serif text-3xl font-bold mb-4">Residence Tracker</h1>
        <p className="text-[var(--text-secondary)] mb-6">
          Track how many days your family spends in each country. Know your 183-day tax residency threshold before it surprises you.
        </p>
        <Link href="/login" className="inline-block px-6 py-3 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity">
          Sign in to track
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-serif text-3xl font-bold">Residence Tracker</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setYear(year - 1)}
            className="w-8 h-8 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)] transition-colors text-sm"
          >
            ←
          </button>
          <span className="font-mono text-sm w-12 text-center">{year}</span>
          <button
            onClick={() => setYear(year + 1)}
            disabled={year >= new Date().getFullYear()}
            className="w-8 h-8 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)] transition-colors text-sm disabled:opacity-30"
          >
            →
          </button>
        </div>
      </div>
      <p className="text-sm text-[var(--text-secondary)] mb-8">
        Days per country in {year}. The 183-day rule determines tax residency in most countries.
      </p>

      {trips.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center">
          <p className="text-[var(--text-secondary)] mb-2">No trips logged yet.</p>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Log trips on city pages with arrival and departure dates to see your residence breakdown.
          </p>
          <Link href="/" className="text-sm text-[var(--accent-green)] hover:underline">
            Browse cities →
          </Link>
        </div>
      ) : countryData.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center">
          <p className="text-[var(--text-secondary)]">No trips with dates in {year}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {countryData.map((cd) => {
            const pct = Math.min(100, (cd.days / 183) * 100)
            const isOver = cd.days >= 183
            const isWarning = cd.days >= 150 && cd.days < 183
            const barColor = isOver
              ? "var(--score-low)"
              : isWarning
                ? "var(--score-mid)"
                : "var(--accent-green)"

            return (
              <div
                key={cd.country}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{countryCodeToFlag(cd.countryCode)}</span>
                    <span className="font-medium">{cd.country}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-lg font-bold" style={{ color: barColor }}>
                      {cd.days}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]"> / 183 days</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 rounded-full bg-[var(--surface-elevated)] mb-3">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: barColor }}
                  />
                </div>

                {isOver && (
                  <p className="text-xs text-[var(--score-low)] mb-3">
                    ⚠ You may be considered a tax resident of {cd.country} in {year}.
                  </p>
                )}
                {isWarning && (
                  <p className="text-xs text-[var(--score-mid)] mb-3">
                    ⚠ Approaching 183-day threshold. {183 - cd.days} days remaining.
                  </p>
                )}

                {/* Trip breakdown */}
                <div className="space-y-1">
                  {cd.trips.map((trip, i) => {
                    const city = cities.find((c) => c.slug === trip.citySlug)
                    return (
                      <div key={i} className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                        <Link href={`/cities/${trip.citySlug}`} className="hover:text-[var(--accent-green)] transition-colors">
                          {city?.name || trip.citySlug}
                        </Link>
                        <span className="font-mono">
                          {new Date(trip.arrived).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          {" → "}
                          {trip.left
                            ? new Date(trip.left).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                            : "now"}
                          {" · "}{trip.days}d
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Total */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 flex items-center justify-between">
            <span className="text-sm text-[var(--text-secondary)]">Total days tracked in {year}</span>
            <span className="font-mono text-lg font-bold">
              {countryData.reduce((sum, cd) => sum + cd.days, 0)}
            </span>
          </div>
        </div>
      )}

      <p className="text-xs text-[var(--text-secondary)] mt-8 leading-relaxed">
        This tracker counts calendar days based on your logged trips. It is not legal or tax advice.
        Tax residency rules vary by country and may consider factors beyond physical presence.
        Consult a tax professional for your specific situation.
      </p>
    </div>
  )
}
