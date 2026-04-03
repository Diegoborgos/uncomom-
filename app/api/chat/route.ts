import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { chatCompletionStream } from "@/lib/llm"
import { extractFromConversation } from "@/lib/family-intelligence"
import { extractFieldReportFromConversation, conversationHasCityExperience } from "@/lib/field-report-extraction"

const SYSTEM_PROMPT = `You are the Uncomun guide — a warm, deeply knowledgeable companion for families living abroad or considering it.

You are not a form. You are not a chatbot. You are the friend who has helped hundreds of families make this exact decision.

Your job is to have natural conversations that serve two purposes:
1. Help families figure out where they should go next (onboarding)
2. Extract city intelligence from families who've BEEN somewhere (field reporting)

You ask ONE question at a time. You listen. You follow threads. You remember everything said in this conversation.

## ONBOARDING MODE (default)

You naturally gather (without making it feel like an interview):
- How many kids, exact ages
- How the family earns money
- Budget range (you ask indirectly: "what kind of lifestyle are you thinking?")
- Passport nationality
- Where they are now, where they're considering
- Their deepest worry (you ask: "what keeps you up at night about this?")
- Education philosophy
- Travel style — fast mover or slow nester
- Timeline — when are they thinking of moving?
- What they absolutely cannot compromise on

After 7-10 exchanges when you have a solid picture, naturally transition:
"I think I have a good sense of what your family needs. Want me to show you which cities fit — and which families have made the exact move you're considering?"

## FIELD REPORT MODE

If a family mentions they've lived in, stayed in, or just returned from a city — shift naturally into field report extraction. Don't announce it. Just be genuinely curious.

Triggers:
- "We just got back from [city]"
- "We lived in [city] for [time]"
- "We're currently in [city]"
- "Our experience in [city] was..."
- Any mention of a specific city + past/present tense living experience

### What to extract (in priority order):

**Priority 1 — The Arrival Curve (unique to Uncomun)**
- How long until they had housing sorted?
- How long until they found other families / community?
- How long until kids were in school (if applicable)?
- How long until they felt "operational" — daily life running smooth?
- What was the single biggest blocker?

Ask naturally: "How long did it take to feel settled?" not "How many days until operational?"

**Priority 2 — Costs**
- Monthly rent (size, neighborhood)
- School costs per child
- Rough monthly family total

Ask naturally: "Was it what you expected cost-wise?"

**Priority 3 — Safety + Schools + Community**
- Did they feel safe with kids?
- What school setup did they use?
- How did they find other families?

**Priority 4 — The verdict**
- Would they go back?
- Who would they recommend it for?
- Top tip for the next family?

### Conversation rules:
- One question at a time. Maximum.
- Mirror their language. If they say "flat," you say "flat."
- React genuinely: "That's a long wait for housing" or "Three days to find community — that's fast."
- Share context: "That lines up with what other families report about Lisbon."
- NEVER list multiple questions. NEVER use bullet points. NEVER say "I have a few questions."
- After 4-6 good exchanges about a city, wrap warmly: "This is exactly the kind of detail that helps the next family land better. Thank you."
- Never ask something they already answered in the conversation.

Your responses are SHORT. 2-4 sentences. Warm. Specific to what they just said.
Never list questions. Never say "let me ask you about X". Just talk.`

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  const { messages, familyId, userId, cityContext, mode } = await req.json()

  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 })
  }

  // Build context-aware system prompt
  let contextAdditions = ""

  if (familyId || userId) {
    try {
      const db = adminClient()
      let fid = familyId
      if (!fid && userId) {
        const { data: fam } = await db.from("families").select("id").eq("user_id", userId).maybeSingle()
        fid = fam?.id
      }
      if (fid) {
        const { data: reports } = await db
          .from("city_field_reports")
          .select("city_slug, source, status, confidence, fields_extracted, would_return, overall_rating")
          .eq("family_id", fid)
          .order("created_at", { ascending: false })
          .limit(5)

        if (reports && reports.length > 0) {
          contextAdditions += `\n\n## EXISTING FIELD REPORTS FROM THIS FAMILY\nDon't re-ask what you already know.\n`
          for (const r of reports) {
            contextAdditions += `- ${r.city_slug}: ${r.source} report, ${r.status} (${r.confidence}% confidence, ${(r.fields_extracted || []).length} fields). ${r.would_return === true ? "Would return." : r.would_return === false ? "Would not return." : ""}\n`
          }
          contextAdditions += `If they mention one of these cities, ask about GAPS in the data.\n`
        }
      }
    } catch (e) {
      console.error("Failed to load existing reports:", e)
    }
  }

  if (mode === "report" && cityContext) {
    contextAdditions += `\n\n## CURRENT CONTEXT\nThis family clicked "Share your experience" from the ${cityContext} city page. Start in field report mode immediately — be curious about their experience there. Don't ask onboarding questions unless they bring it up.\n`
  }

  const fullSystemPrompt = SYSTEM_PROMPT + contextAdditions

  const llmMessages = [
    { role: "system" as const, content: fullSystemPrompt },
    ...messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ]

  let streamRes: Response
  try {
    streamRes = await chatCompletionStream(llmMessages)
  } catch (err) {
    const errMsg = String(err)
    const userMessage = errMsg.includes("rate_limit") || errMsg.includes("429")
      ? "We're experiencing high demand right now. Please try again in a few minutes."
      : "Something went wrong. Please try again."
    const encoder = new TextEncoder()
    const errorStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: userMessage })}\n\n`))
        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        controller.close()
      }
    })
    return new Response(errorStream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    })
  }

  const encoder = new TextEncoder()
  let fullText = ""

  const stream = new ReadableStream({
    async start(controller) {
      const reader = streamRes.body!.getReader()
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          for (const line of chunk.split("\n").filter(l => l.startsWith("data: "))) {
            const raw = line.replace("data: ", "").trim()
            if (raw === "[DONE]") continue
            try {
              const parsed = JSON.parse(raw)
              const text = parsed.choices?.[0]?.delta?.content
              if (text) {
                fullText += text
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
              }
            } catch { /* skip */ }
          }
        }
      } finally {
        reader.releaseLock()
      }

      // Save chat history + extract intelligence after streaming
      const activeUserId = userId || null
      const activeFamilyId = familyId || null

      if ((activeUserId || activeFamilyId) && fullText) {
        try {
          const db = adminClient()
          const allMessages = [...messages, { role: "assistant", content: fullText }]

          // Find or create the family row
          let family = null
          if (activeFamilyId) {
            const { data } = await db.from("families").select("*").eq("id", activeFamilyId).single()
            family = data
          } else if (activeUserId) {
            const { data } = await db.from("families").select("*").eq("user_id", activeUserId).maybeSingle()
            if (data) {
              family = data
            } else {
              // Create family row for new user
              const { data: newFamily } = await db.from("families").insert({
                user_id: activeUserId,
                family_name: "My Family",
                chat_history: allMessages.slice(-30),
                ai_conversation_turns: 1,
                updated_at: new Date().toISOString(),
              }).select().single()
              family = newFamily
            }
          }

          if (family) {
            // Always save chat history
            const updatePayload: Record<string, unknown> = {
              chat_history: allMessages.slice(-30),
              ai_conversation_turns: (family.ai_conversation_turns || 0) + 1,
              ai_last_extracted: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }

            // Extract intelligence from conversation
            const extracted = await extractFromConversation(allMessages, {
              primary_anxiety: family.primary_anxiety,
              real_budget_max: family.real_budget_max,
              passport_tier: family.passport_tier,
              decision_stage: family.decision_stage,
            })

            if (Object.keys(extracted).length > 0) {
              Object.assign(updatePayload, extracted)
              // Mark onboarding complete if we extracted enough
              if (extracted.family_name || extracted.kids_ages || extracted.primary_anxiety) {
                updatePayload.onboarding_complete = true
              }

              // Auto-generate username from family_name if not set yet
              if (extracted.family_name && !family.username) {
                const base = extracted.family_name
                  .toLowerCase()
                  .replace(/[^a-z0-9]/g, "")
                  .slice(0, 20) || "family"
                // Check if taken, add random suffix if so
                const { data: existing } = await db.from("families").select("id").eq("username", base).maybeSingle()
                if (existing) {
                  updatePayload.username = base + Math.floor(Math.random() * 999)
                } else {
                  updatePayload.username = base
                }
              }
            }

            await db.from("families").update(updatePayload).eq("id", family.id)

            // Auto-log mentioned cities as trips
            const { cities: allCities } = await import("@/data/cities")
            const citiesToLog = [
              ...(extracted.cities_visited || []).map(c => ({ name: c, status: "been_here" as const })),
              ...(extracted.current_city ? [{ name: extracted.current_city, status: "here_now" as const }] : []),
            ]
            for (const { name: cityName, status } of citiesToLog) {
              const matched = allCities.find(c =>
                c.name.toLowerCase() === cityName.toLowerCase() ||
                c.slug === cityName.toLowerCase().replace(/\s+/g, "-")
              )
              if (matched) {
                const { data: existingTrip } = await db.from("trips")
                  .select("id").eq("family_id", family.id).eq("city_slug", matched.slug).maybeSingle()
                if (!existingTrip) {
                  await db.from("trips").insert({
                    family_id: family.id,
                    city_slug: matched.slug,
                    status,
                  })
                }
              }
            }
          }
        } catch (err) {
          console.error("Extraction error:", err)
        }
      }

      // Field report extraction — runs on every turn, writes city intelligence
      if ((familyId || userId) && fullText) {
        try {
          const allMsgs = [...messages, { role: "assistant", content: fullText }]

          if (conversationHasCityExperience(allMsgs)) {
            const db = adminClient()

            let fid = familyId
            if (!fid && userId) {
              const { data: fam } = await db.from("families").select("id").eq("user_id", userId).maybeSingle()
              fid = fam?.id
            }

            if (fid) {
              const { data: existingReports } = await db
                .from("city_field_reports")
                .select("*")
                .eq("family_id", fid)
                .eq("source", "conversation")
                .eq("status", "in_progress")
                .order("created_at", { ascending: false })
                .limit(1)

              const existingReport = existingReports?.[0] || {}

              const reportData = await extractFieldReportFromConversation(allMsgs, existingReport)

              if (
                reportData.city_name &&
                reportData.fields_extracted &&
                reportData.fields_extracted.length >= 3
              ) {
                const citySlug = reportData.city_slug || reportData.city_name
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/(^-|-$)/g, "")

                const { data: cityExists } = await db
                  .from("cities")
                  .select("slug")
                  .eq("slug", citySlug)
                  .maybeSingle()

                let validCity = !!cityExists
                if (!validCity) {
                  const { cities: allCities } = await import("@/data/cities")
                  validCity = allCities.some(c => c.slug === citySlug)
                }

                if (validCity) {
                  const reportRow: Record<string, unknown> = {
                    family_id: fid,
                    city_slug: citySlug,
                    source: "conversation",
                    status: reportData.confidence && reportData.confidence >= 60 ? "complete" : "in_progress",
                    confidence: reportData.confidence || 40,
                    fields_extracted: reportData.fields_extracted,
                    extracted_at: new Date().toISOString(),
                  }

                  const fieldMap: Record<string, unknown> = {
                    trip_start: reportData.trip_start,
                    trip_end: reportData.trip_end,
                    stay_duration_days: reportData.trip_duration_weeks ? reportData.trip_duration_weeks * 7 : null,
                    safety_overall: reportData.safety_rating,
                    safety_walking_night: reportData.felt_safe_walking_night === true ? "yes" : reportData.felt_safe_walking_night === false ? "no" : null,
                    kids_played_outside_independently: reportData.kids_play_outside_alone,
                    schooling_approach: reportData.school_type,
                    school_name: reportData.school_name,
                    school_rating: reportData.school_quality_rating,
                    enrollment_difficulty: reportData.school_enrollment_difficulty,
                    housing_cost: reportData.cost_rent,
                    actual_monthly_spend: reportData.cost_total_family,
                    school_monthly_fee: reportData.cost_school_per_child,
                    found_community: reportData.community_notes || (reportData.community_rating ? `Rating: ${reportData.community_rating}/5` : null),
                    where_found_community: reportData.found_community_how,
                    found_community_how: reportData.found_community_how,
                    community_notes: reportData.community_notes,
                    internet_at_accommodation: reportData.internet_reliability,
                    internet_reliability: reportData.internet_reliability,
                    coworking_used: reportData.coworking_used,
                    could_work_reliably: reportData.coworking_used,
                    outdoor_life_rating: reportData.nature_rating,
                    kid_friendly_activities: reportData.kid_friendly_activities,
                    needed_doctor: reportData.needed_medical_care,
                    needed_medical_care: reportData.needed_medical_care,
                    doctor_experience: reportData.healthcare_experience,
                    healthcare_experience: reportData.healthcare_experience,
                    healthcare_quality: reportData.healthcare_quality,
                    would_return: reportData.would_return,
                    overall_rating: reportData.overall_rating,
                    top_tip: reportData.top_tip,
                    biggest_challenge: reportData.biggest_challenge,
                    who_is_this_city_for: reportData.who_is_this_city_for,
                    who_should_avoid: reportData.who_should_avoid,
                    days_to_housing: reportData.days_to_housing,
                    days_to_first_community: reportData.days_to_first_community || reportData.days_to_first_family_connection,
                    days_to_school_enrolled: reportData.days_to_school_enrolled,
                    days_to_operational: reportData.days_to_operational,
                    housing_search_difficulty: reportData.housing_search_difficulty,
                    biggest_setup_blocker: reportData.biggest_setup_blocker,
                    setup_narrative: reportData.setup_narrative,
                  }

                  for (const [key, value] of Object.entries(fieldMap)) {
                    if (value !== null && value !== undefined) {
                      reportRow[key] = value
                    }
                  }

                  if (existingReport?.id) {
                    await db.from("city_field_reports").update(reportRow).eq("id", existingReport.id)
                  } else {
                    await db.from("city_field_reports").insert(reportRow)
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error("Field report extraction error:", err)
        }
      }

      controller.enqueue(encoder.encode("data: [DONE]\n\n"))
      controller.close()
    }
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}
