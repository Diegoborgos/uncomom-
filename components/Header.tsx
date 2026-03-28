"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

const NAV_LINKS = [
  { href: "/", label: "Cities" },
  { href: "/map", label: "Map" },
  { href: "/schools", label: "Schools" },
  { href: "/visas", label: "Visa Guide" },
]

export default function Header() {
  const { user, family, loading, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const initials = family?.family_name
    ? family.family_name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? ""

  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)] relative z-40">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex flex-col" onClick={() => setMobileOpen(false)}>
            <span className="font-serif text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              Uncomun
            </span>
            <span className="text-xs text-[var(--text-secondary)] -mt-1">
              Find your family&apos;s next home
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[var(--text-primary)] hover:text-[var(--accent-green)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-[var(--surface-elevated)] animate-pulse" />
          ) : user ? (
            <>
              <Link
                href="/profile"
                className="flex items-center gap-2 text-sm text-[var(--text-primary)] hover:text-[var(--accent-green)] transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <span className="w-8 h-8 rounded-full bg-[var(--accent-green)] text-[var(--bg)] flex items-center justify-center text-xs font-bold">
                  {initials}
                </span>
                <span className="hidden sm:inline">
                  {family?.family_name || "My Family"}
                </span>
              </Link>
              <button
                onClick={() => signOut()}
                className="hidden sm:block text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="hidden sm:block text-sm px-4 py-2 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity"
              onClick={() => setMobileOpen(false)}
            >
              Join Families
            </Link>
          )}
          {/* Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex flex-col gap-1.5 p-1"
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-[var(--text-primary)] transition-transform ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-[var(--text-primary)] transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-[var(--text-primary)] transition-transform ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--surface)]">
          <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-[var(--text-primary)] hover:text-[var(--accent-green)] transition-colors text-lg"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-[var(--border)] pt-4 mt-2">
              {user ? (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="text-[var(--text-primary)] hover:text-[var(--accent-green)] transition-colors text-lg"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => { signOut(); setMobileOpen(false) }}
                    className="text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="inline-block text-sm px-4 py-2 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] font-medium"
                >
                  Join Families
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
