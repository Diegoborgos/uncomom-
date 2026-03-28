"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function SubmitCityPage() {
  const { user } = useAuth()
  const [cityName, setCityName] = useState("")
  const [country, setCountry] = useState("")
  const [whyFamily, setWhyFamily] = useState("")
  const [monthlyCost, setMonthlyCost] = useState("")
  const [schools, setSchools] = useState("")
  const [safety, setSafety] = useState("")
  const [submitterEmail, setSubmitterEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    await supabase.from("city_submissions").insert({
      city_name: cityName,
      country,
      why_family_friendly: whyFamily,
      estimated_monthly_cost: monthlyCost ? parseInt(monthlyCost) : null,
      school_notes: schools,
      safety_notes: safety,
      submitter_email: user?.email || submitterEmail,
      submitter_family_id: null,
    })

    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--accent-green)]/20 text-[var(--accent-green)] flex items-center justify-center text-2xl mx-auto mb-6">
          ✓
        </div>
        <h1 className="font-serif text-3xl font-bold mb-4">City submitted</h1>
        <p className="text-[var(--text-secondary)] mb-6">
          Thanks for suggesting <strong className="text-[var(--text-primary)]">{cityName}, {country}</strong>.
          We&apos;ll review it and add it to the directory if it fits.
        </p>
        <Link href="/" className="text-sm text-[var(--accent-green)] hover:underline">
          ← Back to cities
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="font-serif text-3xl font-bold mb-2">Submit a city</h1>
      <p className="text-[var(--text-secondary)] mb-8">
        Know a city that&apos;s great for families? Tell us about it and we&apos;ll
        research it for the directory.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">City name *</label>
            <input
              required value={cityName} onChange={(e) => setCityName(e.target.value)}
              placeholder="e.g. Merida"
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-green)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Country *</label>
            <input
              required value={country} onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. Mexico"
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-green)]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1">Why is it good for families? *</label>
          <textarea
            required value={whyFamily} onChange={(e) => setWhyFamily(e.target.value)} rows={3}
            placeholder="What makes this city family-friendly? Safety, community, schools, nature, cost..."
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-green)] resize-none"
          />
        </div>

        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1">Estimated monthly cost for a family of 4 (EUR)</label>
          <input
            type="number" value={monthlyCost} onChange={(e) => setMonthlyCost(e.target.value)}
            placeholder="e.g. 2500"
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-green)]"
          />
        </div>

        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1">School options you know about</label>
          <textarea
            value={schools} onChange={(e) => setSchools(e.target.value)} rows={2}
            placeholder="International schools, homeschool community, local school quality..."
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-green)] resize-none"
          />
        </div>

        <div>
          <label className="block text-xs text-[var(--text-secondary)] mb-1">Safety notes</label>
          <textarea
            value={safety} onChange={(e) => setSafety(e.target.value)} rows={2}
            placeholder="How safe did you feel with kids? Any areas to avoid?"
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-green)] resize-none"
          />
        </div>

        {!user && (
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Your email *</label>
            <input
              type="email" required value={submitterEmail} onChange={(e) => setSubmitterEmail(e.target.value)}
              placeholder="so we can follow up"
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent-green)]"
            />
          </div>
        )}

        <button
          type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading && <span className="w-4 h-4 border-2 border-[var(--bg)] border-t-transparent rounded-full animate-spin" />}
          {loading ? "Submitting..." : "Submit city"}
        </button>
      </form>
    </div>
  )
}
