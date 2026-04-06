import { cities } from "@/data/cities"
import { calculateDefaultFIS } from "@/lib/fis"

export async function GET() {
  const topCities = [...cities]
    .sort((a, b) => calculateDefaultFIS(b).score - calculateDefaultFIS(a).score)
    .slice(0, 10)

  const content = `# Uncomun — Family Travel City Directory

> Uncomun is a city directory and community platform for entrepreneurial families who travel and live globally. The unit of account is the family, not the individual.

## What this site contains

- **45 city profiles** ranked by Family Intelligence Score (FIS, 0-100), a composite score measuring child safety, education access, family cost, healthcare, nature, community, remote work, visa, and lifestyle
- **Cost of living data** estimated for a family of 4 (rent, international school, local school, childcare)
- **Visa guide** covering 15+ visa options across countries with digital nomad, residency, and tourist visa details
- **School finder** with 15+ international schools across 10+ cities (fees, curricula, ratings)
- **Homeschool laws database** covering 21 countries with legal status, requirements, and practical notes
- **Family cost calculator** comparing monthly costs across all cities adjustable by family size and education approach
- **183-day residence tracker** for tax residency planning

## Top 10 cities by FIS

${topCities.map((c, i) => `${i + 1}. **${c.name}, ${c.country}** — FIS: ${calculateDefaultFIS(c).score}/100, Monthly cost: €${c.cost.familyMonthly.toLocaleString()}, Safety: ${c.scores.childSafety}/100`).join("\n")}

## Key data points per city

Each city profile includes:
- Family Intelligence Score / FIS (0-100)
- Child Safety score (0-100)
- School Access score (0-100)
- Nature score (0-100)
- Internet score (0-100)
- Healthcare score (0-100)
- Monthly cost for family of 4 (EUR)
- Rent for 2BR furnished (EUR/month)
- International school fee per child (EUR/month)
- Homeschool legal status
- Visa friendliness rating
- Best months to visit
- Timezone
- Languages spoken

## Structured data

Every city page includes Schema.org JSON-LD with:
- City entity with geo coordinates
- FAQPage with 7 common questions answered
- Product with aggregate rating and cost
- BreadcrumbList

## Machine-readable data

Full city data available at: https://uncomom.vercel.app/api/cities

## Contact

Website: https://uncomom.vercel.app
`

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  })
}
