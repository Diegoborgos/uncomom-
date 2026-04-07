"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Trip, Review } from "@/lib/database.types"
import { cities } from "@/data/cities"
import { countryCodeToFlag } from "@/lib/scores"
import { openJoinOverlay } from "@/components/JoinOverlay"
import ConciergeCard from "@/components/ConciergeCard"
import DashboardBriefing from "@/components/DashboardBriefing"
import { getLevelForPoints } from "@/lib/gamification"
import BadgeGrid from "@/components/gamification/BadgeGrid"

const ProfileMap = dynamic(() => import("@/components/ProfileMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black animate-pulse" />,
})

const WORK_OPTIONS = ["Remote employee", "Freelancer", "Business owner", "Investor / Retired", "Content creator", "Not working currently"]
const EDUCATION_OPTIONS = ["Homeschool", "Worldschool", "International school", "Local school", "Online school", "Unschool", "Mix of approaches"]
const TRAVEL_OPTIONS = ["Slow travel (months per city)", "Medium pace (1-3 months)", "Fast movers (weeks per city)", "Base + trips", "Seasonal (summer/winter bases)", "Just getting started"]
const INTEREST_OPTIONS = ["surf", "nature", "beach", "mountains", "co-living", "co-working", "language immersion", "arts & culture", "outdoor sports", "music", "food & cooking", "sustainability", "entrepreneurship", "yoga & wellness"]
const LANGUAGE_OPTIONS = ["English", "Spanish", "Portuguese", "French", "German", "Italian", "Dutch", "Mandarin", "Japanese", "Arabic"]

