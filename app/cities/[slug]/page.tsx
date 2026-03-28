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
import PaidCityContent from "@/components/PaidCityContent"
import CityCard from "@/components/CityCard"
import { getVisaBadgeColor, getHomeschoolBadgeColor, formatEuro } from "@/lib/scores"

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

  return (
    <div>
      <CityHero city={city} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back + bookmark */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="text-sm text-[var(--accent-green)] hover:underline"
          >
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
          {/* LEFT COLUMN — 2/3 */}
          <div className="flex-1 lg:w-2/3 space-y-10">
            {/* Scores */}
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

            {/* Description */}
            <section>
              <h2 className="font-serif text-2xl font-bold mb-4">About {city.name}</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed text-lg italic">
                {city.description}
              </p>
            </section>

            {/* Tags */}
            <section>
              <h2 className="font-serif text-2xl font-bold mb-4">Tags</h2>
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

            {/* Best months */}
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

            {/* Visas */}
            <section>
              <CityVisas citySlug={city.slug} />
            </section>

            {/* Reviews */}
            <section>
              <CityReviews citySlug={city.slug} />
            </section>
          </div>

          {/* RIGHT COLUMN — 1/3 sticky */}
          <div className="lg:w-1/3">
            <div className="lg:sticky lg:top-20 space-y-6">
              {/* Cost panel — gated for free users */}
              <PaidCityContent>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <h3 className="font-serif text-lg font-bold mb-1">Family Cost Estimate</h3>
                <p className="text-xs text-[var(--text-secondary)] mb-5">Estimated for a family of 4</p>
                <div className="space-y-3">
                  <CostLine emoji="🏠" label="2br furnished apartment" value={city.cost.rent2br} />
                  <CostLine emoji="🎓" label="International school (per child)" value={city.cost.internationalSchool} />
                  <CostLine emoji="🏫" label="Local/alternative school" value={city.cost.localSchool} />
                  <CostLine emoji="👶" label="Childcare" value={city.cost.childcare} />
                  <div className="border-t border-[var(--border)] pt-3 flex justify-between">
                    <span className="font-bold">Total monthly</span>
                    <span className="font-mono font-bold text-lg text-[var(--accent-warm)]">
                      {formatEuro(city.cost.familyMonthly)}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-[var(--text-secondary)] mt-4 leading-relaxed">
                  Estimates only. Costs vary significantly by neighbourhood and season.
                </p>
              </div>

              {/* Meta info card */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
                <MetaRow emoji="🏠" label="Families here now" value={`${city.meta.familiesNow}`} highlight />
                <MetaRow emoji="📊" label="Families have been here" value={`${city.meta.familiesBeen}`} />
                <MetaRow emoji="🔄" label="Return rate" value={`${city.meta.returnRate}%`} />
                <MetaRow emoji="⏰" label="Timezone" value={city.meta.timezone} />
                <MetaRow emoji="🗣" label="Languages" value={city.meta.language.join(", ")} />
                <div className="flex items-start gap-3">
                  <span className="text-sm">📚</span>
                  <div className="flex-1">
                    <p className="text-xs text-[var(--text-secondary)]">Homeschool legal</p>
                    <span
                      className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-0.5"
                      style={{
                        backgroundColor: getHomeschoolBadgeColor(city.meta.homeschoolLegal) + "22",
                        color: getHomeschoolBadgeColor(city.meta.homeschoolLegal),
                      }}
                    >
                      {city.meta.homeschoolLegal}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-sm">🛂</span>
                  <div className="flex-1">
                    <p className="text-xs text-[var(--text-secondary)]">Visa friendly</p>
                    <span
                      className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-0.5"
                      style={{
                        backgroundColor: getVisaBadgeColor(city.meta.visaFriendly) + "22",
                        color: getVisaBadgeColor(city.meta.visaFriendly),
                      }}
                    >
                      {city.meta.visaFriendly}
                    </span>
                  </div>
                </div>
                <MetaRow emoji="👶" label="Ideal for kids" value={city.meta.kidsAgeIdeal} />
              </div>

              {/* Families here (live) */}
              <FamiliesHere citySlug={city.slug} fallbackCount={city.meta.familiesNow} />
              </PaidCityContent>
            </div>
          </div>
        </div>

        {/* Related cities */}
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

function CostLine({ emoji, label, value }: { emoji: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[var(--text-secondary)]">
        {emoji} {label}
      </span>
      <span className="font-mono">{formatEuro(value)}/mo</span>
    </div>
  )
}

function MetaRow({
  emoji,
  label,
  value,
  highlight,
}: {
  emoji: string
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-sm">{emoji}</span>
      <div className="flex-1">
        <p className="text-xs text-[var(--text-secondary)]">{label}</p>
        <p className={`text-sm ${highlight ? "text-[var(--accent-warm)] font-medium" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  )
}
