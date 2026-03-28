"use client"

import Link from "next/link"

export default function Header() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex flex-col">
            <span className="font-serif text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              Uncomun
            </span>
            <span className="text-xs text-[var(--text-secondary)] -mt-1">
              Find your family&apos;s next home
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link
              href="/"
              className="text-[var(--text-primary)] hover:text-[var(--accent-green)] transition-colors"
            >
              Cities
            </Link>
            <span className="text-[var(--text-secondary)] cursor-not-allowed" title="Map view coming soon">
              Map
            </span>
            <span className="text-[var(--text-secondary)] cursor-not-allowed" title="Coming soon">
              Community
              <span className="ml-1 text-[10px] bg-[var(--surface-elevated)] px-1.5 py-0.5 rounded-full">soon</span>
            </span>
            <span className="text-[var(--text-secondary)] cursor-not-allowed" title="Coming soon">
              Schools
              <span className="ml-1 text-[10px] bg-[var(--surface-elevated)] px-1.5 py-0.5 rounded-full">soon</span>
            </span>
            <span className="text-[var(--text-secondary)] cursor-not-allowed" title="Coming soon">
              Visa Guide
              <span className="ml-1 text-[10px] bg-[var(--surface-elevated)] px-1.5 py-0.5 rounded-full">soon</span>
            </span>
          </nav>
        </div>
        <Link
          href="/join"
          className="text-sm px-4 py-2 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity"
        >
          Join Families
        </Link>
      </div>
    </header>
  )
}
