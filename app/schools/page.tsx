"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { cities } from "@/data/cities"
import { countryCodeToFlag, formatEuro } from "@/lib/scores"

type CitySchool = {
  id: string
  city_slug: string
  name: string
  school_type: string
  curriculum: string
  age_range: string
  monthly_fee: number | null
  rating: number | null
  review_count: number
  address: string | null
  phone: string | null
  website: string | null
  google_maps_url: string | null
  photo_urls: string[]
  description: string | null
  languages: string[]
  tags: string[]
}

const SCHOOL_TYPES = ["International", "British", "American", "Montessori", "Waldorf", "Bilingual", "Forest School", "Alternative", "Private"]
const CURRICULA = ["IB", "British", "American", "French", "Montessori", "Waldorf"]

export default function SchoolsPage() {
  const [schools, setSchools] = useState<CitySchool[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [cityFilter, setCityFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [curriculumFilter, setCurriculumFilter] = useState("")
  const [sort, setSort] = useState<"rating" | "name" | "reviews">("rating")

  useEffect(() => {
    supabase
      .from("city_schools")
      .select("*")
      .order("rating", { ascending: false, nullsFirst: false })
      .then(({ data }) => {
        setSchools(data || [])
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    let result = [...schools]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description || "").toLowerCase().includes(q) ||
          (s.address || "").toLowerCase().includes(q)
      )
    }
    if (cityFilter) result = result.filter((s) => s.city_slug === cityFilter)
    if (typeFilter) result = result.filter((s) => s.school_type === typeFilter)
    if (curriculumFilter) result = result.filter((s) => s.curriculum === curriculumFilter)

    result.sort((a, b) => {
      if (sort === "rating") return (b.rating || 0) - (a.rating || 0)
      if (sort === "reviews") return b.review_count - a.review_count
      return a.name.localeCompare(b.name)
    })

    return result
  }, [schools, search, cityFilter, typeFilter, curriculumFilter, sort])

  const getCityInfo = (slug: string) => {
    const city = cities.find((c) => c.slug === slug)
    if (!city) return { name: slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" "), flag: "" }
    return { name: city.name, flag: countryCodeToFlag(city.countryCode) }
  }

  const cityOptions = useMemo(() =>
    Array.from(new Set(schools.map((s) => s.city_slug))).sort()
  , [schools])

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-bold mb-2">School Finder</h1>
        <p className="text-[var(--text-secondary)]">
          International and alternative schools across our city directory. Real Google ratings and reviews.
        </p>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-20 bg-[var(--bg)] py-4 mb-6 border-b border-[var(--border)] space-y-3">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search schools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-green)] w-full sm:w-64"
          />
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
          >
            <option value="">All cities</option>
            {cityOptions.map((slug) => {
              const info = getCityInfo(slug)
              return <option key={slug} value={slug}>{info.flag} {info.name}</option>
            })}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
          >
            <option value="">All types</option>
            {SCHOOL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={curriculumFilter}
            onChange={(e) => setCurriculumFilter(e.target.value)}
            className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
          >
            <option value="">All curricula</option>
            {CURRICULA.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
          >
            <option value="rating">Sort: Rating</option>
            <option value="reviews">Sort: Most reviewed</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          {loading ? "Loading..." : `${filtered.length} ${filtered.length === 1 ? "school" : "schools"}`}
        </p>
      </div>

      {/* School list */}
      {!loading && filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[var(--text-secondary)] mb-2">No schools found.</p>
          <p className="text-sm text-[var(--text-secondary)]">Schools are loaded per city. Check back as we expand coverage.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((school) => {
            const cityInfo = getCityInfo(school.city_slug)
            const photoUrl = school.photo_urls?.[0]

            return (
              <div
                key={school.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:border-[var(--accent-green)] transition-colors"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Photo */}
                  {photoUrl && (
                    <div className="sm:w-48 h-36 sm:h-auto shrink-0 bg-[var(--surface-elevated)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photoUrl} alt={school.name} className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-serif text-lg font-bold mb-1">{school.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)] mb-2">
                          <Link href={`/cities/${school.city_slug}`} className="hover:text-[var(--accent-green)] transition-colors">
                            {cityInfo.flag} {cityInfo.name}
                          </Link>
                          {school.school_type && <><span>·</span><span>{school.school_type}</span></>}
                          {school.curriculum && <><span>·</span><span>{school.curriculum}</span></>}
                          {school.age_range && <><span>·</span><span>Ages {school.age_range}</span></>}
                        </div>
                        {school.description && (
                          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-2 line-clamp-2">
                            {school.description}
                          </p>
                        )}
                        {school.address && (
                          <p className="text-xs text-[var(--text-secondary)] mb-2">{school.address}</p>
                        )}
                        <div className="flex gap-2">
                          {school.google_maps_url && (
                            <a href={school.google_maps_url} target="_blank" rel="noopener noreferrer"
                              className="text-[10px] px-2 py-1 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)] hover:text-[var(--accent-green)] transition-colors">
                              Google Maps
                            </a>
                          )}
                          {school.website && (
                            <a href={school.website} target="_blank" rel="noopener noreferrer"
                              className="text-[10px] px-2 py-1 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)] hover:text-[var(--accent-green)] transition-colors">
                              Website
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
                        {school.rating && school.rating > 0 && (
                          <div className="text-right">
                            <p className="font-mono text-lg font-bold text-[var(--accent-warm)]">
                              {"★"} {school.rating.toFixed(1)}
                            </p>
                            <p className="text-[10px] text-[var(--text-secondary)]">
                              {school.review_count} Google reviews
                            </p>
                          </div>
                        )}
                        {school.monthly_fee && school.monthly_fee > 0 && (
                          <div className="text-right">
                            <p className="text-xs text-[var(--text-secondary)]">Monthly fee</p>
                            <p className="font-mono font-bold text-[var(--accent-warm)]">
                              {formatEuro(school.monthly_fee)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
