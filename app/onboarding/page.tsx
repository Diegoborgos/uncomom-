"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { cities } from "@/data/cities"

type Message = { role: "user" | "assistant"; content: string }

type ProfileFields = {
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
  next_destinations: string[]
  top_priorities: string[]
  deal_breakers: string[]
  bio: string
  done: boolean
}

const emptyProfile: ProfileFields = {
  family_name: "", home_country: "", country_code: "",
  kids_ages: [], parent_work_type: "", education_approach: "",
  travel_style: "", languages: [], interests: [],
  cities_visited: [], next_destinations: [], top_priorities: [], deal_breakers: [], bio: "", done: false,
}

export default function OnboardingPage() {
  const { user, family, loading, refreshFamily } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [profile, setProfile] = useState<ProfileFields>(emptyProfile)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [showCityPicker, setShowCityPicker] = useState(false)
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [cityPickerContinent, setCityPickerContinent] = useState<string | null>(null)
  const [phase, setPhase] = useState<"welcome" | "chat" | "complete">("welcome")
  const [welcomeStep, setWelcomeStep] = useState(0)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const touchStartX = useRef(0)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  // Start conversation — different for new vs returning users
  useEffect(() => {
    if (messages.length === 0 && user && !loading) {
      if (family?.onboarding_complete) {
        // Returning user — show current profile summary and ask what to change
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
        // Pre-fill profile state with existing data
        setProfile({
          family_name: family.family_name || "",
          home_country: family.home_country || "",
          country_code: family.country_code || "",
          kids_ages: family.kids_ages || [],
          parent_work_type: family.parent_work_type || "",
          education_approach: family.education_approach || "",
          travel_style: family.travel_style || "",
          languages: family.languages || [],
          interests: family.interests || [],
          cities_visited: [],
          next_destinations: [],
          top_priorities: family.top_priorities || [],
          deal_breakers: family.deal_breakers || [],
          bio: family.bio || "",
          done: false,
        })
        setPhase("chat")
      }
    }
  }, [user, loading, family]) // eslint-disable-line react-hooks/exhaustive-deps

  // Start chat for new users when they transition from welcome to chat
  useEffect(() => {
    if (phase === "chat" && messages.length === 0 && user && !family?.onboarding_complete) {
      setMessages([{ role: "assistant", content: "Hey! Tell me about your family — where are you from?" }])
      if (typeof window !== "undefined" && window.innerWidth >= 768) setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) container.scrollTop = container.scrollHeight
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || sending) return
    const userMsg = input.trim()
    setInput("")
    setError("")

    // Intercept city-related messages — show picker directly
    const cityWords = ["cities", "city", "traveled", "travelled", "visited", "been to", "places"]
    if (cityWords.some((w) => userMsg.toLowerCase().includes(w)) && !showCityPicker) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: userMsg },
        { role: "assistant", content: "Let's add your cities — tap to select the ones you've been to." },
      ])
      setShowCityPicker(true)
      return
    }

    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }]
    setMessages(newMessages)
    setSending(true)

    try {
      const res = await fetch("/api/onboarding/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          existingProfile: family?.onboarding_complete ? {
            family_name: family.family_name,
            home_country: family.home_country,
            kids_ages: family.kids_ages,
            parent_work_type: family.parent_work_type,
            education_approach: family.education_approach,
            travel_style: family.travel_style,
            languages: family.languages,
            interests: family.interests,
            bio: family.bio,
          } : undefined,
        }),
      })

      const data = await res.json()
      if (data.error) {
        const msg = typeof data.error === "string" && data.error.includes("rate_limit")
          ? "We're getting a lot of traffic right now. Please try again in a few minutes."
          : typeof data.error === "string" && data.error.length > 100
          ? "Something went wrong. Please try again."
          : data.error
        setError(msg)
        setSending(false)
        return
      }

      // Merge extracted profile
      if (data.profile) {
        setProfile((prev) => {
          const merged = { ...prev }
          for (const [key, value] of Object.entries(data.profile)) {
            if (value && (typeof value === "string" ? value.length > 0 : Array.isArray(value) ? (value as unknown[]).length > 0 : value === true)) {
              (merged as Record<string, unknown>)[key] = value
            }
          }
          return merged
        })
      }

      setMessages([...newMessages, { role: "assistant", content: data.reply }])

      // After enough fields extracted and no cities yet → show city picker
      const updatedProfile = { ...profile }
      if (data.profile) {
        for (const [key, value] of Object.entries(data.profile)) {
          if (value && (typeof value === "string" ? value.length > 0 : Array.isArray(value) ? (value as unknown[]).length > 0 : value === true)) {
            (updatedProfile as Record<string, unknown>)[key] = value
          }
        }
      }
      // Show city picker ONLY after core fields are all collected
      const hasAllCore = updatedProfile.home_country
        && updatedProfile.kids_ages.length > 0
        && updatedProfile.parent_work_type
        && updatedProfile.education_approach
        && updatedProfile.travel_style

      // Only auto-trigger city picker for NEW users (not returning ones editing their profile)
      const isNewUser = !family?.onboarding_complete
      if (isNewUser && hasAllCore && !updatedProfile.cities_visited.length && !showCityPicker) {
        setShowCityPicker(true)
        setMessages((prev) => [...prev, { role: "assistant", content: "Now the fun part — which cities have you explored as a family? Tap to select." }])
      } else {
        if (typeof window !== "undefined" && window.innerWidth >= 768) setTimeout(() => inputRef.current?.focus(), 100)      }
    } catch {
      setError("Connection error. Try again.")
    } finally {
      setSending(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setError("")

    try {
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
        top_priorities: profile.top_priorities?.length > 0 ? profile.top_priorities : family?.top_priorities || [],
        deal_breakers: profile.deal_breakers?.length > 0 ? profile.deal_breakers : family?.deal_breakers || [],
        next_destination_candidates: profile.next_destinations?.length > 0 ? profile.next_destinations : family?.next_destination_candidates || [],
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      }

      // Auto-generate username from family_name if not set
      if (payload.family_name && !family?.username) {
        const base = payload.family_name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .slice(0, 20) || "family"
        const { data: existing } = await supabase.from("families").select("id").eq("username", base).maybeSingle()
        const username = existing ? base + Math.floor(Math.random() * 999) : base
        Object.assign(payload, { username })
      }

      if (family) {
        const { error: updateErr } = await supabase.from("families").update(payload).eq("id", family.id)
        if (updateErr) throw new Error(updateErr.message)
      } else {
        const { error: insertErr } = await supabase.from("families").insert({ user_id: user.id, ...payload })
        if (insertErr) throw new Error(insertErr.message)
      }

      // Auto-log cities as trips — re-fetch family if we just inserted
      let familyId = family?.id
      if (!familyId) {
        const { data: newFam } = await supabase.from("families").select("id").eq("user_id", user.id).single()
        familyId = newFam?.id
      }
      if (profile.cities_visited.length > 0 && familyId) {
        for (const cityName of profile.cities_visited) {
          const matched = cities.find((c) =>
            c.name.toLowerCase() === cityName.toLowerCase() ||
            c.slug === cityName.toLowerCase().replace(/\s+/g, "-")
          )
          if (matched) {
            const { data: existingTrip } = await supabase.from("trips")
              .select("id").eq("family_id", familyId).eq("city_slug", matched.slug).maybeSingle()
            if (!existingTrip) {
              await supabase.from("trips").insert({
                family_id: familyId,
                city_slug: matched.slug,
                status: "been_here" as const,
              })
            }
          }
        }
      }

      // Save next destinations to saved_cities
      if (profile.next_destinations && profile.next_destinations.length > 0 && familyId) {
        for (const cityName of profile.next_destinations) {
          const matched = cities.find((c) =>
            c.name.toLowerCase() === cityName.toLowerCase() ||
            c.slug === cityName.toLowerCase().replace(/\s+/g, "-")
          )
          if (matched) {
            await supabase.from("saved_cities").upsert({
              family_id: familyId,
              city_slug: matched.slug,
            }, { onConflict: "family_id,city_slug" })
          }
        }
      }

      await refreshFamily()

      // Award onboarding points (non-blocking)
      try {
        const { data: { session: pointsSession } } = await supabase.auth.getSession()
        if (pointsSession?.access_token) {
          await fetch("/api/gamification/award", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${pointsSession.access_token}` },
            body: JSON.stringify({ action: "complete_onboarding", description: "Completed family profile" }),
          })
        }
      } catch { /* non-blocking */ }

      setPhase("complete")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save. Try again.")
    } finally {
      setSaving(false)
    }
  }

  // Group cities by continent
  const continents = Array.from(new Set(cities.map((c) => c.continent))).sort()
  const citiesByContinent = continents.reduce((acc, cont) => {
    acc[cont] = cities.filter((c) => c.continent === cont).sort((a, b) => a.name.localeCompare(b.name))
    return acc
  }, {} as Record<string, typeof cities>)

  const toggleCity = (cityName: string) => {
    setSelectedCities((prev) =>
      prev.includes(cityName) ? prev.filter((c) => c !== cityName) : [...prev, cityName]
    )
  }

  const submitCities = () => {
    const cityNames = selectedCities
    setProfile((prev) => ({ ...prev, cities_visited: cityNames }))
    setShowCityPicker(false)
    setCityPickerContinent(null)

    // Add as user message and continue conversation
    const cityText = cityNames.length > 0 ? cityNames.join(", ") : "None yet"
    const newMessages: Message[] = [...messages, { role: "user", content: `I've been to: ${cityText}` }]
    setMessages(newMessages)

    // Send to LLM to continue
    setSending(true)
    fetch("/api/onboarding/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages }),
    }).then((res) => res.json()).then((data) => {
      if (data.profile) {
        setProfile((prev) => {
          const merged = { ...prev }
          for (const [key, value] of Object.entries(data.profile)) {
            if (value && (typeof value === "string" ? value.length > 0 : Array.isArray(value) ? (value as unknown[]).length > 0 : value === true)) {
              (merged as Record<string, unknown>)[key] = value
            }
          }
          return merged
        })
      }
      setMessages([...newMessages, { role: "assistant", content: data.reply }])
      setSending(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }).catch(() => {
      setError("Connection error.")
      setSending(false)
    })
  }

  // Quick-reply pill detection
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant")?.content.toLowerCase() || ""
  const pillOptions: { type: "single" | "multi"; items: string[] } | null = (() => {
    if (sending || showCityPicker || profile.done) return null
    if (/\b(work|do you do)\b/.test(lastAssistant))
      return { type: "single", items: ["Remote employee", "Freelancer", "Business owner", "Content creator", "Not working currently"] }
    if (/\b(learn|education|school)\b/.test(lastAssistant))
      return { type: "single", items: ["Homeschool", "Worldschool", "International school", "Local school", "Unschool", "Mix of approaches"] }
    if (/\b(travel|slow|fast)\b/.test(lastAssistant))
      return { type: "single", items: ["Slow travel", "Medium pace", "Fast movers", "Base + trips", "Seasonal", "Just getting started"] }
    if (/\b(interest|enjoy|into)\b/.test(lastAssistant))
      return { type: "multi", items: ["Surf", "Beach", "Nature", "Mountains", "Yoga", "Food & cooking", "Arts & culture", "Co-working", "Entrepreneurship"] }
    return null
  })()

  const sendQuickReply = (value: string) => {
    setInput(value)
    // Use a microtask so React processes the setInput, then send
    setTimeout(() => {
      const syntheticInput = value
      setInput("")
      setError("")
      const newMessages: Message[] = [...messages, { role: "user", content: syntheticInput }]
      setMessages(newMessages)
      setSending(true)
      fetch("/api/onboarding/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      }).then((res) => res.json()).then((data) => {
        if (data.error) {
          setError(typeof data.error === "string" ? data.error : "Something went wrong.")
          setSending(false)
          return
        }
        if (data.profile) {
          setProfile((prev) => {
            const merged = { ...prev }
            for (const [key, val] of Object.entries(data.profile)) {
              if (val && (typeof val === "string" ? val.length > 0 : Array.isArray(val) ? (val as unknown[]).length > 0 : val === true)) {
                (merged as Record<string, unknown>)[key] = val
              }
            }
            return merged
          })
        }
        setMessages([...newMessages, { role: "assistant", content: data.reply }])
        setSending(false)
        if (typeof window !== "undefined" && window.innerWidth >= 768) setTimeout(() => inputRef.current?.focus(), 100)
      }).catch(() => {
        setError("Connection error. Try again.")
        setSending(false)
      })
    }, 0)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">Loading...</div>
  if (!user) return null

  const fieldsExtracted = [
    profile.family_name, profile.home_country, profile.kids_ages.length > 0,
    profile.parent_work_type, profile.education_approach, profile.travel_style,
    profile.languages.length > 0, profile.cities_visited.length > 0, profile.bio,
  ].filter(Boolean).length
  const progress = Math.min(100, (fieldsExtracted / 9) * 100)

  // ── Welcome phase ──
  if (phase === "welcome") {
    const cards = [
      {
        title: "Welcome to Uncomun",
        body: "The city guide built by and for traveling families. Let\u2019s set up your profile so we can personalize everything for you.",
      },
      {
        title: "How it works",
        body: "A quick chat to get to know your family:",
        bullets: ["Tell us about your kids, travel style & education", "Pick the cities you\u2019ve been to", "We\u2019ll write your family bio"],
      },
      {
        title: "Ready?",
        body: "It takes about 2 minutes. You can always edit your profile later.",
      },
    ]

    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
          onTouchEnd={(e) => {
            const diff = touchStartX.current - e.changedTouches[0].clientX
            if (diff > 50 && welcomeStep < 2) setWelcomeStep(welcomeStep + 1)
            if (diff < -50 && welcomeStep > 0) setWelcomeStep(welcomeStep - 1)
          }}
          className="min-h-[260px] flex flex-col items-center justify-center"
        >
          <h1 className="font-serif text-3xl font-bold mb-4">{cards[welcomeStep].title}</h1>
          <p className="text-[var(--text-secondary)] mb-4 max-w-sm">{cards[welcomeStep].body}</p>
          {cards[welcomeStep].bullets && (
            <ul className="text-sm text-[var(--text-secondary)] space-y-2 mb-4 text-left max-w-xs mx-auto">
              {cards[welcomeStep].bullets!.map((b, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-[var(--accent-green)]">&#10003;</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => setWelcomeStep(i)}
              className={`w-2 h-2 rounded-full transition-colors ${i === welcomeStep ? "bg-[var(--accent-green)]" : "bg-[var(--border)]"}`}
            />
          ))}
        </div>

        {/* Actions */}
        {welcomeStep < 2 ? (
          <button
            onClick={() => setWelcomeStep(welcomeStep + 1)}
            className="w-full max-w-xs py-3 rounded-xl bg-[var(--accent-green)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity"
          >
            Next
          </button>
        ) : (
          <button
            onClick={() => setPhase("chat")}
            className="w-full max-w-xs py-3 rounded-xl bg-[var(--accent-green)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity"
          >
            Let&apos;s go &rarr;
          </button>
        )}

        <button
          onClick={() => setPhase("chat")}
          className="block mx-auto mt-4 text-sm text-[var(--text-secondary)] hover:text-[var(--accent-green)] transition-colors"
        >
          Skip intro &rarr;
        </button>
      </div>
    )
  }

  // ── Complete phase ──
  if (phase === "complete") {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[rgb(var(--accent-green-rgb)/0.2)] text-[var(--accent-green)] flex items-center justify-center text-3xl mx-auto mb-8">
          &#10003;
        </div>

        <h1 className="font-serif text-3xl font-bold mb-2">You&apos;re all set!</h1>
        <p className="text-[var(--text-secondary)] mb-8">Your family profile is ready.</p>

        {/* Profile summary */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-left space-y-2 text-sm mb-8">
          {profile.family_name && <p><strong>Family:</strong> {profile.family_name}</p>}
          {profile.home_country && <p><strong>From:</strong> {profile.home_country}</p>}
          {profile.kids_ages.length > 0 && <p><strong>Kids:</strong> ages {profile.kids_ages.join(", ")}</p>}
          {profile.parent_work_type && <p><strong>Work:</strong> {profile.parent_work_type}</p>}
          {profile.education_approach && <p><strong>Education:</strong> {profile.education_approach}</p>}
          {profile.travel_style && <p><strong>Travel:</strong> {profile.travel_style}</p>}
          {profile.bio && <p className="italic text-[var(--text-secondary)] pt-2 border-t border-[var(--border)]">&ldquo;{profile.bio}&rdquo;</p>}
        </div>

        {/* What happens now */}
        <div className="text-left mb-8">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)] mb-3">What happens now</p>
          <ul className="text-sm text-[var(--text-secondary)] space-y-2">
            <li>&#8226; City scores are now personalized to your family</li>
            <li>&#8226; Other families can find and connect with you</li>
            <li>&#8226; Your trip tracker is ready to use</li>
          </ul>
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <Link
            href="/"
            className="block py-3 rounded-xl bg-[var(--accent-green)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity"
          >
            Explore cities &rarr;
          </Link>
          <Link
            href="/community"
            className="block py-3 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors text-sm"
          >
            Find families &rarr;
          </Link>
          <Link
            href="/dashboard"
            className="block py-3 text-sm text-[var(--text-secondary)] hover:text-[var(--accent-green)] transition-colors"
          >
            Go to dashboard &rarr;
          </Link>
        </div>
      </div>
    )
  }

  // ── Chat phase (existing UI) ──
  return (
    <div className="max-w-lg mx-auto">
      {/* Progress — compact inline */}
      <div className="px-4 pt-3 pb-1">
        <div className="h-1 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
          <div className="h-full rounded-full bg-[var(--accent-green)] transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
        {messages.length > 2 && !profile.done && (
          <div className="text-right mt-1">
            <button onClick={() => { setProfile({ ...profile, done: true }) }} className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--accent-green)]">
              Skip →
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-3 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in`}>
            <div className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-[var(--accent-green)] text-black rounded-2xl rounded-br-md"
                : "bg-[var(--surface)] text-[var(--text-primary)] rounded-2xl rounded-bl-md"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {sending && (
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

        <div />
      </div>

      {/* Error */}
      {error && <p className="text-xs text-center text-[var(--score-low)] mb-2">{error}</p>}

      {/* Quick-reply pills */}
      {pillOptions && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-1.5">
            {pillOptions.items.map((item) => {
              if (pillOptions.type === "multi") {
                const isSelected = selectedInterests.includes(item)
                return (
                  <button
                    key={item}
                    onClick={() => setSelectedInterests((prev) =>
                      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
                    )}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      isSelected
                        ? "border-[var(--accent-green)] bg-[rgb(var(--accent-green-rgb)/0.15)] text-[var(--accent-green)]"
                        : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)]"
                    }`}
                  >
                    {item}
                  </button>
                )
              }
              return (
                <button
                  key={item}
                  onClick={() => sendQuickReply(item)}
                  className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)] hover:text-[var(--accent-green)] transition-colors"
                >
                  {item}
                </button>
              )
            })}
          </div>
          {pillOptions.type === "multi" && selectedInterests.length > 0 && (
            <button
              onClick={() => {
                const value = selectedInterests.join(", ")
                setSelectedInterests([])
                sendQuickReply(value)
              }}
              className="mt-2 w-full py-2 rounded-xl bg-[var(--accent-green)] text-black font-semibold text-xs hover:opacity-90 transition-opacity"
            >
              Continue with {selectedInterests.length} selected &rarr;
            </button>
          )}
        </div>
      )}

      {/* Input — directly below messages, no gap */}
      <div className="pb-4 pt-2">
        {showCityPicker ? (
          <div className="space-y-3">
            {/* Continent selector */}
            {!cityPickerContinent ? (
              <>
                <p className="text-xs text-[var(--text-secondary)] mb-2">Tap a continent to see cities:</p>
                <div className="flex flex-wrap gap-2">
                  {continents.map((cont) => (
                    <button key={cont} onClick={() => setCityPickerContinent(cont)}
                      className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:border-[var(--accent-green)] hover:text-[var(--accent-green)] transition-colors">
                      {cont}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <button onClick={() => setCityPickerContinent(null)} className="text-xs text-[var(--accent-green)]">&larr; All continents</button>
                  <p className="text-xs text-[var(--text-secondary)]">{selectedCities.length} selected</p>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {citiesByContinent[cityPickerContinent]?.map((c) => {
                    const selected = selectedCities.includes(c.name)
                    const flag = c.countryCode.toUpperCase().split("").map((ch) => String.fromCodePoint(127397 + ch.charCodeAt(0))).join("")
                    return (
                      <button key={c.slug} onClick={() => toggleCity(c.name)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                          selected ? "bg-[rgb(var(--accent-green-rgb)/0.15)] text-[var(--accent-green)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface)]"
                        }`}>
                        <span>{flag} {c.name}</span>
                        {selected && <span>✓</span>}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
            {/* Selected cities preview + submit */}
            {selectedCities.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[var(--border)]">
                {selectedCities.map((c) => (
                  <span key={c} onClick={() => toggleCity(c)}
                    className="text-xs px-2.5 py-1 rounded-full bg-[var(--accent-green)] text-black cursor-pointer hover:opacity-80">
                    {c} ✕
                  </span>
                ))}
              </div>
            )}
            <button onClick={submitCities}
              className="w-full py-3 rounded-xl bg-[var(--accent-green)] text-black font-semibold text-sm hover:opacity-90 transition-opacity">
              {selectedCities.length > 0 ? `Continue with ${selectedCities.length} cities` : "Skip — haven't traveled yet"}
            </button>
          </div>
        ) : profile.done ? (
          <div className="space-y-3">
            {/* Profile summary */}
            <div className="rounded-xl bg-[var(--surface)] p-4 space-y-2 text-xs">
              <p className="text-[var(--text-secondary)] font-medium uppercase tracking-wider text-[10px]">Your profile</p>
              {profile.family_name && <p><strong>Family:</strong> {profile.family_name}</p>}
              {profile.home_country && <p><strong>From:</strong> {profile.home_country}</p>}
              {profile.kids_ages.length > 0 && <p><strong>Kids:</strong> ages {profile.kids_ages.join(", ")}</p>}
              {profile.parent_work_type && <p><strong>Work:</strong> {profile.parent_work_type}</p>}
              {profile.education_approach && <p><strong>Education:</strong> {profile.education_approach}</p>}
              {profile.travel_style && <p><strong>Travel:</strong> {profile.travel_style}</p>}
              {profile.cities_visited.length > 0 && <p><strong>Cities:</strong> {profile.cities_visited.join(", ")}</p>}
              {profile.bio && <p className="italic text-[var(--text-primary)] pt-1 border-t border-[var(--border)]">&ldquo;{profile.bio}&rdquo;</p>}
            </div>
            <button onClick={handleSave} disabled={saving}
              className="w-full py-4 rounded-xl bg-[var(--accent-green)] text-black font-semibold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity">
              {saving ? "Setting up..." : "Save profile →"}
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me about your family..."
              disabled={sending}
              className="flex-1 px-4 py-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm outline-none focus:border-[var(--accent-green)] transition-colors disabled:opacity-50 placeholder-[var(--text-secondary)]"
            />
            <button type="submit" disabled={!input.trim() || sending}
              className="px-5 py-3.5 rounded-xl bg-[var(--accent-green)] text-black font-bold text-sm disabled:opacity-20 hover:opacity-90 transition-opacity">
              →
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
