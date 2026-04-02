"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { countryCodeToFlag } from "@/lib/scores"
import { cities } from "@/data/cities"

type MatchedFamily = {
  family: {
    id: string
    username: string | null
    family_name: string
    country_code: string
    kids_ages: number[]
    travel_style: string
    education_approach: string
    interests: string[]
    bio: string
    avatar_url: string | null
  }
  score: number
  reasons: string[]
  currentCity: string | null
}

export default function FamilyMatches() {
  const { user, isPaid } = useAuth()
  const [matches, setMatches] = useState<MatchedFamily[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !isPaid) { setLoading(false); return }

    const fetchMatches = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) { setLoading(false); return }

      try {
        const res = await fetch("/api/matchmaking", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
        })
        const data = await res.json()
        setMatches(data.matches || [])
      } catch {
        // Silently fail
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [user, isPaid])

  if (!isPaid || loading || matches.length === 0) return null

  return (
    <section className="mb-8">
      <h2 className="font-serif text-xl font-bold mb-3">Families like yours</h2>
      <div className="space-y-3">
        {matches.slice(0, 5).map((match, i) => {
          const fam = match.family
          const flag = fam.country_code ? countryCodeToFlag(fam.country_code) : ""
          const initials = fam.family_name?.slice(0, 2).toUpperCase() || "??"
          const cityName = match.currentCity ? cities.find((c) => c.slug === match.currentCity)?.name : null

          return (
            <Link key={i} href={`/profile/${fam.username || fam.id}`} className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-[var(--accent-green)] transition-colors">
              <div className="flex items-start gap-3">
                {fam.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fam.avatar_url} alt={fam.family_name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[var(--accent-green)] text-black flex items-center justify-center text-sm font-bold shrink-0">
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{flag} {fam.family_name}</p>
                    <span className="text-xs font-mono text-[var(--accent-green)]">{match.score}% match</span>
                  </div>
                  {fam.kids_ages && fam.kids_ages.length > 0 && (
                    <p className="text-xs text-[var(--text-secondary)]">Kids: {fam.kids_ages.join(", ")}</p>
                  )}
                  {cityName && (
                    <p className="text-xs text-[var(--accent-green)] mt-0.5">Currently in {cityName}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {match.reasons.map((reason, j) => (
                      <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-elevated)] text-[var(--text-secondary)]">
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
