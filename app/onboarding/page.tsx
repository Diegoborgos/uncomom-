"use client"

import Link from "next/link"

export default function OnboardingPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--accent-green)]/20 text-[var(--accent-green)] flex items-center justify-center text-2xl mx-auto mb-6">
        ✓
      </div>
      <h1 className="font-serif text-3xl font-bold mb-4">
        Let&apos;s set up your family profile
      </h1>
      <p className="text-[var(--text-secondary)] mb-8">
        Tell other traveling families a bit about yours — your home country,
        your kids, and how you travel.
      </p>
      <Link
        href="/dashboard"
        className="inline-block px-6 py-3 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity"
      >
        Continue
      </Link>
    </div>
  )
}
