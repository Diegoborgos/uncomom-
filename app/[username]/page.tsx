"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { notFound } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Family, Trip } from "@/lib/database.types"
import { cities } from "@/data/cities"
import { countryCodeToFlag } from "@/lib/scores"

const ProfileMap = dynamic(() => import("@/components/ProfileMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black animate-pulse" />,
})

const RESERVED = new Set([
  "cities", "dashboard", "join", "signup", "login", "onboarding", "profile",
  "admin", "api", "auth", "map", "families", "schools", "visas", "member-map",
  "about", "pricing", "settings", "search", "explore",
])

type CrossPathFamily = {
  id: string
  family_name: string
  username: string | null
  avatar_url: string | null
  country_code: string
}

export default function UserProfilePage() {
  const params = useParams()
  const handle = params.username as string
  const { user, family: myFamily } = useAuth()

  const [family, setFamily] = useState<Family | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [crossPaths, setCrossPaths] = useState<CrossPathFamily[]>([])
  const [followers, setFollowers] = useState<CrossPathFamily[]>([])
  const [following, setFollowing] = useState<CrossPathFamily[]>([])

  // Reserved route check
  if (RESERVED.has(handle)) return notFound()

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const load = async () => {
      // Resolve username or UUID
      const isUUID = handle.includes("-") && handle.length > 30
      const { data: fam } = await supabase
        .from("families")
        .select("*")
        .eq(isUUID ? "id" : "username", handle)
        .single()

      if (!fam) { setLoading(false); return }
      setFamily(fam as Family)

      // Trips
      const { data: t } = await supabase
        .from("trips")
        .select("*")
        .eq("family_id", fam.id)
        .order("arrived_at", { ascending: false, nullsFirst: false })
      setTrips(t || [])

      // Follower/following counts
      const { count: fc } = await supabase.from("family_follows").select("id", { count: "exact", head: true }).eq("following_id", fam.id)
      const { count: fgc } = await supabase.from("family_follows").select("id", { count: "exact", head: true }).eq("follower_id", fam.id)
      setFollowerCount(fc || 0)
      setFollowingCount(fgc || 0)

      // Am I following this person?
      if (myFamily?.id && myFamily.id !== fam.id) {
        const { data: fw } = await supabase.from("family_follows").select("id").eq("follower_id", myFamily.id).eq("following_id", fam.id).maybeSingle()
        setIsFollowing(!!fw)
      }

      // People who cross paths — families with trips in the same cities
      const citySlugs = [...new Set((t || []).map((tr: Trip) => tr.city_slug))]
      if (citySlugs.length > 0) {
        const { data: crossTrips } = await supabase
          .from("trips")
          .select("family_id")
          .in("city_slug", citySlugs)
          .neq("family_id", fam.id)
          .limit(100)
        const crossFamilyIds = [...new Set((crossTrips || []).map(ct => ct.family_id))].slice(0, 20)
        if (crossFamilyIds.length > 0) {
          const { data: crossFams } = await supabase
            .from("families")
            .select("id, family_name, username, avatar_url, country_code")
            .in("id", crossFamilyIds)
          setCrossPaths((crossFams || []) as CrossPathFamily[])
        }
      }

      // Followers list
      const { data: followerRows } = await supabase.from("family_follows").select("follower_id").eq("following_id", fam.id).limit(20)
      if (followerRows?.length) {
        const { data: fols } = await supabase.from("families").select("id, family_name, username, avatar_url, country_code").in("id", followerRows.map(r => r.follower_id))
        setFollowers((fols || []) as CrossPathFamily[])
      }

      // Following list
      const { data: followingRows } = await supabase.from("family_follows").select("following_id").eq("follower_id", fam.id).limit(20)
      if (followingRows?.length) {
        const { data: fgns } = await supabase.from("families").select("id, family_name, username, avatar_url, country_code").in("id", followingRows.map(r => r.following_id))
        setFollowing((fgns || []) as CrossPathFamily[])
      }

      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle, myFamily?.id])

  const toggleFollow = async () => {
    if (!myFamily?.id || !family?.id) return
    setFollowLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) { setFollowLoading(false); return }

    const method = isFollowing ? "DELETE" : "POST"
    await fetch("/api/follow", {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ targetFamilyId: family.id }),
    })

    setIsFollowing(!isFollowing)
    setFollowerCount(prev => isFollowing ? prev - 1 : prev + 1)
    setFollowLoading(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">Loading...</div>
  if (!family) return notFound()

  const isOwnProfile = myFamily?.id === family.id
  const flag = family.country_code ? countryCodeToFlag(family.country_code) : ""
  const initials = family.family_name?.slice(0, 2).toUpperCase() || "??"
  const uniqueCities = [...new Set(trips.map(t => t.city_slug))]
  const uniqueCountries = [...new Set(trips.map(t => cities.find(c => c.slug === t.city_slug)?.country).filter(Boolean))]
  const currentTrip = trips.find(t => t.status === "here_now")
  const currentCity = currentTrip ? cities.find(c => c.slug === currentTrip.city_slug) : null
  const memberSince = new Date(family.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })

  const totalDays = trips.reduce((sum, t) => {
    if (!t.arrived_at) return sum
    const end = t.left_at ? new Date(t.left_at) : new Date()
    return sum + Math.ceil((end.getTime() - new Date(t.arrived_at).getTime()) / 86400000)
  }, 0)

  // Top countries
  const countryData: Record<string, { count: number; cities: string[]; photo: string; code: string }> = {}
  trips.forEach(t => {
    const city = cities.find(c => c.slug === t.city_slug)
    if (!city) return
    if (!countryData[city.country]) countryData[city.country] = { count: 0, cities: [], photo: city.photo, code: city.countryCode }
    countryData[city.country].count++
    if (!countryData[city.country].cities.includes(city.name)) countryData[city.country].cities.push(city.name)
  })
  const topCountries = Object.entries(countryData).sort((a, b) => b[1].count - a[1].count)

  // Most visits per city
  const visitCounts: Record<string, number> = {}
  trips.forEach(t => { visitCounts[t.city_slug] = (visitCounts[t.city_slug] || 0) + 1 })
  const mostVisits = Object.entries(visitCounts).sort((a, b) => b[1] - a[1])

  // Most time spent per city
  const daysPerCity: Record<string, number> = {}
  trips.forEach(t => {
    if (!t.arrived_at) return
    const end = t.left_at ? new Date(t.left_at) : new Date()
    const days = Math.ceil((end.getTime() - new Date(t.arrived_at).getTime()) / 86400000)
    daysPerCity[t.city_slug] = (daysPerCity[t.city_slug] || 0) + days
  })
  const mostTime = Object.entries(daysPerCity).sort((a, b) => b[1] - a[1])

  // Tags
  const tags: string[] = []
  if (family.travel_style) tags.push(family.travel_style)
  if (family.education_approach) tags.push(family.education_approach)
  if (family.parent_work_type) tags.push(family.parent_work_type)
  if (family.interests?.length) tags.push(...family.interests.map(i => i.charAt(0).toUpperCase() + i.slice(1)))

  return (
    <div>
      {/* 1. Globe Map Hero */}
      <div className="relative w-full h-[400px] bg-black">
        <ProfileMap trips={trips} />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--bg)] to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10">
        {/* 2. Avatar + Handle + Bio */}
        <div className="text-center mb-4">
          <div className="w-28 h-28 mx-auto mb-3">
            {family.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={family.avatar_url} alt={family.family_name} className="w-full h-full rounded-full object-cover border-4 border-[var(--bg)]" />
            ) : (
              <div className="w-full h-full rounded-full bg-[var(--accent-green)] text-black flex items-center justify-center text-3xl font-bold border-4 border-[var(--bg)]">
                {initials}
              </div>
            )}
          </div>
          <h1 className="font-serif text-3xl font-bold">{family.family_name}</h1>
          <p className="text-sm text-[var(--accent-green)] mt-1">@{family.username || handle}</p>
          {family.bio && (
            <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-md mx-auto">{family.bio}</p>
          )}
          {currentCity && (
            <p className="text-xs text-[var(--accent-green)] mt-2">
              Currently in {countryCodeToFlag(currentCity.countryCode)} {currentCity.name}
            </p>
          )}
        </div>

        {/* 3. Action Buttons */}
        <div className="flex justify-center gap-2 mb-6">
          {isOwnProfile ? (
            <Link href="/onboarding" className="px-5 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm font-medium hover:border-[var(--accent-green)] transition-colors">
              Edit profile
            </Link>
          ) : user ? (
            <>
              <button
                onClick={toggleFollow}
                disabled={followLoading}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  isFollowing
                    ? "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--score-low)] hover:text-[var(--score-low)]"
                    : "bg-[var(--accent-green)] text-black"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
              <button className="px-5 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] cursor-not-allowed opacity-50" title="Coming soon">
                Message
              </button>
            </>
          ) : (
            <Link href="/signup" className="px-5 py-2 rounded-lg bg-[var(--accent-green)] text-black text-sm font-medium hover:opacity-90 transition-opacity">
              Sign up to connect
            </Link>
          )}
        </div>

        {/* 4. Stats Row */}
        <div className="flex justify-center gap-6 sm:gap-10 mb-6 overflow-x-auto pb-2">
          <Stat value={followerCount} label="Followers" />
          <Stat value={followingCount} label="Following" />
          <Stat value={uniqueCities.length} label="Cities" />
          <Stat value={uniqueCountries.length} label="Countries" />
          <Stat value={totalDays} label="Days" />
          <Stat value={memberSince} label="Member since" />
        </div>

        {/* 5. Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mb-8">
            {tags.map(tag => (
              <span key={tag} className="text-xs px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 6. Trip Timeline */}
        {trips.length > 0 && (
          <section className="mb-8">
            <SectionTitle>Trip Timeline</SectionTitle>
            <div className="rounded-xl border border-[var(--border)] overflow-hidden">
              {trips.slice(0, 15).map((trip, i) => {
                const city = cities.find(c => c.slug === trip.city_slug)
                if (!city) return null
                const isActive = trip.status === "here_now"
                const arrived = trip.arrived_at ? new Date(trip.arrived_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "2-digit" }) : ""
                const left = trip.left_at ? new Date(trip.left_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "2-digit" }) : isActive ? "now" : ""
                return (
                  <Link key={trip.id || i} href={`/cities/${trip.city_slug}`}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface)] transition-colors ${isActive ? "bg-[var(--accent-green)]/5 border-l-2 border-l-[var(--accent-green)]" : ""}`}>
                    <span className="text-[10px] text-[var(--text-secondary)] w-28 shrink-0 font-mono">
                      {arrived}{left ? ` → ${left}` : ""}
                    </span>
                    {city.photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={city.photo} alt={city.name} className="w-8 h-8 rounded object-cover shrink-0" />
                    )}
                    <span className="text-sm font-medium flex-1">{city.name}</span>
                    <span className="text-xs text-[var(--text-secondary)]">{countryCodeToFlag(city.countryCode)} {city.country}</span>
                  </Link>
                )
              })}
            </div>
            {trips.length > 15 && (
              <p className="text-center text-xs text-[var(--text-secondary)] mt-2">+ {trips.length - 15} more trips</p>
            )}
          </section>
        )}

        {/* 7. Flags Collected */}
        {uniqueCountries.length > 0 && (
          <section className="mb-8">
            <SectionTitle>Flags collected ({uniqueCountries.length})</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {uniqueCountries.map(country => {
                const city = cities.find(c => c.country === country)
                return <span key={country} className="text-3xl" title={country as string}>{city ? countryCodeToFlag(city.countryCode) : ""}</span>
              })}
            </div>
          </section>
        )}

        {/* 8. Top Countries */}
        {topCountries.length > 0 && (
          <section className="mb-8">
            <SectionTitle>Top countries</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {topCountries.slice(0, 8).map(([country, data]) => (
                <div key={country} className="rounded-xl overflow-hidden bg-[var(--surface)]">
                  <div className="relative h-24">
                    {data.photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={data.photo} alt={country} className="w-full h-full object-cover" loading="lazy" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-xs font-bold text-white">{countryCodeToFlag(data.code)} {country}</p>
                      <p className="text-[10px] text-white/60">{data.cities.length} {data.cities.length === 1 ? "city" : "cities"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 9. Most Visits */}
        {mostVisits.length > 0 && (
          <section className="mb-8">
            <SectionTitle>Most visits</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {mostVisits.slice(0, 8).map(([slug, count]) => {
                const city = cities.find(c => c.slug === slug)
                if (!city) return null
                return (
                  <CityCard key={slug} city={city} badge={`${count}x`} href={`/cities/${slug}`} />
                )
              })}
            </div>
          </section>
        )}

        {/* 10. Most Time Spent */}
        {mostTime.length > 0 && (
          <section className="mb-8">
            <SectionTitle>Most time spent</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {mostTime.slice(0, 8).map(([slug, days]) => {
                const city = cities.find(c => c.slug === slug)
                if (!city) return null
                return (
                  <CityCard key={slug} city={city} badge={`${days}d`} href={`/cities/${slug}`} />
                )
              })}
            </div>
          </section>
        )}

        {/* 11. People They Cross Paths With */}
        {crossPaths.length > 0 && (
          <section className="mb-8">
            <SectionTitle>People they cross paths with</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {crossPaths.slice(0, 20).map(f => (
                <AvatarLink key={f.id} family={f} />
              ))}
            </div>
          </section>
        )}

        {/* 12. Followers / Following */}
        <div className="grid grid-cols-2 gap-6 mb-12">
          {followers.length > 0 && (
            <section>
              <SectionTitle>Followers</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {followers.map(f => <AvatarLink key={f.id} family={f} />)}
              </div>
            </section>
          )}
          {following.length > 0 && (
            <section>
              <SectionTitle>Following</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {following.map(f => <AvatarLink key={f.id} family={f} />)}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="text-center shrink-0">
      <p className="font-mono text-lg font-bold">{value}</p>
      <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">{label}</p>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-serif text-xl font-bold mb-3">{children}</h2>
}

function CityCard({ city, badge, href }: { city: { name: string; country: string; countryCode: string; photo: string; scores: { family: number }; cost: { familyMonthly: number } }; badge: string; href: string }) {
  return (
    <Link href={href} className="rounded-xl overflow-hidden bg-[var(--surface)] hover:opacity-90 transition-opacity">
      <div className="relative h-28">
        {city.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={city.photo} alt={city.name} className="w-full h-full object-cover" loading="lazy" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        {/* Badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-[10px] font-mono text-[var(--accent-green)] font-bold">
          {badge}
        </div>
        {/* FIS score */}
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[var(--accent-green)]/20 text-[10px] font-mono text-[var(--accent-green)]">
          {city.scores.family}
        </div>
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-[10px] text-white/60">{countryCodeToFlag(city.countryCode)} {city.country}</p>
          <p className="text-sm font-bold text-white">{city.name}</p>
          <p className="text-[10px] text-white/50 font-mono">${city.cost.familyMonthly.toLocaleString()} / mo</p>
        </div>
      </div>
    </Link>
  )
}

function AvatarLink({ family }: { family: CrossPathFamily }) {
  const href = family.username ? `/${family.username}` : `/profile/${family.id}`
  const initials = family.family_name?.slice(0, 2).toUpperCase() || "??"
  return (
    <Link href={href} title={family.family_name} className="group">
      {family.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={family.avatar_url} alt={family.family_name} className="w-10 h-10 rounded-full object-cover border-2 border-[var(--border)] group-hover:border-[var(--accent-green)] transition-colors" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-[var(--surface-elevated)] border-2 border-[var(--border)] group-hover:border-[var(--accent-green)] flex items-center justify-center text-[10px] font-bold text-[var(--text-secondary)] transition-colors">
          {initials}
        </div>
      )}
    </Link>
  )
}
