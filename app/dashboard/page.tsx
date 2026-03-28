"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Trip, Review } from "@/lib/database.types"
import { cities } from "@/data/cities"
import { countryCodeToFlag } from "@/lib/scores"

export default function DashboardPage() {
  const { user, family, loading } = useAuth()
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [reviews, setReviews] = useState<Review[]>([])

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    if (family) {
      supabase
        .from("trips")
        .select("*")
        .eq("family_id", family.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => setTrips(data || []))

      supabase
        .from("reviews")
        .select("*")
        .eq("family_id", family.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => setReviews(data || []))
    }
  }, [family])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-[var(--text-secondary)]">
        Loading...
      </div>
    )
  }

  if (!user) return null

  const currentTrips = trips.filter((t) => t.status === "here_now")
  const pastTrips = trips.filter((t) => t.status === "been_here")
  const uniqueCities = new Set(trips.map((t) => t.city_slug))

  const getCityInfo = (slug: string) => {
    const city = cities.find((c) => c.slug === slug)
    return city ? { name: city.name, flag: countryCodeToFlag(city.countryCode), country: city.country } : { name: slug, flag: "", country: "" }
  }

  const needsOnboarding = !family?.onboarding_complete

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Onboarding prompt */}
      {needsOnboarding && (
        <div className="rounded-xl border border-[var(--accent-warm)]/30 bg-[var(--accent-warm)]/10 p-6 mb-8 flex items-center justify-between">
          <div>
            <p className="font-medium text-[var(--accent-warm)]">Complete your family profile</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Tell other traveling families about yours so they can find and connect with you.
            </p>
          </div>
          <Link
            href="/onboarding"
            className="shrink-0 px-4 py-2 rounded-lg bg-[var(--accent-warm)] text-[var(--bg)] font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Set up profile
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-[var(--accent-green)] text-[var(--bg)] flex items-center justify-center text-xl font-bold font-serif">
          {family?.family_name?.slice(0, 2).toUpperCase() || user.email?.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h1 className="font-serif text-3xl font-bold">
            {family?.family_name || "My Family"}
          </h1>
          {family?.home_country && (
            <p className="text-[var(--text-secondary)] text-sm">
              {family.country_code ? countryCodeToFlag(family.country_code) + " " : ""}
              {family.home_country}
            </p>
          )}
        </div>
        <Link
          href="/onboarding"
          className="ml-auto text-sm px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)] hover:text-[var(--accent-green)] transition-colors"
        >
          Edit profile
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <StatCard value={uniqueCities.size} label="Cities visited" />
        <StatCard value={trips.length} label="Total trips" />
        <StatCard value={currentTrips.length} label="Currently in" />
        <StatCard value={reviews.length} label="Reviews" />
      </div>

      {/* Profile details */}
      {family && (family.travel_style || family.education_approach || family.parent_work_type) && (
        <section className="mb-10">
          <h2 className="font-serif text-xl font-bold mb-4">About your family</h2>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 grid grid-cols-2 gap-4">
            {family.kids_ages && family.kids_ages.length > 0 && (
              <InfoItem label="Kids ages" value={family.kids_ages.join(", ")} />
            )}
            {family.parent_work_type && <InfoItem label="Work" value={family.parent_work_type} />}
            {family.travel_style && <InfoItem label="Travel style" value={family.travel_style} />}
            {family.education_approach && <InfoItem label="Education" value={family.education_approach} />}
            {family.languages && family.languages.length > 0 && (
              <InfoItem label="Languages" value={family.languages.join(", ")} />
            )}
            {family.interests && family.interests.length > 0 && (
              <div className="col-span-2">
                <p className="text-xs text-[var(--text-secondary)] mb-1">Interests</p>
                <div className="flex flex-wrap gap-1.5">
                  {family.interests.map((i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-elevated)] text-[var(--text-secondary)]">
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {family.bio && (
              <div className="col-span-2">
                <p className="text-xs text-[var(--text-secondary)] mb-1">Bio</p>
                <p className="text-sm text-[var(--text-primary)] italic">{family.bio}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Current location */}
      {currentTrips.length > 0 && (
        <section className="mb-10">
          <h2 className="font-serif text-xl font-bold mb-4">Currently in</h2>
          <div className="space-y-3">
            {currentTrips.map((trip) => {
              const info = getCityInfo(trip.city_slug)
              return (
                <Link
                  key={trip.id}
                  href={`/cities/${trip.city_slug}`}
                  className="flex items-center justify-between rounded-xl border border-[var(--accent-green)]/30 bg-[var(--accent-green)]/10 p-4 hover:bg-[var(--accent-green)]/15 transition-colors"
                >
                  <div>
                    <span className="text-lg font-serif font-bold">
                      {info.flag} {info.name}
                    </span>
                    <span className="text-sm text-[var(--text-secondary)] ml-2">{info.country}</span>
                  </div>
                  {trip.arrived_at && (
                    <span className="text-xs text-[var(--text-secondary)]">
                      Since {new Date(trip.arrived_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Trip history */}
      <section className="mb-10">
        <h2 className="font-serif text-xl font-bold mb-4">Trip history</h2>
        {pastTrips.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
            <p className="text-[var(--text-secondary)] mb-2">No trips logged yet.</p>
            <p className="text-sm text-[var(--text-secondary)]">
              Visit a{" "}
              <Link href="/" className="text-[var(--accent-green)] hover:underline">city page</Link>
              {" "}and log your first trip.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {pastTrips.map((trip) => {
              const info = getCityInfo(trip.city_slug)
              return (
                <Link
                  key={trip.id}
                  href={`/cities/${trip.city_slug}`}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-[var(--accent-green)] transition-colors"
                >
                  <span className="text-sm font-medium">
                    {info.flag} {info.name}
                    <span className="text-[var(--text-secondary)] ml-1">{info.country}</span>
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {trip.arrived_at
                      ? new Date(trip.arrived_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                      : ""}
                    {trip.left_at && (
                      <>
                        {" → "}
                        {new Date(trip.left_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </>
                    )}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Reviews */}
      <section>
        <h2 className="font-serif text-xl font-bold mb-4">Your reviews</h2>
        {reviews.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
            <p className="text-[var(--text-secondary)]">No reviews yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => {
              const info = getCityInfo(review.city_slug)
              return (
                <Link
                  key={review.id}
                  href={`/cities/${review.city_slug}`}
                  className="block rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-[var(--accent-green)] transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{info.flag} {info.name}</span>
                    <span className="text-xs font-mono text-[var(--accent-warm)]">
                      {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">{review.text}</p>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Membership status (placeholder) */}
      <section className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
        <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">Membership</p>
        <p className="font-serif text-lg font-bold mb-1">Free Explorer</p>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Upgrade to unlock the residence tracker, family finder, and premium city data.
        </p>
        <span className="inline-block px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-secondary)] cursor-not-allowed">
          Upgrade coming soon
        </span>
      </section>
    </div>
  )
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
      <p className="font-mono text-2xl font-bold text-[var(--accent-green)]">{value}</p>
      <p className="text-xs text-[var(--text-secondary)] mt-1">{label}</p>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-secondary)]">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  )
}
