import { extractionCompletion } from "./llm"

export type ExtractedFieldReport = {
  city_slug: string | null
  city_name: string | null
  trip_start: string | null
  trip_end: string | null
  trip_duration_weeks: number | null
  still_there: boolean | null
  days_to_housing: number | null
  days_to_first_community: number | null
  days_to_school_enrolled: number | null
  days_to_operational: number | null
  housing_search_difficulty: string | null
  biggest_setup_blocker: string | null
  setup_narrative: string | null
  cost_rent: number | null
  cost_school_per_child: number | null
  cost_groceries: number | null
  cost_total_family: number | null
  safety_rating: number | null
  safety_notes: string | null
  felt_safe_walking_night: boolean | null
  kids_play_outside_alone: boolean | null
  school_type: string | null
  school_name: string | null
  school_quality_rating: number | null
  school_enrollment_difficulty: string | null
  community_rating: number | null
  days_to_first_family_connection: number | null
  found_community_how: string | null
  community_notes: string | null
  nature_rating: number | null
  kid_friendly_activities: string | null
  internet_reliability: string | null
  coworking_used: boolean | null
  healthcare_experience: string | null
  needed_medical_care: boolean | null
  healthcare_quality: string | null
  would_return: boolean | null
  overall_rating: number | null
  top_tip: string | null
  biggest_challenge: string | null
  who_is_this_city_for: string | null
  who_should_avoid: string | null
  confidence: number | null
  fields_extracted: string[]
}

export async function extractFieldReportFromConversation(
  messages: Array<{ role: string; content: string }>,
  existingReport: Partial<ExtractedFieldReport> = {}
): Promise<Partial<ExtractedFieldReport>> {
  const conversation = messages
    .map(m => `${m.role === "user" ? "Family" : "Guide"}: ${m.content}`)
    .join("\n")

  const response = await extractionCompletion([
    {
      role: "system",
      content: "You extract structured city field report data from family conversations. Return only valid JSON. No markdown. No explanation."
    },
    {
      role: "user",
      content: `Extract city field report data from this conversation.
Return JSON with only fields clearly evidenced in the conversation.
Do NOT guess numbers — only include costs, ratings, and days if explicitly stated or clearly calculable.
For ratings (1-5), infer from sentiment: very negative = 1-2, mixed = 3, positive = 4, glowing = 5.
For costs, normalize to EUR/month.
Set confidence: 80-100 = most fields stated, 50-79 = mix, below 50 = mostly inferred.

Possible fields:
{
  "city_slug": "lowercase-with-hyphens",
  "city_name": "string",
  "trip_start": "ISO date if mentioned",
  "trip_end": "ISO date if mentioned",
  "trip_duration_weeks": number,
  "still_there": boolean,
  "days_to_housing": number,
  "days_to_first_community": number,
  "days_to_school_enrolled": number,
  "days_to_operational": number,
  "housing_search_difficulty": "easy|moderate|hard|very_hard",
  "biggest_setup_blocker": "string",
  "setup_narrative": "their setup story in their words",
  "cost_rent": EUR/month,
  "cost_school_per_child": EUR/month,
  "cost_groceries": EUR/month,
  "cost_total_family": EUR/month,
  "safety_rating": 1-5,
  "safety_notes": "string",
  "felt_safe_walking_night": boolean,
  "kids_play_outside_alone": boolean,
  "school_type": "international|local|homeschool|hybrid|worldschool",
  "school_name": "string",
  "school_quality_rating": 1-5,
  "school_enrollment_difficulty": "easy|moderate|hard|very_hard",
  "community_rating": 1-5,
  "days_to_first_family_connection": number,
  "found_community_how": "string",
  "community_notes": "string",
  "nature_rating": 1-5,
  "kid_friendly_activities": "string",
  "internet_reliability": "excellent|good|spotty|bad",
  "coworking_used": boolean,
  "healthcare_experience": "string",
  "needed_medical_care": boolean,
  "healthcare_quality": "good|adequate|poor",
  "would_return": boolean,
  "overall_rating": 1-5,
  "top_tip": "their #1 advice",
  "biggest_challenge": "string",
  "who_is_this_city_for": "string",
  "who_should_avoid": "string",
  "confidence": 0-100,
  "fields_extracted": ["field names with clear evidence"]
}

Existing report data (merge — new data wins on conflict):
${JSON.stringify(existingReport)}

Conversation:
${conversation}

Return only the JSON object. No other text.`
    }
  ])

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    const extracted: Partial<ExtractedFieldReport> = JSON.parse(jsonMatch?.[0] || "{}")
    return extracted
  } catch {
    return {}
  }
}

export function conversationHasCityExperience(
  messages: Array<{ role: string; content: string }>
): boolean {
  const fullText = messages.map(m => m.content).join(" ").toLowerCase()

  const experienceSignals = [
    /we (?:lived|stayed|spent|were) in/,
    /(?:just )?(?:got back|returned|came back|left) from/,
    /(?:moved|relocated) (?:to|from)/,
    /we(?:'re| are) (?:currently |now )?(?:in|living in|based in|staying in)/,
    /(?:been here|been living here|arrived) (?:for |since )/,
    /(?:the school|our school|enrolled|housing|apartment|flat|rent) (?:here|there|in|was|is|cost)/,
    /(?:it took|we found|we spent) .{0,30}(?:weeks?|months?|days?) (?:to find|to get|looking|searching|settling)/,
    /(?:field report|report on|review of|our experience in)/,
    /(?:i want to share|let me tell you about|here's what .+ was like)/,
  ]

  return experienceSignals.some(pattern => pattern.test(fullText))
}
