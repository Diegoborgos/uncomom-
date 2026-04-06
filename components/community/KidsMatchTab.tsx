"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { cities } from "@/data/cities"
import { countryCodeToFlag } from "@/lib/scores"
import { PaywallGate } from "@/components/Paywall"
import FamilyCard from "./FamilyCard"

type FamilyWithTrip = {
  id?: string
  family_name: string
  country_code: string
  kids_ages: number[]
  education_approach: string
  interests: string[]
  avatar_url: string | null
  city_slug: string
}

const selectClass = "w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"

export default function KidsMatchTab({ selectedCity }: { selectedCity: string | null }) {
  const { isPaid, family: myFamily, loading: authLoading } = useAuth()
  const [families, setFamilies] = useState<FamilyWithTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [cityFilter, setCityFilter] = useState(selectedCity || "")
  const [ageTarget, setAgeTarget] = useState("")
  const [ageRange, setAgeRange] = useState(2)

  // Sync selectedCity prop
  useEffect(() => {
    if (selectedCity) setCityFilter(selectedCity)
  }, [selectedCity])

  // Auto-fill age from user&apos;s first kid
  useEffect(() => {
    if (myFamily?.kids_ages?.length && !ageTarget) {
      setAgeTarget(String(myFamily.kids_ages[0]))
    }
  }, [myFamily, ageTarget])

  useEffect(() => {
    supabase
      .from("trips")
      .select("city_slug, families(id, family_name, country_code, kids_ages, education_approach, interests, avatar_url)")
      .eq("status", "here_now")
      .then(({ data }) => {
        if (data) {
          const fams = data
            .map((t) => {
              const f = (t as unknown as { families: Omit<FamilyWithTrip, "city_slug"> }).families
              if (!f || !f.kids_ages?.length) return null
              return { ...f, city_slug: t.city_slug }
            })
            .filter(Boolean) as FamilyWithTrip[]
          setFamilies(fams)
        }
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    let result = [...families]
    if (cityFilter) result = result.filter((f) => f.city_slug === cityFilter)
    if (ageTarget) {
      const target = parseInt(ageTarget)
      if (!isNaN(target)) {
        result = result.filter((f) =>
          f.kids_ages.some((age) => Math.abs(age - target) <= ageRange)
        )
      }
    }
    return result
  }, [families, cityFilter, ageTarget, ageRange])

  if (loading || authLoading) {
    return <p className="p-4 text-sm text-[var(--text-secondary)]">Loading...</p>
  }

  if (!isPaid) {
    return (
      <div className="p-4 space-y-3">
        <p className="text-xs text-[var(--text-secondary)]">
          {filtered.length} {filtered.length === 1 ? "family" : "families"} with kids
        </p>
        {filtered.slice(0, 3).map((fam, i) => {
          const city = cities.find((c) => c.slug === fam.city_slug)
          return (
            <FamilyCard
              key={fam.id || i}
              family={{
                family_name: fam.family_name,
                country_code: fam.country_code,
                kids_ages: fam.kids_ages,
                cityName: city?.name,
              }}
            />
          )
        })}
        <PaywallGate feature="See all kids matches and connect" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="p-4 space-y-2 border-b border-[var(--border)]">
        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1">City</label>
          <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className={selectClass}>
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>{countryCodeToFlag(c.countryCode)} {c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Child&apos;s age</label>
            <input
              type="number"
              min={0}
              max={18}
              value={ageTarget}
              onChange={(e) => setAgeTarget(e.target.value)}
              placeholder="e.g. 7"
              className={selectClass}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Range &plusmn;</label>
            <select value={ageRange} onChange={(e) => setAgeRange(parseInt(e.target.value))} className={selectClass}>
              <option value={1}>&plusmn;1 year</option>
              <option value={2}>&plusmn;2 years</option>
              <option value={3}>&plusmn;3 years</option>
              <option value={5}>&plusmn;5 years</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        <p className="px-4 pt-3 pb-1 text-xs text-[var(--text-secondary)]">
          {filtered.length} {filtered.length === 1 ? "family" : "families"} with kids
          {ageTarget ? ` aged ${Math.max(0, parseInt(ageTarget) - ageRange)}\u2013${parseInt(ageTarget) + ageRange}` : ""}
          {cityFilter ? ` in ${cities.find((c) => c.slug === cityFilter)?.name || cityFilter}` : ""}
        </p>
        {filtered.length === 0 ? (
          <p className="p-4 text-sm text-[var(--text-secondary)]">
            {families.length === 0
              ? "No families with kids are currently checked in."
              : "No matches. Try widening the age range or choosing a different city."}
          </p>
        ) : (
          <div className="px-1">
            {filtered.map((fam, i) => {
              const city = cities.find((c) => c.slug === fam.city_slug)
              return (
                <FamilyCard
                  key={fam.id || i}
                  family={{
                    id: fam.id,
                    family_name: fam.family_name,
                    country_code: fam.country_code,
                    kids_ages: fam.kids_ages,
                    education_approach: fam.education_approach,
                    interests: fam.interests,
                    avatar_url: fam.avatar_url,
                    cityName: city?.name,
                  }}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
