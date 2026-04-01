"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

type Message = { role: "user" | "assistant"; content: string }

const FIRST_MESSAGE: Message = {
  role: "assistant",
  content: "Welcome. I'm here to help your family figure out where to go next — and connect you with families who've made the exact same move.\n\nTell me where you are in your journey. Are you still dreaming about this, actively planning, or already close to moving?"
}

export default function JoinPage() {
  const { user, family, refreshFamily } = useAuth()
  const [messages, setMessages] = useState<Message[]>([FIRST_MESSAGE])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [matchData, setMatchData] = useState<Record<string, unknown> | null>(null)
  const [trajectoryData, setTrajectoryData] = useState<Record<string, unknown> | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

      if (family?.id) await refreshFamily()

      // Show results after enough conversation or natural transition
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
  }, [input, loading, messages, family, refreshFamily, showResults, loadResults])

  type CityMatch = { slug: string; name: string; country: string; score: number; personalizedInsight: string; photo: string }
  const top5 = matchData?.top5 as CityMatch[] | undefined
  const trajectory = trajectoryData as { narrative?: string; insights?: Array<{ statement: string; basedOn: number }> } | null

  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl font-bold mb-2">Find where your family belongs</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Tell us about your family. We&apos;ll match you with cities and families who&apos;ve made the same move.
        </p>
      </div>

      <div className="flex-1 space-y-4 mb-6">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-[var(--accent-green)] text-black rounded-br-sm"
                : "bg-[var(--surface)] border border-[var(--border)] rounded-bl-sm"
            }`}>
              {msg.content}
              {loading && i === messages.length - 1 && msg.role === "assistant" && !msg.content && (
                <span className="inline-flex gap-1 ml-1">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Results panel — appears after enough conversation */}
      {showResults && (
        <div className="mb-6 space-y-4">
          {/* Trajectory insights */}
          {trajectory?.narrative && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-2 font-medium">Families like yours</p>
              <p className="text-sm leading-relaxed text-[var(--text-primary)]">{trajectory.narrative}</p>
              {trajectory.insights?.slice(0, 2).map((ins, i) => (
                <p key={i} className="text-xs text-[var(--text-secondary)] mt-1.5">→ {ins.statement}</p>
              ))}
            </div>
          )}

          {/* City matches */}
          {top5 && top5.length > 0 && (
            <div className="rounded-xl border border-[var(--accent-green)]/30 bg-[var(--accent-green)]/5 p-4">
              <p className="text-[10px] text-[var(--accent-green)] uppercase tracking-wider mb-3 font-medium">Your top cities</p>
              {matchData?.personalIntro && (
                <p className="text-xs text-[var(--text-secondary)] italic mb-3">{matchData.personalIntro as string}</p>
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
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
          disabled={loading}
          placeholder={loading ? "..." : "Your answer..."}
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
        <p className="text-center text-xs text-[var(--text-secondary)] mt-3">
          <Link href="/signup" className="text-[var(--accent-green)] hover:underline">Create an account</Link>
          {" "}to save your profile and get matched with families
        </p>
      )}
    </div>
  )
}
