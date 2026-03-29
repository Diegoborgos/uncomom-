"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { schools as staticSchools } from "@/data/schools"
import { cities } from "@/data/cities"
import { countryCodeToFlag, formatEuro } from "@/lib/scores"
import { School, SchoolType, SchoolCurriculum } from "@/lib/school-types"

const SCHOOL_TYPES: SchoolType[] = ["International", "Bilingual", "Montessori", "Waldorf", "Online/Hybrid"]
const CURRICULA: SchoolCurriculum[] = ["IB", "British", "American", "French", "Montessori", "Waldorf"]

function rowToSchool(row: Record<string, unknown>): School {
  return {
    id: row.id as string, name: row.name as string, citySlug: row.city_slug as string,
    type: row.type as SchoolType, curriculum: row.curriculum as SchoolCurriculum, ageRange: row.age_range as string,
    monthlyFee: row.monthly_fee as number, language: (row.languages as string[]) || [],
    rating: row.rating as number, familyReviews: row.family_reviews as number,
    website: row.website as string, description: (row.description as string) || "", tags: (row.tags as string[]) || [],
  }
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>(staticSchools)
  const [search, setSearch] = useState("")
  const [cityFilter, setCityFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [curriculumFilter, setCurriculumFilter] = useState("")
  const [sort, setSort] = useState<"rating" | "fee-low" | "fee-high">("rating")

  useEffect(() => {
    supabase.from("schools").select("*").order("name").then(({ data }) => {
      if (data && data.length > 0) setSchools(data.map(rowToSchool))
    })
  }, [])

  const filtered = useMemo(() => {
    let result = [...schools]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    if (cityFilter) result = result.filter((s) => s.citySlug === cityFilter)
    if (typeFilter) result = result.filter((s) => s.type === typeFilter)
    if (curriculumFilter) result = result.filter((s) => s.curriculum === curriculumFilter)

    result.sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating
      if (sort === "fee-low") return a.monthlyFee - b.monthlyFee
      return b.monthlyFee - a.monthlyFee
    })

    return result
  }, [schools, search, cityFilter, typeFilter, curriculumFilter, sort])

  const getCityInfo = (slug: string) => {
    const city = cities.find((c) => c.slug === slug)
    if (!city) return { name: slug, flag: "" }
    return { name: city.name, flag: countryCodeToFlag(city.countryCode) }
  }

  const cityOptions = Array.from(new Set(schools.map((s) => s.citySlug))).sort()

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
          </select>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          {filtered.length} {filtered.length === 1 ? "school" : "schools"}
        </p>
      </div>

      {/* School list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[var(--text-secondary)]">No schools match your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((school) => {
            const cityInfo = getCityInfo(school.citySlug)
            return (
              <div
                key={school.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 hover:border-[var(--accent-green)] transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-serif text-xl font-bold mb-1">{school.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)] mb-3">
                      <Link
                        href={`/cities/${school.citySlug}`}
                        className="hover:text-[var(--accent-green)] transition-colors"
                      >
                        {cityInfo.flag} {cityInfo.name}
                      </Link>
                      <span>·</span>
                      <span>{school.type}</span>
                      <span>·</span>
                      <span>{school.curriculum} curriculum</span>
                      <span>·</span>
                      <span>Ages {school.ageRange}</span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
                      {school.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {school.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-elevated)] text-[var(--text-secondary)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-[var(--text-secondary)]">Monthly fee</p>
                      <p className="font-mono font-bold text-[var(--accent-warm)]">
                        {formatEuro(school.monthlyFee)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--text-secondary)]">Rating</p>
                      <p className="font-mono text-[var(--accent-warm)]">
                        {"★".repeat(Math.round(school.rating))}{"☆".repeat(5 - Math.round(school.rating))}
                        <span className="text-xs ml-1">({school.familyReviews})</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {school.language.map((lang) => (
                        <span
                          key={lang}
                          className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)]"
                        >
                          {lang}
                        </span>
                      ))}
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
