import { Metadata } from "next"
import { getAllHomeschoolLaws } from "@/lib/homeschool-db"
import { getAllCities } from "@/lib/cities-db"
import Link from "next/link"
import SignalBadge from "@/components/ui/SignalBadge"

export const metadata: Metadata = {
  title: "Homeschooling Laws by Country — Legal Status for Traveling Families | Uncomun",
  description: "Is homeschooling legal where you want to live? Country-by-country guide to homeschool laws, requirements, and practical notes for traveling families.",
  openGraph: {
    title: "Homeschooling Laws by Country | Uncomun",
    description: "Country-by-country guide to homeschool laws for traveling families. Legal status, requirements, and practical notes.",
  },
}

const STATUS_COLORS: Record<string, string> = {
  "Legal": "var(--score-high)",
  "Legal with notification": "var(--score-high)",
  "Legal with restrictions": "var(--score-mid)",
  "Grey area": "var(--score-mid)",
  "Varies by region": "var(--score-mid)",
  "Illegal": "var(--score-low)",
}

function flag(code: string) {
  return code.toUpperCase().split("").map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join("")
}

export default async function HomeschoolLawsPage() {
  const homeschoolLaws = await getAllHomeschoolLaws()
  const cities = await getAllCities()
  const sorted = [...homeschoolLaws].sort((a, b) => a.country.localeCompare(b.country))

  const legalCount = homeschoolLaws.filter((l) => l.status.startsWith("Legal")).length
  const greyCount = homeschoolLaws.filter((l) => l.status === "Grey area").length

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-bold mb-3">Homeschooling Laws by Country</h1>
        <p className="text-[var(--text-secondary)] leading-relaxed max-w-2xl">
          The legal landscape for homeschooling varies enormously. This guide covers {homeschoolLaws.length} countries
          popular with traveling families — {legalCount} where homeschooling is legal, and {greyCount} where
          it operates in a grey area.
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-3 flex items-center gap-2 max-w-2xl">
          <SignalBadge sourceType="seed_estimate" compact />
          <span>Legal interpretations are manually curated for family-friendly guidance. Always consult a local lawyer before relocating.</span>
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
          <p className="font-mono text-2xl font-bold text-[var(--score-high)]">{legalCount}</p>
          <p className="text-xs text-[var(--text-secondary)]">Fully legal</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
          <p className="font-mono text-2xl font-bold text-[var(--score-mid)]">{greyCount}</p>
          <p className="text-xs text-[var(--text-secondary)]">Grey area</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
          <p className="font-mono text-2xl font-bold">{homeschoolLaws.length}</p>
          <p className="text-xs text-[var(--text-secondary)]">Countries covered</p>
        </div>
      </div>

      {/* Country list */}
      <div className="space-y-4">
        {sorted.map((law) => {
          const color = STATUS_COLORS[law.status] || "var(--text-secondary)"
          return (
            <div
              key={law.countryCode}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <h2 className="font-serif text-xl font-bold">
                  {flag(law.countryCode)} {law.country}
                </h2>
                <span
                  className="inline-block text-xs font-medium px-3 py-1 rounded-full self-start"
                  style={{ backgroundColor: color + "22", color }}
                >
                  {law.status}
                </span>
              </div>

              <p className="text-sm text-[var(--text-primary)] mb-3">{law.summary}</p>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-xs text-[var(--text-secondary)] font-medium">Requirements: </span>
                  <span className="text-[var(--text-secondary)]">{law.requirements}</span>
                </div>
                <div>
                  <span className="text-xs text-[var(--text-secondary)] font-medium">For traveling families: </span>
                  <span className="text-[var(--text-secondary)]">{law.notes}</span>
                </div>
              </div>

              {law.popularCities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-[var(--border)]">
                  {law.popularCities.map((slug) => {
                    const city = cities.find((c) => c.slug === slug)
                    if (!city) return null
                    return (
                      <Link
                        key={slug}
                        href={`/cities/${slug}`}
                        className="text-xs px-2.5 py-1 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)] hover:text-[var(--accent-green)] transition-colors"
                      >
                        {city.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-lg mx-auto">
          This information is for general guidance only and may not reflect the most recent legal changes.
          Laws are interpreted differently by local authorities. Always verify with a local legal professional
          before making education decisions for your family.
        </p>
      </div>
    </div>
  )
}
