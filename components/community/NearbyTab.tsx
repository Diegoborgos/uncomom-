"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { cities } from "@/data/cities"
import { countryCodeToFlag } from "@/lib/scores"
import FamilyCard from "./FamilyCard"

type FamilyLocation = {
  family_name: string
  country_code: string
  kids_ages: number[]
  travel_style: string
  education_approach: string
  avatar_url: string | null
  interests: string[]
  city_slug: string
  id?: string
}

export default function NearbyTab({ selectedCity }: { selectedCity: string | null }) {
  const [families, setFamilies] = useState<FamilyLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  useEffect(() => {
    supabase
      .from("trips")
      .select("city_slug, families(id, family_name, country_code, kids_ages, travel_style, education_approach, avatar_url, interests)")
      .eq("status", "here_now")
      .then(({ data }) => {
        if (data) {
          const locations = data
            .map((t) => {
              const fam = (t as unknown as { families: Omit<FamilyLocation, "city_slug"> }).families
              if (!fam) return null
              return { ...fam, city_slug: t.city_slug }
            })
            .filter(Boolean) as FamilyLocation[]
          setFamilies(locations)
        }
        setLoading(false)
      })
  }, [])

  const grouped = useMemo(() => {
    const filtered = selectedCity
      ? families.filter((f) => f.city_slug === selectedCity)
      : families

    const byCity: Record<string, FamilyLocation[]> = {}
    filtered.forEach((f) => {
      if (!byCity[f.city_slug]) byCity[f.city_slug] = []
      byCity[f.city_slug].push(f)
    })
    return Object.entries(byCity).sort((a, b) => b[1].length - a[1].length)
  }, [families, selectedCity])

  const totalCount = grouped.reduce((sum, [, fams]) => sum + fams.length, 0)

  const toggleCity = (slug: string) => {
    setCollapsed((prev) => ({ ...prev, [slug]: !prev[slug] }))
  }

  if (loading) {
    return <p className="p-4 text-sm text-[var(--text-secondary)]">Loading...</p>
  }

  const cityLabel = selectedCity
    ? cities.find((c) => c.slug === selectedCity)?.name || selectedCity
    : null

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2">
        <p className="text-xs text-[var(--text-secondary)]">
          {totalCount} {totalCount === 1 ? "family" : "families"}{" "}
          {cityLabel ? `in ${cityLabel}` : "traveling now"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {grouped.length === 0 ? (
          <p className="p-4 text-sm text-[var(--text-secondary)]">
            No families are checked in right now.
          </p>
        ) : (
          grouped.map(([slug, fams]) => {
            const city = cities.find((c) => c.slug === slug)
            const isCollapsed = collapsed[slug]
            return (
              <div key={slug} className="border-b border-[var(--border)]">
                <button
                  onClick={() => toggleCity(slug)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--surface)] transition-colors text-left"
                >
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {city ? `${countryCodeToFlag(city.countryCode)} ${city.name}` : slug}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-secondary)]">
                      {fams.length} {fams.length === 1 ? "family" : "families"}
                    </span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      className={`text-[var(--text-secondary)] transition-transform ${isCollapsed ? "" : "rotate-180"}`}
                    >
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="px-1 pb-2">
                    {fams.map((fam, i) => (
                      <FamilyCard
                        key={fam.id || `${slug}-${i}`}
                        family={{
                          id: fam.id,
                          family_name: fam.family_name,
                          country_code: fam.country_code,
                          kids_ages: fam.kids_ages,
                          travel_style: fam.travel_style,
                          education_approach: fam.education_approach,
                          avatar_url: fam.avatar_url,
                          interests: fam.interests,
                          cityName: city?.name,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
