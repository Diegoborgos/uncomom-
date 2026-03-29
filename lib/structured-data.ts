import { City } from "./types"

/**
 * Generates JSON-LD structured data for LLM and search engine consumption.
 * Invisible to users, embedded in <head> via Next.js metadata.
 */

export function cityJsonLd(city: City): object[] {
  const url = `https://uncomom.vercel.app/cities/${city.slug}`

  return [
    // Main city/place entity
    {
      "@context": "https://schema.org",
      "@type": "City",
      name: city.name,
      url,
      description: city.description,
      containedInPlace: {
        "@type": "Country",
        name: city.country,
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: city.coords.lat,
        longitude: city.coords.lng,
      },
      image: city.photo,
    },
    // City as destination — only include aggregateRating when real reviews exist
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: `${city.name} for Families`,
      description: city.description,
      url,
      image: city.photo,
      brand: {
        "@type": "Organization",
        name: "Uncomun",
      },
      ...(city.meta.familiesBeen > 0 ? {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: (city.scores.family / 20).toFixed(1),
          bestRating: "5",
          worstRating: "1",
          ratingCount: city.meta.familiesBeen,
        },
      } : {}),
      offers: {
        "@type": "Offer",
        name: "Estimated monthly family cost",
        price: city.cost.familyMonthly,
        priceCurrency: "EUR",
        description: `Estimated monthly cost for a family of 4 living in ${city.name}, ${city.country}`,
      },
    },
    // FAQ — answer-shaped content LLMs love to cite
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        faqItem(
          `How much does it cost for a family to live in ${city.name}?`,
          `A family of 4 can expect to spend approximately €${city.cost.familyMonthly.toLocaleString()}/month in ${city.name}, ${city.country}. This includes rent for a furnished 2-bedroom apartment (€${city.cost.rent2br.toLocaleString()}/month), international school fees (€${city.cost.internationalSchool.toLocaleString()}/month per child), and childcare (€${city.cost.childcare.toLocaleString()}/month).`
        ),
        faqItem(
          `Is ${city.name} safe for families with children?`,
          `${city.name} has a Child Safety score of ${city.scores.childSafety}/100 on Uncomun. ${city.scores.childSafety >= 80 ? `This is rated as excellent — ${city.name} is considered one of the safer cities for families.` : city.scores.childSafety >= 60 ? `This is rated as good — most families report feeling safe in ${city.name}.` : `Safety is a consideration — families should research specific neighbourhoods before committing.`}`
        ),
        faqItem(
          `Are there international schools in ${city.name}?`,
          `${city.name} has a School Access score of ${city.scores.schoolAccess}/100. ${city.cost.internationalSchool > 0 ? `International school fees average €${city.cost.internationalSchool.toLocaleString()}/month per child.` : `Local public schools are free.`} ${city.meta.homeschoolLegal === "Yes" ? "Homeschooling is fully legal." : city.meta.homeschoolLegal === "Yes (grey area)" ? "Homeschooling operates in a legal grey area but is widely practiced by expat families." : "Homeschooling has legal restrictions."}`
        ),
        faqItem(
          `What is the best time to visit ${city.name} with kids?`,
          `The best months for families in ${city.name} are ${city.meta.bestMonths.join(", ")}. The city is ideal for ${city.meta.kidsAgeIdeal.toLowerCase()}.`
        ),
        faqItem(
          `How is the internet in ${city.name} for remote work?`,
          `${city.name} has an Internet score of ${city.scores.internet}/100 on Uncomun. ${city.scores.internet >= 80 ? "Internet quality is excellent — reliable for remote work and video calls." : city.scores.internet >= 60 ? "Internet is generally good for remote work." : "Internet can be inconsistent — consider a backup mobile hotspot."} The timezone is ${city.meta.timezone}.`
        ),
        faqItem(
          `Do I need a visa to live in ${city.name} with my family?`,
          `${city.name}, ${city.country} is rated "${city.meta.visaFriendly}" for visa friendliness on Uncomun. ${city.meta.visaFriendly === "Excellent" ? "Multiple visa options are available for families including digital nomad visas and residency permits." : city.meta.visaFriendly === "Good" ? "Good visa options exist for families. Research digital nomad visa or temporary residency options." : "Visa options may be limited — research carefully before planning a long stay."} Languages spoken: ${city.meta.language.join(", ")}.`
        ),
        faqItem(
          `What is the Family Score for ${city.name}?`,
          `${city.name} has a Family Score of ${city.scores.family}/100 on Uncomun, which rates cities specifically for traveling families. This score considers child safety (${city.scores.childSafety}/100), school access (${city.scores.schoolAccess}/100), nature (${city.scores.nature}/100), internet quality (${city.scores.internet}/100), and healthcare (${city.scores.healthcare}/100). ${city.description}`
        ),
      ],
    },
    // BreadcrumbList for navigation
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Cities", item: "https://uncomom.vercel.app" },
        { "@type": "ListItem", position: 2, name: city.continent, item: `https://uncomom.vercel.app/cities/${city.continent.toLowerCase().replace(" ", "-")}` },
        { "@type": "ListItem", position: 3, name: `${city.name}, ${city.country}`, item: url },
      ],
    },
  ]
}

