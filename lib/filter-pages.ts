import { cities } from "@/data/cities"
import { City } from "./types"

export type FilterPage = {
  segments: string[]
  title: string
  description: string
  heading: string
  subheading: string
  filter: (city: City) => boolean
}

const CONTINENTS: Record<string, string> = {
  europe: "Europe",
  asia: "Asia",
  "latin-america": "Latin America",
  africa: "Africa",
}

const TAGS: Record<string, string> = {
  beach: "Beach",
  surf: "Surf",
  mountains: "Mountains",
  nature: "Nature",
  safe: "Safe",
  "low-cost": "Low Cost",
  "expat-community": "Expat Community",
  "international-schools": "International Schools",
}

const COST_RANGES: Record<string, { label: string; min: number; max: number }> = {
  "under-2k": { label: "Under €2K/month", min: 0, max: 2000 },
  "2k-3k": { label: "€2K–3K/month", min: 2000, max: 3000 },
  "3k-4k": { label: "€3K–4K/month", min: 3000, max: 4000 },
  "over-4k": { label: "Over €4K/month", min: 4000, max: 999999 },
}

const HOMESCHOOL: Record<string, { label: string; match: string[] }> = {
  "homeschool-legal": { label: "Homeschool Legal", match: ["Yes"] },
  "homeschool-friendly": { label: "Homeschool Friendly", match: ["Yes", "Yes (grey area)"] },
}

const VISA: Record<string, { label: string; match: string[] }> = {
  "visa-friendly": { label: "Visa Friendly", match: ["Excellent", "Good"] },
}

export function generateAllFilterPages(): FilterPage[] {
  const pages: FilterPage[] = []

  // Continent pages: /cities/europe, /cities/asia, etc.
  for (const [slug, name] of Object.entries(CONTINENTS)) {
    pages.push({
      segments: [slug],
      title: `Best Cities for Families in ${name}`,
      description: `Family-friendly cities in ${name} ranked by Family Score. Costs, schools, safety, and visa info for traveling families.`,
      heading: `Family Cities in ${name}`,
      subheading: `${cities.filter((c) => c.continent === name).length} cities ranked by Family Score`,
      filter: (c) => c.continent === name,
    })

    // Continent + tag combos: /cities/europe/beach, /cities/asia/mountains, etc.
    for (const [tagSlug, tagName] of Object.entries(TAGS)) {
      const tagValue = tagSlug.replace("-", " ")
      const count = cities.filter((c) => c.continent === name && c.tags.includes(tagValue)).length
      if (count > 0) {
        pages.push({
          segments: [slug, tagSlug],
          title: `${tagName} Cities for Families in ${name}`,
          description: `${tagName} family-friendly cities in ${name}. Scores, costs, and community data for traveling families.`,
          heading: `${tagName} Cities in ${name}`,
          subheading: `${count} ${tagName.toLowerCase()} cities for families`,
          filter: (c) => c.continent === name && c.tags.includes(tagValue),
        })
      }
    }
  }

  // Tag-only pages: /cities/beach, /cities/surf, etc.
  for (const [tagSlug, tagName] of Object.entries(TAGS)) {
    const tagValue = tagSlug.replace("-", " ")
    pages.push({
      segments: [tagSlug],
      title: `Best ${tagName} Cities for Families`,
      description: `${tagName} cities ranked for traveling families. Family Score, costs, schools, safety data.`,
      heading: `${tagName} Cities for Families`,
      subheading: `${cities.filter((c) => c.tags.includes(tagValue)).length} cities`,
      filter: (c) => c.tags.includes(tagValue),
    })
  }

  // Cost pages: /cities/under-2k, /cities/2k-3k, etc.
  for (const [slug, { label, min, max }] of Object.entries(COST_RANGES)) {
    pages.push({
      segments: [slug],
      title: `Family Cities ${label} — Affordable Living Abroad`,
      description: `Cities where a family of 4 can live for ${label}. Ranked by Family Score with cost breakdowns.`,
      heading: `Cities ${label}`,
      subheading: `${cities.filter((c) => c.cost.familyMonthly >= min && c.cost.familyMonthly < max).length} cities for families`,
      filter: (c) => c.cost.familyMonthly >= min && c.cost.familyMonthly < max,
    })
  }

  // Homeschool pages
  for (const [slug, { label, match }] of Object.entries(HOMESCHOOL)) {
    pages.push({
      segments: [slug],
      title: `${label} Cities for Families`,
      description: `Cities where homeschooling is legal or tolerated. Family scores, costs, and education data for worldschooling families.`,
      heading: `${label} Cities`,
      subheading: `${cities.filter((c) => match.includes(c.meta.homeschoolLegal)).length} cities where homeschooling is possible`,
      filter: (c) => match.includes(c.meta.homeschoolLegal),
    })
  }

  // Visa friendly page
  for (const [slug, { label, match }] of Object.entries(VISA)) {
    pages.push({
      segments: [slug],
      title: `${label} Cities for Families`,
      description: `Cities with excellent or good visa options for traveling families. Digital nomad visas, residency permits, and tourist-friendly policies.`,
      heading: `${label} Cities`,
      subheading: `${cities.filter((c) => match.includes(c.meta.visaFriendly)).length} cities with family-friendly visas`,
      filter: (c) => match.includes(c.meta.visaFriendly),
    })
  }

  return pages
}

export function findFilterPage(segments: string[]): FilterPage | null {
  const allPages = generateAllFilterPages()
  return allPages.find((p) =>
    p.segments.length === segments.length &&
    p.segments.every((s, i) => s === segments[i])
  ) || null
}
