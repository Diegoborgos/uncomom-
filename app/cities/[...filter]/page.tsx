import { cities } from "@/data/cities"
import { calculateDefaultFIS } from "@/lib/fis"
import { notFound } from "next/navigation"
import { generateAllFilterPages, findFilterPage } from "@/lib/filter-pages"
import CityCard from "@/components/CityCard"
import Link from "next/link"

export function generateStaticParams() {
  return generateAllFilterPages().map((page) => ({
    filter: page.segments,
  }))
}

export function generateMetadata({ params }: { params: { filter: string[] } }) {
  const page = findFilterPage(params.filter)
  if (!page) return { title: "Cities — Uncomun" }
  return {
    title: `${page.title} | Uncomun`,
    description: page.description,
    openGraph: {
      title: page.title,
      description: page.description,
    },
  }
}

export default function FilteredCitiesPage({ params }: { params: { filter: string[] } }) {
  const page = findFilterPage(params.filter)
  if (!page) notFound()

  const filtered = cities
    .filter(page.filter)
    .sort((a, b) => calculateDefaultFIS(b).score - calculateDefaultFIS(a).score)

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-6">
        <Link href="/" className="hover:text-[var(--accent-green)] transition-colors">Cities</Link>
        {params.filter.map((seg, i) => (
          <span key={seg} className="flex items-center gap-2">
            <span>›</span>
            {i < params.filter.length - 1 ? (
              <Link
                href={`/cities/${params.filter.slice(0, i + 1).join("/")}`}
                className="hover:text-[var(--accent-green)] transition-colors capitalize"
              >
                {seg.replace(/-/g, " ")}
              </Link>
            ) : (
              <span className="text-[var(--text-primary)] capitalize">{seg.replace(/-/g, " ")}</span>
            )}
          </span>
        ))}
      </div>

      {/* Header */}
      <h1 className="font-serif text-4xl font-bold mb-2">{page.heading}</h1>
      <p className="text-[var(--text-secondary)] mb-8">{page.subheading}</p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
          <p className="text-[var(--text-secondary)]">No cities match this filter.</p>
          <Link href="/" className="text-sm text-[var(--accent-green)] hover:underline mt-2 inline-block">
            Browse all cities
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((city) => (
            <CityCard key={city.id} city={city} />
          ))}
        </div>
      )}

      {/* Related filter links for SEO internal linking */}
      <div className="mt-16 border-t border-[var(--border)] pt-8">
        <h2 className="font-serif text-xl font-bold mb-4">Explore more</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { href: "/cities/europe", label: "Europe" },
            { href: "/cities/asia", label: "Asia" },
            { href: "/cities/latin-america", label: "Latin America" },
            { href: "/cities/africa", label: "Africa" },
            { href: "/cities/beach", label: "Beach cities" },
            { href: "/cities/mountains", label: "Mountain cities" },
            { href: "/cities/surf", label: "Surf cities" },
            { href: "/cities/low-cost", label: "Low cost" },
            { href: "/cities/safe", label: "Safe cities" },
            { href: "/cities/under-2k", label: "Under €2K/mo" },
            { href: "/cities/2k-3k", label: "€2K–3K/mo" },
            { href: "/cities/homeschool-legal", label: "Homeschool legal" },
            { href: "/cities/homeschool-friendly", label: "Homeschool friendly" },
            { href: "/cities/visa-friendly", label: "Visa friendly" },
            { href: "/cities/international-schools", label: "International schools" },
            { href: "/cities/expat-community", label: "Expat community" },
          ].filter((l) => l.href !== `/cities/${params.filter.join("/")}`).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)] hover:text-[var(--accent-green)] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
