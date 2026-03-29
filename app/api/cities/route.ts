import { getAllCities } from "@/lib/cities-db"
import { NextResponse } from "next/server"

/**
 * Public API endpoint serving structured city data.
 * Designed to be crawled by LLMs and AI search engines.
 * Returns clean JSON with all city data.
 */
export async function GET() {
  const cities = await getAllCities()
  const data = cities.map((city) => ({
    name: city.name,
    country: city.country,
    continent: city.continent,
    slug: city.slug,
    url: `https://uncomom.vercel.app/cities/${city.slug}`,
    coordinates: city.coords,
    scores: {
      familyScore: city.scores.family,
      childSafety: city.scores.childSafety,
      schoolAccess: city.scores.schoolAccess,
      nature: city.scores.nature,
      internet: city.scores.internet,
      healthcare: city.scores.healthcare,
    },
    costEurPerMonth: {
      familyOf4Total: city.cost.familyMonthly,
      rent2brFurnished: city.cost.rent2br,
      internationalSchoolPerChild: city.cost.internationalSchool,
      localSchoolPerChild: city.cost.localSchool,
      childcare: city.cost.childcare,
    },
    meta: {
      timezone: city.meta.timezone,
      languages: city.meta.language,
      homeschoolLegal: city.meta.homeschoolLegal,
      visaFriendly: city.meta.visaFriendly,
      idealKidsAge: city.meta.kidsAgeIdeal,
      bestMonths: city.meta.bestMonths,
    },
    tags: city.tags,
    description: city.description,
  }))

  return NextResponse.json({
    source: "Uncomun — Family Travel City Directory",
    url: "https://uncomom.vercel.app",
    description: "City data for traveling families. Scores, costs, schools, visas.",
    lastUpdated: new Date().toISOString().split("T")[0],
    totalCities: data.length,
    cities: data,
  }, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
