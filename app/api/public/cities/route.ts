import { NextResponse } from "next/server"
import { cities } from "@/data/cities"
import { calculateDefaultFIS, getFISLabel } from "@/lib/fis"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET() {
  const citiesData = cities
    .map((city) => {
      const fis = calculateDefaultFIS(city)
      return {
        slug: city.slug,
        name: city.name,
        country: city.country,
        countryCode: city.countryCode,
        continent: city.continent,
        fis: fis.score,
        fisLabel: getFISLabel(fis.score),
        costMonthly: city.cost.familyMonthly,
        photo: city.photo,
        tags: city.tags,
        coords: city.coords,
      }
    })
    .sort((a, b) => b.fis - a.fis)

  return NextResponse.json(
    {
      cities: citiesData,
      total: citiesData.length,
      _meta: {
        generatedAt: new Date().toISOString(),
        apiVersion: "1.0",
        endpoints: {
          cities: "/api/public/cities",
          cityDetail: "/api/public/city/{slug}",
          changes: "/api/public/changes?days=7",
        },
      },
    },
    { headers: CORS_HEADERS }
  )
}
