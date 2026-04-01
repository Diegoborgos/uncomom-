"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

type Message = { role: "user" | "assistant"; content: string }

const FIRST_MESSAGE: Message = {
  role: "assistant",
  content: "Hey! Tell me about your family — where are you from, and what's got you thinking about living abroad?"
}

export default function JoinPage() {
  const { user, family, refreshFamily, loading: authLoading } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [matchData, setMatchData] = useState<Record<string, unknown> | null>(null)
  const [trajectoryData, setTrajectoryData] = useState<Record<string, unknown> | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasInitialized = useRef(false)

  // Load saved chat history or show first message
  // Key fix: depend on `family` so it re-runs when family loads
  useEffect(() => {
    if (authLoading) return
    if (hasInitialized.current) return
    hasInitialized.current = true

    const saved = family?.chat_history as Message[] | null
    if (saved && Array.isArray(saved) && saved.length > 0) {
      setMessages(saved)
      if (saved.length >= 14 || family?.primary_anxiety) {
        setShowResults(true)
        loadResults()
      }
    } else if (family && (family.onboarding_complete || (family.family_name && family.family_name !== "My Family"))) {
      // Returning user with a profile but no chat history — show profile summary
      const parts: string[] = []
      if (family.family_name) parts.push(`Family: ${family.family_name}`)
      if (family.home_country) parts.push(`From: ${family.home_country}`)
      if (family.kids_ages?.length) parts.push(`Kids: ages ${family.kids_ages.join(", ")}`)
      if (family.parent_work_type) parts.push(`Work: ${family.parent_work_type}`)
      if (family.education_approach) parts.push(`Education: ${family.education_approach}`)
      if (family.travel_style) parts.push(`Travel: ${family.travel_style}`)
      if (family.bio) parts.push(`\nBio: "${family.bio}"`)
      setMessages([{
        role: "assistant",
        content: `Here's your current profile:\n\n${parts.join("\n")}\n\nWhat would you like to update?`
      }])
    } else {
      setMessages([FIRST_MESSAGE])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, family])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (!loading) inputRef.current?.focus()
  }, [loading])

  const loadResults = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`

    const [matchRes, trajRes] = await Promise.all([
      fetch("/api/match-cities", { method: "POST", headers }),
      fetch("/api/trajectory", { method: "POST", headers, body: JSON.stringify({}) }),
    ])

    if (matchRes.ok) setMatchData(await matchRes.json())
    if (trajRes.ok) setTrajectoryData(await trajRes.json())
  }, [])

  const send = useCallback(async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: "user", content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          familyId: family?.id || null,
          userId: user?.id || null,
        }),
      })

      if (!res.body) throw new Error("No stream")
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ""

      setMessages(prev => [...prev, { role: "assistant", content: "" }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value).split("\n").filter(l => l.startsWith("data: "))) {
          const raw = line.replace("data: ", "").trim()
          if (raw === "[DONE]") continue
          try {
            const p = JSON.parse(raw)
            if (p.text) {
              text += p.text
              setMessages(prev => [...prev.slice(0, -1), { role: "assistant", content: text }])
            }
          } catch { /* skip */ }
        }
      }

      if (user) await refreshFamily()

      const shouldShow = text.toLowerCase().includes("show you which cities") ||
        text.toLowerCase().includes("based on what you") ||
        text.toLowerCase().includes("good sense of") ||
        newMessages.length >= 14

      if (shouldShow && !showResults) {
        setShowResults(true)
        loadResults()
      }
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, family, user, refreshFamily, showResults, loadResults])

  type CityMatch = { slug: string; name: string; country: string; score: number; personalizedInsight: string; photo: string }
  const top5 = matchData?.top5 as CityMatch[] | undefined
  const trajectory = trajectoryData as { narrative?: string; insights?: Array<{ statement: string; basedOn: number }> } | null

  // Progress bar — same as onboarding
  const fields = [
    family?.family_name && family.family_name !== "My Family",
    family?.home_country,
    family?.kids_ages?.length,
    family?.parent_work_type,
    family?.education_approach,
    family?.travel_style,
    family?.primary_anxiety,
    family?.real_budget_max,
    family?.bio,
  ]
  const progress = Math.min(100, Math.round((fields.filter(Boolean).length / fields.length) * 100))

  if (authLoading) return <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">Loading...</div>

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress — compact inline, same as onboarding */}
      <div className="px-4 pt-3 pb-1">
        <div className="h-1 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
          <div className="h-full rounded-full bg-[var(--accent-green)] transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Messages — same style as onboarding */}
      <div className="px-4 py-2 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-[var(--accent-green)] text-black rounded-2xl rounded-br-md"
                : "bg-[var(--surface)] text-[var(--text-primary)] rounded-2xl rounded-bl-md"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[var(--surface)] px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {/* Results panel — inline with messages */}
        {showResults && (
          <>
            {trajectory?.narrative && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-2 font-medium">Families like yours</p>
                <p className="text-sm leading-relaxed text-[var(--text-primary)]">{trajectory.narrative}</p>
                {trajectory.insights?.slice(0, 2).map((ins, i) => (
                  <p key={i} className="text-xs text-[var(--text-secondary)] mt-1.5">→ {ins.statement}</p>
                ))}
              </div>
            )}

            {top5 && top5.length > 0 && (
              <div className="rounded-xl border border-[var(--accent-green)]/30 bg-[var(--accent-green)]/5 p-4">
                <p className="text-[10px] text-[var(--accent-green)] uppercase tracking-wider mb-3 font-medium">Your top cities</p>
                {typeof matchData?.personalIntro === "string" && matchData.personalIntro && (
                  <p className="text-xs text-[var(--text-secondary)] italic mb-3">{matchData.personalIntro}</p>
                )}
                <div className="space-y-2">
                  {top5.map((city, i) => (
                    <Link key={city.slug} href={`/cities/${city.slug}`}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-green)] transition-colors">
                      <span className="font-mono text-sm font-bold text-[var(--accent-warm)] w-4">{i + 1}</span>
                      {city.photo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={city.photo} alt={city.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{city.name}, {city.country}</p>
                        {city.personalizedInsight && (
                          <p className="text-[10px] text-[var(--text-secondary)] truncate">{city.personalizedInsight}</p>
                        )}
                      </div>
                      <span className="font-mono text-sm font-bold shrink-0" style={{
                        color: city.score >= 80 ? "var(--accent-green)" : "var(--accent-warm)"
                      }}>{city.score}</span>
                    </Link>
                  ))}
                </div>
                <Link href="/" className="block text-center mt-3 py-2.5 rounded-lg bg-[var(--accent-green)] text-black font-medium text-sm hover:opacity-90 transition-opacity">
                  See your full personalised ranking →
                </Link>
              </div>
            )}
          </>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input — same position as onboarding */}
      <div className="px-4 pb-4 pt-2">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
            disabled={loading}
            placeholder={loading ? "..." : "Tell me about your family..."}
            className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--accent-green)] transition-colors disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="px-5 py-3 rounded-xl bg-[var(--accent-green)] text-black font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            →
          </button>
        </div>

        {!user && (
          <p className="text-center text-xs text-[var(--text-secondary)] mt-2">
            <Link href="/signup" className="text-[var(--accent-green)] hover:underline">Create an account</Link>
            {" "}to save your profile and get matched with families
          </p>
        )}
      </div>
    </div>
  )
}
