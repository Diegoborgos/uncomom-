"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Trip } from "@/lib/database.types"
import Link from "next/link"

export default function TripTracker({ citySlug }: { citySlug: string }) {
  const { user, family } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form state
  const [status, setStatus] = useState<"here_now" | "been_here">("here_now")
  const [arrivedAt, setArrivedAt] = useState("")
  const [leftAt, setLeftAt] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (family) {
      supabase
        .from("trips")
        .select("*")
        .eq("family_id", family.id)
        .eq("city_slug", citySlug)
        .order("created_at", { ascending: false })
        .then(({ data }) => setTrips(data || []))
    }
  }, [family, citySlug])

  const currentTrip = trips.find((t) => t.status === "here_now")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!family) return
    setLoading(true)

    const { data } = await supabase
      .from("trips")
      .insert({
        family_id: family.id,
        city_slug: citySlug,
        status,
        arrived_at: arrivedAt || null,
        left_at: status === "been_here" ? (leftAt || null) : null,
        notes,
      })
      .select()
      .single()

    if (data) setTrips([data, ...trips])
    setShowForm(false)
    setArrivedAt("")
    setLeftAt("")
    setNotes("")
    setLoading(false)
  }

  const markLeft = async (tripId: string) => {
    setLoading(true)
    const { data } = await supabase
      .from("trips")
      .update({ status: "been_here" as const, left_at: new Date().toISOString() })
      .eq("id", tripId)
      .select()
      .single()
    if (data) setTrips(trips.map((t) => (t.id === tripId ? data : t)))
    setLoading(false)
  }

  const removeTrip = async (tripId: string) => {
    setLoading(true)
    await supabase.from("trips").delete().eq("id", tripId)
    setTrips(trips.filter((t) => t.id !== tripId))
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg font-bold">Trip Log</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)] hover:text-[var(--accent-green)] transition-colors"
          >
            + Log a trip
          </button>
        )}
      </div>

      {/* Quick actions */}
      {!showForm && !currentTrip && trips.length === 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={() => { setStatus("here_now"); setArrivedAt(new Date().toISOString().split("T")[0]); setShowForm(true) }}
            disabled={loading}
            className="flex-1 min-w-[140px] py-2.5 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)] hover:text-[var(--accent-green)] transition-all"
          >
            I&apos;m here now
          </button>
          <button
            onClick={() => { setStatus("been_here"); setShowForm(true) }}
            disabled={loading}
            className="flex-1 min-w-[140px] py-2.5 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-warm)] hover:text-[var(--accent-warm)] transition-all"
          >
            I&apos;ve been here
          </button>
        </div>
      )}

      {/* Current trip banner */}
      {currentTrip && (
        <div className="flex items-center justify-between bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/30 rounded-lg px-4 py-3 mb-4">
          <div>
            <p className="text-sm font-medium text-[var(--accent-green)]">You&apos;re here now</p>
            {currentTrip.arrived_at && (
              <p className="text-xs text-[var(--text-secondary)]">
                Since {new Date(currentTrip.arrived_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            )}
          </div>
          <button
            onClick={() => markLeft(currentTrip.id)}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Mark as left
          </button>
        </div>
      )}

      {/* Log form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 mb-4 border border-[var(--border)] rounded-lg p-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStatus("here_now")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                status === "here_now"
                  ? "bg-[var(--accent-green)] text-[var(--bg)]"
                  : "border border-[var(--border)] text-[var(--text-secondary)]"
              }`}
            >
              Here now
            </button>
            <button
              type="button"
              onClick={() => setStatus("been_here")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                status === "been_here"
                  ? "bg-[var(--accent-warm)] text-[var(--bg)]"
                  : "border border-[var(--border)] text-[var(--text-secondary)]"
              }`}
            >
              Been here
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Arrived</label>
              <input
                type="date"
                value={arrivedAt}
                onChange={(e) => setArrivedAt(e.target.value)}
                className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
              />
            </div>
            {status === "been_here" && (
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Left</label>
                <input
                  type="date"
                  value={leftAt}
                  onChange={(e) => setLeftAt(e.target.value)}
                  className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Best neighbourhood, school used, what you'd recommend..."
              className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-green)] resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Saving..." : "Log trip"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Past trips */}
      {trips.filter((t) => t.status === "been_here").length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-[var(--text-secondary)] font-medium">Past visits</p>
          {trips
            .filter((t) => t.status === "been_here")
            .map((trip) => (
              <div
                key={trip.id}
                className="flex items-start justify-between py-2 border-b border-[var(--border)] last:border-0"
              >
                <div>
                  <p className="text-sm text-[var(--text-primary)]">
                    {trip.arrived_at
                      ? new Date(trip.arrived_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                      : "Unknown date"}
                    {trip.left_at && (
                      <span className="text-[var(--text-secondary)]">
                        {" → "}
                        {new Date(trip.left_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </span>
                    )}
                  </p>
                  {trip.notes && (
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{trip.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => removeTrip(trip.id)}
                  className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--score-low)] transition-colors shrink-0 ml-2"
                >
                  remove
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
