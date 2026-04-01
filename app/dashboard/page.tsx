"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Trip, Review } from "@/lib/database.types"
import { cities } from "@/data/cities"
import { countryCodeToFlag } from "@/lib/scores"
import { openJoinOverlay } from "@/components/JoinOverlay"
import EditableTagRow from "@/components/EditableTagRow"
import { WORK_TYPES, EDUCATION_APPROACHES, TRAVEL_STYLES, INTERESTS, COMMON_LANGUAGES } from "@/lib/profile-options"
import ForYou from "@/components/ForYou"
import FamilyMatches from "@/components/FamilyMatches"

const ProfileMap = dynamic(() => import("@/components/ProfileMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black animate-pulse" />,
})

export default function DashboardPage() {
  const { user, family, loading, isPaid } = useAuth()
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [reviews, setReviews] = useState<Review[]>([])

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    if (family) {
      supabase.from("trips").select("*").eq("family_id", family.id)
        .order("arrived_at", { ascending: false, nullsFirst: false })
        .then(({ data }) => setTrips(data || []))
      supabase.from("reviews").select("*").eq("family_id", family.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => setReviews(data || []))
    }
  }, [family])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">Loading...</div>
  if (!user) return null

  const currentTrips = trips.filter((t) => t.status === "here_now")
  const uniqueCities = new Set(trips.map((t) => t.city_slug))
  const uniqueCountries = new Set(
    trips.map((t) => cities.find((c) => c.slug === t.city_slug)?.country).filter(Boolean)
  )
  const needsOnboarding = !family?.onboarding_complete

  const totalDays = trips.reduce((sum, t) => {
    if (!t.arrived_at) return sum
    const end = t.left_at ? new Date(t.left_at) : new Date()
    return sum + Math.ceil((end.getTime() - new Date(t.arrived_at).getTime()) / (1000 * 60 * 60 * 24))
  }, 0)

  const getCityInfo = (slug: string) => {
    const city = cities.find((c) => c.slug === slug)
    return city ? { name: city.name, flag: countryCodeToFlag(city.countryCode), country: city.country } : { name: slug, flag: "", country: "" }
  }

  const initials = family?.family_name
    ? family.family_name.slice(0, 2).toUpperCase()
    : user.email?.slice(0, 2).toUpperCase() ?? ""

  const memberSince = family?.created_at
    ? new Date(family.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : ""

  return (
    <div>
      {/* Map hero */}
      <div className="relative w-full h-[400px] bg-black">
        <ProfileMap trips={trips} />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[var(--bg)] to-transparent" />
      </div>

      {/* Profile section */}
      <div className="max-w-3xl mx-auto px-4 -mt-16 relative z-10">
        {/* Avatar + name + badge */}
        <div className="text-center mb-6">
          <div className="relative w-28 h-28 mx-auto mb-3">
            {family?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={family.avatar_url} alt={family.family_name || ""} className="w-full h-full rounded-full object-cover border-4 border-[var(--bg)]" />
            ) : (
              <div className="w-full h-full rounded-full bg-[var(--accent-green)] text-black flex items-center justify-center text-3xl font-bold border-4 border-[var(--bg)]">
                {initials}
              </div>
            )}
            {/* Photo upload overlay */}
            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[var(--surface)] border-2 border-[var(--border)] flex items-center justify-center cursor-pointer hover:bg-[var(--surface-elevated)] transition-colors">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 11l4-4 3 3 2-2 3 3" /><rect x="1" y="2" width="14" height="12" rx="2" />
              </svg>
              <input
                type="file"
                accept="image/jpeg,image/webp,image/png"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file || !family) return
                  const { data: { session } } = await supabase.auth.getSession()
                  if (!session?.access_token) return
                  const formData = new FormData()
                  formData.append("file", file)
                  formData.append("familyId", family.id)
                  const res = await fetch("/api/upload-avatar", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${session.access_token}` },
                    body: formData,
                  })
                  const result = await res.json()
                  if (result.url) { window.location.reload() }
                  else { alert(`Upload failed: ${result.error}`) }
                }}
              />
            </label>
          </div>
          <h1 className="font-serif text-3xl font-bold inline-flex items-center gap-2 justify-center">
            {family?.family_name || "My Family"}
            {isPaid && <PremiumBadge />}
          </h1>
          {family?.home_country && (
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {family.country_code ? countryCodeToFlag(family.country_code) + " " : ""}
              {family.home_country}
            </p>
          )}
          {/* Member stats */}
          <div className="flex justify-center gap-6 mt-3 text-xs text-[var(--text-secondary)]">
            {memberSince && <span>Joined {memberSince}</span>}
            {uniqueCities.size > 0 && <span>{uniqueCities.size} cities</span>}
            {uniqueCountries.size > 0 && <span>{uniqueCountries.size} countries</span>}
            {totalDays > 0 && <span>{totalDays} days abroad</span>}
          </div>
        </div>

        {/* Bio — tap to edit */}
        {family && (
          <div className="text-center mb-6">
            {family.bio ? (
              <EditableTagRow label="" field="bio" value={family.bio} mode="text" />
            ) : (
              <EditableTagRow label="" field="bio" value="" mode="text" />
            )}
          </div>
        )}

        {/* Onboarding prompt */}
        {needsOnboarding && (
          <Link href="/onboarding" className="block rounded-2xl border border-[var(--accent-green)]/30 bg-[var(--accent-green)]/5 p-5 mb-6 text-center hover:bg-[var(--accent-green)]/10 transition-colors">
            <p className="font-medium text-[var(--accent-green)] mb-1">Complete your profile</p>
            <p className="text-xs text-[var(--text-secondary)]">Quick chat — helps families find and connect with you.</p>
          </Link>
        )}

        {/* Tags — inline editable */}
        {family && (
          <div className="mb-8">
            <div className="mb-3">
              <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Profile details</span>
            </div>
            <div className="space-y-3">
              <EditableTagRow label="Work" field="parent_work_type" value={family.parent_work_type || ""} options={WORK_TYPES} mode="single" />
              <EditableTagRow label="Education" field="education_approach" value={family.education_approach || ""} options={EDUCATION_APPROACHES} mode="single" />
              <EditableTagRow label="Travel" field="travel_style" value={family.travel_style || ""} options={TRAVEL_STYLES} mode="single" />
              <EditableTagRow label="Kids" field="kids_ages" value={family.kids_ages || []} mode="ages" />
              <EditableTagRow label="Languages" field="languages" value={family.languages || []} options={COMMON_LANGUAGES} mode="multi" />
              <EditableTagRow label="Interests" field="interests" value={family.interests || []} options={INTERESTS} mode="multi" formatDisplay={(v) => v.charAt(0).toUpperCase() + v.slice(1)} />
            </div>

            {/* Profile completion for missing fields */}
            {(!family.parent_work_type || !family.education_approach || !family.travel_style || !family.languages?.length || !family.interests?.length) && (
              <div className="mt-4 rounded-xl border border-dashed border-[var(--border)] p-4 text-center">
                <p className="text-xs text-[var(--text-secondary)]">
                  Your profile is {Math.round(([family.parent_work_type, family.education_approach, family.travel_style, family.languages?.length, family.interests?.length, family.bio, family.kids_ages?.length].filter(Boolean).length / 7) * 100)}% complete —{" "}
                  <span className="text-[var(--accent-green)]">tap any field above to add more</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Free user upgrade CTA — inline, not a card */}
        {!isPaid && (
          <div className="rounded-2xl border border-[var(--accent-green)]/30 bg-[var(--accent-green)]/5 p-5 mb-8 text-center">
            <p className="text-sm font-medium mb-1">Unlock the full Uncomun experience</p>
            <p className="text-xs text-[var(--text-secondary)] mb-3 max-w-md mx-auto">City intelligence, family matching, personalized recommendations, and community access.</p>
            <button onClick={() => openJoinOverlay()} className="px-5 py-2.5 rounded-xl bg-[var(--accent-green)] text-black font-medium text-sm hover:opacity-90 transition-opacity">
              Join Uncomun →
            </button>
          </div>
        )}

        {/* For You — data-driven intelligence cards */}
        <ForYou trips={trips} reviews={reviews} />

        {/* Family Matches */}
        <FamilyMatches />

        {/* Stats grid */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-8">
          <StatCard value={uniqueCities.size} label="Cities" />
          <StatCard value={uniqueCountries.size} label="Countries" />
          <StatCard value={totalDays} label="Days" />
          <StatCard value={reviews.length} label="Reviews" />
          <StatCard value={currentTrips.length} label="Here now" accent={currentTrips.length > 0} />
        </div>

        {/* Currently in */}
        {currentTrips.length > 0 && (
          <section className="mb-8">
            <SectionTitle>Currently in</SectionTitle>
            {currentTrips.map((trip) => {
              const info = getCityInfo(trip.city_slug)
              return (
                <Link key={trip.id} href={`/cities/${trip.city_slug}`}
                  className="flex items-center justify-between rounded-2xl border border-[var(--accent-green)]/30 bg-[var(--accent-green)]/5 p-4 hover:bg-[var(--accent-green)]/10 transition-colors">
                  <div>
                    <p className="font-serif text-lg font-bold">{info.flag} {info.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{info.country}</p>
                  </div>
                  {trip.arrived_at && (
                    <span className="text-xs text-[var(--text-secondary)]">
                      Since {new Date(trip.arrived_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </Link>
              )
            })}
          </section>
        )}

        {/* No trips */}
        {trips.length === 0 && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 mb-8 text-center">
            <h3 className="font-serif text-xl font-bold mb-2">Where have you been?</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4 max-w-md mx-auto">
              Log your travels to build your map. Every trip helps other families decide where to go next.
            </p>
            <Link href="/" className="inline-block px-6 py-3 rounded-xl bg-[var(--accent-green)] text-black font-medium text-sm hover:opacity-90 transition-opacity">
              Find a city →
            </Link>
          </div>
        )}

        {/* Cities visited — photo grid */}
        {uniqueCities.size > 0 && (
          <section className="mb-8">
            <SectionTitle>Cities visited</SectionTitle>
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
            <SectionTitle>Flags collected ({uniqueCountries.size})</SectionTitle>
            <div className="flex flex-wrap gap-3">
              {Array.from(uniqueCountries).map((country) => {
                const city = cities.find((c) => c.country === country)
                const f = city ? countryCodeToFlag(city.countryCode) : ""
                return <span key={country as string} className="text-3xl" title={country as string}>{f}</span>
              })}
            </div>
          </section>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="mb-12">
            <SectionTitle>Reviews</SectionTitle>
            <div className="space-y-2">
              {reviews.map((review) => {
                const info = getCityInfo(review.city_slug)
                return (
                  <Link key={review.id} href={`/cities/${review.city_slug}`}
                    className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 hover:border-[var(--accent-green)] transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{info.flag} {info.name}</span>
                      <span className="text-xs font-mono text-[var(--accent-green)]">{"★".repeat(review.rating)}</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{review.text}</p>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function PremiumBadge() {
  return (
    <span className="inline-flex items-center justify-center" title="Uncomun Member">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="9" fill="var(--accent-green)" />
        <path d="M6 10l3 3 5-6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

function StatCard({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-[var(--surface)] p-3 text-center">
      <p className={`font-mono text-xl font-bold ${accent ? "text-[var(--accent-green)]" : ""}`}>{value}</p>
      <p className="text-[10px] text-[var(--text-secondary)]">{label}</p>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-serif text-lg font-bold mb-3">{children}</h2>
}
