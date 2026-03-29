"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const ADMIN_EMAILS = ["hello@uncomun.com", "diego@diegoborgo.com"]

const EDITABLE_FIELDS = [
  { key: "cost_family_monthly", label: "Family monthly total (EUR)", type: "number" },
  { key: "cost_rent_2br", label: "2br rent (EUR/mo)", type: "number" },
  { key: "cost_international_school", label: "International school (EUR/mo)", type: "number" },
  { key: "cost_local_school", label: "Local school (EUR/mo)", type: "number" },
  { key: "cost_childcare", label: "Childcare (EUR/mo)", type: "number" },
  { key: "score_family", label: "Family score (0-100)", type: "number" },
  { key: "score_child_safety", label: "Child safety (0-100)", type: "number" },
  { key: "score_school_access", label: "School access (0-100)", type: "number" },
  { key: "score_nature", label: "Nature (0-100)", type: "number" },
  { key: "score_internet", label: "Internet (0-100)", type: "number" },
  { key: "score_healthcare", label: "Healthcare (0-100)", type: "number" },
  { key: "families_now", label: "Families here now", type: "number" },
  { key: "families_been", label: "Families been here", type: "number" },
  { key: "return_rate", label: "Return rate (%)", type: "number" },
  { key: "visa_friendly", label: "Visa friendly", type: "select", options: ["Excellent", "Good", "OK", "Difficult"] },
  { key: "homeschool_legal", label: "Homeschool legal", type: "select", options: ["Yes", "Yes (grey area)", "Restricted", "No"] },
  { key: "data_confidence", label: "Data confidence (0-100)", type: "number" },
]

export default function AdminCitiesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [cities, setCities] = useState<Record<string, unknown>[]>([])
  const [selectedCity, setSelectedCity] = useState("")
  const [cityData, setCityData] = useState<Record<string, unknown> | null>(null)
  const [edits, setEdits] = useState<Record<string, unknown>>({})
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [changelog, setChangelog] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    if (!loading && (!user || !ADMIN_EMAILS.includes(user.email || ""))) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    supabase.from("cities").select("slug, name, country, data_confidence, pending_review, last_manual_update")
      .order("name")
      .then(({ data }) => setCities(data || []))
  }, [])

  useEffect(() => {
    if (!selectedCity) return
    supabase.from("cities").select("*").eq("slug", selectedCity).single()
      .then(({ data }) => { setCityData(data); setEdits({}) })
    supabase.from("city_data_changelog")
      .select("*").eq("city_slug", selectedCity)
      .order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setChangelog(data || []))
  }, [selectedCity])

  const handleSave = async () => {
    if (!selectedCity || Object.keys(edits).length === 0 || !reason) return
    setSaving(true)

    const response = await fetch("/api/admin/update-city", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: selectedCity, fields: edits, reason, changedBy: user?.email }),
    })

    const result = await response.json()
    if (result.success) {
      setSaved(true)
      setEdits({})
      setReason("")
      setTimeout(() => setSaved(false), 3000)
      supabase.from("cities").select("*").eq("slug", selectedCity).single()
        .then(({ data }) => setCityData(data))
      supabase.from("city_data_changelog")
        .select("*").eq("city_slug", selectedCity)
        .order("created_at", { ascending: false }).limit(20)
        .then(({ data }) => setChangelog(data || []))
    }
    setSaving(false)
  }

  if (loading) return <div className="p-8 text-[var(--text-secondary)]">Loading...</div>
  if (!user || !ADMIN_EMAILS.includes(user.email || "")) return null

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-bold mb-2">City Data Editor</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-8">
        Edit city data directly. All changes are logged with reason and timestamp. No code deploy required.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* City list */}
        <div className="col-span-1">
          <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-3 uppercase tracking-wider">Select city</h2>
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {cities.map((c) => (
              <button
                key={c.slug as string}
                onClick={() => setSelectedCity(c.slug as string)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  selectedCity === c.slug ? "bg-[var(--accent-green)] text-[var(--bg)]" : "hover:bg-[var(--surface)] text-[var(--text-primary)]"
                }`}
              >
                <span className="font-medium">{c.name as string}</span>
                <span className="text-xs ml-1 opacity-70">{c.country as string}</span>
                {Boolean(c.pending_review) && (
                  <span className="ml-2 text-[10px] bg-[var(--accent-warm)]/20 text-[var(--accent-warm)] px-1.5 py-0.5 rounded-full">review</span>
                )}
                <div className="text-[10px] opacity-60 mt-0.5">Confidence: {c.data_confidence as number}%</div>
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="col-span-2">
          {!selectedCity && (
            <div className="rounded-xl border border-[var(--border)] p-8 text-center text-[var(--text-secondary)]">Select a city to edit</div>
          )}

          {selectedCity && cityData && (
            <div className="space-y-6">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <h2 className="font-serif text-xl font-bold mb-4">{cityData.name as string}, {cityData.country as string}</h2>
                <div className="grid grid-cols-2 gap-4">
                  {EDITABLE_FIELDS.map((field) => {
                    const currentValue = edits[field.key] !== undefined ? edits[field.key] : cityData[field.key]
                    return (
                      <div key={field.key}>
                        <label className="block text-xs text-[var(--text-secondary)] mb-1">{field.label}</label>
                        {field.type === "select" ? (
                          <select
                            value={currentValue as string}
                            onChange={(e) => setEdits({ ...edits, [field.key]: e.target.value })}
                            className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent-green)]"
                          >
                            {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input
                            type="number"
                            value={currentValue as number}
                            onChange={(e) => setEdits({ ...edits, [field.key]: parseFloat(e.target.value) })}
                            className={`w-full bg-[var(--surface-elevated)] border rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent-green)] ${
                              edits[field.key] !== undefined ? "border-[var(--accent-warm)]" : "border-[var(--border)]"
                            }`}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>

                {Object.keys(edits).length > 0 && (
                  <div className="mt-6 pt-6 border-t border-[var(--border)]">
                    <p className="text-sm font-medium mb-2">{Object.keys(edits).length} field{Object.keys(edits).length > 1 ? "s" : ""} changed</p>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Reason for change (required)"
                      rows={2}
                      className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent-green)] resize-none mb-3"
                    />
                    <button
                      onClick={handleSave}
                      disabled={saving || !reason}
                      className="px-6 py-2.5 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {saving ? "Saving..." : saved ? "Saved" : "Save changes"}
                    </button>
                  </div>
                )}
              </div>

              {changelog.length > 0 && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
                  <h3 className="font-medium text-sm mb-4">Change history</h3>
                  <div className="space-y-3">
                    {changelog.map((entry) => (
                      <div key={entry.id as string} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{entry.field_changed as string}</span>
                          <span className="text-[var(--text-secondary)]">{entry.old_value as string} &rarr; {entry.new_value as string}</span>
                        </div>
                        <p className="text-[var(--text-secondary)] mt-0.5">
                          {entry.change_reason as string} &middot; {entry.changed_by as string} &middot;{" "}
                          {new Date(entry.created_at as string).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
