"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { cities } from "@/data/cities"
import { countryCodeToFlag, formatEuro } from "@/lib/scores"

type SchoolRow = {
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
  google_reviews: Array<{ author: string; rating: number; text: string; time: string }> | null
}

const SCHOOL_TYPES = ["International", "British", "American", "Montessori", "Waldorf", "Bilingual", "Forest School", "Alternative", "Private"]
const CURRICULA = ["IB", "British", "American", "French", "Montessori", "Waldorf"]
const USELESS_TAGS = ["point_of_interest", "establishment", "service", "political", "premise", "locality", "sublocality", "administrative_area_level_1", "administrative_area_level_2", "country", "geocode"]

export default function SchoolsPage() {
  const [schools, setSchools] = useState<SchoolRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [cityFilter, setCityFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [curriculumFilter, setCurriculumFilter] = useState("")
  const [sort, setSort] = useState<"rating" | "fee-low" | "fee-high" | "reviews">("rating")

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
          (s.address || "").toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    if (cityFilter) result = result.filter((s) => s.city_slug === cityFilter)
    if (typeFilter) result = result.filter((s) => s.school_type === typeFilter)
    if (curriculumFilter) result = result.filter((s) => s.curriculum === curriculumFilter)

    result.sort((a, b) => {
      if (sort === "rating") return (b.rating || 0) - (a.rating || 0)
      if (sort === "fee-low") return (a.monthly_fee || 9999) - (b.monthly_fee || 9999)
      if (sort === "fee-high") return (b.monthly_fee || 0) - (a.monthly_fee || 0)
      return b.review_count - a.review_count
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
          International schools across our city directory. Fees, curricula, and reviews from traveling families.
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
            <option value="fee-low">Sort: Fee (low first)</option>
            <option value="fee-high">Sort: Fee (high first)</option>
            <option value="reviews">Sort: Most reviewed</option>
          </select>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          {loading ? "Loading..." : `${filtered.length} ${filtered.length === 1 ? "school" : "schools"}`}
        </p>
      </div>

      {/* School list */}
      {!loading && filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[var(--text-secondary)] mb-2">No schools match your filters.</p>
          <p className="text-sm text-[var(--text-secondary)]">Schools are loaded per city. Check back as we expand coverage.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((school) => {
            const cityInfo = getCityInfo(school.city_slug)
            return (
              <div
                key={school.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:border-[var(--accent-green)] transition-colors"
              >
                <div className="flex">
                  {/* Photo — left side, fixed width */}
                  <div className="w-48 shrink-0 bg-[var(--surface-elevated)]">
                    {school.photo_urls?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={school.photo_urls[0]} alt={school.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)] text-xs">No photo</div>
                    )}
                  </div>
                  {/* Content — right side */}
                  <div className="flex-1 p-5">
                {/* Header row */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-serif text-xl font-bold mb-1">{school.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
                      <Link href={`/cities/${school.city_slug}`} className="hover:text-[var(--accent-green)] transition-colors">
                        {cityInfo.flag} {cityInfo.name}
                      </Link>
                      {school.school_type && <><span>·</span><span>{school.school_type}</span></>}
                      {school.curriculum && <><span>·</span><span>{school.curriculum}</span></>}
                      {school.age_range && <><span>·</span><span>Ages {school.age_range}</span></>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-[var(--text-secondary)]">Rating</p>
                    <p className="font-mono text-[var(--accent-warm)]">
                      {school.rating && school.rating > 0 ? (
                        <>{"★".repeat(Math.round(school.rating))}{"☆".repeat(5 - Math.round(school.rating))} <span className="text-xs">({school.review_count})</span></>
                      ) : (
                        <span className="text-xs text-[var(--text-secondary)]">No reviews</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {school.description && (
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">{school.description}</p>
                )}

                {/* Cost + Tags row */}
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  {school.monthly_fee && school.monthly_fee > 0 && (
                    <span className="text-xs px-3 py-1 rounded-full bg-[var(--accent-warm)]/15 text-[var(--accent-warm)] font-medium">
                      {formatEuro(school.monthly_fee)}/mo
                    </span>
                  )}
                  {school.tags.filter((t) => !USELESS_TAGS.includes(t)).slice(0, 5).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSearch(tag.replace(/_/g, " "))}
                      className="text-xs px-2.5 py-1 rounded-full border border-[var(--accent-green)]/30 text-[var(--accent-green)] hover:bg-[var(--accent-green)]/10 transition-colors"
                    >
                      {tag.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>

                {/* CTA buttons */}
                <div className="flex gap-3 mb-4">
                  {school.google_maps_url && (
                    <a href={school.google_maps_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs px-4 py-2 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity">
                      View on Google Maps
                    </a>
                  )}
                  {school.website && (
                    <a href={school.website} target="_blank" rel="noopener noreferrer"
                      className="text-xs px-4 py-2 rounded-lg border border-[var(--accent-green)] text-[var(--accent-green)] font-medium hover:bg-[var(--accent-green)]/10 transition-colors">
                      Visit Website
                    </a>
                  )}
                </div>

                {/* Google Reviews — one positive, one negative */}
                {school.google_reviews && school.google_reviews.length > 0 && (() => {
                  const positive = school.google_reviews!.find((r) => r.rating >= 4 && r.text)
                  const negative = school.google_reviews!.find((r) => r.rating <= 3 && r.text)
                  if (!positive && !negative) return null
                  return (
                    <div className="border-t border-[var(--border)] pt-3 space-y-2">
                      {positive && (
                        <div className="flex gap-2">
                          <span className="text-[var(--accent-green)] shrink-0 text-xs mt-0.5">+</span>
                          <div>
                            <p className="text-xs text-[var(--text-secondary)] line-clamp-2">&ldquo;{positive.text}&rdquo;</p>
                            <p className="text-[10px] text-[var(--text-secondary)]/50 mt-0.5">{positive.author} · Google Maps</p>
                          </div>
                        </div>
                      )}
                      {negative && (
                        <div className="flex gap-2">
                          <span className="text-[var(--score-low)] shrink-0 text-xs mt-0.5">−</span>
                          <div>
                            <p className="text-xs text-[var(--text-secondary)] line-clamp-2">&ldquo;{negative.text}&rdquo;</p>
                            <p className="text-[10px] text-[var(--text-secondary)]/50 mt-0.5">{negative.author} · Google Maps</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
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
