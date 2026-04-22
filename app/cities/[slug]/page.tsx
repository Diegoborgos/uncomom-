import { getAllCities, getCityBySlug, getCityBySlugWithMeta } from "@/lib/cities-db"
import CachedDataBanner from "@/components/ui/CachedDataBanner"
import { cities as staticCities } from "@/data/cities"
import { notFound } from "next/navigation"
import Link from "next/link"
import CityHero from "@/components/CityHero"
import BookmarkButton from "@/components/BookmarkButton"
import { cityJsonLd } from "@/lib/structured-data"
import { calculateDefaultFIS } from "@/lib/fis"
import CityPageTracker from "@/components/CityPageTracker"
import CityPageTabs from "@/components/CityPageTabs"
import TrajectoryPanel from "@/components/TrajectoryPanel"

export async function generateStaticParams() {
  return staticCities.map((city) => ({ slug: city.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const city = await getCityBySlug(params.slug)
  if (!city) return { title: "City not found" }
  const title = `${city.name}, ${city.country} — Family Travel Guide | Uncomun`
  const description = `FIS ${calculateDefaultFIS(city).score}/100. ${city.description} Estimated family cost: €${city.cost.familyMonthly}/month for a family of 4.`
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

export default async function CityPage({ params }: { params: { slug: string } }) {
  const { data: city, fromFallback } = await getCityBySlugWithMeta(params.slug)
  if (!city) notFound()

  const allCities = await getAllCities()
  const relatedCities = allCities
    .filter((c) => c.continent === city.continent && c.slug !== city.slug)
    .slice(0, 3)

  const jsonLd = cityJsonLd(city)

  return (
    <div>
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <CachedDataBanner fromFallback={fromFallback} dataset="city data" />
      <CityPageTracker citySlug={city.slug} cityName={city.name} />
      <CityHero city={city} />

      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <Link href="/" className="text-sm text-[var(--accent-green)] hover:underline">
            &larr; All cities
          </Link>
          <BookmarkButton citySlug={city.slug} />
        </div>
      </div>

      <CityPageTabs city={city} relatedCities={relatedCities} />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <TrajectoryPanel citySlug={city.slug} />
      </div>
    </div>
  )
}
