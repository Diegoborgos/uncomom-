import { NextRequest, NextResponse } from "next/server"
import { chatCompletion } from "@/lib/llm"

const SYSTEM_PROMPT = `You are helping a traveling family set up their Uncomun profile. Uncomun is a city directory for families who travel and live globally.

Your job is to have a SHORT, warm conversation to learn about this family and extract their profile data.

FIELDS TO EXTRACT (return as JSON in your response):
- family_name: string (their family surname or what they want to be called)
- home_country: string (country name)
- country_code: string (2-letter ISO code, e.g. "US", "PT", "AU")
- kids_ages: number[] (array of ages)
- parent_work_type: string (one of: "Remote employee", "Freelancer", "Business owner", "Investor / Retired", "Content creator", "Not working currently")
- education_approach: string (one of: "Homeschool", "Worldschool", "International school", "Local school", "Online school", "Unschool", "Mix of approaches")
- travel_style: string (one of: "Slow travel (months per city)", "Medium pace (1-3 months)", "Fast movers (weeks per city)", "Base + trips", "Seasonal (summer/winter bases)", "Just getting started")
- languages: string[] (languages the family speaks)
- interests: string[] (from: surf, nature, beach, mountains, co-living, co-working, language immersion, arts & culture, outdoor sports, music, food & cooking, sustainability, entrepreneurship, yoga & wellness)
- cities_visited: string[] (cities they've lived in or visited as a family — CRITICAL, always ask this)
- bio: string (a polished 1-2 sentence profile bio YOU write based on what you learned — do NOT use their raw text)

RULES:
1. Ask ONE question at a time. Keep it conversational, not like a form.
2. Start by asking them to tell you about their family openly.
3. If their answer is vague or ambiguous, ask a follow-up to clarify (e.g. "3 different countries — which ones? That's a cool mix!")
4. ALWAYS ask which cities they've been to as a family. This is the most important data.
5. After ~6-8 exchanges, when you have enough info, write a polished bio and present it: "Here's how I'd describe your family on Uncomun: [bio]. Does that sound right?"
6. When the user confirms the bio (or you have all key fields), set done: true.
7. Be warm but efficient. No filler. Every message should extract data or clarify something.
8. Do NOT repeat information back unnecessarily. Move forward.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS (always include both parts):
---REPLY---
Your conversational message to the user
---PROFILE---
{"family_name":"","home_country":"","country_code":"","kids_ages":[],"parent_work_type":"","education_approach":"","travel_style":"","languages":[],"interests":[],"cities_visited":[],"bio":"","done":false}

Only include fields you've actually extracted. Use empty string/array for unknown fields. Set done:true ONLY when you've presented the bio and the user confirmed.`

export type ExtractedProfile = {
  family_name: string
  home_country: string
  country_code: string
  kids_ages: number[]
  parent_work_type: string
  education_approach: string
  travel_style: string
  languages: string[]
  interests: string[]
  cities_visited: string[]
  bio: string
  done: boolean
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages required" }, { status: 400 })
    }

    const llmMessages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...messages,
    ]

    const response = await chatCompletion(llmMessages)

    // Parse the structured response
    let reply = response
    let profile: Partial<ExtractedProfile> = {}

    // Try structured format first: ---REPLY--- ... ---PROFILE--- ...
    const replyMatch = response.match(/---REPLY---\s*([\s\S]*?)(?=---PROFILE---|$)/)
    const profileMatch = response.match(/---PROFILE---\s*([\s\S]*)/)

    if (replyMatch) {
      reply = replyMatch[1].trim()
    } else if (profileMatch) {
      // No ---REPLY--- marker, but ---PROFILE--- exists
      // Split on ---PROFILE--- and take everything before as the reply
      reply = response.split("---PROFILE---")[0].replace("---REPLY---", "").trim()
    }

    // Extract profile JSON
    if (profileMatch) {
      try {
        profile = JSON.parse(profileMatch[1].trim())
      } catch {
        const jsonMatch = profileMatch[1].match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try { profile = JSON.parse(jsonMatch[0]) } catch { /* ignore */ }
        }
      }
    } else {
      // No markers at all — try to find JSON anywhere in the response
      const jsonMatch = response.match(/\{[\s\S]*"done"\s*:\s*(true|false)[\s\S]*\}/)
      if (jsonMatch) {
        try {
          profile = JSON.parse(jsonMatch[0])
          // Remove the JSON from the reply
          reply = response.replace(jsonMatch[0], "").trim()
        } catch { /* ignore */ }
      }
    }

    // Clean up any remaining markers from the reply
    reply = reply.replace(/---REPLY---/g, "").replace(/---PROFILE---/g, "").trim()
    // Remove any JSON that leaked into the reply
    reply = reply.replace(/\{[^}]*"done"\s*:\s*(true|false)[^}]*\}/g, "").trim()

    return NextResponse.json({ reply, profile })
  } catch (error) {
    console.error("Onboarding chat error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
