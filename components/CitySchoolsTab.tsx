"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { countryCodeToFlag, formatEuro } from "@/lib/scores"

type SchoolRow = {
  id: string
  name: string
  school_type: string
  curriculum: string
  rating: number | null
  review_count: number
  monthly_fee: number | null
  photo_urls: string[]
  google_maps_url: string | null
  website: string | null
}

export default function CitySchoolsTab({ citySlug, cityName, countryCode }: { citySlug: string; cityName: string; countryCode: string }) {
  const [schools, setSchools] = useState<SchoolRow[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    supabase
      .from("city_schools")
      .select("id, name, school_type, curriculum, rating, review_count, monthly_fee, photo_urls, google_maps_url, website")
      .eq("city_slug", citySlug)
      .order("rating", { ascending: false, nullsFirst: false })
      .then(({ data }) => {
        setSchools(data || [])
        setLoaded(true)
      })
  }, [citySlug])

  const flag = countryCodeToFlag(countryCode)

  if (!loaded) return <p className="text-sm text-[var(--text-secondary)] py-8 text-center">Loading schools...</p>

  if (schools.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-secondary)] mb-2">No schools loaded for {cityName} yet.</p>
        <Link href="/schools" className="text-sm text-[var(--accent-green)] hover:underline">Browse all schools →</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-3 mb-6">
        {schools.map((school) => (
          <div key={school.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              {school.photo_urls?.[0] && (
                <div className="h-36 sm:h-auto sm:w-36 shrink-0 bg-[var(--surface-elevated)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={school.photo_urls[0]} alt={school.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-medium text-sm line-clamp-1">{school.name}</h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <span>{flag} {cityName}</span>
                      {school.school_type && <span>· {school.school_type}</span>}
                      {school.curriculum && school.curriculum !== school.school_type && <span>· {school.curriculum}</span>}
                    </div>
                  </div>
                  {school.rating && school.rating > 0 && (
                    <span className="text-xs font-mono text-[var(--accent-green)] shrink-0">
                      ★ {school.rating.toFixed(1)} ({school.review_count})
                    </span>
                  )}
                </div>
                {school.monthly_fee && school.monthly_fee > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-warm)]/15 text-[var(--accent-warm)]">
                    {formatEuro(school.monthly_fee)}/mo
                  </span>
                )}
                <div className="flex gap-2 mt-2">
                  {school.google_maps_url && (
                    <a href={school.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[var(--accent-green)] hover:underline">Google Maps</a>
                  )}
                  {school.website && (
                    <a href={school.website} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[var(--accent-green)] hover:underline">Website</a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Link href="/schools" className="block text-center py-3 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:border-[var(--accent-green)] hover:text-[var(--accent-green)] transition-colors">
        See all schools →
      </Link>
    </div>
  )
}
