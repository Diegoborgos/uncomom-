"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

const FREE_INCLUDES = [
  "Browse city cards with basic scores",
  "Cost calculator",
  "Homeschool laws database",
  "School & visa guide (basic)",
]

const PREMIUM_INCLUDES = [
  "Full city data & detailed costs",
  "Trip logger & residence tracker",
  "Family friend finder",
  "Kids peer finder",
  "Meetups — post & RSVP",
  "Member map",
  "City reviews",
  "Compare tool",
  "Priority new features",
]

/**
 * Full-screen style paywall overlay with free vs premium comparison.
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
      {/* Blurred preview behind */}
      <div className="select-none pointer-events-none" style={{ filter: "blur(8px)", opacity: 0.35 }}>
        {preview || children}
      </div>

      {/* Overlay card */}
      <div className="absolute inset-0 flex items-start justify-center pt-8 pb-8 overflow-y-auto">
        <div className="bg-[var(--bg)] border border-[var(--border)] rounded-2xl max-w-2xl w-full mx-4 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative px-8 pt-10 pb-8 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-green)]/10 via-transparent to-[var(--accent-warm)]/10" />
            <div className="relative">
              <h2 className="font-serif text-3xl font-bold mb-2">
                Unlock {feature}
              </h2>
              <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto">
                Join families who&apos;ve already made Uncomun their home base for living and traveling globally.
              </p>
            </div>
          </div>

          {/* Free vs Premium comparison */}
          <div className="grid grid-cols-2 gap-0 border-t border-[var(--border)]">
            {/* Free column */}
            <div className="p-6 border-r border-[var(--border)]">
              <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">Explorer</p>
              <p className="font-serif text-2xl font-bold mb-4">Free</p>
              <ul className="space-y-2.5">
                {FREE_INCLUDES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                    <span className="mt-0.5 shrink-0">○</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {!user && (
                <Link
                  href="/signup"
                  className="block text-center mt-6 py-2 rounded-lg border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:border-[var(--text-secondary)] transition-colors"
                >
                  Sign up free
                </Link>
              )}
            </div>

            {/* Premium column */}
            <div className="p-6 bg-[var(--surface)]">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs text-[var(--accent-warm)] uppercase tracking-wider">Member</p>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--accent-warm)] text-[var(--bg)] font-medium">Best value</span>
              </div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="font-serif text-2xl font-bold">€149</span>
                <span className="text-xs text-[var(--text-secondary)]">lifetime</span>
              </div>
              <ul className="space-y-2.5">
                {PREMIUM_INCLUDES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs">
                    <span className="text-[var(--accent-green)] mt-0.5 shrink-0">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={user ? "/membership" : "/signup"}
                className="block text-center mt-6 py-2.5 rounded-lg bg-[var(--accent-warm)] text-[var(--bg)] text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {user ? "Get lifetime access" : "Join & unlock"}
              </Link>
              <p className="text-[10px] text-[var(--text-secondary)] text-center mt-2">
                One payment. No subscription. 30-day refund.
              </p>
            </div>
          </div>

          {/* Trust bar */}
          <div className="border-t border-[var(--border)] px-8 py-4 flex items-center justify-center gap-6 text-[10px] text-[var(--text-secondary)]">
            <span>🔒 Secure payment</span>
            <span>🏠 One membership = whole family</span>
            <span>♾️ Lifetime access</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Inline paywall for smaller elements.
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
      <Link
        href={user ? "/membership" : "/signup"}
        className="text-xs px-3 py-1 rounded-full bg-[var(--accent-warm)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity shrink-0"
      >
        {user ? "Unlock · €149" : "Join"}
      </Link>
    </div>
  )
}
