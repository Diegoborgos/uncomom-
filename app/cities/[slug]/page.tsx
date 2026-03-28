import { cities } from "@/data/cities"
import { notFound } from "next/navigation"
import Link from "next/link"
import CityHero from "@/components/CityHero"
import ScoreBar from "@/components/ScoreBar"
import FamilyCostPanel from "@/components/FamilyCostPanel"
import TripTracker from "@/components/TripTracker"
import CityReviews from "@/components/CityReviews"
import FamiliesHere from "@/components/FamiliesHere"
import CityVisas from "@/components/CityVisas"
import BookmarkButton from "@/components/BookmarkButton"
import { getVisaBadgeColor, getHomeschoolBadgeColor } from "@/lib/scores"

export function generateStaticParams() {
  return cities.map((city) => ({ slug: city.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const city = cities.find((c) => c.slug === params.slug)
  if (!city) return { title: "City not found" }
  return {
    title: `${city.name}, ${city.country} — Uncomun`,
    description: city.description,
  }
}

export default function CityPage({ params }: { params: { slug: string } }) {
  const city = cities.find((c) => c.slug === params.slug)
  if (!city) notFound()

  return (
    <div>
      <CityHero city={city} />

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* Back link + bookmark */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-[var(--accent-green)] hover:underline"
          >
            &larr; All cities
          </Link>
          <BookmarkButton citySlug={city.slug} />
        </div>

        {/* Trip tracker */}
        <section>
          <TripTracker citySlug={city.slug} />
        </section>

        {/* Families here */}
        <section>
          <FamiliesHere citySlug={city.slug} fallbackCount={city.meta.familiesNow} />
        </section>

        {/* Scores */}
        <section>
          <h2 className="font-serif text-2xl font-bold mb-6">Scores</h2>
          <div className="space-y-4">
            <ScoreBar label="Family Score" score={city.scores.family} />
            <ScoreBar label="Child Safety" score={city.scores.childSafety} />
            <ScoreBar label="School Access" score={city.scores.schoolAccess} />
            <ScoreBar label="Nature" score={city.scores.nature} />
            <ScoreBar label="Internet" score={city.scores.internet} />
            <ScoreBar label="Healthcare" score={city.scores.healthcare} />
          </div>
        </section>

        {/* Cost */}
        <section>
          <h2 className="font-serif text-2xl font-bold mb-6">Cost of Living</h2>
          <FamilyCostPanel city={city} />
        </section>

        {/* Meta grid */}
        <section>
          <h2 className="font-serif text-2xl font-bold mb-6">Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <MetaItem label="Return rate" value={`${city.meta.returnRate}%`} />
            <MetaItem label="Timezone" value={city.meta.timezone} />
            <MetaItem label="Languages" value={city.meta.language.join(", ")} />
            <MetaItem label="Ideal kids age" value={city.meta.kidsAgeIdeal} />
            <div className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4">
              <p className="text-xs text-[var(--text-secondary)] mb-1">Homeschool legal</p>
              <span
                className="inline-block text-sm font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: getHomeschoolBadgeColor(city.meta.homeschoolLegal) + "22",
                  color: getHomeschoolBadgeColor(city.meta.homeschoolLegal),
                }}
              >
                {city.meta.homeschoolLegal}
              </span>
            </div>
            <div className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4">
              <p className="text-xs text-[var(--text-secondary)] mb-1">Visa friendliness</p>
              <span
                className="inline-block text-sm font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: getVisaBadgeColor(city.meta.visaFriendly) + "22",
                  color: getVisaBadgeColor(city.meta.visaFriendly),
                }}
              >
                {city.meta.visaFriendly}
              </span>
            </div>
            <div className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4">
              <p className="text-xs text-[var(--text-secondary)] mb-1">Best months</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {city.meta.bestMonths.map((m) => (
                  <span key={m} className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-elevated)] text-[var(--text-primary)]">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Visas */}
        <section>
          <CityVisas citySlug={city.slug} />
        </section>

        {/* Description */}
        <section>
          <h2 className="font-serif text-2xl font-bold mb-4">About {city.name}</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed max-w-2xl">
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
                className="text-sm px-3 py-1 rounded-full bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* Reviews */}
        <section>
          <CityReviews citySlug={city.slug} />
        </section>
      </div>
    </div>
  )
}

function MetaItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4">
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}
