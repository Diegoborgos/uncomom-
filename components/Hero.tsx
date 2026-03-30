"use client"

import Link from "next/link"

export default function Hero() {
  return (
    <section className="relative w-full h-[85vh] min-h-[600px] overflow-hidden bg-[var(--bg)]">
      {/* Pure black with subtle radial glow */}
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: "radial-gradient(circle at 50% 40%, rgba(235,255,0,0.12) 0%, transparent 50%)"
      }} />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 text-center">
        <p className="text-sm text-[var(--accent-green)] font-medium tracking-wider uppercase mb-6">
          For families who live differently
        </p>
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-medium text-white leading-tight max-w-4xl mb-6" style={{ fontFamily: "'Instrument Serif', serif", letterSpacing: "-0.03em" }}>
          Spent months in a city<br />that failed your family?
        </h1>
        <p className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-xl mb-10" style={{ fontFamily: "'Inter', sans-serif" }}>
          Great on paper. Wrong school options. No family community. Traffic that made walking with your kids dangerous. That&apos;s what we prevent.
        </p>

        {/* CTA — yellow pill */}
        <Link
          href="/signup"
          className="px-8 py-3.5 rounded-full bg-[var(--accent-green)] text-black font-semibold hover:opacity-90 transition-opacity text-sm"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Join Uncomun
        </Link>
      </div>
    </section>
  )
}
