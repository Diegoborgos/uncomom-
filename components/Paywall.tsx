"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { openJoinOverlay } from "./JoinOverlay"

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

/**
 * CTA logic used across all paywall components:
 * - Logged out → "Join Uncomun" → /signup (create account)
 * - Logged in, not paid → "Unlock details" → opens JoinOverlay (buy membership)
 */

/**
 * PaywallBlur — blurs a small section of content with a thin unlock bar.
 */
export function PaywallBlur({ children }: { children: React.ReactNode }) {
  const { isPaid, loading } = useAuth()
  if (loading || isPaid) return <>{children}</>

  return (
    <div className="relative">
      <div className="select-none pointer-events-none max-h-48 overflow-hidden" style={{ filter: "blur(5px)", opacity: 0.4 }}>
        {children}
      </div>
      <div className="absolute inset-0 flex items-end justify-center pb-2">
        <button
          onClick={openJoinOverlay}
          className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-[var(--accent-warm)] text-[var(--bg)] hover:opacity-90 transition-opacity shadow-xl"
        >
          🔒 Unlock details
        </button>
      </div>
    </div>
  )
}

/**
 * PaywallGate — clean card that gates interactive/premium features.
 */
export function PaywallGate({ feature }: { feature: string }) {
  const { user, isPaid, loading } = useAuth()
  if (loading || isPaid) return null

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
      <div className="w-10 h-10 rounded-full bg-[var(--accent-warm)]/15 text-[var(--accent-warm)] flex items-center justify-center text-lg mx-auto mb-4">
        🔒
      </div>
      <h3 className="font-serif text-xl font-bold mb-2">{feature}</h3>
      <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-sm mx-auto">
        This is available to Uncomun members. One payment, lifetime access for your whole family.
      </p>
      {user ? (
        <button
          onClick={openJoinOverlay}
          className="inline-block px-6 py-2.5 rounded-lg bg-[var(--accent-warm)] text-[var(--bg)] font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Unlock details
        </button>
      ) : (
        <Link
          href="/signup"
          className="inline-block px-6 py-2.5 rounded-lg bg-[var(--accent-warm)] text-[var(--bg)] font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Join Uncomun
        </Link>
      )}
    </div>
  )
}

/**
 * Paywall — full overlay for entire sections (community pages).
 */
export default function Paywall({
  children,
  feature,
  preview,
}: {
  children: React.ReactNode
  feature: string
  preview?: React.ReactNode
}) {
  const { user, isPaid, loading } = useAuth()

  if (loading) return <>{preview || children}</>
  if (isPaid) return <>{children}</>

  return (
    <div className="relative">
      {/* Blurred preview */}
      <div className="select-none pointer-events-none" style={{ filter: "blur(8px)", opacity: 0.3 }}>
        {preview || children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
        <div className="bg-[var(--bg)] border border-[var(--border)] rounded-2xl max-w-md w-full mx-4 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative px-8 pt-10 pb-6 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-green)]/8 via-transparent to-[var(--accent-warm)]/8" />
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-[var(--accent-warm)]/15 text-[var(--accent-warm)] flex items-center justify-center text-xl mx-auto mb-4">
                🔒
              </div>
              <h2 className="font-serif text-2xl font-bold mb-2">{feature}</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Available to Uncomun members
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="px-8 pb-6">
            <ul className="space-y-2.5 mb-6">
              {MEMBER_BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm">
                  <span className="text-[var(--accent-green)] mt-0.5 shrink-0">✓</span>
                  <span className="text-[var(--text-secondary)]">{b}</span>
                </li>
              ))}
            </ul>

            {user ? (
              <button
                onClick={openJoinOverlay}
                className="block w-full text-center py-3 rounded-lg bg-[var(--accent-warm)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity"
              >
                Unlock details
              </button>
            ) : (
              <Link
                href="/signup"
                className="block text-center py-3 rounded-lg bg-[var(--accent-warm)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity"
              >
                Join Uncomun
              </Link>
            )}
            <p className="text-[10px] text-[var(--text-secondary)] text-center mt-2">
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
    </div>
  )
}

/**
 * Inline paywall for small elements.
 */
export function PaywallInline({ feature }: { feature: string }) {
  const { user, isPaid } = useAuth()
  if (isPaid) return null

  return (
    <div className="rounded-lg border border-[var(--accent-warm)]/30 bg-[var(--accent-warm)]/5 px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm">🔒</span>
        <span className="text-xs text-[var(--text-secondary)]">{feature}</span>
      </div>
      {user ? (
        <button
          onClick={openJoinOverlay}
          className="text-xs px-3 py-1 rounded-full bg-[var(--accent-warm)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity shrink-0"
        >
          Unlock
        </button>
      ) : (
        <Link
          href="/signup"
          className="text-xs px-3 py-1 rounded-full bg-[var(--accent-warm)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity shrink-0"
        >
          Join
        </Link>
      )}
    </div>
  )
}
