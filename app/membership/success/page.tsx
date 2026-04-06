"use client"

import { useEffect, Suspense } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

function SuccessContent() {
  const { user, refreshFamily } = useAuth()
  useEffect(() => {
    if (!user) return
    const refresh = async () => {
      await refreshFamily()
    }
    refresh()
    const timer = setTimeout(refresh, 2000)
    return () => clearTimeout(timer)
  }, [user, refreshFamily])

  // Guest purchase — no session yet
  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[rgb(var(--accent-green-rgb)/0.2)] text-[var(--accent-green)] flex items-center justify-center text-3xl mx-auto mb-8">
          &#10003;
        </div>

        <h1 className="font-serif text-3xl font-bold mb-4">
          Welcome to Uncomun
        </h1>

        <p className="text-[var(--text-secondary)] text-lg mb-2">
          Your lifetime membership is confirmed.
        </p>
        <p className="text-[var(--text-secondary)] mb-10">
          We&apos;ve sent a magic link to your email. Click it to access your account
          and set up your family profile.
        </p>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 mb-6">
          <p className="text-sm font-medium mb-1">Check your inbox</p>
          <p className="text-xs text-[var(--text-secondary)]">
            Look for an email from Uncomun with a sign-in link. It may take a minute to arrive.
          </p>
        </div>

        <Link
          href="/"
          className="text-sm text-[var(--accent-green)] hover:underline"
        >
          Browse cities while you wait &rarr;
        </Link>

        <p className="text-xs text-[var(--text-secondary)] mt-8">
          A receipt has been sent to your email. Questions? hello@uncomun.com
        </p>
      </div>
    )
  }

  // Authenticated purchase
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-[rgb(var(--accent-green-rgb)/0.2)] text-[var(--accent-green)] flex items-center justify-center text-3xl mx-auto mb-8">
        &#10003;
      </div>

      <h1 className="font-serif text-3xl font-bold mb-4">
        Welcome to Uncomun
      </h1>

      <p className="text-[var(--text-secondary)] text-lg mb-2">
        Your lifetime membership is confirmed.
      </p>
      <p className="text-[var(--text-secondary)] mb-10">
        You now have full access to everything &mdash; city intelligence, trip tracker,
        field reports, community features, and everything we build next.
      </p>

      <div className="space-y-3">
        <Link
          href="/onboarding"
          className="block py-3 rounded-xl bg-[var(--accent-green)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity"
        >
          Set up your family profile &rarr;
        </Link>
        <Link
          href="/"
          className="block py-3 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors text-sm"
        >
          Browse cities first
        </Link>
      </div>

      <p className="text-xs text-[var(--text-secondary)] mt-8">
        A receipt has been sent to your email. Questions? hello@uncomun.com
      </p>
    </div>
  )
}

export default function MembershipSuccessPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto px-4 py-20 text-center text-[var(--text-secondary)]">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
