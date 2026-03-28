"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Trip, Review } from "@/lib/database.types"
import { cities } from "@/data/cities"
import { countryCodeToFlag } from "@/lib/scores"

export default function ProfilePage() {
  const { user, family, loading, refreshFamily } = useAuth()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [familyName, setFamilyName] = useState("")
  const [homeCountry, setHomeCountry] = useState("")
  const [countryCode, setCountryCode] = useState("")
  const [kidsAges, setKidsAges] = useState("")
  const [travelStyle, setTravelStyle] = useState("")
  const [bio, setBio] = useState("")
  const [saving, setSaving] = useState(false)
  const [trips, setTrips] = useState<Trip[]>([])
  const [reviews, setReviews] = useState<Review[]>([])

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (family) {
      setFamilyName(family.family_name)
      setHomeCountry(family.home_country || "")
      setCountryCode(family.country_code || "")
      setKidsAges(family.kids_ages?.join(", ") || "")
      setTravelStyle(family.travel_style || "")
      setBio(family.bio || "")
    }
  }, [family])

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

  const handleSave = async () => {
    if (!family) return
    setSaving(true)
    const ages = kidsAges
      .split(",")
      .map((a) => parseInt(a.trim()))
      .filter((a) => !isNaN(a))

    await supabase
      .from("families")
      .update({
        family_name: familyName,
        home_country: homeCountry,
        country_code: countryCode,
        kids_ages: ages,
        travel_style: travelStyle,
        bio: bio,
        updated_at: new Date().toISOString(),
      })
      .eq("id", family.id)

    await refreshFamily()
    setSaving(false)
    setEditing(false)
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-[var(--text-secondary)]">
        Loading...
      </div>
    )
  }

  if (!user || !family) return null

  const getCityName = (slug: string) => {
    const city = cities.find((c) => c.slug === slug)
    return city ? `${countryCodeToFlag(city.countryCode)} ${city.name}` : slug
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">
      {/* Profile header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[var(--accent-green)] text-[var(--bg)] flex items-center justify-center text-xl font-bold font-serif">
            {family.family_name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold">{family.family_name}</h1>
            {family.home_country && (
              <p className="text-[var(--text-secondary)] text-sm">
                {family.country_code ? countryCodeToFlag(family.country_code) + " " : ""}
                {family.home_country}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="text-sm px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)] hover:text-[var(--accent-green)] transition-colors"
        >
          {editing ? "Cancel" : "Edit profile"}
        </button>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Family name</label>
              <input
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Home country</label>
              <input
                value={homeCountry}
                onChange={(e) => setHomeCountry(e.target.value)}
                className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
                placeholder="Portugal"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Country code (2 letter)</label>
              <input
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                maxLength={2}
                className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
                placeholder="PT"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Kids ages (comma separated)</label>
              <input
                value={kidsAges}
                onChange={(e) => setKidsAges(e.target.value)}
                className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
                placeholder="4, 7, 11"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Travel style</label>
            <input
              value={travelStyle}
              onChange={(e) => setTravelStyle(e.target.value)}
              className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
              placeholder="Slow travel, 2-3 months per city"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)] resize-none"
              placeholder="Tell other families a bit about your family..."
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save profile"}
          </button>
        </div>
      )}

      {/* Profile details (non-edit) */}
      {!editing && (family.bio || family.travel_style || (family.kids_ages && family.kids_ages.length > 0)) && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-3">
          {family.kids_ages && family.kids_ages.length > 0 && (
            <div>
              <span className="text-xs text-[var(--text-secondary)]">Kids ages: </span>
              <span className="text-sm">{family.kids_ages.join(", ")}</span>
            </div>
          )}
          {family.travel_style && (
            <div>
              <span className="text-xs text-[var(--text-secondary)]">Travel style: </span>
              <span className="text-sm">{family.travel_style}</span>
            </div>
          )}
          {family.bio && <p className="text-sm text-[var(--text-secondary)]">{family.bio}</p>}
        </div>
      )}

      {/* Trip history */}
      <section>
        <h2 className="font-serif text-2xl font-bold mb-4">Trip History</h2>
        {trips.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
            <p className="text-[var(--text-secondary)] mb-2">No trips logged yet.</p>
            <p className="text-sm text-[var(--text-secondary)]">
              Visit a{" "}
              <Link href="/" className="text-[var(--accent-green)] hover:underline">
                city page
              </Link>
              {" "}and mark yourself as &quot;here now&quot; or &quot;been here&quot;.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {trips.map((trip) => (
              <Link
                key={trip.id}
                href={`/cities/${trip.city_slug}`}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-[var(--accent-green)] transition-colors"
              >
                <span className="text-sm font-medium">{getCityName(trip.city_slug)}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    trip.status === "here_now"
                      ? "bg-[var(--accent-green)]/20 text-[var(--accent-green)]"
                      : "bg-[var(--surface-elevated)] text-[var(--text-secondary)]"
                  }`}
                >
                  {trip.status === "here_now" ? "Here now" : "Been here"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Reviews */}
      <section>
        <h2 className="font-serif text-2xl font-bold mb-4">Your Reviews</h2>
        {reviews.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
            <p className="text-[var(--text-secondary)]">No reviews yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <Link
                key={review.id}
                href={`/cities/${review.city_slug}`}
                className="block rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-[var(--accent-green)] transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{getCityName(review.city_slug)}</span>
                  <span className="text-xs font-mono text-[var(--accent-warm)]">
                    {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">{review.text}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
