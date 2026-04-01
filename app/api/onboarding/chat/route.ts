import { NextRequest, NextResponse } from "next/server"
import { chatCompletion } from "@/lib/llm"

const SYSTEM_PROMPT = `You are setting up a family profile on Uncomun — a city directory for traveling families.

CRITICAL RULE: Ask exactly ONE short question per message. Never ask two questions. Never combine questions. Max 2 sentences per message.

FIELDS TO EXTRACT:
- family_name, home_country, country_code (2-letter ISO)
- kids_ages: number[]
- parent_work_type: one of "Remote employee", "Freelancer", "Business owner", "Investor / Retired", "Content creator", "Not working currently"
- education_approach: one of "Homeschool", "Worldschool", "International school", "Local school", "Online school", "Unschool", "Mix of approaches"
- travel_style: one of "Slow travel (months per city)", "Medium pace (1-3 months)", "Fast movers (weeks per city)", "Base + trips", "Seasonal (summer/winter bases)", "Just getting started"
- languages: string[]
- interests: string[] (from: surf, nature, beach, mountains, co-living, co-working, language immersion, arts & culture, outdoor sports, music, food & cooking, sustainability, entrepreneurship, yoga & wellness)
- cities_visited: string[] — DO NOT ask the user to list cities. Just ask "Have you traveled to many cities as a family?" The app will show a visual city picker. Set cities_visited to [] always.
- bio: polished 1-2 sentence summary YOU write. Never use their raw text.

FLOW (strict order — do NOT skip steps):
1. User tells you about their family → extract country, kids ages. Then ask: "What's your family name or what should we call you?"
2. Ask about work: "What kind of work do you do?"
3. Ask about education: "How do your kids learn?"
4. Ask about travel style: "How do you travel — slow, fast, seasonal?"
5. Ask about languages: "What languages does your family speak?"
6. When you have family_name + country + kids + work + education + travel style + languages → write a polished bio and present it
7. When user confirms bio → set done: true

IMPORTANT: You MUST ask for family_name early. Never skip it. Never guess it (don't say "Brazilian Family" — ask them).

STYLE: Warm, brief, one question only. "Nice! How do your kids learn?" not "That's great! So how do your kids learn on the road? And what languages do you speak? Also..."

FORMAT (always):
---REPLY---
Your single short question
---PROFILE---
{"family_name":"","home_country":"","country_code":"","kids_ages":[],"parent_work_type":"","education_approach":"","travel_style":"","languages":[],"interests":[],"cities_visited":[],"bio":"","done":false}`

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
