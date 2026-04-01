"use client"

import { useState } from "react"
import Link from "next/link"
import { City } from "@/lib/types"
import { formatEuro } from "@/lib/scores"
import { FISBreakdown } from "./FISScore"
import CityIntelligence from "./CityIntelligence"
import PlacesGallery from "./PlacesGallery"
import CityVisas from "./CityVisas"
import CityReviews from "./CityReviews"
import CitySchoolsTab from "./CitySchoolsTab"
import FamiliesHere from "./FamiliesHere"
import TripTracker from "./TripTracker"
import CostPanelGated from "./CostPanelGated"
import MetaPanelGated from "./MetaPanelGated"
import FieldReportForm from "./FieldReportForm"

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

  return (
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
          <div className="space-y-8">
            {/* FIS Breakdown */}
            <section>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="font-serif text-xl font-bold">Family Intelligence Score&trade;</h2>
                <Link href="/methodology" className="text-xs text-[var(--accent-green)] hover:underline shrink-0 ml-4">
                  How this works &rarr;
                </Link>
              </div>
              <FISBreakdown city={city} />
            </section>

            {/* About + Tags + Best Months — compact */}
            <section>
              <h2 className="font-serif text-xl font-bold mb-3">About {city.name}</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">{city.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {city.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/?tags=${encodeURIComponent(tag)}`}
                    className="text-xs px-2.5 py-1 rounded-full text-[var(--accent-green)] border border-[var(--accent-green)]/30 bg-[var(--accent-green)]/10 hover:bg-[var(--accent-green)]/20 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
              <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                <span>Best months:</span>
                <span className="text-[var(--text-primary)]">{city.meta.bestMonths.join(", ")}</span>
              </div>
            </section>

            {/* Cost + Meta — side by side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <h3 className="font-serif text-lg font-bold mb-1">Family Cost Estimate</h3>
                <p className="text-xs text-[var(--text-secondary)] mb-3">Estimated for a family of 4</p>
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-sm text-[var(--text-secondary)]">Total monthly</span>
                  <span className="font-mono font-bold text-xl text-[var(--accent-warm)]">
                    {formatEuro(city.cost.familyMonthly)}
                  </span>
                </div>
                <CostPanelGated city={city} />
              </div>
              <MetaPanelGated city={city} />
            </div>

            {/* Trip Tracker */}
            <TripTracker citySlug={city.slug} />

            {/* Related Cities */}
            {relatedCities.length > 0 && (
              <section>
                <h2 className="font-serif text-xl font-bold mb-4">Other cities in {city.continent}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {relatedCities.map((c) => {
                    const relFlag = c.countryCode.toUpperCase().split("").map((ch) => String.fromCodePoint(127397 + ch.charCodeAt(0))).join("")
                    return (
                      <Link key={c.id} href={`/cities/${c.slug}`}
                        className="rounded-2xl overflow-hidden bg-[var(--surface)] hover:opacity-90 transition-opacity">
                        {/* Image */}
                        <div className="relative h-36 bg-black">
                          {c.photo && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.photo} alt={c.name} className="w-full h-full object-cover" loading="lazy" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          <span className="absolute top-2 left-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-mono font-bold bg-[var(--accent-green)] text-black">
                            {c.scores.family} FIS&trade;
                          </span>
                          <div className="absolute bottom-2 left-2 right-2">
                            <p className="text-[10px] text-white/80">{relFlag} {c.country}</p>
                            <p className="text-sm font-bold text-white">{c.name}</p>
                          </div>
                          <span className="absolute bottom-2 right-2 text-[10px] font-mono text-white/70">
                            {formatEuro(c.cost.familyMonthly)}/mo
                          </span>
                        </div>
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
              <h2 className="font-serif text-xl font-bold mb-2">File a Field Report</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Your report directly updates {city.name}&apos;s city intelligence.
              </p>
              <FieldReportForm citySlug={city.slug} />
            </section>
          </div>
        )}

      </div>
    </div>
  )
}
