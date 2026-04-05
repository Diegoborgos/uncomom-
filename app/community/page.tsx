"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
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
  const initialTab = (searchParams.get("tab") as TabId) || "people"
  const [activeTab, setActiveTab] = useState<TabId>(initialTab)
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const activeLabel = TABS.find((t) => t.id === activeTab)?.label || "People"

  const renderTab = () => {
    switch (activeTab) {
      case "people":
        return <PeopleTab selectedCity={selectedCity} onCitySelect={setSelectedCity} />
      case "nearby":
        return <NearbyTab selectedCity={selectedCity} />
      case "kids":
        return <KidsMatchTab selectedCity={selectedCity} />
      case "meetups":
        return <MeetupsTab selectedCity={selectedCity} />
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

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-[380px] border-r border-[var(--border)] bg-[var(--bg)] shrink-0">
        {tabBar}
        <div className="flex-1 overflow-y-auto">
          {renderTab()}
        </div>
      </div>

      {/* Mobile bottom sheet toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-5 py-2.5 rounded-full bg-[var(--accent-green)] text-[var(--bg)] font-medium text-sm shadow-lg hover:opacity-90 transition-opacity"
      >
        {mobileOpen ? "Show map" : `Show ${activeLabel.toLowerCase()}`}
      </button>

      {/* Mobile bottom sheet */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 h-[70vh] rounded-t-2xl border-t border-[var(--border)] bg-[var(--bg)] flex flex-col">
          {/* Drag handle */}
          <div className="flex justify-center py-2 shrink-0">
            <div className="w-10 h-1 rounded-full bg-[var(--border)]" />
          </div>
          {tabBar}
          <div className="flex-1 overflow-y-auto">
            {renderTab()}
          </div>
        </div>
      )}

      {/* Map */}
      <div className="flex-1 relative">
        <CommunityMap onCitySelect={setSelectedCity} selectedCity={selectedCity} />
      </div>
    </div>
  )
}

export default function CommunityPage() {
  return (
    <Suspense fallback={<div className="flex h-[calc(100vh-64px)] bg-[var(--bg)]" />}>
      <CommunityPageInner />
    </Suspense>
  )
}