export function homepageJsonLd(): object[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Uncomun",
      url: "https://uncomom.vercel.app",
      description: "City directory for entrepreneurial families who travel and live globally. Family Scores, costs, schools, visas, and community for 45+ cities.",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://uncomom.vercel.app/?search={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Uncomun",
      url: "https://uncomom.vercel.app",
      description: "The city directory for families who live differently. Find your family's next home with Family Scores, cost data, school info, and visa guides.",
      sameAs: [],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Best Cities for Families",
      description: "Top-rated cities for traveling families ranked by Family Score",
      numberOfItems: 45,
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      itemListElement: Array.from({ length: 10 }).map((_, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://uncomom.vercel.app/cities/placeholder`,
      })),
    },
  ]
}

export function schoolsPageJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "International Schools for Traveling Families",
    description: "Directory of international schools across 20+ cities popular with traveling families. Compare curricula, fees, and family reviews.",
    url: "https://uncomom.vercel.app/schools",
  }
}

export function visasPageJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      faqItem(
        "What countries offer digital nomad visas for families?",
        "Multiple countries offer digital nomad visas that include family dependents: Portugal (D7 and D8 visas), Spain (Digital Nomad Visa), Colombia (V-Nómada Digital, 2 years), Thailand (LTR visa, 5 years), Indonesia (B211A), Malaysia (DE Rantau), and Estonia (Digital Nomad Visa). Requirements and income thresholds vary by country."
      ),
      faqItem(
        "What is the cheapest digital nomad visa for families?",
        "Colombia's V-Nómada Digital visa has the lowest income requirement at approximately €690/month (3x Colombian minimum wage) for a 2-year visa that includes dependents. Georgia offers visa-free stays of up to 1 year with no income requirement at all."
      ),
      faqItem(
        "Which countries let you stay longest with a family?",
        "Thailand's Long-Term Resident (LTR) visa offers 5 years. Mexico's Temporary Resident Visa gives 4 years. Colombia's digital nomad visa provides 2 years. Portugal's D7 visa is renewable annually and leads to permanent residency after 5 years. Georgia allows visa-free stays of 1 year."
      ),
    ],
  }
}

export function calculatorPageJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Uncomun Family Cost Calculator",
    applicationCategory: "FinanceApplication",
    description: "Compare the monthly cost of living as a family across 45+ cities worldwide. Adjust for family size, number of kids, and education approach (international school, local school, homeschool).",
    url: "https://uncomom.vercel.app/calculator",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
  }
}

export function homeschoolLawsJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      faqItem(
        "In which countries is homeschooling legal for traveling families?",
        "Homeschooling is fully legal in Georgia, Colombia, Mexico, South Africa, Malaysia, Romania, Costa Rica, Guatemala, Bulgaria, Ecuador, and Estonia among others. It operates in a legal grey area in Portugal, Thailand, Indonesia, Japan, Serbia, and Montenegro. Spain and Hungary have restrictions but tolerate it. Enforcement against foreign families is rare in most countries."
      ),
      faqItem(
        "What are the best countries for worldschooling families?",
        "The most popular countries for worldschooling families include: Georgia (visa-free 1 year, fully legal), Thailand (large homeschool community in Chiang Mai), Indonesia/Bali (Green School and alternatives), Mexico (legal, large community), Colombia (constitutional right, 2-year nomad visa), and Portugal (D7 visa, grey area but no enforcement)."
      ),
    ],
  }
}

function faqItem(question: string, answer: string) {
  return {
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  }
}
