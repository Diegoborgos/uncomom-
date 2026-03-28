"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { cities } from "@/data/cities"
import { countryCodeToFlag } from "@/lib/scores"
import Paywall from "@/components/Paywall"

type FamilyWithTrip = {
  family_name: string
  country_code: string
  kids_ages: number[]
  education_approach: string
  interests: string[]
  city_slug: string
}

export default function KidsFinderPage() {
  const { isPaid } = useAuth()

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-bold mb-2">Kids Peer Finder</h1>
        <p className="text-[var(--text-secondary)]">
          Find families with kids your children&apos;s age in a specific city.
          The fastest way to make friends on the road.
        </p>
      </div>

      {isPaid ? <KidsFinderContent /> : (
        <Paywall feature="Kids Peer Finder is for members" preview={<KidsFinderPreview />}>
          <KidsFinderContent />
        </Paywall>
      )}
    </div>
  )
}

function KidsFinderPreview() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--surface-elevated)]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-36 bg-[var(--surface-elevated)] rounded" />
            <div className="h-3 w-56 bg-[var(--surface-elevated)] rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

function KidsFinderContent() {
  const [families, setFamilies] = useState<FamilyWithTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [cityFilter, setCityFilter] = useState("")
  const [ageTarget, setAgeTarget] = useState("")
  const [ageRange, setAgeRange] = useState(2)

  useEffect(() => {
    supabase
      .from("trips")
      .select("city_slug, families(family_name, country_code, kids_ages, education_approach, interests)")
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

  if (loading) {
    return <p className="text-[var(--text-secondary)] py-10 text-center">Loading...</p>
  }

  return (
    <>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 mb-6">
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Find kids near your child&apos;s age currently in a city:
        </p>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">City</label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
            >
              <option value="">All cities</option>
              {cities.map((c) => (
                <option key={c.slug} value={c.slug}>{countryCodeToFlag(c.countryCode)} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">My child&apos;s age</label>
            <input
              type="number"
              min={0}
              max={18}
              value={ageTarget}
              onChange={(e) => setAgeTarget(e.target.value)}
              placeholder="e.g. 7"
              className="w-20 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Age range ±</label>
            <select
              value={ageRange}
              onChange={(e) => setAgeRange(parseInt(e.target.value))}
              className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
            >
              <option value={1}>±1 year</option>
              <option value={2}>±2 years</option>
              <option value={3}>±3 years</option>
              <option value={5}>±5 years</option>
            </select>
          </div>
        </div>
      </div>

      <p className="text-xs text-[var(--text-secondary)] mb-4">
        {filtered.length} {filtered.length === 1 ? "family" : "families"} with kids
        {ageTarget ? ` aged ${Math.max(0, parseInt(ageTarget) - ageRange)}–${parseInt(ageTarget) + ageRange}` : ""}
        {cityFilter ? ` in ${cities.find((c) => c.slug === cityFilter)?.name || cityFilter}` : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center">
          <p className="text-[var(--text-secondary)]">
            {families.length === 0
              ? "No families with kids are currently checked in to any city."
              : "No matches for your search. Try widening the age range or choosing a different city."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((fam, i) => {
            const city = cities.find((c) => c.slug === fam.city_slug)
            const flag = fam.country_code
              ? fam.country_code.toUpperCase().split("").map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join("")
              : ""
            return (
              <div
                key={i}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 flex items-start gap-4"
              >
                <span className="w-12 h-12 rounded-full bg-[var(--accent-green)] text-[var(--bg)] flex items-center justify-center text-sm font-bold shrink-0">
                  {fam.family_name.slice(0, 2).toUpperCase()}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{flag} {fam.family_name}</h3>
                    {city && (
                      <span className="text-xs text-[var(--accent-green)]">
                        in {city.name}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
                    <span className="font-medium text-[var(--text-primary)]">
                      Kids: {fam.kids_ages.join(", ")}
                    </span>
                    {fam.education_approach && <span>{fam.education_approach}</span>}
                  </div>
                  {fam.interests && fam.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {fam.interests.slice(0, 4).map((int) => (
                        <span key={int} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-elevated)] text-[var(--text-secondary)]">
                          {int}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
