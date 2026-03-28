"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Family } from "@/lib/database.types"
import { cities } from "@/data/cities"
import Paywall from "@/components/Paywall"

type FamilyWithCity = Family & { current_city_name?: string }

const TRAVEL_STYLES = [
  "Slow travel (months per city)",
  "Medium pace (1-3 months)",
  "Fast movers (weeks per city)",
  "Base + trips (one home base)",
  "Seasonal (summer/winter bases)",
]

const EDUCATION_APPROACHES = [
  "Homeschool", "Worldschool", "International school", "Local school (immersion)",
  "Online school", "Unschool", "Mix of approaches",
]

export default function FamiliesPage() {
  const { isPaid } = useAuth()

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-bold mb-2">Family Finder</h1>
        <p className="text-[var(--text-secondary)]">
          Find traveling families by city, kids ages, travel style, and education approach. Connect with families who move like you do.
        </p>
      </div>

      {isPaid ? <FamilyFinderContent /> : (
        <Paywall feature="Family Finder is for members" preview={<FamilyFinderPreview />}>
          <FamilyFinderContent />
        </Paywall>
      )}
    </div>
  )
}

function FamilyFinderPreview() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--surface-elevated)]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-[var(--surface-elevated)] rounded" />
            <div className="h-3 w-48 bg-[var(--surface-elevated)] rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

function FamilyFinderContent() {
  const [families, setFamilies] = useState<FamilyWithCity[]>([])
  const [loading, setLoading] = useState(true)
  const [cityFilter, setCityFilter] = useState("")
  const [travelFilter, setTravelFilter] = useState("")
  const [educationFilter, setEducationFilter] = useState("")
  const [ageMin, setAgeMin] = useState("")
  const [ageMax, setAgeMax] = useState("")

  useEffect(() => {
    supabase
      .from("families")
      .select("*")
      .eq("onboarding_complete", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setFamilies(data || [])
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    let result = [...families]
    if (cityFilter) {
      result = result.filter((f) => f.current_city === cityFilter)
    }
    if (travelFilter) {
      result = result.filter((f) => f.travel_style === travelFilter)
    }
    if (educationFilter) {
      result = result.filter((f) => f.education_approach === educationFilter)
    }
    if (ageMin || ageMax) {
      const min = ageMin ? parseInt(ageMin) : 0
      const max = ageMax ? parseInt(ageMax) : 99
      result = result.filter((f) =>
        f.kids_ages && f.kids_ages.some((age) => age >= min && age <= max)
      )
    }
    return result
  }, [families, cityFilter, travelFilter, educationFilter, ageMin, ageMax])

  const flag = (code: string) =>
    code.toUpperCase().split("").map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join("")

  if (loading) {
    return <p className="text-[var(--text-secondary)] py-10 text-center">Loading families...</p>
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <select
          value={travelFilter}
          onChange={(e) => setTravelFilter(e.target.value)}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
        >
          <option value="">All travel styles</option>
          {TRAVEL_STYLES.map((ts) => (
            <option key={ts} value={ts}>{ts}</option>
          ))}
        </select>
        <select
          value={educationFilter}
          onChange={(e) => setEducationFilter(e.target.value)}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
        >
          <option value="">All education</option>
          {EDUCATION_APPROACHES.map((ea) => (
            <option key={ea} value={ea}>{ea}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)]">Kids age:</span>
          <input
            type="number"
            placeholder="Min"
            value={ageMin}
            onChange={(e) => setAgeMin(e.target.value)}
            className="w-16 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
          />
          <span className="text-xs text-[var(--text-secondary)]">–</span>
          <input
            type="number"
            placeholder="Max"
            value={ageMax}
            onChange={(e) => setAgeMax(e.target.value)}
            className="w-16 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
          />
        </div>
      </div>

      <p className="text-xs text-[var(--text-secondary)] mb-4">{filtered.length} families</p>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center">
          <p className="text-[var(--text-secondary)]">No families match your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((fam) => (
            <div
              key={fam.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 flex items-start gap-4"
            >
              <span className="w-12 h-12 rounded-full bg-[var(--accent-green)] text-[var(--bg)] flex items-center justify-center text-sm font-bold shrink-0 font-serif">
                {fam.family_name.slice(0, 2).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">
                    {fam.country_code ? flag(fam.country_code) + " " : ""}
                    {fam.family_name}
                  </h3>
                  {fam.home_country && (
                    <span className="text-xs text-[var(--text-secondary)]">from {fam.home_country}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)] mb-2">
                  {fam.kids_ages && fam.kids_ages.length > 0 && (
                    <span>Kids: {fam.kids_ages.join(", ")}</span>
                  )}
                  {fam.travel_style && <span>{fam.travel_style}</span>}
                  {fam.education_approach && <span>{fam.education_approach}</span>}
                  {fam.parent_work_type && <span>{fam.parent_work_type}</span>}
                </div>
                {fam.bio && (
                  <p className="text-sm text-[var(--text-secondary)] italic line-clamp-2">{fam.bio}</p>
                )}
                {fam.interests && fam.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {fam.interests.slice(0, 5).map((i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-elevated)] text-[var(--text-secondary)]">
                        {i}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
