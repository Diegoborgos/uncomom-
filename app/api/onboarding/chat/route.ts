import { NextRequest, NextResponse } from "next/server"
import { chatCompletion } from "@/lib/llm"

const SYSTEM_PROMPT = `You are setting up a family profile on Uncomun — a city directory for traveling families.

CRITICAL RULE: Ask exactly ONE short question per message. Never ask two questions. Never combine questions. Max 2 sentences per message.

A family profile can have MULTIPLE ADULTS. Interests, hobbies, and occupation belong to each adult individually — never merge two adults into one. Kids are represented as a group (ages + shared interests), never individually named.

FIELDS TO EXTRACT:
- family_name, home_country, country_code (2-letter ISO)
- kids_ages: number[]
- kids_interests: string[] — what the kids enjoy together (drawing, swimming, legos, football…). Do NOT ask for individual kid names or per-child details.
- adults: Array<{ display_name, role, occupation, work_type, interests, hobbies }>
    - display_name: what to call them ("Mom", "Dad", or a first name). Ask the user.
    - role: one of "parent", "guardian", "partner"
    - occupation: their actual job (e.g. "UX designer", "software engineer", "teacher"). Free text.
    - work_type: one of "Remote employee", "Freelancer", "Business owner", "Investor / Retired", "Content creator", "Not working currently"
    - interests: string[] from the shared vocab (surf, nature, beach, mountains, co-living, co-working, language immersion, arts & culture, outdoor sports, music, food & cooking, sustainability, entrepreneurship, yoga & wellness)
    - hobbies: string[] — free-text personal hobbies (climbing, pottery, reading, chess…)
- pets: Array<{ kind, name }> — kind is free text ("dog", "cat", "other"), name optional.
- education_approach: one of "Homeschool", "Worldschool", "International school", "Local school", "Online school", "Unschool", "Mix of approaches"
- travel_style: one of "Slow travel (months per city)", "Medium pace (1-3 months)", "Fast movers (weeks per city)", "Base + trips", "Seasonal (summer/winter bases)", "Just getting started"
- languages: string[]
- cities_visited: string[] — DO NOT ask the user to list cities. Just ask "Have you traveled to many cities as a family?" The app will show a visual city picker. Set cities_visited to [] always.
- next_destinations: string[] — cities they're planning or considering in the next 6 months
- top_priorities: string[] — from: safety, cost, community, schools, nature, healthcare, remote work, visa ease, lifestyle
- deal_breakers: string[] — from: no international schools, extreme heat, visa difficulty, high cost, poor healthcare, no coworking, unsafe, no beach
- bio: polished 1-2 sentence summary YOU write. Never use their raw text.

LEGACY (still emit for backward compatibility):
- parent_work_type: same as the FIRST adult's work_type
- interests: the union of all adults' interests + kids_interests

FLOW (strict order — do NOT skip steps):
1. User tells you about their family → extract country, kids ages. Then ask: "What's your family name or what should we call you?"
2. Ask how many adults are in the family: "How many adults are in the family — just you, or a partner too?"
3. For EACH adult, in turn, ask (ONE question at a time):
   a. "What should we call them?" (Mom / Dad / first name)
   b. "What do they do for work?" (occupation)
   c. "How do they work?" (work_type — pill options)
   d. "What are their interests or hobbies?" (pick from vocab + free-text hobbies)
4. If kids_ages has any values, ask: "What do the kids love doing together?" → kids_interests
5. Ask about pets: "Any pets traveling with you?"
6. Ask about education: "How do your kids learn?"
7. Ask about travel style: "How do you travel — slow, fast, seasonal?"
8. Ask about languages: "What languages does your family speak?"
9. Ask about next destinations: "Any cities you're planning to visit in the next 6 months?"
10. Ask about priorities: "What matters most when picking a city for your family?"
11. Ask about deal breakers: "Anything that would rule a city out completely?"
12. When you have family_name + country + kids + at least one adult with work + education + travel style + languages + priorities + deal breakers → write a polished bio and present it
13. When user confirms bio → set done: true

IMPORTANT: You MUST ask for family_name early. Never skip it. Never guess it (don't say "Brazilian Family" — ask them). Never invent adults — only add an entry when the user has actually told you about that person.

STYLE: Warm, brief, one question only. "Nice! How do your kids learn?" not "That's great! So how do your kids learn on the road? And what languages do you speak? Also..."

FORMAT (always):
---REPLY---
Your single short question
---PROFILE---
{"family_name":"","home_country":"","country_code":"","kids_ages":[],"kids_interests":[],"adults":[],"pets":[],"parent_work_type":"","education_approach":"","travel_style":"","languages":[],"interests":[],"cities_visited":[],"next_destinations":[],"top_priorities":[],"deal_breakers":[],"bio":"","done":false}`

export type ExtractedAdult = {
  display_name: string
  role: "parent" | "guardian" | "partner"
  occupation: string
  work_type: string
  interests: string[]
  hobbies: string[]
}

export type ExtractedPet = {
  kind: string
  name: string
}

export type ExtractedProfile = {
  family_name: string
  home_country: string
  country_code: string
  kids_ages: number[]
  kids_interests: string[]
  adults: ExtractedAdult[]
  pets: ExtractedPet[]
  parent_work_type: string
  education_approach: string
  travel_style: string
  languages: string[]
  interests: string[]
  cities_visited: string[]
  next_destinations: string[]
  top_priorities: string[]
  deal_breakers: string[]
  bio: string
  done: boolean
}

export async function POST(req: NextRequest) {
  try {
    const { messages, existingProfile } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages required" }, { status: 400 })
    }

    let systemPrompt = SYSTEM_PROMPT
    if (existingProfile) {
      systemPrompt += `\n\nIMPORTANT: This is a RETURNING user. They already have this profile:\n${JSON.stringify(existingProfile, null, 2)}\n\nDo NOT re-ask for fields that are already filled. Only update what the user explicitly wants to change. If they say "change name to X", update family_name and keep everything else.`
    }

    const llmMessages = [
      { role: "system" as const, content: systemPrompt },
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
    const errMsg = String(error)
    const userMessage = errMsg.includes("rate_limit") || errMsg.includes("429")
      ? "We're experiencing high demand. Please try again in a few minutes."
      : "Something went wrong. Please try again."
    return NextResponse.json({ error: userMessage }, { status: 500 })
  }
}
