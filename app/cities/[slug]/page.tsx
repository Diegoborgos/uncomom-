import { cities } from "@/data/cities"
import { notFound } from "next/navigation"
import Link from "next/link"
import CityHero from "@/components/CityHero"
import ScoreBar from "@/components/ScoreBar"
import TripTracker from "@/components/TripTracker"
import CityReviews from "@/components/CityReviews"
import FamiliesHere from "@/components/FamiliesHere"
import CityVisas from "@/components/CityVisas"
import BookmarkButton from "@/components/BookmarkButton"
import CityCard from "@/components/CityCard"
import CostPanelGated from "@/components/CostPanelGated"
import MetaPanelGated from "@/components/MetaPanelGated"
import { formatEuro } from "@/lib/scores"
import { cityJsonLd } from "@/lib/structured-data"
import CityPageTracker from "@/components/CityPageTracker"

export function generateStaticParams() {
  return cities.map((city) => ({ slug: city.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const city = cities.find((c) => c.slug === params.slug)
  if (!city) return { title: "City not found" }
  const title = `${city.name}, ${city.country} — Family Travel Guide | Uncomun`
  const description = `Family Score ${city.scores.family}/100. ${city.description} Estimated family cost: €${city.cost.familyMonthly}/month for a family of 4.`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: city.photo, width: 800, height: 500, alt: `${city.name}, ${city.country}` }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [city.photo],
    },
  }
}

export default function CityPage({ params }: { params: { slug: string } }) {
  const city = cities.find((c) => c.slug === params.slug)
  if (!city) notFound()

  const relatedCities = cities
    .filter((c) => c.continent === city.continent && c.slug !== city.slug)
    .slice(0, 3)

  const jsonLd = cityJsonLd(city)

  return (
    <div>
      {/* Invisible structured data for LLMs and search engines */}
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <CityPageTracker citySlug={city.slug} cityName={city.name} />
      <CityHero city={city} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back + bookmark */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-sm text-[var(--accent-green)] hover:underline">
            &larr; All cities
          </Link>
          <BookmarkButton citySlug={city.slug} />
        </div>

        {/* Trip tracker */}
        <div className="mb-8">
          <TripTracker citySlug={city.slug} />
        </div>

        {/* Two column layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT COLUMN — 2/3 (all free) */}
          <div className="flex-1 lg:w-2/3 space-y-10">
            {/* Scores — FREE */}
            <section>
              <h2 className="font-serif text-2xl font-bold mb-6">Family Scores</h2>
              <div className="space-y-4">
                <ScoreBar label="Family Score" score={city.scores.family} />
                <ScoreBar label="Child Safety" score={city.scores.childSafety} />
                <ScoreBar label="School Access" score={city.scores.schoolAccess} />
                <ScoreBar label="Nature" score={city.scores.nature} />
                <ScoreBar label="Internet" score={city.scores.internet} />
                <ScoreBar label="Healthcare" score={city.scores.healthcare} />
              </div>
            </section>

            {/* Description — FREE */}
            <section>
              <h2 className="font-serif text-2xl font-bold mb-4">About {city.name}</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed text-lg italic">
                {city.description}
              </p>
            </section>

            {/* Tags — FREE */}
            <section>
              <div className="flex flex-wrap gap-2">
                {city.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-sm px-3 py-1 rounded-full text-[var(--accent-green)] border border-[var(--accent-green)]/30 bg-[var(--accent-green)]/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>

            {/* Best months — FREE */}
            <section>
              <h2 className="font-serif text-2xl font-bold mb-4">Best time to visit</h2>
              <div className="flex flex-wrap gap-2">
                {city.meta.bestMonths.map((m) => (
                  <span key={m} className="text-sm px-3 py-1 rounded-full bg-[var(--surface-elevated)] text-[var(--text-primary)] border border-[var(--border)]">
                    {m}
                  </span>
                ))}
              </div>
            </section>

            {/* Visas — FREE */}
            <section>
              <CityVisas citySlug={city.slug} />
            </section>

            {/* Reviews — GATED (component handles its own paywall) */}
            <section>
              <CityReviews citySlug={city.slug} />
            </section>
          </div>

          {/* RIGHT COLUMN — 1/3 sticky */}
          <div className="lg:w-1/3">
            <div className="lg:sticky lg:top-20 space-y-6">
              {/* Cost — total visible, details gated */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <h3 className="font-serif text-lg font-bold mb-1">Family Cost Estimate</h3>
                <p className="text-xs text-[var(--text-secondary)] mb-4">Estimated for a family of 4</p>
                {/* Total is always visible */}
                <div className="flex justify-between items-baseline mb-4">
                  <span className="text-sm text-[var(--text-secondary)]">Total monthly</span>
                  <span className="font-mono font-bold text-2xl text-[var(--accent-warm)]">
                    {formatEuro(city.cost.familyMonthly)}
                  </span>
                </div>
                {/* Line items — gated */}
                <CostPanelGated city={city} />
              </div>

              {/* Meta — basic visible, details gated */}
              <MetaPanelGated city={city} />

              {/* Families here — gated */}
              <FamiliesHere citySlug={city.slug} fallbackCount={city.meta.familiesNow} />
            </div>
          </div>
        </div>

        {/* Related cities — FREE */}
        {relatedCities.length > 0 && (
          <section className="mt-16">
            <h2 className="font-serif text-2xl font-bold mb-6">
              Other cities in {city.continent}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedCities.map((c) => (
                <CityCard key={c.id} city={c} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
