"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Trip } from "@/lib/database.types"
import Link from "next/link"

export default function TripTracker({ citySlug }: { citySlug: string }) {
  const { user, family } = useAuth()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (family) {
      supabase
        .from("trips")
        .select("*")
        .eq("family_id", family.id)
        .eq("city_slug", citySlug)
        .order("created_at", { ascending: false })
        .limit(1)
        .then(({ data }) => setTrip(data?.[0] ?? null))
    }
  }, [family, citySlug])

  const markTrip = async (status: "here_now" | "been_here") => {
    if (!family) return
    setLoading(true)

    if (trip) {
      // Update existing trip
      const { data } = await supabase
        .from("trips")
        .update({
          status,
          arrived_at: status === "here_now" ? new Date().toISOString() : trip.arrived_at,
          left_at: status === "been_here" ? new Date().toISOString() : null,
        })
        .eq("id", trip.id)
        .select()
        .single()
      setTrip(data)
    } else {
      // Create new trip
      const { data } = await supabase
        .from("trips")
        .insert({
          family_id: family.id,
          city_slug: citySlug,
          status,
          arrived_at: status === "here_now" ? new Date().toISOString() : null,
          left_at: status === "been_here" ? new Date().toISOString() : null,
        })
        .select()
        .single()
      setTrip(data)
    }
    setLoading(false)
  }

  const removeTrip = async () => {
    if (!trip) return
    setLoading(true)
    await supabase.from("trips").delete().eq("id", trip.id)
    setTrip(null)
    setLoading(false)
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
        <p className="text-sm text-[var(--text-secondary)] mb-3">
          Track your travels and connect with other families.
        </p>
        <Link
          href="/login"
          className="inline-block text-sm px-4 py-2 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity"
        >
          Sign in to log trips
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h3 className="font-serif text-lg font-bold mb-4">Your Trip Status</h3>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => markTrip("here_now")}
          disabled={loading}
          className={`flex-1 min-w-[140px] py-2.5 rounded-lg text-sm font-medium transition-all ${
            trip?.status === "here_now"
              ? "bg-[var(--accent-green)] text-[var(--bg)]"
              : "border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)] hover:text-[var(--accent-green)]"
          }`}
        >
          {trip?.status === "here_now" ? "✓ Here now" : "I'm here now"}
        </button>
        <button
          onClick={() => markTrip("been_here")}
          disabled={loading}
          className={`flex-1 min-w-[140px] py-2.5 rounded-lg text-sm font-medium transition-all ${
            trip?.status === "been_here"
              ? "bg-[var(--accent-warm)] text-[var(--bg)]"
              : "border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-warm)] hover:text-[var(--accent-warm)]"
          }`}
        >
          {trip?.status === "been_here" ? "✓ Been here" : "I've been here"}
        </button>
        {trip && (
          <button
            onClick={removeTrip}
            disabled={loading}
            className="py-2.5 px-4 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--score-low)] border border-[var(--border)] hover:border-[var(--score-low)] transition-colors"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  )
}
