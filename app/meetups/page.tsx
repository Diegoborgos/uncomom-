"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { cities } from "@/data/cities"
import { countryCodeToFlag } from "@/lib/scores"
import Paywall from "@/components/Paywall"

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

export default function MeetupsPage() {
  const { isPaid } = useAuth()

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-bold mb-2">Family Meetups</h1>
        <p className="text-[var(--text-secondary)]">
          Meet other traveling families in person. Post a meetup or RSVP to one near you.
        </p>
      </div>

      {isPaid ? <MeetupsContent /> : (
        <Paywall feature="Meetups are for members" preview={<MeetupsPreview />}>
          <MeetupsContent />
        </Paywall>
      )}
    </div>
  )
}

function MeetupsPreview() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-2">
          <div className="h-5 w-48 bg-[var(--surface-elevated)] rounded" />
          <div className="h-3 w-32 bg-[var(--surface-elevated)] rounded" />
          <div className="h-3 w-64 bg-[var(--surface-elevated)] rounded" />
        </div>
      ))}
    </div>
  )
}

function MeetupsContent() {
  const { family } = useAuth()
  const [meetups, setMeetups] = useState<Meetup[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [cityFilter, setCityFilter] = useState("")

  // Form
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [ageGroups, setAgeGroups] = useState("All ages")
  const [formCity, setFormCity] = useState("")
  const [submitting, setSubmitting] = useState(false)

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

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>{countryCodeToFlag(c.countryCode)} {c.name}</option>
          ))}
        </select>
        {family && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="ml-auto text-sm px-4 py-2 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity"
          >
            {showForm ? "Cancel" : "+ Post a meetup"}
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Title</label>
              <input
                required value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Coffee & playground at Parque das Nações"
                className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">City</label>
              <select
                required value={formCity} onChange={(e) => setFormCity(e.target.value)}
                className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
              >
                <option value="">Select city</option>
                {cities.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Date & time</label>
              <input
                type="datetime-local" required value={eventDate} onChange={(e) => setEventDate(e.target.value)}
                className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Location</label>
              <input
                value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="Café name, park, address..."
                className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Description</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              placeholder="What's the plan? Any age groups welcome?"
              className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)] resize-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={ageGroups} onChange={(e) => setAgeGroups(e.target.value)}
              className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-green)]"
            >
              <option>All ages</option>
              <option>Under 5</option>
              <option>5-10</option>
              <option>Teens</option>
              <option>Parents only</option>
            </select>
            <button
              type="submit" disabled={submitting}
              className="ml-auto px-4 py-2 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Post meetup"}
            </button>
          </div>
        </form>
      )}

      {/* Meetup list */}
      {loading ? (
        <p className="text-[var(--text-secondary)] py-10 text-center">Loading meetups...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center">
          <p className="text-[var(--text-secondary)] mb-2">No upcoming meetups{cityFilter ? " in this city" : ""}.</p>
          <p className="text-sm text-[var(--text-secondary)]">Be the first to post one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((meetup) => (
            <div key={meetup.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-medium mb-1">{meetup.title}</h3>
                  <div className="flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
                    <span>{getCityName(meetup.city_slug)}</span>
                    <span>{new Date(meetup.event_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                    {meetup.location && <span>📍 {meetup.location}</span>}
                    <span>👶 {meetup.age_groups}</span>
                  </div>
                </div>
                {family && (
                  <button
                    onClick={() => handleRSVP(meetup.id)}
                    className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-[rgb(var(--accent-green-rgb)/0.15)] text-[var(--accent-green)] hover:bg-[rgb(var(--accent-green-rgb)/0.25)] transition-colors"
                  >
                    RSVP
                  </button>
                )}
              </div>
              {meetup.description && (
                <p className="text-sm text-[var(--text-secondary)]">{meetup.description}</p>
              )}
              <p className="text-xs text-[var(--text-secondary)] mt-2">
                Hosted by {meetup.families?.family_name || "a family"}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
