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

const ProfileMap = dynamic(() => import("@/components/ProfileMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[var(--surface)] rounded-2xl animate-pulse" />,
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

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-[var(--text-secondary)]">Loading...</div>
  if (!user) return null

  const currentTrips = trips.filter((t) => t.status === "here_now")
  const pastTrips = trips.filter((t) => t.status === "been_here")
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">

      {/* Onboarding prompt */}
      {needsOnboarding && (
        <Link href="/onboarding" className="block rounded-2xl border border-[var(--accent-green)]/30 bg-[var(--accent-green)]/5 p-5 mb-6 hover:bg-[var(--accent-green)]/10 transition-colors">
          <p className="font-medium text-[var(--accent-green)] mb-1">Set up your profile</p>
          <p className="text-sm text-[var(--text-secondary)]">
            Quick chat — 60 seconds. Helps families find and connect with you.
          </p>
        </Link>
      )}

      {/* Trip map — full width */}
      {trips.length > 0 && (
        <div className="h-72 mb-6 rounded-2xl overflow-hidden border border-[var(--border)]">
          <ProfileMap trips={trips} />
        </div>
      )}

      {/* Profile header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-[var(--accent-green)] text-black flex items-center justify-center text-2xl font-bold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h1 className="font-serif text-3xl font-bold truncate">
              {family?.family_name || "My Family"}
            </h1>
            <Link href="/onboarding" className="text-xs text-[var(--accent-green)] hover:underline shrink-0 ml-2">
              Edit profile
            </Link>
          </div>
          {family?.home_country && (
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {family.country_code ? countryCodeToFlag(family.country_code) + " " : ""}
              {family.home_country}
              {uniqueCities.size > 0 && ` · ${uniqueCities.size} cities · ${uniqueCountries.size} countries`}
            </p>
          )}
          {family?.bio && (
            <p className="text-sm text-[var(--text-secondary)] italic mt-2 leading-relaxed">{family.bio}</p>
          )}
        </div>
      </div>

      {/* Tags */}
      {family && (family.travel_style || family.education_approach || family.parent_work_type) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {family.travel_style && (
            <span className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)]">
              {family.travel_style}
            </span>
          )}
          {family.education_approach && (
            <span className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)]">
              {family.education_approach}
            </span>
          )}
          {family.parent_work_type && (
            <span className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)]">
              {family.parent_work_type}
            </span>
          )}
          {family.kids_ages && family.kids_ages.length > 0 && (
            <span className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)]">
              Kids: {family.kids_ages.join(", ")}
            </span>
          )}
          {family.languages && family.languages.length > 0 && (
            <span className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)]">
              {family.languages.join(", ")}
            </span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        <StatCard value={uniqueCities.size} label="Cities" />
        <StatCard value={uniqueCountries.size} label="Countries" />
        <StatCard value={totalDays} label="Days traveling" />
        <StatCard value={reviews.length} label="Reviews" />
        <StatCard value={currentTrips.length} label="Here now" accent={currentTrips.length > 0} />
      </div>

      {/* No trips CTA */}
      {trips.length === 0 && (
        <div className="rounded-2xl border border-[var(--accent-green)]/20 bg-[var(--surface)] p-8 mb-8 text-center">
          <h3 className="font-serif text-xl font-bold mb-2">Where have you been?</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4 max-w-md mx-auto">
            Log your travels to build your family map. Every trip you log helps other families make better decisions about where to go next.
          </p>
          <Link href="/" className="inline-block px-6 py-3 rounded-xl bg-[var(--accent-green)] text-black font-medium text-sm hover:opacity-90 transition-opacity">
            Find a city and log your first trip →
          </Link>
        </div>
      )}

      {/* Current location */}
      {currentTrips.length > 0 && (
        <section className="mb-8">
          <h2 className="font-serif text-xl font-bold mb-3">Currently in</h2>
          {currentTrips.map((trip) => {
            const info = getCityInfo(trip.city_slug)
            return (
              <Link key={trip.id} href={`/cities/${trip.city_slug}`}
                className="flex items-center justify-between rounded-2xl border border-[var(--accent-green)]/30 bg-[var(--accent-green)]/5 p-5 hover:bg-[var(--accent-green)]/10 transition-colors">
                <div>
                  <p className="font-serif text-lg font-bold">{info.flag} {info.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{info.country}</p>
                </div>
                {trip.arrived_at && (
                  <div className="text-right">
                    <p className="text-xs text-[var(--text-secondary)]">Since</p>
                    <p className="text-sm font-mono">{new Date(trip.arrived_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                  </div>
                )}
              </Link>
            )
          })}
        </section>
      )}

      {/* Travel timeline */}
      {pastTrips.length > 0 && (
        <section className="mb-8">
          <h2 className="font-serif text-xl font-bold mb-3">Travel timeline</h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-[var(--border)]" />

            <div className="space-y-4">
              {pastTrips.map((trip) => {
                const info = getCityInfo(trip.city_slug)
                const days = trip.arrived_at && trip.left_at
                  ? Math.ceil((new Date(trip.left_at).getTime() - new Date(trip.arrived_at).getTime()) / (1000 * 60 * 60 * 24))
                  : null
                return (
                  <Link key={trip.id} href={`/cities/${trip.city_slug}`}
                    className="flex items-start gap-4 pl-8 relative hover:opacity-80 transition-opacity">
                    {/* Dot on timeline */}
                    <div className="absolute left-3 top-1.5 w-3 h-3 rounded-full bg-[var(--accent-green)] border-2 border-[var(--bg)]" />
                    <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{info.flag} {info.name}</span>
                        {days && <span className="text-xs text-[var(--text-secondary)]">{days} days</span>}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {trip.arrived_at ? new Date(trip.arrived_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : ""}
                        {trip.left_at && ` → ${new Date(trip.left_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}
                      </p>
                      {trip.notes && <p className="text-xs text-[var(--text-secondary)] mt-1 italic">{trip.notes}</p>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="mb-8">
          <h2 className="font-serif text-xl font-bold mb-3">Your reviews</h2>
          <div className="space-y-3">
            {reviews.map((review) => {
              const info = getCityInfo(review.city_slug)
              return (
                <Link key={review.id} href={`/cities/${review.city_slug}`}
                  className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-[var(--accent-green)] transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{info.flag} {info.name}</span>
                    <span className="text-xs font-mono text-[var(--accent-green)]">
                      {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{review.text}</p>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Membership */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center mb-8">
        <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-2">Membership</p>
        {isPaid ? (
          <>
            <div className="w-10 h-10 rounded-full bg-[var(--accent-green)]/20 text-[var(--accent-green)] flex items-center justify-center text-lg mx-auto mb-3">✓</div>
            <p className="font-serif text-lg font-bold mb-1">Uncomun Member</p>
            <p className="text-sm text-[var(--text-secondary)]">Lifetime access. Thank you for being part of the society.</p>
          </>
        ) : (
          <>
            <p className="font-serif text-lg font-bold mb-1">Free Explorer</p>
            <p className="text-sm text-[var(--text-secondary)] mb-4">Join to unlock full city intelligence, community, and more.</p>
            <button onClick={() => openJoinOverlay()}
              className="inline-block px-5 py-2.5 rounded-xl bg-[var(--accent-green)] text-black font-medium text-sm hover:opacity-90 transition-opacity">
              Unlock details
            </button>
          </>
        )}
      </section>
    </div>
  )
}

function StatCard({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-center">
      <p className={`font-mono text-xl font-bold ${accent ? "text-[var(--accent-green)]" : ""}`}>{value}</p>
      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{label}</p>
    </div>
  )
}
