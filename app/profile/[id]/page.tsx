"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { supabase } from "@/lib/supabase"
import { Family, Trip } from "@/lib/database.types"
import { cities } from "@/data/cities"
import { countryCodeToFlag } from "@/lib/scores"

const ProfileMap = dynamic(() => import("@/components/ProfileMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black animate-pulse" />,
})

export default function PublicProfilePage() {
  const params = useParams()
  const familyId = params.id as string
  const [family, setFamily] = useState<Family | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      // Try username first, then fallback to UUID
      const isUUID = familyId.includes("-") && familyId.length > 30
      const { data: fam } = await supabase
        .from("families")
        .select("id, family_name, home_country, country_code, kids_ages, travel_style, education_approach, interests, languages, bio, avatar_url, created_at")
        .eq(isUUID ? "id" : "username", familyId)
        .single()

      if (fam) {
        setFamily(fam as Family)
        const { data: t } = await supabase
          .from("trips")
          .select("*")
          .eq("family_id", fam.id)
          .order("arrived_at", { ascending: false, nullsFirst: false })
        setTrips(t || [])
      }
      setLoading(false)
    }
    fetch()
  }, [familyId])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">Loading...</div>
  if (!family) return <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">Family not found</div>

  const flag = family.country_code ? countryCodeToFlag(family.country_code) : ""
  const initials = family.family_name?.slice(0, 2).toUpperCase() || "??"
  const uniqueCities = new Set(trips.map((t) => t.city_slug))
  const uniqueCountries = new Set(trips.map((t) => cities.find((c) => c.slug === t.city_slug)?.country).filter(Boolean))
  const currentTrip = trips.find((t) => t.status === "here_now")
  const currentCityInfo = currentTrip ? cities.find((c) => c.slug === currentTrip.city_slug) : null
  const memberSince = new Date(family.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })

  return (
    <div>
      {/* Map */}
      <div className="relative w-full h-[350px] bg-black">
        <ProfileMap trips={trips} />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[var(--bg)] to-transparent" />
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-16 relative z-10">
        {/* Avatar */}
        <div className="text-center mb-6">
          <div className="w-28 h-28 mx-auto mb-3">
            {family.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={family.avatar_url} alt={family.family_name} className="w-full h-full rounded-full object-cover border-4 border-[var(--bg)]" />
            ) : (
              <div className="w-full h-full rounded-full bg-[var(--accent-green)] text-black flex items-center justify-center text-3xl font-bold border-4 border-[var(--bg)]">
                {initials}
              </div>
            )}
          </div>
          <h1 className="font-serif text-3xl font-bold">{family.family_name}</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{flag} {family.home_country}</p>
          {currentCityInfo && (
            <p className="text-xs text-[var(--accent-green)] mt-1">Currently in {currentCityInfo.name}</p>
          )}
          <div className="flex justify-center gap-6 mt-3 text-xs text-[var(--text-secondary)]">
            <span>Joined {memberSince}</span>
            {uniqueCities.size > 0 && <span>{uniqueCities.size} cities</span>}
            {uniqueCountries.size > 0 && <span>{uniqueCountries.size} countries</span>}
          </div>
        </div>

        {/* Bio */}
        {family.bio && (
          <p className="text-sm text-[var(--text-secondary)] italic text-center max-w-lg mx-auto mb-6">
            &ldquo;{family.bio}&rdquo;
          </p>
        )}

        {/* Tags */}
        <div className="space-y-3 mb-8">
          {family.travel_style && <TagRow label="Travel" tags={[family.travel_style]} />}
          {family.education_approach && <TagRow label="Education" tags={[family.education_approach]} />}
          {family.kids_ages && family.kids_ages.length > 0 && <TagRow label="Kids" tags={family.kids_ages.map((a) => `${a} years`)} />}
          {family.languages && family.languages.length > 0 && <TagRow label="Languages" tags={family.languages} />}
          {family.interests && family.interests.length > 0 && <TagRow label="Interests" tags={family.interests.map((i) => i.charAt(0).toUpperCase() + i.slice(1))} />}
        </div>

        {/* Cities visited — grid with photos */}
        {trips.length > 0 && (
          <section className="mb-8">
            <h2 className="font-serif text-xl font-bold mb-4">Cities visited</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from(uniqueCities).map((slug) => {
                const city = cities.find((c) => c.slug === slug)
                if (!city) return null
                const cityFlag = countryCodeToFlag(city.countryCode)
                return (
                  <Link key={slug} href={`/cities/${slug}`}
                    className="rounded-xl overflow-hidden bg-[var(--surface)] hover:opacity-90 transition-opacity">
                    <div className="relative h-24 bg-black">
                      {city.photo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={city.photo} alt={city.name} className="w-full h-full object-cover" loading="lazy" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-2 left-2">
                        <p className="text-[10px] text-white/70">{cityFlag} {city.country}</p>
                        <p className="text-sm font-bold text-white">{city.name}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Flags collected */}
        {uniqueCountries.size > 0 && (
          <section className="mb-8">
            <h2 className="font-serif text-xl font-bold mb-3">Flags collected ({uniqueCountries.size})</h2>
            <div className="flex flex-wrap gap-2">
              {Array.from(uniqueCountries).map((country) => {
                const city = cities.find((c) => c.country === country)
                const f = city ? countryCodeToFlag(city.countryCode) : ""
                return (
                  <span key={country} className="text-2xl" title={country as string}>{f}</span>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function TagRow({ label, tags }: { label: string; tags: string[] }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider w-20 shrink-0 pt-1.5">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span key={tag} className="text-xs px-3 py-1.5 rounded-full bg-[var(--accent-green)]/10 text-[var(--accent-green)] border border-[var(--accent-green)]/20">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
