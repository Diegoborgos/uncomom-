// lib/family-intelligence.ts
// The extraction engine. Runs silently on every conversation turn.
// Also powers the always-on companion that follows families over time.

import { extractionCompletion, chatCompletion } from "./llm"

export type ExtractedIntelligence = {
  family_name?: string
  home_country?: string
  country_code?: string
  kids_ages?: number[]
  parent_work_type?: string
  travel_style?: string
  education_approach?: string
  languages?: string[]
  interests?: string[]
  current_city?: string
  primary_anxiety?: string
  secondary_anxiety?: string
  real_budget_min?: number
  real_budget_max?: number
  passport_tier?: "strong" | "medium" | "limited"
  next_destination_candidates?: string[]
  departure_horizon?: string
  decision_stage?: string
  top_priorities?: string[]
  deal_breakers?: string[]
  ai_profile_summary?: string
  open_to_introductions?: boolean
  cities_visited?: string[]
}

const STRONG_PASSPORTS = ["US","GB","DE","FR","IT","ES","NL","BE","AT","CH","SE","NO","DK","FI","AU","NZ","CA","JP","SG","KR","IL","PT","IE","LU"]
const MEDIUM_PASSPORTS = ["BR","MX","AR","CL","CO","PE","TR","IN","ZA","MY","TH","ID","UA","PL","CZ","HU","RO","BG","CN","HR","RS"]

export function inferPassportTier(code: string): "strong" | "medium" | "limited" {
  const c = code.toUpperCase()
  if (STRONG_PASSPORTS.includes(c)) return "strong"
  if (MEDIUM_PASSPORTS.includes(c)) return "medium"
  return "limited"
}

export async function extractFromConversation(
  messages: Array<{ role: string; content: string }>,
  existing: Partial<ExtractedIntelligence>
): Promise<ExtractedIntelligence> {

  const conversation = messages
    .map(m => `${m.role === "user" ? "Family" : "Guide"}: ${m.content}`)
    .join("\n")

  const response = await extractionCompletion([
    {
      role: "system",
      content: "You extract structured data from conversations. Return only valid JSON. No markdown. No explanation."
    },
    {
      role: "user",
      content: `Extract family intelligence from this conversation.
Return JSON with only fields clearly evidenced in the conversation.

Possible fields:
{
  "family_name": "string",
  "home_country": "string",
  "country_code": "2-letter ISO",
  "kids_ages": [integers],
  "parent_work_type": "string",
  "travel_style": "slow|medium|fast|seasonal|base+trips",
  "education_approach": "string",
  "languages": ["strings"],
  "interests": ["strings"],
  "current_city": "string — city they are currently living in",
  "cities_visited": ["cities they have lived in or traveled to as a family"],
  "primary_anxiety": "school|safety|cost|community|visa|healthcare|financial|relationship",
  "secondary_anxiety": "same options",
  "real_budget_min": integer EUR/month,
  "real_budget_max": integer EUR/month,
  "next_destination_candidates": ["city names mentioned"],
  "departure_horizon": "now|1-3months|3-6months|6-12months|not-sure",
  "decision_stage": "dreaming|planning|decided|moving|already-there",
  "top_priorities": ["what matters most"],
  "deal_breakers": ["absolute nos"],
  "ai_profile_summary": "one sentence describing this family and their core need",
  "open_to_introductions": boolean
}

Existing profile (new data wins on conflict):
${JSON.stringify(existing)}

Conversation:
${conversation}

Return only the JSON object. No other text.`
    }
  ])

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    const extracted: ExtractedIntelligence = JSON.parse(jsonMatch?.[0] || "{}")
    if (extracted.country_code && !extracted.passport_tier) {
      extracted.passport_tier = inferPassportTier(extracted.country_code)
    }
    return extracted
  } catch {
    return {}
  }
}

// Generate the companion's next question based on family state
export async function generateCompanionCheckin(
  family: Record<string, unknown>,
  trigger: string,
  context?: string
): Promise<string> {
  const response = await chatCompletion([
    {
      role: "system",
      content: "You are the Uncomun companion. You follow up with families over time. Ask ONE short, warm, specific question based on where they are in their journey. Max 2 sentences."
    },
    {
      role: "user",
      content: `Family profile: ${JSON.stringify({
        name: family.family_name,
        kidsAges: family.kids_ages,
        primaryAnxiety: family.primary_anxiety,
        decisionStage: family.decision_stage,
        departureHorizon: family.departure_horizon,
        currentCity: family.current_city,
        destinations: family.next_destination_candidates,
      })}

Trigger: ${trigger}
Context: ${context || "routine checkin"}

Generate one warm, specific follow-up question for this family.`
    }
  ])

  return response.trim() || "How is your family doing with the planning?"
}
