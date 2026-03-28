"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"

const WORK_TYPES = [
  "Remote employee",
  "Freelancer / Consultant",
  "Business owner",
  "Investor / Retired",
  "Content creator",
  "Not working currently",
  "Other",
]

const EDUCATION_APPROACHES = [
  "Homeschool",
  "Worldschool",
  "International school",
  "Local school (immersion)",
  "Online school",
  "Unschool",
  "Mix of approaches",
  "No school-age kids yet",
]

const TRAVEL_STYLES = [
  "Slow travel (months per city)",
  "Medium pace (1-3 months)",
  "Fast movers (weeks per city)",
  "Base + trips (one home base)",
  "Seasonal (summer/winter bases)",
  "Just getting started",
]

const INTERESTS = [
  "surf", "nature", "beach", "mountains", "co-living", "co-working",
  "language immersion", "arts & culture", "outdoor sports", "music",
  "food & cooking", "sustainability", "entrepreneurship", "yoga & wellness",
]

const LANGUAGES = [
  "English", "Spanish", "Portuguese", "French", "German", "Italian",
  "Dutch", "Thai", "Indonesian", "Japanese", "Mandarin", "Arabic",
  "Russian", "Korean", "Hindi",
]

const TOTAL_STEPS = 4

export default function OnboardingPage() {
  const { user, family, loading, refreshFamily } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Form state
  const [familyName, setFamilyName] = useState("")
  const [homeCountry, setHomeCountry] = useState("")
  const [countryCode, setCountryCode] = useState("")
  const [kidsAges, setKidsAges] = useState("")
  const [parentWorkType, setParentWorkType] = useState("")
  const [travelStyle, setTravelStyle] = useState("")
  const [educationApproach, setEducationApproach] = useState("")
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [bio, setBio] = useState("")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // Pre-fill if family already exists
  useEffect(() => {
    if (family) {
      setFamilyName(family.family_name || "")
      setHomeCountry(family.home_country || "")
      setCountryCode(family.country_code || "")
      setKidsAges(family.kids_ages?.join(", ") || "")
      setParentWorkType(family.parent_work_type || "")
      setTravelStyle(family.travel_style || "")
      setEducationApproach(family.education_approach || "")
      setSelectedLanguages(family.languages || [])
      setSelectedInterests(family.interests || [])
      setBio(family.bio || "")
    }
  }, [family])

  const toggleItem = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]

  const handleSave = async () => {
    if (!user) return
    setSaving(true)

    const ages = kidsAges
      .split(",")
      .map((a) => parseInt(a.trim()))
      .filter((a) => !isNaN(a))

    const payload = {
      family_name: familyName,
      home_country: homeCountry,
      country_code: countryCode.toUpperCase(),
      kids_ages: ages,
      parent_work_type: parentWorkType,
      travel_style: travelStyle,
      education_approach: educationApproach,
      languages: selectedLanguages,
      interests: selectedInterests,
      bio: bio,
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

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center text-[var(--text-secondary)]">
        Loading...
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-10">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-colors ${
              i < step ? "bg-[var(--accent-green)]" : "bg-[var(--border)]"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Who are you */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h1 className="font-serif text-3xl font-bold mb-2">Tell us about your family</h1>
            <p className="text-[var(--text-secondary)]">
              This helps other traveling families find and connect with you.
            </p>
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Family name</label>
            <input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="The Silvas"
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-green)] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">Home country</label>
              <input
                type="text"
                value={homeCountry}
                onChange={(e) => setHomeCountry(e.target.value)}
                placeholder="Portugal"
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-green)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">Country code</label>
              <input
                type="text"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                maxLength={2}
                placeholder="PT"
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-green)] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">
              Kids ages <span className="opacity-60">(comma separated)</span>
            </label>
            <input
              type="text"
              value={kidsAges}
              onChange={(e) => setKidsAges(e.target.value)}
              placeholder="4, 7, 11"
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-green)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">What do you do for work?</label>
            <div className="grid grid-cols-2 gap-2">
              {WORK_TYPES.map((wt) => (
                <button
                  key={wt}
                  onClick={() => setParentWorkType(wt)}
                  className={`px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                    parentWorkType === wt
                      ? "bg-[var(--accent-green)]/15 border-[var(--accent-green)] text-[var(--accent-green)]"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]"
                  }`}
                >
                  {wt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: How you travel */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h1 className="font-serif text-3xl font-bold mb-2">How does your family travel?</h1>
            <p className="text-[var(--text-secondary)]">
              Helps us match you with cities and families that move like you do.
            </p>
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Travel style</label>
            <div className="space-y-2">
              {TRAVEL_STYLES.map((ts) => (
                <button
                  key={ts}
                  onClick={() => setTravelStyle(ts)}
                  className={`w-full px-4 py-3 rounded-lg border text-sm text-left transition-colors ${
                    travelStyle === ts
                      ? "bg-[var(--accent-green)]/15 border-[var(--accent-green)] text-[var(--accent-green)]"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]"
                  }`}
                >
                  {ts}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Education approach</label>
            <div className="grid grid-cols-2 gap-2">
              {EDUCATION_APPROACHES.map((ea) => (
                <button
                  key={ea}
                  onClick={() => setEducationApproach(ea)}
                  className={`px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                    educationApproach === ea
                      ? "bg-[var(--accent-warm)]/15 border-[var(--accent-warm)] text-[var(--accent-warm)]"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]"
                  }`}
                >
                  {ea}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Languages + interests */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h1 className="font-serif text-3xl font-bold mb-2">Languages & interests</h1>
            <p className="text-[var(--text-secondary)]">
              Select all that apply. This helps families with similar kids connect.
            </p>
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">
              Languages your family speaks
            </label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguages(toggleItem(selectedLanguages, lang))}
                  className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${
                    selectedLanguages.includes(lang)
                      ? "bg-[var(--accent-green)] border-[var(--accent-green)] text-[var(--bg)]"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">
              Family interests
            </label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  onClick={() => setSelectedInterests(toggleItem(selectedInterests, interest))}
                  className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${
                    selectedInterests.includes(interest)
                      ? "bg-[var(--accent-warm)] border-[var(--accent-warm)] text-[var(--bg)]"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]"
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Bio + finish */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h1 className="font-serif text-3xl font-bold mb-2">Almost there</h1>
            <p className="text-[var(--text-secondary)]">
              A short bio helps other families get a feel for who you are.
            </p>
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">
              Family bio <span className="opacity-60">(optional, 2-3 sentences)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="We're a family of four from Lisbon, currently slow-traveling through Southeast Asia. The kids (4 and 7) are homeschooled and obsessed with surfing and bugs."
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-green)] transition-colors resize-none"
            />
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
            <h3 className="font-serif font-bold text-lg">Your profile</h3>
            <SummaryRow label="Family" value={familyName} />
            <SummaryRow label="From" value={`${homeCountry}${countryCode ? ` (${countryCode.toUpperCase()})` : ""}`} />
            <SummaryRow label="Kids" value={kidsAges || "—"} />
            <SummaryRow label="Work" value={parentWorkType || "—"} />
            <SummaryRow label="Travel" value={travelStyle || "—"} />
            <SummaryRow label="Education" value={educationApproach || "—"} />
            <SummaryRow label="Languages" value={selectedLanguages.join(", ") || "—"} />
            <SummaryRow label="Interests" value={selectedInterests.join(", ") || "—"} />
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-10">
        {step > 1 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            ← Back
          </button>
        ) : (
          <div />
        )}

        {step < TOTAL_STEPS ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={step === 1 && !familyName}
            className="px-6 py-2.5 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-30"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving || !familyName}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving && <span className="w-4 h-4 border-2 border-[var(--bg)] border-t-transparent rounded-full animate-spin" />}
            {saving ? "Saving..." : "Complete profile"}
          </button>
        )}
      </div>

      {/* Skip link */}
      <p className="text-center mt-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          Skip for now
        </button>
      </p>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className="text-right max-w-[60%]">{value}</span>
    </div>
  )
}
