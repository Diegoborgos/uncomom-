"use client"

import { openJoinOverlay } from "./JoinOverlay"

export default function Hero() {
  return (
    <section className="relative w-full h-[85vh] min-h-[600px] overflow-hidden bg-[var(--bg)]">
      {/* Gradient background instead of image */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d1a14] via-[#1a3d28] to-[#0d1a14]" />
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 40%, rgba(76,175,125,0.3) 0%, transparent 60%), radial-gradient(circle at 70% 60%, rgba(212,135,74,0.2) 0%, transparent 50%)" }} />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 text-center">
        <p className="text-sm text-[var(--accent-green)] font-medium tracking-wider uppercase mb-6">
          For families who live differently
        </p>
        <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold text-[var(--text-primary)] leading-tight max-w-4xl mb-6">
          Spent months in a city<br />that failed your family?
        </h1>
        <p className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-xl mb-10">
          Great on paper. Wrong school options. No family community. Traffic that made walking with your kids dangerous. That&apos;s what we prevent.
        </p>

        {/* CTA */}
        <button
          onClick={openJoinOverlay}
          className="px-8 py-3.5 rounded-xl bg-[var(--accent-green)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity text-sm"
        >
          Join Uncomun
        </button>

      </div>
    </section>
  )
}
