"use client"

import { useState } from "react"
import Link from "next/link"
import { City } from "@/lib/types"
import CityCard from "./CityCard"
import { formatEuro } from "@/lib/scores"
import FISBreakdownV2 from "./FISBreakdownV2"
import CityIntelligence from "./CityIntelligence"
import PlacesGallery from "./PlacesGallery"
import CityVisas from "./CityVisas"
import CityReviews from "./CityReviews"
import CitySchoolsTab from "./CitySchoolsTab"
import FamiliesHere from "./FamiliesHere"
import TripTracker from "./TripTracker"
import CostPanelGated from "./CostPanelGated"
import MetaPanelGated from "./MetaPanelGated"
import { useCityOverview, CityOverviewContext } from "@/lib/use-city-overview"
import PersonalBadge from "./ui/PersonalBadge"
import CityWhatsHappening from "./CityWhatsHappening"

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "intelligence", label: "Intelligence" },
  { id: "schools", label: "Schools" },
  { id: "visas", label: "Visas" },
  { id: "places", label: "Things to Do" },
  { id: "community", label: "Community" },
] as const

type TabId = typeof TABS[number]["id"]

export default function CityPageTabs({
  city,
  relatedCities,
}: {
  city: City
  relatedCities: City[]
}) {
  const [activeTab, setActiveTab] = useState<TabId>("overview")
  const { data: overview } = useCityOverview(city)

  return (
    <CityOverviewContext.Provider value={overview}>
    <div>
      {/* Sticky tab bar */}
      <div className="sticky top-16 z-30 bg-[var(--bg)] border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-[var(--accent-green)] text-[var(--accent-green)]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* FIS Breakdown — reads from context */}
            <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="font-serif text-xl font-bold">Family Intelligence Score&trade;</h2>
                {overview?.fis.isPersonalized && <PersonalBadge label="Personalized" />}
              </div>
              <FISBreakdownV2 />
            </section>

            {/* What's happening — from intelligence engine */}
            <CityWhatsHappening citySlug={city.slug} />

            {/* About */}
            <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="font-serif text-xl font-bold mb-3">About {city.name}</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">{city.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {city.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/?tags=${encodeURIComponent(tag)}`}
                    className="text-xs px-2.5 py-1 rounded-full text-[var(--accent-green)] border border-[rgb(var(--accent-green-rgb)/0.3)] bg-[rgb(var(--accent-green-rgb)/0.1)] hover:bg-[rgb(var(--accent-green-rgb)/0.2)] transition-colors"
                  >
                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                  </Link>
                ))}
              </div>
              {city.meta.bestMonths.length > 0 && (
                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <span>Best months:</span>
                  <span className="text-[var(--text-primary)]">{city.meta.bestMonths.join(", ")}</span>
                </div>
              )}
            </section>

            {/* Cost + Meta — consistent card style */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <CostPanelGated city={city} />
              </div>
              <MetaPanelGated city={city} />
            </div>

            {/* Trip Tracker */}
            <TripTracker citySlug={city.slug} />

            {/* Related Cities */}
            {relatedCities.length > 0 && (
              <section>
                <h2 className="font-serif text-xl font-bold mb-4">
                  {overview?.fis.isPersonalized
                    ? `Other cities in ${city.continent} for your family`
                    : `Other cities in ${city.continent}`}
                </h2>
                {/* Desktop: full CityCards */}
                <div className="hidden sm:grid sm:grid-cols-3 gap-4">
                  {relatedCities.map((c) => (
                    <CityCard key={c.id} city={c} />
                  ))}
                </div>
                {/* Mobile: compact cards */}
                <div className="sm:hidden space-y-3">
                  {relatedCities.map((c) => {
                    const relFlag = c.countryCode.toUpperCase().split("").map((ch) => String.fromCodePoint(127397 + ch.charCodeAt(0))).join("")
                    return (
                      <Link key={c.id} href={`/cities/${c.slug}`}
                        className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 hover:border-[var(--accent-green)] transition-colors">
                        <div className="w-16 h-16 rounded-lg bg-black shrink-0 overflow-hidden">
                          {c.photo && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.photo} alt={c.name} className="w-full h-full object-cover" loading="lazy" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[var(--text-secondary)]">{relFlag} {c.country}</p>
                          <p className="font-serif font-bold truncate">{c.name}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{formatEuro(c.cost.familyMonthly)}/mo</p>
                        </div>
                        <span className="text-xs font-mono font-bold text-[var(--accent-green)] shrink-0">{c.scores.family} FIS&trade;</span>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}
          </div>
        )}

        {/* INTELLIGENCE */}
        {activeTab === "intelligence" && (
          <CityIntelligence city={city} />
        )}

        {/* SCHOOLS */}
        {activeTab === "schools" && (
          <CitySchoolsTab citySlug={city.slug} cityName={city.name} countryCode={city.countryCode} />
        )}

        {/* VISAS */}
        {activeTab === "visas" && (
          <div>
            <CityVisas citySlug={city.slug} />
            <Link href="/visas" className="block text-center py-3 mt-6 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:border-[var(--accent-green)] hover:text-[var(--accent-green)] transition-colors">
              See all visas →
            </Link>
          </div>
        )}

        {/* THINGS TO DO */}
        {activeTab === "places" && (
          <div>
            <PlacesGallery citySlug={city.slug} />
            <Link href={`/cities/${city.slug}/thingstodo`} className="block text-center py-3 mt-6 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:border-[var(--accent-green)] hover:text-[var(--accent-green)] transition-colors">
              See all places →
            </Link>
          </div>
        )}

        {/* COMMUNITY */}
        {activeTab === "community" && (
          <div className="space-y-8">
            <CityReviews citySlug={city.slug} />
            <FamiliesHere citySlug={city.slug} fallbackCount={city.meta.familiesNow} />
            <section id="field-report">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 text-center">
                <h2 className="font-serif text-xl font-bold mb-2">
                  Been to {city.name}?
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Tell us about your experience. A quick conversation helps the next family land better.
                </p>
                <a
                  href={`/join?city=${city.slug}&mode=report`}
                  className="inline-flex items-center gap-2 bg-[var(--accent-green)] text-black px-6 py-3 rounded-full text-sm font-medium hover:opacity-90 transition"
                >
                  Share your experience &rarr;
                </a>
              </div>
            </section>
          </div>
        )}

      </div>
    </div>
    </CityOverviewContext.Provider>
  )
}
