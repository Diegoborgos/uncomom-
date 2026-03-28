"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Family } from "@/lib/database.types"

type FamilyHere = Pick<Family, "id" | "family_name" | "country_code" | "kids_ages">

export default function FamiliesHere({
  citySlug,
  fallbackCount,
}: {
  citySlug: string
  fallbackCount: number
}) {
  const [families, setFamilies] = useState<FamilyHere[]>([])
  const [totalHere, setTotalHere] = useState(fallbackCount)
  const [totalBeen, setTotalBeen] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const fetchFamilies = async () => {
      // Get families here now
      const { data: hereTrips, count: hereCount } = await supabase
        .from("trips")
        .select("family_id, families(id, family_name, country_code, kids_ages)", { count: "exact" })
        .eq("city_slug", citySlug)
        .eq("status", "here_now")

      // Get total been count
      const { count: beenCount } = await supabase
        .from("trips")
        .select("*", { count: "exact", head: true })
        .eq("city_slug", citySlug)

      if (hereTrips && hereTrips.length > 0) {
        const fams = hereTrips
          .map((t) => (t as unknown as { families: FamilyHere }).families)
          .filter(Boolean)
        setFamilies(fams)
        setTotalHere(hereCount ?? fams.length)
      }

      if (beenCount && beenCount > 0) {
        setTotalBeen(beenCount)
      }

      setLoaded(true)
    }

    fetchFamilies()
  }, [citySlug])

  const countryCodeToFlag = (code: string) =>
    code
      .toUpperCase()
      .split("")
      .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
      .join("")

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h3 className="font-serif text-lg font-bold mb-4">Families in this city</h3>

      <div className="flex gap-6 mb-4">
        <div>
          <p className="text-2xl font-mono font-bold text-[var(--accent-warm)] pulse-live">
            {totalHere}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">here now</p>
        </div>
        {(loaded && totalBeen > 0) && (
          <div>
            <p className="text-2xl font-mono font-bold">{totalBeen}</p>
            <p className="text-xs text-[var(--text-secondary)]">total visits</p>
          </div>
        )}
      </div>

      {families.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {families.map((fam) => (
            <div
              key={fam.id}
              className="flex items-center gap-2 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] px-3 py-1.5"
            >
              <span className="w-6 h-6 rounded-full bg-[var(--accent-green)] text-[var(--bg)] flex items-center justify-center text-[9px] font-bold">
                {fam.family_name.slice(0, 2).toUpperCase()}
              </span>
              <span className="text-xs">
                {fam.country_code ? countryCodeToFlag(fam.country_code) + " " : ""}
                {fam.family_name}
              </span>
              {fam.kids_ages && fam.kids_ages.length > 0 && (
                <span className="text-[10px] text-[var(--text-secondary)]">
                  · {fam.kids_ages.length} kid{fam.kids_ages.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--text-secondary)]">
          {loaded
            ? "No families have checked in yet. Be the first!"
            : `${fallbackCount} families estimated`}
        </p>
      )}
    </div>
  )
}
