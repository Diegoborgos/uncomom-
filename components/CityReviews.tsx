"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Review, Family } from "@/lib/database.types"
import Link from "next/link"

type ReviewWithFamily = Review & { families: Pick<Family, "family_name" | "country_code"> | null }

export default function CityReviews({ citySlug }: { citySlug: string }) {
  const { user, family } = useAuth()
  const [reviews, setReviews] = useState<ReviewWithFamily[]>([])
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(4)
  const [text, setText] = useState("")
  const [submitting, setSubmitting] = useState(false)

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

    // Check if user already reviewed this city
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("family_id", family.id)
      .eq("city_slug", citySlug)
      .limit(1)

    if (existing && existing.length > 0) {
      // Update existing review
      await supabase
        .from("reviews")
        .update({ rating, text, updated_at: new Date().toISOString() })
        .eq("id", existing[0].id)
    } else {
      // Create new review
      await supabase
        .from("reviews")
        .insert({ family_id: family.id, city_slug: citySlug, rating, text })
    }

    setText("")
    setShowForm(false)
    setSubmitting(false)
    fetchReviews()
  }

  const countryCodeToFlag = (code: string) =>
    code
      .toUpperCase()
      .split("")
      .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
      .join("")

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl font-bold">Family Reviews</h2>
        {user && family && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)] hover:text-[var(--accent-green)] transition-colors"
          >
            {showForm ? "Cancel" : "Write a review"}
          </button>
        )}
      </div>

      {/* Review form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 mb-6 space-y-4">
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-2">Rating</label>
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
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Your review</label>
            <textarea
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)] resize-none"
              placeholder="What was it like for your family?"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
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
            <Link
              href="/login"
              className="inline-block mt-3 text-sm text-[var(--accent-green)] hover:underline"
            >
              Sign in to write a review
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-[var(--accent-green)] text-[var(--bg)] flex items-center justify-center text-[10px] font-bold">
                    {review.families?.family_name?.slice(0, 2).toUpperCase() ?? "??"}
                  </span>
                  <span className="text-sm font-medium">
                    {review.families?.country_code
                      ? countryCodeToFlag(review.families.country_code) + " "
                      : ""}
                    {review.families?.family_name ?? "A family"}
                  </span>
                </div>
                <span className="text-xs font-mono text-[var(--accent-warm)]">
                  {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                </span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{review.text}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-2 opacity-50">
                {new Date(review.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
