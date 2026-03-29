"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

const MEMBER_BENEFITS = [
  "Full city data & detailed cost breakdowns",
  "Trip logger & 183-day residence tracker",
  "Family friend finder & kids peer finder",
  "Meetups — post & RSVP",
  "Member world map",
  "Read & write verified city reviews",
  "Side-by-side city comparison",
  "Lifetime access — one payment, no subscription",
]

let openOverlayFn: (() => void) | null = null

/** Call this from anywhere to open the join overlay */
export function openJoinOverlay() {
  openOverlayFn?.()
}

export default function JoinOverlay() {
  const [open, setOpen] = useState(false)
  const { user, family, isPaid } = useAuth()
  const [guestEmail, setGuestEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    openOverlayFn = () => setOpen(true)
    return () => { openOverlayFn = null }
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
    setError("")
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, handleClose])

  const handleCheckout = async () => {
    setLoading(true)
    setError("")

    try {
      if (user) {
        // Authenticated path
        const { data: { session } } = await supabase.auth.getSession()

        if (!session?.access_token) {
          setError("Please sign in to continue.")
          setLoading(false)
          return
        }

        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            familyId: family?.id || null,
            email: user.email || null,
          }),
        })

        const data = await res.json()
        if (data.url) {
          window.location.href = data.url
        } else {
          setError("Something went wrong. Please try again.")
        }
      } else {
        // Guest path — no auth required
        if (!guestEmail || !guestEmail.includes("@")) {
          setError("Please enter a valid email.")
          setLoading(false)
          return
        }

        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: guestEmail }),
        })

        const data = await res.json()
        if (data.url) {
          window.location.href = data.url
        } else {
          setError(data.error || "Something went wrong. Please try again.")
        }
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!open || isPaid) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-[var(--bg)] border border-[var(--border)] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors z-10"
        >
          ✕
        </button>

        {/* Header */}
        <div className="relative px-8 pt-10 pb-6 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-green)]/8 via-transparent to-[var(--accent-warm)]/8" />
          <div className="relative">
            <h2 className="font-serif text-2xl font-bold mb-2">Join Uncomun</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              One payment. Lifetime access for your whole family.
            </p>
          </div>
        </div>

        {/* Benefits + CTA */}
        <div className="px-8 pb-8">
          <ul className="space-y-2.5 mb-6">
            {MEMBER_BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm">
                <span className="text-[var(--accent-green)] mt-0.5 shrink-0">✓</span>
                <span className="text-[var(--text-secondary)]">{b}</span>
              </li>
            ))}
          </ul>

          {/* Email input for guests */}
          {!user && (
            <input
              type="email"
              placeholder="your@email.com"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCheckout() }}
              className="w-full mb-3 px-4 py-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-green)] transition-colors"
            />
          )}

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="block w-full text-center py-3 rounded-lg bg-[var(--accent-warm)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Redirecting..." : "Join now · €179 lifetime"}
          </button>

          {error && (
            <p className="text-xs text-[var(--score-low)] text-center mt-2">{error}</p>
          )}

          <p className="text-[10px] text-[var(--text-secondary)] text-center mt-3">
            One payment · Whole family · 30-day refund
          </p>

          {!user && (
            <p className="text-center mt-4">
              <Link href="/login" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                Already a member? Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
