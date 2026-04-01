import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { chatCompletionStream } from "@/lib/llm"
import { extractFromConversation } from "@/lib/family-intelligence"

const SYSTEM_PROMPT = `You are the Uncomun guide — a warm, deeply knowledgeable companion for families considering living abroad.

You are not a form. You are not a chatbot. You are the friend who has helped hundreds of families make this exact decision.

You ask ONE question at a time. You listen. You follow threads. You remember everything said in this conversation.

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

Your responses are SHORT. 2-4 sentences. Warm. Specific to what they just said.

After 7-10 exchanges when you have a solid picture, naturally transition:
"I think I have a good sense of what your family needs. Want me to show you which cities fit — and which families have made the exact move you're considering?"

Never list questions. Never say "let me ask you about X". Just talk.`

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  const { messages, familyId } = await req.json()

  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 })
  }

  const llmMessages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
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
    // Return as SSE so the client can parse it
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

      // Silent extraction after streaming completes
      if (familyId && fullText) {
        try {
          const db = adminClient()
          const { data: family } = await db.from("families").select("*").eq("id", familyId).single()

          const allMessages = [...messages, { role: "assistant", content: fullText }]
          const extracted = await extractFromConversation(allMessages, {
            primary_anxiety: family?.primary_anxiety,
            real_budget_max: family?.real_budget_max,
            passport_tier: family?.passport_tier,
            decision_stage: family?.decision_stage,
          })

          if (Object.keys(extracted).length > 0) {
            const updatePayload: Record<string, unknown> = {
              ...extracted,
              ai_conversation_turns: (family?.ai_conversation_turns || 0) + 1,
              ai_last_extracted: new Date().toISOString(),
              chat_history: allMessages.slice(-30),
              onboarding_complete: true,
              updated_at: new Date().toISOString(),
            }
            await db.from("families").update(updatePayload).eq("id", familyId)
          }
        } catch (err) {
          console.error("Extraction error:", err)
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
