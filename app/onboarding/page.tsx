"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"

const COUNTRIES = [
  { code: "US", name: "United States" }, { code: "GB", name: "United Kingdom" }, { code: "AU", name: "Australia" },
  { code: "CA", name: "Canada" }, { code: "DE", name: "Germany" }, { code: "NL", name: "Netherlands" },
  { code: "FR", name: "France" }, { code: "ES", name: "Spain" }, { code: "PT", name: "Portugal" },
  { code: "IT", name: "Italy" }, { code: "BR", name: "Brazil" }, { code: "MX", name: "Mexico" },
  { code: "AR", name: "Argentina" }, { code: "CO", name: "Colombia" }, { code: "IN", name: "India" },
  { code: "ZA", name: "South Africa" }, { code: "NZ", name: "New Zealand" }, { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" }, { code: "DK", name: "Denmark" }, { code: "IE", name: "Ireland" },
  { code: "SG", name: "Singapore" }, { code: "JP", name: "Japan" }, { code: "KR", name: "South Korea" },
  { code: "IL", name: "Israel" }, { code: "TR", name: "Turkey" }, { code: "GE", name: "Georgia" },
  { code: "TH", name: "Thailand" }, { code: "ID", name: "Indonesia" }, { code: "MY", name: "Malaysia" },
  { code: "PH", name: "Philippines" }, { code: "NG", name: "Nigeria" }, { code: "KE", name: "Kenya" },
  { code: "GH", name: "Ghana" }, { code: "RO", name: "Romania" }, { code: "BG", name: "Bulgaria" },
  { code: "HU", name: "Hungary" }, { code: "CZ", name: "Czech Republic" }, { code: "PL", name: "Poland" },
  { code: "AT", name: "Austria" }, { code: "CH", name: "Switzerland" }, { code: "BE", name: "Belgium" },
].sort((a, b) => a.name.localeCompare(b.name))

const WORK_TYPES = [
  "Remote employee", "Freelancer", "Business owner", "Investor / Retired",
  "Content creator", "Not working currently",
]

const EDUCATION = [
  "Homeschool", "Worldschool", "International school", "Local school",
  "Online school", "Unschool", "Mix of approaches",
]

const TRAVEL_STYLES = [
  "Slow travel (months per city)", "Medium pace (1-3 months)",
  "Fast movers (weeks per city)", "Base + trips",
  "Seasonal (summer/winter bases)", "Just getting started",
]

const INTERESTS = [
  "surf", "nature", "beach", "mountains", "co-living", "co-working",
  "language immersion", "arts & culture", "outdoor sports", "music",
  "food & cooking", "sustainability", "entrepreneurship", "yoga & wellness",
]

const LANGUAGES = [
  "English", "Spanish", "Portuguese", "French", "German", "Italian",
  "Dutch", "Thai", "Indonesian", "Japanese", "Mandarin", "Arabic",
]

type Message = {
  from: "bot" | "user"
  text: string
}

type Step = {
  id: string
  question: (data: ProfileData) => string
  type: "text" | "pills" | "multi-pills" | "country" | "kids"
  options?: string[]
  field: keyof ProfileData
}

type ProfileData = {
  bio: string
  familyName: string
  homeCountry: string
  countryCode: string
  kidsAges: string
  parentWorkType: string
  educationApproach: string
  travelStyle: string
  languages: string[]
  interests: string[]
}

const STEPS: Step[] = [
  {
    id: "bio",
    question: () => "Welcome! Tell us about your family in a sentence or two. What makes you, you?",
    type: "text",
    field: "bio",
  },
  {
    id: "name",
    question: (d) => d.bio ? `Love that. What should we call your family?` : "What's your family name?",
    type: "text",
    field: "familyName",
  },
  {
    id: "country",
    question: (d) => `Nice to meet the ${d.familyName || ""} family! Where's home base?`,
    type: "country",
    field: "homeCountry",
  },
  {
    id: "kids",
    question: () => "How old are your kids? (comma separated, e.g. 4, 7)",
    type: "kids",
    field: "kidsAges",
  },
  {
    id: "work",
    question: (d) => {
      const ages = d.kidsAges.split(",").map((a) => a.trim()).filter(Boolean)
      return ages.length > 0
        ? `${ages.length} kid${ages.length > 1 ? "s" : ""} — amazing. How do you work while traveling?`
        : "How do you work?"
    },
    type: "pills",
    options: WORK_TYPES,
    field: "parentWorkType",
  },
  {
    id: "education",
    question: (d) => {
      const ages = d.kidsAges.split(",").map((a) => parseInt(a.trim())).filter((a) => !isNaN(a))
      const young = ages.some((a) => a < 5)
      return young
        ? "With little ones — how are you thinking about education?"
        : "How do your kids learn on the road?"
    },
    type: "pills",
    options: EDUCATION,
    field: "educationApproach",
  },
  {
    id: "travel",
    question: () => "What's your travel pace?",
    type: "pills",
    options: TRAVEL_STYLES,
    field: "travelStyle",
  },
  {
    id: "languages",
    question: () => "What languages does your family speak?",
    type: "multi-pills",
    options: LANGUAGES,
    field: "languages",
  },
  {
    id: "interests",
    question: (d) => `Almost done! What are the ${d.familyName || "family"} into?`,
    type: "multi-pills",
    options: INTERESTS,
    field: "interests",
  },
]

const defaultData: ProfileData = {
  bio: "", familyName: "", homeCountry: "", countryCode: "",
  kidsAges: "", parentWorkType: "", educationApproach: "",
  travelStyle: "", languages: [], interests: [],
}

export default function OnboardingPage() {
  const { user, family, loading, refreshFamily } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<ProfileData>(defaultData)
  const [messages, setMessages] = useState<Message[]>([])
  const [textInput, setTextInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  // Pre-fill if family exists
  useEffect(() => {
    if (family) {
      setData({
        bio: family.bio || "",
        familyName: family.family_name || "",
        homeCountry: family.home_country || "",
        countryCode: family.country_code || "",
        kidsAges: family.kids_ages?.join(", ") || "",
        parentWorkType: family.parent_work_type || "",
        educationApproach: family.education_approach || "",
        travelStyle: family.travel_style || "",
        languages: family.languages || [],
        interests: family.interests || [],
      })
    }
  }, [family])

  // Show first question
  useEffect(() => {
    if (messages.length === 0 && step === 0) {
      setMessages([{ from: "bot", text: STEPS[0].question(data) }])
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, step])

  const advance = (answer: string, updatedData: ProfileData) => {
    // Add user answer as message
    setMessages((prev) => [...prev, { from: "user", text: answer }])

    const nextStep = step + 1
    if (nextStep >= STEPS.length) {
      setDone(true)
      setMessages((prev) => [...prev, { from: "bot", text: `You're all set! Welcome to Uncomun, ${updatedData.familyName || "family"}.` }])
      return
    }

    setStep(nextStep)
    // Add next question with slight delay for chat feel
    setTimeout(() => {
      setMessages((prev) => [...prev, { from: "bot", text: STEPS[nextStep].question(updatedData) }])
    }, 300)
  }

  const handleTextSubmit = () => {
    if (!textInput.trim()) return
    const currentStep = STEPS[step]
    const updated = { ...data, [currentStep.field]: textInput.trim() }
    setData(updated)
    setTextInput("")
    advance(textInput.trim(), updated)
  }

  const handlePillSelect = (value: string) => {
    const currentStep = STEPS[step]
    const updated = { ...data, [currentStep.field]: value }
    setData(updated)
    advance(value, updated)
  }

  const handleCountrySelect = (name: string, code: string) => {
    const updated = { ...data, homeCountry: name, countryCode: code }
    setData(updated)
    advance(name, updated)
  }

  const [multiSelection, setMultiSelection] = useState<string[]>([])

  const handleMultiDone = () => {
    const currentStep = STEPS[step]
    const updated = { ...data, [currentStep.field]: multiSelection }
    setData(updated)
    advance(multiSelection.join(", "), updated)
    setMultiSelection([])
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)

    const ages = data.kidsAges.split(",").map((a) => parseInt(a.trim())).filter((a) => !isNaN(a))

    const payload = {
      family_name: data.familyName,
      home_country: data.homeCountry,
      country_code: data.countryCode.toUpperCase(),
      kids_ages: ages,
      parent_work_type: data.parentWorkType,
      travel_style: data.travelStyle,
      education_approach: data.educationApproach,
      languages: data.languages,
      interests: data.interests,
      bio: data.bio,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    }

    if (family) {
      await supabase.from("families").update(payload).eq("id", family.id)
    } else {
      await supabase.from("families").insert({ user_id: user.id, ...payload })
    }

    await refreshFamily()
    setSaving(false)
    router.push("/dashboard")
  }

  if (loading) return <div className="max-w-lg mx-auto px-4 py-20 text-center text-[var(--text-secondary)]">Loading...</div>
  if (!user) return null

  const currentStep = STEPS[step]
  const progress = ((step + (done ? 1 : 0)) / STEPS.length) * 100

  return (
    <div className="max-w-lg mx-auto px-4 py-8 min-h-screen flex flex-col">
      {/* Progress */}
      <div className="mb-6">
        <div className="h-1 rounded-full bg-[var(--surface-elevated)]">
          <div className="h-full rounded-full bg-[var(--accent-green)] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[10px] text-[var(--text-secondary)] mt-2">
          {done ? "Complete!" : `Step ${step + 1} of ${STEPS.length}`}
        </p>
      </div>

      {/* Chat messages */}
      <div className="flex-1 space-y-4 mb-6">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
              msg.from === "user"
                ? "bg-[var(--accent-green)] text-black rounded-br-sm"
                : "bg-[var(--surface)] text-[var(--text-primary)] rounded-bl-sm"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      {!done && (
        <div className="sticky bottom-0 bg-[var(--bg)] pt-4 pb-4 border-t border-[var(--border)]">
          {/* Text input */}
          {(currentStep.type === "text" || currentStep.type === "kids") && (
            <form onSubmit={(e) => { e.preventDefault(); handleTextSubmit() }} className="flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={currentStep.type === "kids" ? "e.g. 4, 7, 11" : "Type here..."}
                autoFocus
                className="flex-1 px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm outline-none focus:border-[var(--accent-green)] transition-colors"
              />
              <button
                type="submit"
                disabled={!textInput.trim()}
                className="px-5 py-3 rounded-xl bg-[var(--accent-green)] text-black font-medium text-sm disabled:opacity-30"
              >
                →
              </button>
            </form>
          )}

          {/* Single pill select */}
          {currentStep.type === "pills" && (
            <div className="flex flex-wrap gap-2">
              {currentStep.options?.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handlePillSelect(opt)}
                  className="px-4 py-2 rounded-full border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:border-[var(--accent-green)] hover:text-[var(--accent-green)] transition-colors"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* Country select */}
          {currentStep.type === "country" && (
            <div className="max-h-48 overflow-y-auto space-y-1">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => handleCountrySelect(c.name, c.code)}
                  className="w-full text-left px-4 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {/* Multi-select pills */}
          {currentStep.type === "multi-pills" && (
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {currentStep.options?.map((opt) => {
                  const selected = multiSelection.includes(opt)
                  return (
                    <button
                      key={opt}
                      onClick={() => setMultiSelection(
                        selected ? multiSelection.filter((s) => s !== opt) : [...multiSelection, opt]
                      )}
                      className={`px-4 py-2 rounded-full text-xs border transition-colors ${
                        selected
                          ? "bg-[var(--accent-green)] border-[var(--accent-green)] text-black"
                          : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)]"
                      }`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={handleMultiDone}
                disabled={multiSelection.length === 0}
                className="w-full py-3 rounded-xl bg-[var(--accent-green)] text-black font-medium text-sm disabled:opacity-30"
              >
                Continue ({multiSelection.length} selected)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Done — save */}
      {done && (
        <div className="sticky bottom-0 bg-[var(--bg)] pt-4 pb-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 rounded-xl bg-[var(--accent-green)] text-black font-semibold text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Start exploring →"}
          </button>
        </div>
      )}
    </div>
  )
}
