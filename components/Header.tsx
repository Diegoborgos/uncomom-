"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

const NAV_LINKS = [
  { href: "/", label: "Cities" },
  { href: "/map", label: "Map" },
  { href: "/schools", label: "Schools" },
  { href: "/visas", label: "Visa Guide" },
]

export default function Header() {
  const { user, family, loading, signOut } = useAuth()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const profileComplete = Boolean(family?.family_name)

  const initials = family?.family_name
    ? family.family_name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? ""

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
    setDropdownOpen(false)
  }, [pathname])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [mobileOpen])

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <header
      className={`sticky top-0 z-50 bg-[var(--surface)] transition-all duration-200 ${
        scrolled ? "border-b border-[var(--border)] backdrop-blur-sm" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* LEFT — Logo */}
        <Link href="/" className="flex flex-col shrink-0">
          <span className="font-serif text-2xl font-bold text-[var(--text-primary)] tracking-tight leading-none">
            Uncomun
          </span>
          <span className="text-[10px] text-[var(--text-secondary)] leading-none mt-0.5">
            Find your family&apos;s next home
          </span>
        </Link>

        {/* CENTER — Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative py-1 transition-colors ${
                isActive(link.href)
                  ? "text-[var(--accent-green)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {link.label}
              {isActive(link.href) && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-green)] rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        {/* RIGHT — Auth zone + hamburger */}
        <div className="flex items-center gap-3">
          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-[var(--surface-elevated)] animate-pulse" />
            ) : user ? (
              /* Logged in */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 text-sm hover:opacity-90 transition-opacity"
                >
                  <span className="w-8 h-8 rounded-full bg-[var(--accent-green)] text-[var(--bg)] flex items-center justify-center text-xs font-bold">
                    {initials}
                  </span>
                  {profileComplete && (
                    <span className="text-[var(--text-primary)] text-sm">
                      {family?.family_name}
                    </span>
                  )}
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`}>
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-xl overflow-hidden">
                    {profileComplete ? (
                      <>
                        <Link
                          href="/dashboard"
                          className="block px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
                        >
                          My Family
                        </Link>
                        <span className="block px-4 py-3 text-sm text-[var(--text-secondary)] cursor-not-allowed">
                          My Trips
                          <span className="ml-2 text-[10px] bg-[var(--surface)] px-1.5 py-0.5 rounded-full">coming soon</span>
                        </span>
                        <span className="block px-4 py-3 text-sm text-[var(--text-secondary)] cursor-not-allowed">
                          Settings
                          <span className="ml-2 text-[10px] bg-[var(--surface)] px-1.5 py-0.5 rounded-full">coming soon</span>
                        </span>
                      </>
                    ) : (
                      <Link
                        href="/onboarding"
                        className="block px-4 py-3 text-sm text-[var(--accent-warm)] hover:bg-[var(--surface)] transition-colors"
                      >
                        Complete your profile
                      </Link>
                    )}
                    <div className="border-t border-[var(--border)]">
                      <button
                        onClick={() => { signOut(); setDropdownOpen(false) }}
                        className="block w-full text-left px-4 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Logged out */
              <>
                <Link
                  href="/login"
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="text-sm px-4 py-2 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity"
                >
                  Join Families
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex flex-col justify-center items-center w-10 h-10"
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-[var(--text-primary)] transition-all duration-200 ${mobileOpen ? "rotate-45 translate-y-[3px]" : ""}`} />
            <span className={`block w-5 h-0.5 bg-[var(--text-primary)] transition-all duration-200 mt-1.5 ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-[var(--text-primary)] transition-all duration-200 mt-1.5 ${mobileOpen ? "-rotate-45 -translate-y-[9px]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile full-screen overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 top-16 z-50 bg-[var(--bg)]/[0.98] md:hidden">
          <div className="flex flex-col h-full px-6 py-8">
            {/* Nav links */}
            <nav className="flex flex-col gap-6 flex-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-2xl font-serif font-bold transition-colors ${
                    isActive(link.href)
                      ? "text-[var(--accent-green)]"
                      : "text-[var(--text-primary)] hover:text-[var(--accent-green)]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Auth section at bottom */}
            <div className="border-t border-[var(--border)] pt-6 space-y-4">
              {loading ? null : user ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-10 h-10 rounded-full bg-[var(--accent-green)] text-[var(--bg)] flex items-center justify-center text-sm font-bold">
                      {initials}
                    </span>
                    <span className="text-[var(--text-primary)]">
                      {family?.family_name || user.email}
                    </span>
                  </div>
                  {profileComplete ? (
                    <Link href="/dashboard" className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                      My Family
                    </Link>
                  ) : (
                    <Link href="/onboarding" className="block text-[var(--accent-warm)]">
                      Complete your profile
                    </Link>
                  )}
                  <button
                    onClick={() => signOut()}
                    className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/signup"
                    className="text-center py-3 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity"
                  >
                    Join Families
                  </Link>
                  <Link
                    href="/login"
                    className="text-center py-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Sign in
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
