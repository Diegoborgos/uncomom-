/**
 * AI Concierge — personalized recommendations for families.
 * Uses Groq LLM with full family context to generate suggestions.
 */

import { chatCompletion } from "./llm"
import { cities } from "@/data/cities"

const CITY_NAMES = cities.map((c) => `${c.name} (/cities/${c.slug})`).join(", ")

export type Recommendation = {
  type: "city" | "action" | "match" | "prompt"
  title: string
  description: string
  actionUrl?: string
  priority: number // 1-10, higher = more important
}

export type ConciergeAdult = {
  name: string
  role: string
  occupation: string
  workType: string
  interests: string[]
  hobbies: string[]
}

export type ConciergePet = {
  kind: string
  name: string
}

export type ConciergeInput = {
  family: {
    name: string
    country: string
    kidsAges: number[]
    kidsInterests: string[]
    education: string
    travelStyle: string
    interests: string[]
    languages: string[]
    bio: string
    adults: ConciergeAdult[]
    pets: ConciergePet[]
  }
  intelligence: {
    topCandidateCities: string[]
    dismissedCities: string[]
    primaryAnxiety: string
    decisionStage: string
    realBudgetMax: number
    continentPreference: string
    engagement: string
  } | null
  trips: { citySlug: string; status: string }[]
  currentCity: string | null
}

const CONCIERGE_PROMPT = `You are the Uncomun AI concierge — a personal family travel advisor.

You have access to this family's complete profile, behavioral intelligence, and trip history. Generate 3 personalized, actionable recommendations.

RULES:
1. Be specific — reference their actual kids' ages, education approach, and travel style
2. A "family" often has multiple adults. When adults have distinct occupations, interests, or hobbies, treat them as individuals — e.g. a recommendation can serve one parent's hobby (surf for Dad) while still working for the whole family. Do NOT average their profiles into one generic interest list.
3. If the family has pets, factor pet-friendly housing / neighbourhoods into relevant recs.
4. Every recommendation must have a clear next action
5. Never be creepy — frame insights as helpful, not surveillance
6. Prioritize: safety concerns > immediate opportunities > long-term suggestions
7. If they have no trips, encourage logging their travel history
8. If they're viewing specific cities, give comparative advice
9. Match families only if there's genuine overlap (same city + similar kids)

AVAILABLE CITIES (ONLY recommend from this list — no others exist):
${CITY_NAMES}

VALID ACTION URLS:
- City page: /cities/{slug} (use exact slugs from the list above)
- Log a trip: /cities/{slug} (they can log trips from the city page)
- Write a review: /cities/{slug} (review form is on the city page)
- Edit profile: /onboarding
- Browse cities: /
- Schools: /schools
- Visas: /visas

NEVER link to /dashboard. NEVER recommend cities not in the list above.

RECOMMENDATION TYPES:
- "city": Suggest a city based on their profile
- "action": Something they should do on the platform (log trip, write review, file report)
- "match": A family connection opportunity
- "prompt": Ask for missing profile information that would improve recommendations

OUTPUT FORMAT (strict JSON):
[
  {"type":"city","title":"Short title","description":"2-3 sentences with specific reasoning","actionUrl":"/cities/slug","priority":8},
  {"type":"action","title":"Short title","description":"Why this matters for them","actionUrl":"/dashboard","priority":6},
  {"type":"prompt","title":"Short title","description":"What we need and why","priority":4}
]

Return ONLY the JSON array. No markdown, no explanation.`

export async function getRecommendations(input: ConciergeInput): Promise<Recommendation[]> {
  const adultsBlock = input.family.adults.length > 0
    ? input.family.adults.map((a) => {
        const label = a.name || a.role || "Adult"
        const job = [a.occupation, a.workType].filter(Boolean).join(", ") || "work not specified"
        const tags = [...(a.interests || []), ...(a.hobbies || [])]
        return `  - ${label} (${job}): ${tags.join(", ") || "no interests listed"}`
      }).join("\n")
    : "  (no adults listed — using family-level interests only)"

  const kidsBlock = input.family.kidsAges.length > 0
    ? `ages ${input.family.kidsAges.join(", ")}${input.family.kidsInterests.length > 0 ? ` — kids enjoy: ${input.family.kidsInterests.join(", ")}` : ""}`
    : "no kids info"

  const petsBlock = input.family.pets.length > 0
    ? input.family.pets.map(p => p.name ? `${p.kind} (${p.name})` : p.kind).join(", ")
    : "none"

  const context = `
FAMILY PROFILE:
- Name: ${input.family.name}
- From: ${input.family.country}
- Adults:
${adultsBlock}
- Kids: ${kidsBlock}
- Pets: ${petsBlock}
- Education: ${input.family.education || "unknown"}
- Travel style: ${input.family.travelStyle || "unknown"}
- Languages: ${input.family.languages.join(", ") || "unknown"}
- Bio: ${input.family.bio || "none"}

${input.intelligence ? `BEHAVIORAL INTELLIGENCE:
- Top cities researched: ${input.intelligence.topCandidateCities.join(", ") || "none"}
- Dismissed cities: ${input.intelligence.dismissedCities.join(", ") || "none"}
- Primary concern: ${input.intelligence.primaryAnxiety || "unknown"}
- Decision stage: ${input.intelligence.decisionStage || "exploring"}
- Budget ceiling: €${input.intelligence.realBudgetMax || "unknown"}/month
- Continent preference: ${input.intelligence.continentPreference || "none"}
- Engagement level: ${input.intelligence.engagement || "new"}` : "No behavioral intelligence yet — this is a new or inactive user."}

TRIP HISTORY:
${input.trips.length > 0 ? input.trips.map((t) => `- ${t.citySlug} (${t.status})`).join("\n") : "No trips logged yet."}

${input.currentCity ? `CURRENTLY IN: ${input.currentCity}` : "Not checked in anywhere."}
`

  const messages = [
    { role: "system" as const, content: CONCIERGE_PROMPT },
    { role: "user" as const, content: context },
  ]

  try {
    const response = await chatCompletion(messages)
    // Parse JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as Recommendation[]
    }
    return []
  } catch {
    return []
  }
}
