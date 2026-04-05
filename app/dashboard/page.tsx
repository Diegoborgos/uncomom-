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
import ConciergeCard from "@/components/ConciergeCard"
import FamilyMatches from "@/components/FamilyMatches"
import FamilyMatch from "@/components/FamilyMatch"

const ProfileMap = dynamic(() => import("@/components/ProfileMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black animate-pulse" />,
})

export default function DashboardPage() {
  const { user, family, loading, isPaid, refreshFamily } = useAuth()
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
      {/* Map hero — always show, like Nomad List globe */}
      <div className="relative w-full h-[400px] bg-black">
        <ProfileMap trips={trips} />
        {/* Overlay gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[var(--bg)] to-transparent" />
      </div>

      {/* Profile section */}
      <div className="max-w-3xl mx-auto px-4 -mt-16 relative z-10">
        {/* Avatar + name */}
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
                  if (result.url) { await refreshFamily() }
                  else { alert(`Upload failed: ${result.error}`) }
                }}
              />
            </label>
          </div>
          <h1 className="font-serif text-3xl font-bold">
            {family?.family_name || "My Family"}
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
          {/* Action buttons */}
          <div className="flex justify-center gap-2 mt-4">
            <Link href="/onboarding" className="px-4 py-2 rounded-xl bg-[var(--accent-green)] text-black text-xs font-medium hover:opacity-90 transition-opacity">
              Edit profile
            </Link>
          </div>
        </div>

        {/* Bio */}
        {family?.bio && (
          <div className="text-center mb-6">
            <p className="text-sm text-[var(--text-secondary)] italic max-w-lg mx-auto leading-relaxed">
              &ldquo;{family.bio}&rdquo;
            </p>
          </div>
        )}

        {/* Onboarding prompt */}
        {needsOnboarding && (
          <Link href="/onboarding" className="block rounded-2xl border border-[rgb(var(--accent-green-rgb)/0.3)] bg-[rgb(var(--accent-green-rgb)/0.05)] p-5 mb-6 text-center hover:bg-[rgb(var(--accent-green-rgb)/0.1)] transition-colors">
            <p className="font-medium text-[var(--accent-green)] mb-1">Complete your profile</p>
            <p className="text-xs text-[var(--text-secondary)]">Quick chat — helps families find and connect with you.</p>
          </Link>
        )}

        {/* Tags — organized by category + edit link */}
        {family && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Profile details</span>
              <Link href="/onboarding" className="text-[10px] text-[var(--accent-green)] hover:underline">Edit all →</Link>
            </div>
            <div className="space-y-3">
              {family.parent_work_type && <TagRow label="Work" tags={[family.parent_work_type]} />}
              {family.education_approach && <TagRow label="Education" tags={[family.education_approach]} />}
              {family.travel_style && <TagRow label="Travel" tags={[family.travel_style]} />}
              {family.kids_ages && family.kids_ages.length > 0 && <TagRow label="Kids" tags={family.kids_ages.map((a) => `${a} years`)} />}
              {family.languages && family.languages.length > 0 && <TagRow label="Languages" tags={family.languages} />}
              {family.interests && family.interests.length > 0 && <TagRow label="Interests" tags={family.interests.map((i) => i.charAt(0).toUpperCase() + i.slice(1))} />}
            </div>

            {/* Data collection prompts — ask for missing fields */}
            {(!family.parent_work_type || !family.education_approach || !family.travel_style || !family.languages?.length || !family.interests?.length) && (
              <Link href="/onboarding" className="block mt-4 rounded-xl border border-dashed border-[var(--border)] p-4 text-center hover:border-[var(--accent-green)] transition-colors">
                <p className="text-xs text-[var(--text-secondary)]">
                  Your profile is {Math.round(([family.parent_work_type, family.education_approach, family.travel_style, family.languages?.length, family.interests?.length, family.bio, family.kids_ages?.length].filter(Boolean).length / 7) * 100)}% complete —{" "}
                  <span className="text-[var(--accent-green)]">add more to get better matches</span>
                </p>
              </Link>
            )}
          </div>
        )}

        {/* AI Concierge — personalized recommendations */}
        <ConciergeCard />

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

        {/* AI-matched family introduction */}
        <FamilyMatch />

        {/* Currently in */}
        {currentTrips.length > 0 && (
          <section className="mb-8">
            <SectionTitle>Currently in</SectionTitle>
            {currentTrips.map((trip) => {
              const info = getCityInfo(trip.city_slug)
              return (
                <Link key={trip.id} href={`/cities/${trip.city_slug}`}
                  className="flex items-center justify-between rounded-2xl border border-[rgb(var(--accent-green-rgb)/0.3)] bg-[rgb(var(--accent-green-rgb)/0.05)] p-4 hover:bg-[rgb(var(--accent-green-rgb)/0.1)] transition-colors">
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
          <section className="mb-8">
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

        {/* Membership */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center mb-12">
          {isPaid ? (
            <>
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-[rgb(var(--accent-green-rgb)/0.2)] text-[var(--accent-green)] mb-2">Member</span>
              <p className="font-serif text-lg font-bold">Uncomun Member</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Lifetime access</p>
            </>
          ) : (
            <>
              <p className="font-serif text-lg font-bold mb-1">Free Explorer</p>
              <p className="text-xs text-[var(--text-secondary)] mb-3">Unlock full city intelligence and community.</p>
              <button onClick={() => openJoinOverlay()}
                className="px-5 py-2.5 rounded-xl bg-[var(--accent-green)] text-black font-medium text-sm hover:opacity-90 transition-opacity">
                Unlock details
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

function TagRow({ label, tags }: { label: string; tags: string[] }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider w-16 shrink-0 pt-1.5">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span key={tag} className="text-xs px-3 py-1.5 rounded-full bg-[rgb(var(--accent-green-rgb)/0.1)] text-[var(--accent-green)] border border-[rgb(var(--accent-green-rgb)/0.2)]">
            {tag.charAt(0).toUpperCase() + tag.slice(1)}
          </span>
        ))}
      </div>
    </div>
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
