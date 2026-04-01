"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { City } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { countryCodeToFlag } from "@/lib/scores"

type FamilyInCity = {
  family_id: string
  family_name: string
  kids_ages: number[]
  username: string | null
}

export default function FamiliesNowCard({ candidateCities, familyId, kidsAges }: { candidateCities: City[]; familyId: string; kidsAges: number[] }) {
  const [data, setData] = useState<{ city: City; families: FamilyInCity[] } | null>(null)

  useEffect(() => {
    const fetchFamilies = async () => {
      const citySlugs = candidateCities.map((c) => c.slug)

      const { data: trips } = await supabase
        .from("trips")
        .select("family_id, city_slug")
        .in("city_slug", citySlugs)
        .eq("status", "here_now")
        .neq("family_id", familyId)

      if (!trips || trips.length === 0) return

      // Group by city, find city with most families
      const byCitySlug: Record<string, string[]> = {}
      trips.forEach((t) => {
        if (!byCitySlug[t.city_slug]) byCitySlug[t.city_slug] = []
        byCitySlug[t.city_slug].push(t.family_id)
      })

      const bestSlug = Object.entries(byCitySlug).sort((a, b) => b[1].length - a[1].length)[0]
      if (!bestSlug) return

      const city = candidateCities.find((c) => c.slug === bestSlug[0])
      if (!city) return

      const { data: families } = await supabase
        .from("families")
        .select("id, family_name, kids_ages, username")
        .in("id", bestSlug[1])
        .limit(3)

      if (families && families.length > 0) {
        setData({
          city,
          families: families.map((f) => ({
            family_id: f.id,
            family_name: f.family_name,
            kids_ages: f.kids_ages || [],
            username: f.username,
          })),
        })
      }
    }

    fetchFamilies()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!data) return null

  const flag = countryCodeToFlag(data.city.countryCode)
  const hasAgeMatch = data.families.some((f) =>
    f.kids_ages.some((theirAge) =>
      kidsAges.some((myAge) => Math.abs(myAge - theirAge) <= 2)
    )
  )

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-[10px] text-[var(--accent-green)] font-medium uppercase tracking-wider mb-1">👨‍👩‍👧‍👦 Families in your next city</p>
      <p className="text-sm font-medium mb-3">
        {data.families.length} {data.families.length === 1 ? "family" : "families"}{hasAgeMatch ? " with kids your age" : ""} in {flag} {data.city.name} right now
      </p>

      <div className="space-y-2">
        {data.families.map((f) => {
          const initials = f.family_name.slice(0, 2).toUpperCase()
          return (
            <Link
              key={f.family_id}
              href={`/profile/${f.username || f.family_id}`}
              className="flex items-center gap-3 rounded-lg p-2 -mx-2 hover:bg-[var(--surface-elevated)] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--accent-green)] text-black flex items-center justify-center text-[10px] font-bold shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{f.family_name}</p>
                {f.kids_ages.length > 0 && (
                  <p className="text-[10px] text-[var(--text-secondary)]">Kids: {f.kids_ages.join(", ")}</p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
