"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

const ADMIN_EMAILS = ["hello@uncomun.com", "diego@diegoborgo.com"]

const EDITABLE_FIELDS = [
  { key: "cost_family_monthly", label: "Family monthly (EUR)", type: "number", group: "costs" },
  { key: "cost_rent_2br", label: "2br rent (EUR/mo)", type: "number", group: "costs" },
  { key: "cost_international_school", label: "Int'l school (EUR/mo)", type: "number", group: "costs" },
  { key: "cost_local_school", label: "Local school (EUR/mo)", type: "number", group: "costs" },
  { key: "cost_childcare", label: "Childcare (EUR/mo)", type: "number", group: "costs" },
  { key: "score_family", label: "Family score", type: "number", group: "scores" },
  { key: "score_child_safety", label: "Child safety", type: "number", group: "scores" },
  { key: "score_school_access", label: "School access", type: "number", group: "scores" },
  { key: "score_nature", label: "Nature", type: "number", group: "scores" },
  { key: "score_internet", label: "Internet", type: "number", group: "scores" },
  { key: "score_healthcare", label: "Healthcare", type: "number", group: "scores" },
  { key: "families_now", label: "Families now", type: "number", group: "meta" },
  { key: "families_been", label: "Families been", type: "number", group: "meta" },
  { key: "return_rate", label: "Return rate (%)", type: "number", group: "meta" },
  { key: "visa_friendly", label: "Visa friendly", type: "select", options: ["Excellent", "Good", "OK", "Difficult"], group: "meta" },
  { key: "homeschool_legal", label: "Homeschool", type: "select", options: ["Yes", "Yes (grey area)", "Restricted", "No"], group: "meta" },
  { key: "data_confidence", label: "Confidence", type: "number", group: "meta" },
]

type CityRow = Record<string, unknown>

