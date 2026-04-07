"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Review, Family } from "@/lib/database.types"
import Paywall from "./Paywall"
import Link from "next/link"

type ReviewWithFamily = Review & { families: Pick<Family, "family_name" | "country_code"> | null }

export default function CityReviews({ citySlug }: { citySlug: string }) {
  const { user, family, isPaid } = useAuth()
  const [reviews, setReviews] = useState<ReviewWithFamily[]>([])
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [rating, setRating] = useState(4)
  const [text, setText] = useState("")
  const [bestNeighbourhood, setBestNeighbourhood] = useState("")
  const [schoolUsed, setSchoolUsed] = useState("")
  const [housingReality, setHousingReality] = useState("")
  const [wouldDoDifferently, setWouldDoDifferently] = useState("")

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*, families(family_name, country_code)")
      .eq("city_slug", citySlug)
      .order("created_at", { ascending: false })
    setReviews((data as ReviewWithFamily[]) || [])
  }

  useEffect(() => {
    fetchReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citySlug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!family) return
    setSubmitting(true)

    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("family_id", family.id)
      .eq("city_slug", citySlug)
      .limit(1)

    const payload = {
      rating,
      text,
      best_neighbourhood: bestNeighbourhood,
      school_used: schoolUsed,
      housing_cost_reality: housingReality,
      would_do_differently: wouldDoDifferently,
      updated_at: new Date().toISOString(),
    }

    if (existing && existing.length > 0) {
      await supabase.from("reviews").update(payload).eq("id", existing[0].id)
    } else {
      await supabase.from("reviews").insert({
        family_id: family.id,
        city_slug: citySlug,
        ...payload,
      })

      // Award review points (non-blocking)
      try {
        const { data: { session: awardSession } } = await supabase.auth.getSession()
        if (awardSession?.access_token) {
          await fetch("/api/gamification/award", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${awardSession.access_token}` },
            body: JSON.stringify({ action: "city_review", description: `Reviewed ${citySlug}` }),
          })
        }
      } catch { /* non-blocking */ }
    }

    setText("")
    setBestNeighbourhood("")
    setSchoolUsed("")
    setHousingReality("")
    setWouldDoDifferently("")
    setShowForm(false)
    setSubmitting(false)
    fetchReviews()
  }

  const flag = (code: string) =>
    code.toUpperCase().split("").map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join("")

  // Gate reviews behind paywall
  if (!isPaid && reviews.length > 0) {
    return (
      <div>
        <h2 className="font-serif text-2xl font-bold mb-6">Family Reviews</h2>
        <Paywall feature="Family Reviews" preview={
          <div className="space-y-4">
            {reviews.slice(0, 3).map((r) => (
              <div key={r.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="h-4 w-32 bg-[var(--surface-elevated)] rounded mb-2" />
                <div className="h-3 w-full bg-[var(--surface-elevated)] rounded mb-1" />
                <div className="h-3 w-2/3 bg-[var(--surface-elevated)] rounded" />
              </div>
            ))}
          </div>
        }>
          <ReviewList reviews={reviews} flag={flag} />
        </Paywall>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl font-bold">Family Reviews</h2>
        {user && family && isPaid && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)] hover:text-[var(--accent-green)] transition-colors"
          >
            {showForm ? "Cancel" : "Write a review"}
          </button>
        )}
      </div>

      {/* Review form — structured */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 mb-6 space-y-4">
          {/* Rating */}
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-2">Overall rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl transition-colors ${
                    star <= rating ? "text-[var(--accent-warm)]" : "text-[var(--border)]"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Your experience *</label>
            <textarea
              required value={text} onChange={(e) => setText(e.target.value)} rows={3}
              placeholder="What was it like living here with your family?"
              className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)] resize-none"
            />
          </div>

          {/* Structured fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Best neighbourhood for families</label>
              <input
                value={bestNeighbourhood} onChange={(e) => setBestNeighbourhood(e.target.value)}
                placeholder="e.g. Estrela, Principe Real"
                className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">School used</label>
              <input
                value={schoolUsed} onChange={(e) => setSchoolUsed(e.target.value)}
                placeholder="e.g. St. Julian's, homeschool"
                className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Housing cost reality</label>
            <input
              value={housingReality} onChange={(e) => setHousingReality(e.target.value)}
              placeholder="e.g. We paid €1,400 for a 2br in Alfama, listed prices are lower than reality"
              className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">What would you do differently?</label>
            <input
              value={wouldDoDifferently} onChange={(e) => setWouldDoDifferently(e.target.value)}
              placeholder="e.g. Arrive in September, not January. Join parent WhatsApp groups before landing."
              className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
            />
          </div>

          <button
            type="submit" disabled={submitting}
            className="px-4 py-2 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Posting..." : "Post review"}
          </button>
        </form>
      )}

      {/* Review list */}
      {reviews.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <p className="text-[var(--text-secondary)]">No reviews yet. Be the first family to share your experience.</p>
          {!user && (
            <Link href="/login" className="inline-block mt-3 text-sm text-[var(--accent-green)] hover:underline">
              Sign in to write a review
            </Link>
          )}
        </div>
      ) : (
        <ReviewList reviews={reviews} flag={flag} />
      )}
    </div>
  )
}

function ReviewList({ reviews, flag }: { reviews: ReviewWithFamily[]; flag: (code: string) => string }) {
  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[var(--accent-green)] text-[var(--bg)] flex items-center justify-center text-[10px] font-bold">
                {review.families?.family_name?.slice(0, 2).toUpperCase() ?? "??"}
              </span>
              <span className="text-sm font-medium">
                {review.families?.country_code ? flag(review.families.country_code) + " " : ""}
                {review.families?.family_name ?? "A family"}
              </span>
            </div>
            <span className="text-xs font-mono text-[var(--accent-warm)]">
              {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
            </span>
          </div>

          {/* Main text */}
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">{review.text}</p>

          {/* Structured fields */}
          {(review.best_neighbourhood || review.school_used || review.housing_cost_reality || review.would_do_differently) && (
            <div className="grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-3">
              {review.best_neighbourhood && (
                <StructuredField label="Best neighbourhood" value={review.best_neighbourhood} />
              )}
              {review.school_used && (
                <StructuredField label="School used" value={review.school_used} />
              )}
              {review.housing_cost_reality && (
                <StructuredField label="Housing reality" value={review.housing_cost_reality} />
              )}
              {review.would_do_differently && (
                <StructuredField label="Would do differently" value={review.would_do_differently} />
              )}
            </div>
          )}

          <p className="text-xs text-[var(--text-secondary)] mt-3 opacity-50">
            {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
      ))}
    </div>
  )
}

function StructuredField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-xs text-[var(--text-primary)]">{value}</p>
    </div>
  )
}
