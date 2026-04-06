"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { openJoinOverlay } from "@/components/JoinOverlay"
import dynamic from "next/dynamic"
import PeopleTab from "@/components/community/PeopleTab"
import NearbyTab from "@/components/community/NearbyTab"
import KidsMatchTab from "@/components/community/KidsMatchTab"
import MeetupsTab from "@/components/community/MeetupsTab"

const CommunityMap = dynamic(() => import("@/components/CommunityMap"), { ssr: false })

const TABS = [
  { id: "people", label: "People", icon: "👥" },
  { id: "nearby", label: "Nearby", icon: "📍" },
  { id: "kids", label: "Kids Match", icon: "🧒" },
  { id: "meetups", label: "Meetups", icon: "🤝" },
] as const

type TabId = (typeof TABS)[number]["id"]

function CommunityPageInner() {
  const searchParams = useSearchParams()
  const { user, isPaid } = useAuth()
  const initialTab = (searchParams.get("tab") as TabId) || "people"
  const [activeTab, setActiveTab] = useState<TabId>(initialTab)
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<"list" | "map">("list")

  const renderTab = () => {
    // Nearby is always public
    if (activeTab === "nearby") {
      return <NearbyTab selectedCity={selectedCity} />
    }

    // All other tabs require paid membership
    if (!isPaid) {
      return (
        <div className="relative">
          {/* Blurred preview behind */}
          <div className="blur-sm opacity-30 pointer-events-none select-none p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-full bg-[var(--surface-elevated)]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-32 rounded bg-[var(--surface-elevated)]" />
                  <div className="h-2.5 w-48 rounded bg-[var(--surface-elevated)]" />
                </div>
              </div>
            ))}
          </div>
          {/* Paywall overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg)]/80">
            <div className="text-center px-6">
              <p className="text-3xl mb-3">🔒</p>
              <h3 className="font-serif text-lg font-bold mb-2">
                {activeTab === "people" ? "Find families like yours" :
                 activeTab === "kids" ? "Match your kids with playmates" :
                 "Join family meetups"}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4 max-w-xs mx-auto">
                This is available to Uncomun members. One payment, lifetime access for your whole family.
              </p>
              {user ? (
                <button
                  onClick={() => openJoinOverlay()}
                  className="px-6 py-3 rounded-xl bg-[var(--accent-green)] text-black font-medium text-sm hover:opacity-90 transition-opacity"
                >
                  Become a member →
                </button>
              ) : (
                <Link
                  href="/signup"
                  className="inline-block px-6 py-3 rounded-xl bg-[var(--accent-green)] text-black font-medium text-sm hover:opacity-90 transition-opacity"
                >
                  Join Uncomun →
                </Link>
              )}
            </div>
          </div>
        </div>
      )
    }

    // Paid users get full access
    switch (activeTab) {
      case "people":
        return <PeopleTab selectedCity={selectedCity} onCitySelect={setSelectedCity} />
      case "kids":
        return <KidsMatchTab selectedCity={selectedCity} />
      case "meetups":
        return <MeetupsTab selectedCity={selectedCity} />
      default:
        return null
    }
  }

  const tabBar = (
    <div className="flex border-b border-[var(--border)] overflow-x-auto scrollbar-hide shrink-0">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`shrink-0 px-4 py-3 text-sm transition-colors border-b-2 ${
            activeTab === tab.id
              ? "border-[var(--accent-green)] text-[var(--accent-green)]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  )

  const floatingBtnClass = "fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-sm font-medium shadow-lg hover:border-[var(--accent-green)] transition-colors"

  return (
    <>
      {/* Mobile: list/map toggle */}
      <div className="lg:hidden flex flex-col h-[calc(100vh-64px)]">
        {tabBar}
        {mobileView === "list" ? (
          <>
            <div className="flex-1 overflow-y-auto">
              {renderTab()}
            </div>
            <button onClick={() => setMobileView("map")} className={floatingBtnClass}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
              </svg>
              Map
            </button>
          </>
        ) : (
          <>
            <div className="flex-1 relative">
              <CommunityMap
                onCitySelect={(slug) => { setSelectedCity(slug); setMobileView("list") }}
                selectedCity={selectedCity}
              />
            </div>
            <button onClick={() => setMobileView("list")} className={floatingBtnClass}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              List
            </button>
          </>
        )}
      </div>

      {/* Desktop: sidebar + map */}
      <div className="hidden lg:flex h-[calc(100vh-64px)]">
        <div className="flex flex-col w-[380px] border-r border-[var(--border)] bg-[var(--bg)] shrink-0">
          {tabBar}
          <div className="flex-1 overflow-y-auto">
            {renderTab()}
          </div>
        </div>
        <div className="flex-1 relative">
          <CommunityMap onCitySelect={setSelectedCity} selectedCity={selectedCity} />
        </div>
      </div>
    </>
  )
}

export default function CommunityPage() {
  return (
    <Suspense fallback={<div className="flex h-[calc(100vh-64px)] bg-[var(--bg)]" />}>
      <CommunityPageInner />
    </Suspense>
  )
}