export default function AdminCitiesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [cities, setCities] = useState<CityRow[]>([])
  const [selectedCity, setSelectedCity] = useState("")
  const [cityData, setCityData] = useState<CityRow | null>(null)
  const [edits, setEdits] = useState<Record<string, unknown>>({})
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [changelog, setChangelog] = useState<CityRow[]>([])
  const [citySearch, setCitySearch] = useState("")
  const [activeTab, setActiveTab] = useState<"editor" | "pipeline" | "changelog">("editor")

  useEffect(() => {
    if (!loading && (!user || !ADMIN_EMAILS.includes(user.email || ""))) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    supabase.from("cities").select("slug, name, country, data_confidence, pending_review, last_manual_update, signals_stale, field_report_count")
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

  const filteredCities = useMemo(() => {
    if (!citySearch) return cities
    const q = citySearch.toLowerCase()
    return cities.filter((c) =>
      (c.name as string).toLowerCase().includes(q) ||
      (c.country as string).toLowerCase().includes(q) ||
      (c.slug as string).toLowerCase().includes(q)
    )
  }, [cities, citySearch])

  const handleSave = async () => {
    if (!selectedCity || Object.keys(edits).length === 0 || !reason) return
    setSaving(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) { setSaving(false); return }

    const response = await fetch("/api/admin/update-city", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ slug: selectedCity, fields: edits, reason }),
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

  const runPipeline = async (endpoint: string, body?: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token || ""}`,
        "x-cron-secret": process.env.NEXT_PUBLIC_CRON_SECRET || "",
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    return res.json()
  }

  if (loading) return <div className="p-8 text-[var(--text-secondary)]">Loading...</div>
  if (!user || !ADMIN_EMAILS.includes(user.email || "")) return null

  const selectedCityName = cities.find((c) => c.slug === selectedCity)?.name as string || selectedCity

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold">Admin</h1>
          <p className="text-xs text-[var(--text-secondary)]">{cities.length} cities · {user.email}</p>
        </div>
        <Link href="/" className="text-xs text-[var(--accent-green)] hover:underline">&larr; Back to site</Link>
      </div>

      <div className="flex gap-6">
        {/* Sidebar — city list */}
        <div className="w-56 shrink-0">
          <input
            type="text"
            placeholder="Search cities..."
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
            className="w-full mb-2 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs outline-none focus:border-[var(--accent-green)] placeholder-[var(--text-secondary)]"
          />
          <div className="space-y-0.5 max-h-[calc(100vh-200px)] overflow-y-auto">
            {filteredCities.map((c) => (
              <button
                key={c.slug as string}
                onClick={() => { setSelectedCity(c.slug as string); setActiveTab("editor") }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                  selectedCity === c.slug
                    ? "bg-[var(--accent-green)] text-[var(--bg)]"
                    : "hover:bg-[var(--surface)] text-[var(--text-primary)]"
                }`}
              >
                <span className="truncate font-medium">{c.name as string}</span>
                <span className="flex items-center gap-1 shrink-0 ml-1">
                  {Boolean(c.signals_stale) && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-warm)]" title="Stale" />}
                  {Boolean(c.pending_review) && <span className="w-1.5 h-1.5 rounded-full bg-[var(--score-low)]" title="Pending review" />}
                  <span className="text-[10px] opacity-50">{c.data_confidence as number}%</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {!selectedCity ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center text-[var(--text-secondary)] text-sm">
              Select a city from the sidebar
            </div>
          ) : (
            <>
              {/* City header + tabs */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-serif text-xl font-bold">{selectedCityName}</h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {cityData?.country as string} · Confidence: {cityData?.data_confidence as number}%
                    {cityData?.field_report_count ? ` · ${cityData.field_report_count} reports` : ""}
                  </p>
                </div>
                <Link href={`/cities/${selectedCity}`} target="_blank" className="text-xs text-[var(--accent-green)] hover:underline">
                  View page &rarr;
                </Link>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-4 border-b border-[var(--border)]">
                {(["editor", "pipeline", "changelog"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                      activeTab === tab
                        ? "border-[var(--accent-green)] text-[var(--accent-green)]"
                        : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {tab === "editor" ? "Edit Data" : tab === "pipeline" ? "Pipeline" : "Changelog"}
                  </button>
                ))}
              </div>

              {/* Editor tab */}
              {activeTab === "editor" && cityData && (
                <div className="space-y-4">
                  {/* Scores */}
                  <FieldGroup title="Scores (0-100)">
                    {EDITABLE_FIELDS.filter((f) => f.group === "scores").map((field) => (
                      <FieldInput key={field.key} field={field} cityData={cityData} edits={edits} setEdits={setEdits} />
                    ))}
                  </FieldGroup>

                  {/* Costs */}
                  <FieldGroup title="Costs (EUR)">
                    {EDITABLE_FIELDS.filter((f) => f.group === "costs").map((field) => (
                      <FieldInput key={field.key} field={field} cityData={cityData} edits={edits} setEdits={setEdits} />
                    ))}
                  </FieldGroup>

                  {/* Meta */}
                  <FieldGroup title="Meta">
                    {EDITABLE_FIELDS.filter((f) => f.group === "meta").map((field) => (
                      <FieldInput key={field.key} field={field} cityData={cityData} edits={edits} setEdits={setEdits} />
                    ))}
                  </FieldGroup>

                  {/* Save bar */}
                  {Object.keys(edits).length > 0 && (
                    <div className="sticky bottom-4 rounded-xl border border-[var(--accent-warm)] bg-[var(--surface)] p-4 shadow-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-[var(--accent-warm)]">{Object.keys(edits).length} changed</span>
                        <input
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Reason for change (required)"
                          className="flex-1 px-3 py-2 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] text-xs outline-none focus:border-[var(--accent-green)]"
                        />
                        <button
                          onClick={handleSave}
                          disabled={saving || !reason}
                          className="px-5 py-2 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] font-medium text-xs hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {saving ? "Saving..." : saved ? "Saved ✓" : "Save"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pipeline tab */}
              {activeTab === "pipeline" && (
                <div className="space-y-3">
                  <PipelineButton
                    label="Fetch Google Places"
                    description={`~11 API calls (~$0.37) for ${selectedCityName}. 24h cooldown.`}
                    color="green"
                    onClick={async () => {
                      if (!confirm(`Fetch places for ${selectedCityName}? ~11 API calls (~$0.37)`)) return
                      const result = await runPipeline("/api/places/refresh", { citySlug: selectedCity })
                      alert(result.error || `${result.fetched || 0} places fetched, ${result.inserted || 0} saved`)
                    }}
                  />
                  <PipelineButton
                    label="Fetch Schools"
                    description={`~10 API calls (~$0.34) for ${selectedCityName}. 24h cooldown.`}
                    color="green"
                    onClick={async () => {
                      if (!confirm(`Fetch schools for ${selectedCityName}? ~10 API calls (~$0.34)`)) return
                      const result = await runPipeline("/api/schools/refresh", { citySlug: selectedCity })
                      alert(result.error || `${result.total || 0} schools found, ${result.inserted || 0} saved`)
                    }}
                  />
                  <PipelineButton
                    label="Run Field Report Aggregation"
                    description="Recalculate signals from member field reports. No API cost."
                    color="warm"
                    onClick={async () => {
                      const result = await runPipeline("/api/aggregate-signals")
                      alert(`Aggregated ${result.succeeded || 0} cities`)
                    }}
                  />
                  <PipelineButton
                    label="Refresh All Public Data"
                    description={`Open-Meteo + REST Countries + Teleport + AQICN for ${selectedCityName}. Free, no cost.`}
                    color="warm"
                    onClick={async () => {
                      const result = await runPipeline("/api/refresh-public-data", { citySlug: selectedCity })
                      alert(result.error || `Refreshed ${result.signals || 0} signals from ${Object.keys(result.results || {}).length} APIs for ${selectedCityName}`)
                    }}
                  />
                </div>
              )}

              {/* Changelog tab */}
              {activeTab === "changelog" && (
                <div className="space-y-2">
                  {changelog.length === 0 ? (
                    <p className="text-sm text-[var(--text-secondary)] py-8 text-center">No changes logged yet.</p>
                  ) : changelog.map((entry) => (
                    <div key={entry.id as string} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{entry.field_changed as string}</span>
                        <span className="text-[10px] text-[var(--text-secondary)]">
                          {new Date(entry.created_at as string).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {entry.old_value as string} &rarr; {entry.new_value as string}
                      </p>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                        {entry.change_reason as string} · {entry.changed_by as string}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-medium mb-3">{title}</p>
      <div className="grid grid-cols-3 gap-3">{children}</div>
    </div>
  )
}

function FieldInput({ field, cityData, edits, setEdits }: {
  field: { key: string; label: string; type: string; options?: string[] }
  cityData: Record<string, unknown>
  edits: Record<string, unknown>
  setEdits: (e: Record<string, unknown>) => void
}) {
  const currentValue = edits[field.key] !== undefined ? edits[field.key] : cityData[field.key]
  const isEdited = edits[field.key] !== undefined

  return (
    <div>
      <label className="block text-[10px] text-[var(--text-secondary)] mb-1">{field.label}</label>
      {field.type === "select" ? (
        <select
          value={currentValue as string}
          onChange={(e) => setEdits({ ...edits, [field.key]: e.target.value })}
          className={`w-full bg-[var(--surface-elevated)] border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-[var(--accent-green)] ${
            isEdited ? "border-[var(--accent-warm)]" : "border-[var(--border)]"
          }`}
        >
          {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type="number"
          value={currentValue as number}
          onChange={(e) => setEdits({ ...edits, [field.key]: parseFloat(e.target.value) })}
          className={`w-full bg-[var(--surface-elevated)] border rounded-lg px-2 py-1.5 text-xs font-mono outline-none focus:border-[var(--accent-green)] ${
            isEdited ? "border-[var(--accent-warm)]" : "border-[var(--border)]"
          }`}
        />
      )}
    </div>
  )
}

function PipelineButton({ label, description, color, onClick }: {
  label: string; description: string; color: "green" | "warm"; onClick: () => void
}) {
  const accent = color === "green" ? "var(--accent-green)" : "var(--accent-warm)"
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-[var(--accent-green)] transition-colors"
    >
      <p className="text-sm font-medium" style={{ color: accent }}>{label}</p>
      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{description}</p>
    </button>
  )
}
