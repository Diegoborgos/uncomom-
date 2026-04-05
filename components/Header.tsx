"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"

const NAV_LINKS = [
  { href: "/", label: "Cities" },
  { href: "/map", label: "Map" },
  { href: "/community", label: "Community" },
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
      className={`sticky top-0 z-50 bg-[var(--bg)] transition-all duration-200 ${
        scrolled ? "border-b border-[var(--border)]" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* LEFT — Logo */}
        <Link href="/" className="shrink-0">
          <span className="font-serif text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            Uncomun
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
              <div className="flex items-center gap-3">
                {/* Message icon with unread badge */}
                <MessageBadge />
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
                  Sign up
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

      <MobileMenu
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        isActive={isActive}
        user={user}
        family={family}
        loading={loading}
        initials={initials}
        profileComplete={profileComplete}
        signOut={signOut}
      />
    </header>
  )
}

function MobileMenu({
  mobileOpen,
  setMobileOpen,
  isActive,
  user,
  family,
  loading,
  initials,
  profileComplete,
  signOut,
}: {
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
  isActive: (href: string) => boolean
  user: unknown
  family: { family_name?: string; email?: string } | null
  loading: boolean
  initials: string
  profileComplete: boolean
  signOut: () => void
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted || !mobileOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 flex flex-col md:hidden"
      style={{ backgroundColor: "var(--bg)", zIndex: 99999 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-16 shrink-0">
        <Link href="/" onClick={() => setMobileOpen(false)}>
          <span className="font-serif text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            Uncomun
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="w-10 h-10 flex items-center justify-center"
          aria-label="Close menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round">
            <path d="M4 4l12 12M16 4L4 16" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-4 pt-4 flex-1">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setMobileOpen(false)}
            className={`text-3xl font-serif font-bold py-3 ${
              isActive(link.href) ? "text-[var(--accent-green)]" : "text-[var(--text-primary)]"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Auth */}
      <div className="px-4 pb-8 pt-4 border-t border-[var(--border)] space-y-3">
        {loading ? null : user ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 rounded-full bg-[var(--accent-green)] text-[var(--bg)] flex items-center justify-center text-sm font-bold">
                {initials}
              </span>
              <span className="text-[var(--text-primary)]">
                {family?.family_name || "My Family"}
              </span>
            </div>
            {profileComplete ? (
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block text-lg text-[var(--text-secondary)] py-1">
                My Family
              </Link>
            ) : (
              <Link href="/onboarding" onClick={() => setMobileOpen(false)} className="block text-lg text-[var(--accent-warm)] py-1">
                Complete your profile
              </Link>
            )}
            <Link href="/messages" onClick={() => setMobileOpen(false)} className="block text-lg text-[var(--text-secondary)] py-1">
              Messages
            </Link>
            <button
              onClick={() => { signOut(); setMobileOpen(false) }}
              className="block text-lg text-[var(--text-secondary)] py-1"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/signup"
              onClick={() => setMobileOpen(false)}
              className="block text-center py-3.5 rounded-xl bg-[var(--accent-green)] text-[var(--bg)] font-medium text-lg"
            >
              Sign up
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block text-center py-3 text-[var(--text-secondary)]"
            >
              Sign in
            </Link>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}

function MessageBadge() {
  const [unread, setUnread] = useState(0)

  const fetchUnread = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      const res = await fetch("/api/messages/unread", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      setUnread(data.count || 0)
    } catch { /* */ }
  }, [])

  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    const onRead = () => fetchUnread()
    window.addEventListener("messages-read", onRead)
    return () => {
      clearInterval(interval)
      window.removeEventListener("messages-read", onRead)
    }
  }, [fetchUnread])

  return (
    <Link href="/messages" className="relative hover:opacity-80 transition-opacity">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
      {unread > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-[var(--accent-green)] text-black text-[9px] font-bold flex items-center justify-center px-1">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  )
}
