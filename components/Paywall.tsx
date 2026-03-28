"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

/**
 * Wraps content that should be gated for free users.
 * Free users see a blurred preview with an upgrade CTA overlay.
 * Paid users see the content normally.
 * Logged-out users see sign-up prompt.
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
      <div className="select-none pointer-events-none" style={{ filter: "blur(6px)", opacity: 0.5 }}>
        {preview || children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 max-w-sm mx-4 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-[var(--accent-warm)]/20 text-[var(--accent-warm)] flex items-center justify-center text-xl mx-auto mb-4">
            🔒
          </div>
          <h3 className="font-serif text-lg font-bold mb-2">
            {feature}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-5">
            {user
              ? "This feature is available to Uncomun members. One-time payment, lifetime access."
              : "Sign up and join Uncomun to unlock this feature."
            }
          </p>
          {user ? (
            <Link
              href="/membership"
              className="inline-block w-full py-2.5 rounded-lg bg-[var(--accent-warm)] text-[var(--bg)] font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Unlock for €149 · Lifetime
            </Link>
          ) : (
            <div className="space-y-2">
              <Link
                href="/signup"
                className="block w-full py-2.5 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] font-medium text-sm hover:opacity-90 transition-opacity"
              >
                Join Uncomun
              </Link>
              <Link
                href="/login"
                className="block text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Already a member? Sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Inline paywall for smaller elements — shows a lock icon + link instead of blur.
 */
export function PaywallInline({ feature }: { feature: string }) {
  const { user, isPaid } = useAuth()

  if (isPaid) return null

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm">🔒</span>
        <span className="text-xs text-[var(--text-secondary)]">{feature}</span>
      </div>
      <Link
        href={user ? "/membership" : "/signup"}
        className="text-xs px-3 py-1 rounded-full bg-[var(--accent-warm)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity shrink-0"
      >
        {user ? "Unlock" : "Join"}
      </Link>
    </div>
  )
}
