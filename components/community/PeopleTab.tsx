"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Family } from "@/lib/database.types"
import { cities } from "@/data/cities"
import { PaywallGate } from "@/components/Paywall"
import FamilyCard from "./FamilyCard"

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

const selectClass = "w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"

export default function PeopleTab({
  selectedCity,
  onCitySelect,
}: {
  selectedCity: string | null
  onCitySelect: (slug: string | null) => void
}) {
  const { isPaid, loading: authLoading } = useAuth()
  const [families, setFamilies] = useState<Family[]>([])
  const [loading, setLoading] = useState(true)
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
    if (selectedCity) {
      result = result.filter((f) => f.current_city === selectedCity)
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
  }, [families, selectedCity, travelFilter, educationFilter, ageMin, ageMax])

  if (loading || authLoading) {
    return <p className="p-4 text-sm text-[var(--text-secondary)]">Loading families...</p>
  }

  if (!isPaid) {
    return (
      <div className="p-4 space-y-3">
        <p className="text-xs text-[var(--text-secondary)]">{filtered.length} families</p>
        {filtered.slice(0, 3).map((fam) => (
          <FamilyCard
            key={fam.id}
            family={{
              family_name: fam.family_name,
              country_code: fam.country_code,
              kids_ages: fam.kids_ages,
            }}
          />
        ))}
        <PaywallGate feature="See all families and connect" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="p-4 space-y-2 border-b border-[var(--border)]">
        <select
          value={selectedCity || ""}
          onChange={(e) => onCitySelect(e.target.value || null)}
          className={selectClass}
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <select value={travelFilter} onChange={(e) => setTravelFilter(e.target.value)} className={selectClass}>
          <option value="">All travel styles</option>
          {TRAVEL_STYLES.map((ts) => (
            <option key={ts} value={ts}>{ts}</option>
          ))}
        </select>
        <select value={educationFilter} onChange={(e) => setEducationFilter(e.target.value)} className={selectClass}>
          <option value="">All education</option>
          {EDUCATION_APPROACHES.map((ea) => (
            <option key={ea} value={ea}>{ea}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)] shrink-0">Kids age:</span>
          <input
            type="number"
            placeholder="Min"
            value={ageMin}
            onChange={(e) => setAgeMin(e.target.value)}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
          />
          <span className="text-xs text-[var(--text-secondary)]">&ndash;</span>
          <input
            type="number"
            placeholder="Max"
            value={ageMax}
            onChange={(e) => setAgeMax(e.target.value)}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
          />
        </div>
      </div>

      {/* Count + list */}
      <div className="flex-1 overflow-y-auto">
        <p className="px-4 pt-3 pb-1 text-xs text-[var(--text-secondary)]">{filtered.length} families</p>
        {filtered.length === 0 ? (
          <p className="p-4 text-sm text-[var(--text-secondary)]">No families match your filters.</p>
        ) : (
          <div className="px-1">
            {filtered.map((fam) => (
              <FamilyCard
                key={fam.id}
                family={{
                  id: fam.id,
                  family_name: fam.family_name,
                  country_code: fam.country_code,
                  kids_ages: fam.kids_ages,
                  travel_style: fam.travel_style,
                  education_approach: fam.education_approach,
                  bio: fam.bio,
                  interests: fam.interests,
                  avatar_url: fam.avatar_url,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
