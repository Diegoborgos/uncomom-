"use client"

import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

function SuccessContent() {
  const { refreshFamily } = useAuth()
  const [, setRefreshed] = useState(false)

  useEffect(() => {
    const refresh = async () => {
      await refreshFamily()
      setRefreshed(true)
    }

    refresh()
    const timer = setTimeout(refresh, 2000)
    return () => clearTimeout(timer)
  }, [refreshFamily])

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--accent-green)]/20 text-[var(--accent-green)] flex items-center justify-center text-3xl mx-auto mb-8">
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
          href="/"
          className="block py-3 rounded-xl bg-[var(--accent-green)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity"
        >
          Explore cities &rarr;
        </Link>
        <Link
          href="/dashboard"
          className="block py-3 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors text-sm"
        >
          Set up my family profile
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
