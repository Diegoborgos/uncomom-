"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { cities } from "@/data/cities"

type Message = { role: "user" | "assistant"; content: string }

type ExtractedProfile = {
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

const emptyProfile: ExtractedProfile = {
  family_name: "", home_country: "", country_code: "",
  kids_ages: [], parent_work_type: "", education_approach: "",
  travel_style: "", languages: [], interests: [],
  cities_visited: [], bio: "", done: false,
}

export default function OnboardingPage() {
  const { user, family, loading, refreshFamily } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [profile, setProfile] = useState<ExtractedProfile>(emptyProfile)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  // Start the conversation
  useEffect(() => {
    if (messages.length === 0 && user && !loading) {
      const greeting = family?.onboarding_complete
        ? { role: "assistant" as const, content: "Welcome back! Want to update your profile? Just tell me what's changed." }
        : { role: "assistant" as const, content: "Hey! I'm here to set up your Uncomun profile. Tell me about your family — who you are, where you're from, how you travel. Just talk naturally." }
      setMessages([greeting])
    }
  }, [user, loading, family]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || sending) return
    const userMsg = input.trim()
    setInput("")
    setError("")

    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }]
    setMessages(newMessages)
    setSending(true)

    try {
      const res = await fetch("/api/onboarding/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      })

      const data = await res.json()

      if (data.error) {
        setError(data.error)
        setSending(false)
        return
      }

      // Merge extracted profile fields
      if (data.profile) {
        setProfile((prev) => {
          const merged = { ...prev }
          for (const [key, value] of Object.entries(data.profile)) {
            if (value && (typeof value === "string" ? value.length > 0 : Array.isArray(value) ? value.length > 0 : value === true)) {
              (merged as Record<string, unknown>)[key] = value
            }
          }
          return merged
        })
      }

      setMessages([...newMessages, { role: "assistant", content: data.reply }])
    } catch {
      setError("Something went wrong. Try again.")
    } finally {
      setSending(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)

    const payload = {
      family_name: profile.family_name || family?.family_name || "My Family",
      home_country: profile.home_country || family?.home_country || "",
      country_code: (profile.country_code || family?.country_code || "").toUpperCase(),
      kids_ages: profile.kids_ages.length > 0 ? profile.kids_ages : family?.kids_ages || [],
      parent_work_type: profile.parent_work_type || family?.parent_work_type || "",
      travel_style: profile.travel_style || family?.travel_style || "",
      education_approach: profile.education_approach || family?.education_approach || "",
      languages: profile.languages.length > 0 ? profile.languages : family?.languages || [],
      interests: profile.interests.length > 0 ? profile.interests : family?.interests || [],
      bio: profile.bio || family?.bio || "",
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    }

    if (family) {
      await supabase.from("families").update(payload).eq("id", family.id)
    } else {
      await supabase.from("families").insert({ user_id: user.id, ...payload })
    }

    // Auto-log cities mentioned as "been_here" trips
    if (profile.cities_visited.length > 0 && family) {
      for (const cityName of profile.cities_visited) {
        // Match city name to our city slugs
        const matchedCity = cities.find((c) =>
          c.name.toLowerCase() === cityName.toLowerCase() ||
          c.slug === cityName.toLowerCase().replace(/\s+/g, "-")
        )
        if (matchedCity) {
          // Insert trip — ignore if already exists
          await supabase.from("trips").insert({
            family_id: family.id,
            city_slug: matchedCity.slug,
            status: "been_here" as const,
          })
        }
      }
    }

    await refreshFamily()
    setSaving(false)
    router.push("/dashboard")
  }

  if (loading) return <div className="max-w-lg mx-auto px-4 py-20 text-center text-[var(--text-secondary)]">Loading...</div>
  if (!user) return null

  // Count extracted fields for progress
  const fieldCount = [
    profile.family_name, profile.home_country, profile.kids_ages.length > 0,
    profile.parent_work_type, profile.education_approach, profile.travel_style,
    profile.languages.length > 0, profile.cities_visited.length > 0, profile.bio,
  ].filter(Boolean).length
  const progress = Math.min(100, (fieldCount / 9) * 100)

  return (
    <div className="max-w-lg mx-auto px-4 py-6 min-h-screen flex flex-col">
      {/* Progress */}
      <div className="mb-4">
        <div className="h-1 rounded-full bg-[var(--surface-elevated)]">
          <div className="h-full rounded-full bg-[var(--accent-green)] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        {fieldCount > 0 && (
          <p className="text-[10px] text-[var(--text-secondary)] mt-1">{fieldCount} of 9 profile fields captured</p>
        )}
      </div>

      {/* Chat */}
      <div className="flex-1 space-y-3 mb-4 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-[var(--accent-green)] text-black rounded-br-sm"
                : "bg-[var(--surface)] text-[var(--text-primary)] rounded-bl-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-[var(--surface)] text-[var(--text-secondary)] px-4 py-3 rounded-2xl rounded-bl-sm text-sm">
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-[var(--score-low)] text-center mb-2">{error}</p>
      )}

      {/* Input or Save */}
      {profile.done ? (
        <div className="sticky bottom-0 bg-[var(--bg)] pt-4 pb-4 space-y-3">
          {/* Preview extracted data */}
          <div className="rounded-xl bg-[var(--surface)] p-4 text-xs space-y-1">
            <p className="text-[var(--text-secondary)] font-medium mb-2">Your profile:</p>
            {profile.family_name && <p><span className="text-[var(--text-secondary)]">Family:</span> {profile.family_name}</p>}
            {profile.home_country && <p><span className="text-[var(--text-secondary)]">From:</span> {profile.home_country}</p>}
            {profile.kids_ages.length > 0 && <p><span className="text-[var(--text-secondary)]">Kids:</span> {profile.kids_ages.join(", ")}</p>}
            {profile.travel_style && <p><span className="text-[var(--text-secondary)]">Style:</span> {profile.travel_style}</p>}
            {profile.cities_visited.length > 0 && <p><span className="text-[var(--text-secondary)]">Cities:</span> {profile.cities_visited.join(", ")}</p>}
            {profile.bio && <p className="italic text-[var(--text-primary)] mt-2">&ldquo;{profile.bio}&rdquo;</p>}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 rounded-xl bg-[var(--accent-green)] text-black font-semibold text-sm disabled:opacity-50"
          >
            {saving ? "Setting up your profile..." : "Looks good — let's go →"}
          </button>
        </div>
      ) : (
        <div className="sticky bottom-0 bg-[var(--bg)] pt-4 pb-4">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type here..."
              autoFocus
              disabled={sending}
              className="flex-1 px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm outline-none focus:border-[var(--accent-green)] transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="px-5 py-3 rounded-xl bg-[var(--accent-green)] text-black font-medium text-sm disabled:opacity-30"
            >
              →
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
