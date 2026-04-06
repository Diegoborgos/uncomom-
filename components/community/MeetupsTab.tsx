"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { cities } from "@/data/cities"
import { countryCodeToFlag } from "@/lib/scores"
import { PaywallGate } from "@/components/Paywall"

type Meetup = {
  id: string
  host_family_id: string
  city_slug: string
  title: string
  description: string
  location: string
  event_date: string
  age_groups: string
  max_families: number
  created_at: string
  families?: { family_name: string; country_code: string } | null
  rsvp_count?: number
}

const selectClass = "w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"

export default function MeetupsTab({ selectedCity }: { selectedCity: string | null }) {
  const { family, isPaid, loading: authLoading } = useAuth()
  const [meetups, setMeetups] = useState<Meetup[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [cityFilter, setCityFilter] = useState(selectedCity || "")

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [ageGroups, setAgeGroups] = useState("All ages")
  const [formCity, setFormCity] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Sync selectedCity prop
  useEffect(() => {
    if (selectedCity) setCityFilter(selectedCity)
  }, [selectedCity])

  const fetchMeetups = async () => {
    const { data } = await supabase
      .from("meetups")
      .select("*, families(family_name, country_code)")
      .gte("event_date", new Date().toISOString())
      .order("event_date", { ascending: true })

    setMeetups((data as Meetup[]) || [])
    setLoading(false)
  }

  useEffect(() => { fetchMeetups() }, [])

  const handleRSVP = async (meetupId: string) => {
    if (!family) return
    await supabase.from("meetup_rsvps").insert({ meetup_id: meetupId, family_id: family.id })
    fetchMeetups()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!family || !formCity) return
    setSubmitting(true)

    await supabase.from("meetups").insert({
      host_family_id: family.id,
      city_slug: formCity,
      title,
      description,
      location,
      event_date: eventDate,
      age_groups: ageGroups,
    })

    setTitle("")
    setDescription("")
    setLocation("")
    setEventDate("")
    setFormCity("")
    setShowForm(false)
    setSubmitting(false)
    fetchMeetups()
  }

  const filtered = cityFilter
    ? meetups.filter((m) => m.city_slug === cityFilter)
    : meetups

  const getCityName = (slug: string) => {
    const city = cities.find((c) => c.slug === slug)
    return city ? `${countryCodeToFlag(city.countryCode)} ${city.name}` : slug
  }

  if (loading || authLoading) {
    return <p className="p-4 text-sm text-[var(--text-secondary)]">Loading meetups...</p>
  }

  if (!isPaid) {
    return (
      <div className="p-4 space-y-3">
        <p className="text-xs text-[var(--text-secondary)]">{filtered.length} upcoming meetups</p>
        {filtered.slice(0, 3).map((meetup) => (
          <div key={meetup.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            <h3 className="font-medium text-sm mb-1">{meetup.title}</h3>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--text-secondary)]">
              <span>{getCityName(meetup.city_slug)}</span>
              <span>
                {new Date(meetup.event_date).toLocaleDateString("en-US", {
                  weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                })}
              </span>
              <span>👶 {meetup.age_groups}</span>
            </div>
          </div>
        ))}
        <PaywallGate feature="See all meetups and RSVP" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 space-y-2 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className={selectClass}>
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>{countryCodeToFlag(c.countryCode)} {c.name}</option>
            ))}
          </select>
        </div>
        {family && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full text-sm py-2 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity"
          >
            {showForm ? "Cancel" : "+ Post a meetup"}
          </button>
        )}
      </div>

      {/* Inline form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 border-b border-[var(--border)] space-y-3">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Meetup title"
            className={selectClass}
          />
          <select required value={formCity} onChange={(e) => setFormCity(e.target.value)} className={selectClass}>
            <option value="">Select city</option>
            {cities.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
          <input
            type="datetime-local"
            required
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className={selectClass}
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (optional)"
            className={selectClass}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Description (optional)"
            className={`${selectClass} resize-none`}
          />
          <div className="flex items-center gap-2">
            <select value={ageGroups} onChange={(e) => setAgeGroups(e.target.value)} className={selectClass}>
              <option>All ages</option>
              <option>Under 5</option>
              <option>5-10</option>
              <option>Teens</option>
              <option>Parents only</option>
            </select>
            <button
              type="submit"
              disabled={submitting}
              className="shrink-0 px-4 py-2 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              No upcoming meetups{cityFilter ? " in this city" : ""}. Be the first to post one!
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filtered.map((meetup) => (
              <div key={meetup.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-sm">{meetup.title}</h3>
                  {family && (
                    <button
                      onClick={() => handleRSVP(meetup.id)}
                      className="shrink-0 text-xs px-2.5 py-1 rounded-lg bg-[rgb(var(--accent-green-rgb)/0.15)] text-[var(--accent-green)] hover:bg-[rgb(var(--accent-green-rgb)/0.25)] transition-colors"
                    >
                      RSVP
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--text-secondary)] mb-2">
                  <span>{getCityName(meetup.city_slug)}</span>
                  <span>
                    {new Date(meetup.event_date).toLocaleDateString("en-US", {
                      weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                    })}
                  </span>
                  {meetup.location && <span>📍 {meetup.location}</span>}
                  <span>👶 {meetup.age_groups}</span>
                </div>
                {meetup.description && (
                  <p className="text-xs text-[var(--text-secondary)] mb-1">{meetup.description}</p>
                )}
                <p className="text-[10px] text-[var(--text-secondary)]">
                  Hosted by {meetup.families?.family_name || "a family"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