export default function DashboardPage() {
  const { user, family, loading, isPaid, refreshFamily } = useAuth()
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [editingBio, setEditingBio] = useState(false)
  const [bioText, setBioText] = useState("")
  const [savingBio, setSavingBio] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [savingField, setSavingField] = useState(false)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    if (family) {
      supabase.from("trips").select("*").eq("family_id", family.id)
        .order("arrived_at", { ascending: false, nullsFirst: false })
        .then(({ data }) => setTrips(data || []))
      supabase.from("reviews").select("*").eq("family_id", family.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => setReviews(data || []))
      supabase.from("family_streaks").select("current_streak").eq("family_id", family.id).maybeSingle()
        .then(({ data }) => setStreak(data?.current_streak || 0))
    }
  }, [family])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">Loading...</div>
  if (!user) return null

  const currentTrips = trips.filter((t) => t.status === "here_now")
  const uniqueCities = new Set(trips.map((t) => t.city_slug))
  const uniqueCountries = new Set(
    trips.map((t) => cities.find((c) => c.slug === t.city_slug)?.country).filter(Boolean)
  )
  const needsOnboarding = !family?.onboarding_complete

  const totalDays = trips.reduce((sum, t) => {
    if (!t.arrived_at) return sum
    const end = t.left_at ? new Date(t.left_at) : new Date()
    return sum + Math.ceil((end.getTime() - new Date(t.arrived_at).getTime()) / (1000 * 60 * 60 * 24))
  }, 0)

  const getCityInfo = (slug: string) => {
    const city = cities.find((c) => c.slug === slug)
    return city ? { name: city.name, flag: countryCodeToFlag(city.countryCode), country: city.country } : { name: slug, flag: "", country: "" }
  }

  const initials = family?.family_name
    ? family.family_name.slice(0, 2).toUpperCase()
    : user.email?.slice(0, 2).toUpperCase() ?? ""

  const memberSince = family?.created_at
    ? new Date(family.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : ""

  return (
    <div>
      {/* Map hero — always show, like Nomad List globe */}
      <div className="relative w-full h-[400px] bg-black">
        <ProfileMap trips={trips} />
        {/* Overlay gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[var(--bg)] to-transparent" />
      </div>

      {/* Profile section */}
      <div className="max-w-3xl mx-auto px-4 -mt-16 relative z-10">
        {/* Avatar + name */}
        <div className="text-center mb-6">
          <div className="relative w-28 h-28 mx-auto mb-3">
            {family?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={family.avatar_url} alt={family.family_name || ""} className="w-full h-full rounded-full object-cover border-4 border-[var(--bg)]" />
            ) : (
              <div className="w-full h-full rounded-full bg-[var(--accent-green)] text-black flex items-center justify-center text-3xl font-bold border-4 border-[var(--bg)]">
                {initials}
              </div>
            )}
            {/* Photo upload overlay */}
            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[var(--surface)] border-2 border-[var(--border)] flex items-center justify-center cursor-pointer hover:bg-[var(--surface-elevated)] transition-colors">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 11l4-4 3 3 2-2 3 3" /><rect x="1" y="2" width="14" height="12" rx="2" />
              </svg>
              <input
                type="file"
                accept="image/jpeg,image/webp,image/png"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file || !family) return
                  const { data: { session } } = await supabase.auth.getSession()
                  if (!session?.access_token) return
                  const formData = new FormData()
                  formData.append("file", file)
                  formData.append("familyId", family.id)
                  const res = await fetch("/api/upload-avatar", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${session.access_token}` },
                    body: formData,
                  })
                  const result = await res.json()
                  if (result.url) { await refreshFamily() }
                  else { alert(`Upload failed: ${result.error}`) }
                }}
              />
            </label>
          </div>
          <h1 className="font-serif text-3xl font-bold">
            {family?.family_name || "My Family"}
          </h1>
          {family?.home_country && (
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {family.country_code ? countryCodeToFlag(family.country_code) + " " : ""}
              {family.home_country}
            </p>
          )}
          {/* Membership badge — directly under name */}
          {isPaid ? (
            <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-[10px] font-medium bg-[rgb(var(--accent-green-rgb)/0.15)] text-[var(--accent-green)] border border-[rgb(var(--accent-green-rgb)/0.25)]">
              ✦ Uncomun Member
            </span>
          ) : (
            <button onClick={() => openJoinOverlay()} className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-[10px] font-medium bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--accent-green)] hover:text-[var(--accent-green)] transition-colors">
              Unlock full access →
            </button>
          )}
          {family?.total_points !== undefined && family.total_points > 0 && (
            <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-[var(--text-secondary)] bg-[var(--surface)]">
              Lv.{family.level || 1} {getLevelForPoints(family.total_points || 0).current.title} · {family.total_points || 0} UP
            </span>
          )}
          {/* Member stats */}
          <div className="flex justify-center gap-6 mt-3 text-xs text-[var(--text-secondary)]">
            {memberSince && <span>Joined {memberSince}</span>}
            {uniqueCities.size > 0 && <span>{uniqueCities.size} cities</span>}
            {uniqueCountries.size > 0 && <span>{uniqueCountries.size} countries</span>}
            {totalDays > 0 && <span>{totalDays} days abroad</span>}
          </div>
          {/* Action buttons */}
          <div className="flex justify-center gap-2 mt-4">
            <Link href="/onboarding" className="px-4 py-2 rounded-xl bg-[var(--accent-green)] text-black text-xs font-medium hover:opacity-90 transition-opacity">
              Enhance profile ✨
            </Link>
          </div>
        </div>

        {/* Bio */}
        {family?.bio && (
          <div className="text-center mb-6 relative group">
            {editingBio ? (
              <div className="max-w-lg mx-auto">
                <textarea
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)] resize-none"
                />
                <div className="flex justify-center gap-2 mt-2">
                  <button onClick={async () => {
                    setSavingBio(true)
                    await supabase.from("families").update({ bio: bioText, updated_at: new Date().toISOString() }).eq("id", family.id)
                    await refreshFamily()
                    setEditingBio(false)
                    setSavingBio(false)
                  }} disabled={savingBio} className="px-4 py-1.5 rounded-lg bg-[var(--accent-green)] text-black text-xs font-medium disabled:opacity-50">
                    {savingBio ? "Saving..." : "Save"}
                  </button>
                  <button onClick={() => setEditingBio(false)} className="px-4 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text-secondary)]">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <p className="text-sm text-[var(--text-secondary)] italic max-w-lg mx-auto leading-relaxed">
                  &ldquo;{family.bio}&rdquo;
                </p>
                <button onClick={() => { setBioText(family.bio || ""); setEditingBio(true) }}
                  className="absolute -right-2 top-0 p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-green)] hover:bg-[var(--surface)] transition-colors opacity-0 group-hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                  title="Edit bio">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Onboarding prompt */}
        {needsOnboarding && (
          <Link href="/onboarding" className="block rounded-2xl border border-[rgb(var(--accent-green-rgb)/0.3)] bg-[rgb(var(--accent-green-rgb)/0.05)] p-5 mb-6 text-center hover:bg-[rgb(var(--accent-green-rgb)/0.1)] transition-colors">
            <p className="font-medium text-[var(--accent-green)] mb-1">Complete your profile</p>
            <p className="text-xs text-[var(--text-secondary)]">Quick chat — helps families find and connect with you.</p>
          </Link>
        )}

        {/* Tags — organized by category */}
        {family && (
          <div className="mb-8">
            <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-medium mb-3 block">Profile details</span>
            <div className="space-y-3">
              {family.parent_work_type && <EditableTagRow label="Work" tags={[family.parent_work_type]} field="parent_work_type" options={WORK_OPTIONS} editingField={editingField} setEditingField={setEditingField} family={family} refreshFamily={refreshFamily} savingField={savingField} setSavingField={setSavingField} />}
              {family.education_approach && <EditableTagRow label="Education" tags={[family.education_approach]} field="education_approach" options={EDUCATION_OPTIONS} editingField={editingField} setEditingField={setEditingField} family={family} refreshFamily={refreshFamily} savingField={savingField} setSavingField={setSavingField} />}
              {family.travel_style && <EditableTagRow label="Travel" tags={[family.travel_style]} field="travel_style" options={TRAVEL_OPTIONS} editingField={editingField} setEditingField={setEditingField} family={family} refreshFamily={refreshFamily} savingField={savingField} setSavingField={setSavingField} />}
              {family.kids_ages && family.kids_ages.length > 0 && <EditableKidsRow label="Kids" ages={family.kids_ages} editingField={editingField} setEditingField={setEditingField} family={family} refreshFamily={refreshFamily} savingField={savingField} setSavingField={setSavingField} />}
              {family.languages && family.languages.length > 0 && <EditableLanguagesRow label="Languages" languages={family.languages} editingField={editingField} setEditingField={setEditingField} family={family} refreshFamily={refreshFamily} savingField={savingField} setSavingField={setSavingField} />}
              {family.interests && family.interests.length > 0 && <EditableTagRow label="Interests" tags={family.interests} field="interests" options={INTEREST_OPTIONS} multiSelect editingField={editingField} setEditingField={setEditingField} family={family} refreshFamily={refreshFamily} savingField={savingField} setSavingField={setSavingField} />}
            </div>

            {/* Data collection prompts — ask for missing fields */}
            {(!family.parent_work_type || !family.education_approach || !family.travel_style || !family.languages?.length || !family.interests?.length) && (
              <Link href="/onboarding" className="block mt-4 rounded-xl border border-dashed border-[var(--border)] p-4 text-center hover:border-[var(--accent-green)] transition-colors">
                <p className="text-xs text-[var(--text-secondary)]">
                  Your profile is {Math.round(([family.parent_work_type, family.education_approach, family.travel_style, family.languages?.length, family.interests?.length, family.bio, family.kids_ages?.length].filter(Boolean).length / 7) * 100)}% complete —{" "}
                  <span className="text-[var(--accent-green)]">add more to get better matches</span>
                </p>
              </Link>
            )}
          </div>
        )}

        {family && (
          <div className="mb-8">
            <BadgeGrid familyId={family.id} />
          </div>
        )}

        {/* Intelligence Briefing */}
        {isPaid && family && (
          <DashboardBriefing familyId={family.id} />
        )}

        {streak > 0 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 mb-6 flex items-center gap-4">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="text-sm font-medium">{streak}-week streak</p>
              <p className="text-xs text-[var(--text-secondary)]">You&apos;ve contributed every week. Keep it going!</p>
            </div>
          </div>
        )}

        {/* AI Concierge — personalized recommendations */}
        <ConciergeCard />

        {/* Community CTA — replaces FamilyMatches */}
        {isPaid && (
          <section className="mb-8">
            <Link href="/community?tab=nearby" className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-[var(--accent-green)] transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold mb-1">Find families near you</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Browse the community, find matches, plan meetups</p>
                </div>
                <span className="text-[var(--accent-green)] text-xl">→</span>
              </div>
            </Link>
          </section>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-8">
          <StatCard value={uniqueCities.size} label="Cities" />
          <StatCard value={uniqueCountries.size} label="Countries" />
          <StatCard value={totalDays} label="Days" />
          <StatCard value={reviews.length} label="Reviews" />
          <StatCard value={currentTrips.length} label="Here now" accent={currentTrips.length > 0} />
        </div>

        {/* Currently in */}
        {currentTrips.length > 0 && (
          <section className="mb-8">
            <SectionTitle>Currently in</SectionTitle>
            {currentTrips.map((trip) => {
              const info = getCityInfo(trip.city_slug)
              return (
                <Link key={trip.id} href={`/cities/${trip.city_slug}`}
                  className="flex items-center justify-between rounded-2xl border border-[rgb(var(--accent-green-rgb)/0.3)] bg-[rgb(var(--accent-green-rgb)/0.05)] p-4 hover:bg-[rgb(var(--accent-green-rgb)/0.1)] transition-colors">
                  <div>
                    <p className="font-serif text-lg font-bold">{info.flag} {info.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{info.country}</p>
                  </div>
                  {trip.arrived_at && (
                    <span className="text-xs text-[var(--text-secondary)]">
                      Since {new Date(trip.arrived_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </Link>
              )
            })}
          </section>
        )}

        {/* No trips */}
        {trips.length === 0 && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 mb-8 text-center">
            <h3 className="font-serif text-xl font-bold mb-2">Where have you been?</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4 max-w-md mx-auto">
              Log your travels to build your map. Every trip helps other families decide where to go next.
            </p>
            <Link href="/" className="inline-block px-6 py-3 rounded-xl bg-[var(--accent-green)] text-black font-medium text-sm hover:opacity-90 transition-opacity">
              Find a city →
            </Link>
          </div>
        )}

        {/* Flags collected — above cities */}
        {uniqueCountries.size > 0 && (
          <section className="mb-8">
            <SectionTitle>Flags collected ({uniqueCountries.size})</SectionTitle>
            <div className="flex flex-wrap gap-3">
              {Array.from(uniqueCountries).map((country) => {
                const city = cities.find((c) => c.country === country)
                const f = city ? countryCodeToFlag(city.countryCode) : ""
                return <span key={country as string} className="text-3xl" title={country as string}>{f}</span>
              })}
            </div>
          </section>
        )}

        {/* Cities visited — photo grid */}
        {uniqueCities.size > 0 && (
          <section className="mb-8">
            <SectionTitle>Cities visited</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from(uniqueCities).map((slug) => {
                const city = cities.find((c) => c.slug === slug)
                if (!city) return null
                const cityFlag = countryCodeToFlag(city.countryCode)
                return (
                  <Link key={slug} href={`/cities/${slug}`}
                    className="rounded-xl overflow-hidden bg-[var(--surface)] hover:opacity-90 transition-opacity">
                    <div className="relative h-24 bg-black">
                      {city.photo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={city.photo} alt={city.name} className="w-full h-full object-cover" loading="lazy" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-2 left-2">
                        <p className="text-[10px] text-white/70">{cityFlag} {city.country}</p>
                        <p className="text-sm font-bold text-white">{city.name}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="mb-8">
            <SectionTitle>Reviews</SectionTitle>
            <div className="space-y-2">
              {reviews.map((review) => {
                const info = getCityInfo(review.city_slug)
                return (
                  <Link key={review.id} href={`/cities/${review.city_slug}`}
                    className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 hover:border-[var(--accent-green)] transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{info.flag} {info.name}</span>
                      <span className="text-xs font-mono text-[var(--accent-green)]">{"★".repeat(review.rating)}</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{review.text}</p>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Free user CTA — replaces bottom membership card */}
        {!isPaid && (
          <section className="rounded-2xl border border-[rgb(var(--accent-green-rgb)/0.3)] bg-[rgb(var(--accent-green-rgb)/0.05)] p-6 text-center mb-12">
            <h3 className="font-serif text-xl font-bold mb-2">Unlock the full picture</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-1">Personalized city scores tailored to your family</p>
            <p className="text-xs text-[var(--text-secondary)] mb-1">Weekly intelligence briefings for your saved cities</p>
            <p className="text-xs text-[var(--text-secondary)] mb-4">Community access — find and connect with families like yours</p>
            <button onClick={() => openJoinOverlay()} className="px-6 py-3 rounded-xl bg-[var(--accent-green)] text-black font-medium text-sm hover:opacity-90 transition-opacity">
              Become a member →
            </button>
          </section>
        )}
      </div>
    </div>
  )
}

function EditableTagRow({
  label, tags, field, options, multiSelect = false,
  editingField, setEditingField, family, refreshFamily, savingField, setSavingField
}: {
  label: string; tags: string[]; field: string; options: string[]; multiSelect?: boolean;
  editingField: string | null; setEditingField: (f: string | null) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  family: any; refreshFamily: () => Promise<void>; savingField: boolean; setSavingField: (b: boolean) => void;
}) {
  const [selected, setSelected] = useState<string[]>(tags)
  const isEditing = editingField === field

  const handleSave = async () => {
    setSavingField(true)
    const value = multiSelect ? selected : selected[0] || ""
    await supabase.from("families").update({ [field]: value, updated_at: new Date().toISOString() }).eq("id", family.id)
    await refreshFamily()
    setEditingField(null)
    setSavingField(false)
  }

  if (isEditing) {
    return (
      <div className="space-y-2 py-2">
        <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">{label}</span>
        <div className="flex flex-wrap gap-1.5">
          {options.map(opt => (
            <button key={opt} onClick={() => {
              if (multiSelect) {
                setSelected(prev => prev.includes(opt) ? prev.filter(s => s !== opt) : [...prev, opt])
              } else {
                setSelected([opt])
              }
            }} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              selected.includes(opt) || selected.includes(opt.toLowerCase())
                ? "bg-[var(--accent-green)] text-black border-[var(--accent-green)]"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)]"
            }`}>
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={savingField} className="px-3 py-1 rounded-lg bg-[var(--accent-green)] text-black text-[10px] font-medium disabled:opacity-50">
            {savingField ? "..." : "Save"}
          </button>
          <button onClick={() => setEditingField(null)} className="px-3 py-1 rounded-lg border border-[var(--border)] text-[10px] text-[var(--text-secondary)]">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 group">
      <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider w-16 shrink-0 pt-1.5">{label}</span>
      <div className="flex-1 flex flex-wrap items-center gap-1.5">
        {tags.map(tag => (
          <span key={tag} className="text-xs px-3 py-1.5 rounded-full bg-[rgb(var(--accent-green-rgb)/0.1)] text-[var(--accent-green)] border border-[rgb(var(--accent-green-rgb)/0.2)]">
            {tag.charAt(0).toUpperCase() + tag.slice(1)}
          </span>
        ))}
        <button onClick={() => { setSelected(tags); setEditingField(field) }}
          className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-green)] hover:bg-[var(--surface)] transition-colors sm:opacity-0 sm:group-hover:opacity-100"
          title={`Edit ${label.toLowerCase()}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
        </button>
      </div>
    </div>
  )
}

function EditableKidsRow({
  label, ages, editingField, setEditingField, family, refreshFamily, savingField, setSavingField
}: {
  label: string; ages: number[];
  editingField: string | null; setEditingField: (f: string | null) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  family: any; refreshFamily: () => Promise<void>; savingField: boolean; setSavingField: (b: boolean) => void;
}) {
  const [selectedAges, setSelectedAges] = useState<number[]>(ages)
  const [ageInput, setAgeInput] = useState("")
  const isEditing = editingField === "kids_ages"

  const handleAddAge = () => {
    const num = parseInt(ageInput.trim())
    if (!isNaN(num) && num >= 0 && num <= 18) {
      setSelectedAges(prev => [...prev, num].sort((a, b) => a - b))
      setAgeInput("")
    }
  }

  const handleSave = async () => {
    setSavingField(true)
    await supabase.from("families").update({ kids_ages: selectedAges, updated_at: new Date().toISOString() }).eq("id", family.id)
    await refreshFamily()
    setEditingField(null)
    setSavingField(false)
  }

  if (isEditing) {
    return (
      <div className="space-y-2 py-2">
        <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">{label}</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {selectedAges.map((age, i) => (
            <button key={i} onClick={() => setSelectedAges(prev => prev.filter((_, idx) => idx !== i))}
              className="text-xs px-3 py-1.5 rounded-full bg-[var(--accent-green)] text-black border border-[var(--accent-green)] hover:opacity-70">
              {age} years ×
            </button>
          ))}
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={18}
              value={ageInput}
              onChange={(e) => setAgeInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddAge() }}
              placeholder="Age"
              className="w-16 px-2 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
            />
            <button onClick={handleAddAge} className="text-xs px-2 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)] hover:text-[var(--accent-green)]">
              + Add
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={savingField} className="px-3 py-1 rounded-lg bg-[var(--accent-green)] text-black text-[10px] font-medium disabled:opacity-50">
            {savingField ? "..." : "Save"}
          </button>
          <button onClick={() => setEditingField(null)} className="px-3 py-1 rounded-lg border border-[var(--border)] text-[10px] text-[var(--text-secondary)]">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 group">
      <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider w-16 shrink-0 pt-1.5">{label}</span>
      <div className="flex-1 flex flex-wrap items-center gap-1.5">
        {ages.map((age, i) => (
          <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-[rgb(var(--accent-green-rgb)/0.1)] text-[var(--accent-green)] border border-[rgb(var(--accent-green-rgb)/0.2)]">
            {age} years
          </span>
        ))}
        <button onClick={() => { setSelectedAges(ages); setEditingField("kids_ages") }}
          className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-green)] hover:bg-[var(--surface)] transition-colors sm:opacity-0 sm:group-hover:opacity-100"
          title="Edit kids ages">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
        </button>
      </div>
    </div>
  )
}

function EditableLanguagesRow({
  label, languages, editingField, setEditingField, family, refreshFamily, savingField, setSavingField
}: {
  label: string; languages: string[];
  editingField: string | null; setEditingField: (f: string | null) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  family: any; refreshFamily: () => Promise<void>; savingField: boolean; setSavingField: (b: boolean) => void;
}) {
  const [selected, setSelected] = useState<string[]>(languages)
  const [customInput, setCustomInput] = useState("")
  const isEditing = editingField === "languages"

  const handleAddCustom = () => {
    const lang = customInput.trim()
    if (lang && !selected.some(s => s.toLowerCase() === lang.toLowerCase())) {
      setSelected(prev => [...prev, lang])
      setCustomInput("")
    }
  }

  const handleSave = async () => {
    setSavingField(true)
    await supabase.from("families").update({ languages: selected, updated_at: new Date().toISOString() }).eq("id", family.id)
    await refreshFamily()
    setEditingField(null)
    setSavingField(false)
  }

  if (isEditing) {
    return (
      <div className="space-y-2 py-2">
        <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">{label}</span>
        <div className="flex flex-wrap gap-1.5">
          {LANGUAGE_OPTIONS.map(opt => (
            <button key={opt} onClick={() => {
              setSelected(prev => prev.some(s => s.toLowerCase() === opt.toLowerCase()) ? prev.filter(s => s.toLowerCase() !== opt.toLowerCase()) : [...prev, opt])
            }} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              selected.some(s => s.toLowerCase() === opt.toLowerCase())
                ? "bg-[var(--accent-green)] text-black border-[var(--accent-green)]"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)]"
            }`}>
              {opt}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAddCustom() }}
            placeholder="Other language..."
            className="w-36 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
          />
          <button onClick={handleAddCustom} className="text-xs px-2 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)] hover:text-[var(--accent-green)]">
            + Add
          </button>
        </div>
        {selected.filter(s => !LANGUAGE_OPTIONS.some(o => o.toLowerCase() === s.toLowerCase())).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selected.filter(s => !LANGUAGE_OPTIONS.some(o => o.toLowerCase() === s.toLowerCase())).map(lang => (
              <button key={lang} onClick={() => setSelected(prev => prev.filter(s => s !== lang))}
                className="text-xs px-3 py-1.5 rounded-full bg-[var(--accent-green)] text-black border border-[var(--accent-green)] hover:opacity-70">
                {lang} ×
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={savingField} className="px-3 py-1 rounded-lg bg-[var(--accent-green)] text-black text-[10px] font-medium disabled:opacity-50">
            {savingField ? "..." : "Save"}
          </button>
          <button onClick={() => setEditingField(null)} className="px-3 py-1 rounded-lg border border-[var(--border)] text-[10px] text-[var(--text-secondary)]">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 group">
      <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider w-16 shrink-0 pt-1.5">{label}</span>
      <div className="flex-1 flex flex-wrap items-center gap-1.5">
        {languages.map(lang => (
          <span key={lang} className="text-xs px-3 py-1.5 rounded-full bg-[rgb(var(--accent-green-rgb)/0.1)] text-[var(--accent-green)] border border-[rgb(var(--accent-green-rgb)/0.2)]">
            {lang.charAt(0).toUpperCase() + lang.slice(1)}
          </span>
        ))}
        <button onClick={() => { setSelected(languages); setEditingField("languages") }}
          className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-green)] hover:bg-[var(--surface)] transition-colors sm:opacity-0 sm:group-hover:opacity-100"
          title="Edit languages">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
        </button>
      </div>
    </div>
  )
}

function StatCard({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-[var(--surface)] p-3 text-center">
      <p className={`font-mono text-xl font-bold ${accent ? "text-[var(--accent-green)]" : ""}`}>{value}</p>
      <p className="text-[10px] text-[var(--text-secondary)]">{label}</p>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-serif text-lg font-bold mb-3">{children}</h2>
}
