"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Family } from "@/lib/database.types"

type FamilyProfile = Pick<Family, "id" | "family_name" | "country_code" | "kids_ages" | "travel_style" | "education_approach">

export default function FamiliesHere({
  citySlug,
  fallbackCount,
}: {
  citySlug: string
  fallbackCount: number
}) {
  const [familiesNow, setFamiliesNow] = useState<FamilyProfile[]>([])
  const [familiesBeen, setFamiliesBeen] = useState<FamilyProfile[]>([])
  const [totalHere, setTotalHere] = useState(fallbackCount)
  const [totalBeen, setTotalBeen] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [showAllBeen, setShowAllBeen] = useState(false)

  useEffect(() => {
    const fetchFamilies = async () => {
      // Families here now
      const { data: hereTrips, count: hereCount } = await supabase
        .from("trips")
        .select("family_id, families(id, family_name, country_code, kids_ages, travel_style, education_approach)", { count: "exact" })
        .eq("city_slug", citySlug)
        .eq("status", "here_now")

      // Families who've been here
      const { data: beenTrips, count: beenCount } = await supabase
        .from("trips")
        .select("family_id, families(id, family_name, country_code, kids_ages, travel_style, education_approach)", { count: "exact" })
        .eq("city_slug", citySlug)
        .eq("status", "been_here")

      if (hereTrips && hereTrips.length > 0) {
        const fams = hereTrips
          .map((t) => (t as unknown as { families: FamilyProfile }).families)
          .filter(Boolean)
        setFamiliesNow(fams)
        setTotalHere(hereCount ?? fams.length)
      }

      if (beenTrips && beenTrips.length > 0) {
        const seen = new Set<string>()
        const fams = beenTrips
          .map((t) => (t as unknown as { families: FamilyProfile }).families)
          .filter((f) => {
            if (!f || seen.has(f.id)) return false
            seen.add(f.id)
            return true
          })
        setFamiliesBeen(fams)
        setTotalBeen(beenCount ?? fams.length)
      }

      setLoaded(true)
    }

    fetchFamilies()
  }, [citySlug])

  const flag = (code: string) =>
    code.toUpperCase().split("").map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join("")

  const visibleBeen = showAllBeen ? familiesBeen : familiesBeen.slice(0, 6)

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h3 className="font-serif text-lg font-bold mb-4">Families in this city</h3>

      {/* Counters */}
      <div className="flex gap-6 mb-5">
        <div>
          <p className="text-2xl font-mono font-bold text-[var(--accent-warm)] pulse-live">
            {totalHere}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">here now</p>
        </div>
        {(loaded && totalBeen > 0) && (
          <div>
            <p className="text-2xl font-mono font-bold">{totalBeen}</p>
            <p className="text-xs text-[var(--text-secondary)]">have been here</p>
          </div>
        )}
      </div>

      {/* Families here now */}
      {familiesNow.length > 0 && (
        <div className="mb-5">
          <p className="text-xs text-[var(--text-secondary)] font-medium mb-2">Here now</p>
          <div className="space-y-2">
            {familiesNow.map((fam) => (
              <FamilyCard key={fam.id} family={fam} flag={flag} variant="here" />
            ))}
          </div>
        </div>
      )}

      {/* Families who've been here */}
      {familiesBeen.length > 0 && (
        <div>
          <p className="text-xs text-[var(--text-secondary)] font-medium mb-2">Families who&apos;ve been here</p>
          <div className="space-y-2">
            {visibleBeen.map((fam) => (
              <FamilyCard key={fam.id} family={fam} flag={flag} variant="been" />
            ))}
          </div>
          {familiesBeen.length > 6 && !showAllBeen && (
            <button
              onClick={() => setShowAllBeen(true)}
              className="text-xs text-[var(--accent-green)] hover:underline mt-2"
            >
              Show all {familiesBeen.length} families
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {loaded && familiesNow.length === 0 && familiesBeen.length === 0 && (
        <p className="text-sm text-[var(--text-secondary)]">
          No families have checked in yet. Be the first!
        </p>
      )}
      {!loaded && familiesNow.length === 0 && (
        <p className="text-sm text-[var(--text-secondary)]">
          {fallbackCount} families estimated
        </p>
      )}
    </div>
  )
}

function FamilyCard({
  family,
  flag,
  variant,
}: {
  family: Pick<Family, "id" | "family_name" | "country_code" | "kids_ages" | "travel_style" | "education_approach">
  flag: (code: string) => string
  variant: "here" | "been"
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] px-3 py-2.5">
      <span
        className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
          variant === "here"
            ? "bg-[var(--accent-green)] text-[var(--bg)]"
            : "bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)]"
        }`}
      >
        {family.family_name.slice(0, 2).toUpperCase()}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {family.country_code ? flag(family.country_code) + " " : ""}
          {family.family_name}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[var(--text-secondary)]">
          {family.kids_ages && family.kids_ages.length > 0 && (
            <span>Kids: {family.kids_ages.join(", ")}</span>
          )}
          {family.travel_style && <span>{family.travel_style}</span>}
          {family.education_approach && <span>{family.education_approach}</span>}
        </div>
      </div>
    </div>
  )
}
