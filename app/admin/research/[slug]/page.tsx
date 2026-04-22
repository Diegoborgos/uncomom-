"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { buildResearchPrompt, parseResearchResponse, ResearchResponse } from "@/lib/research-prompt"

const ADMIN_EMAILS = ["hello@uncomun.com", "diego@diegoborgo.com"]

type DataSourceRow = {
  signal_key: string
  signal_value: string
  source_type: string
  source_name: string
  source_url: string | null
  fetched_at: string
}

type CityRow = {
  slug: string
  name: string
  country: string
}

type CityCoverage = {
  slug: string
  name: string
  country: string
  total: number
  researched: number
  estimated: number
}

export default function ResearchCityPage() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug
  const router = useRouter()
  const { user, loading } = useAuth()

  const [cities, setCities] = useState<CityCoverage[]>([])
  const [city, setCity] = useState<CityRow | null>(null)
  const [rows, setRows] = useState<DataSourceRow[]>([])
  const [pastedJson, setPastedJson] = useState("")
  const [parsed, setParsed] = useState<ResearchResponse | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [skipSet, setSkipSet] = useState<Set<string>>(new Set())
  const [applying, setApplying] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!loading && (!user || !ADMIN_EMAILS.includes(user.email || ""))) {
      router.push("/")
    }
  }, [user, loading, router])

  // Load current city + signals
  useEffect(() => {
    if (!slug) return
    (async () => {
      const { data: c } = await supabase
        .from("cities").select("slug, name, country").eq("slug", slug).single()
      setCity(c as CityRow)
      const { data: ds } = await supabase
        .from("city_data_sources")
        .select("signal_key, signal_value, source_type, source_name, source_url, fetched_at")
        .eq("city_slug", slug)
        .order("signal_key")
      setRows((ds as DataSourceRow[]) || [])
    })()
  }, [slug])

  // Load coverage stats for the dropdown
  useEffect(() => {
    (async () => {
      const { data: allCities } = await supabase
        .from("cities").select("slug, name, country").order("name")
      const { data: allRows } = await supabase
        .from("city_data_sources").select("city_slug, source_type")
      const byCity: Record<string, { total: number; researched: number; estimated: number }> = {}
      for (const r of (allRows as Array<{ city_slug: string; source_type: string }>) || []) {
        if (!byCity[r.city_slug]) byCity[r.city_slug] = { total: 0, researched: 0, estimated: 0 }
        byCity[r.city_slug].total++
        if (r.source_type === "researched") byCity[r.city_slug].researched++
        if (r.source_type === "seed_estimate" || r.source_type === "paid_api_ready" || r.source_type === "estimated") {
          byCity[r.city_slug].estimated++
        }
      }
      const list: CityCoverage[] = ((allCities as CityRow[]) || []).map((c) => ({
        slug: c.slug, name: c.name, country: c.country,
        total: byCity[c.slug]?.total ?? 0,
        researched: byCity[c.slug]?.researched ?? 0,
        estimated: byCity[c.slug]?.estimated ?? 0,
      }))
      setCities(list)
    })()
  }, [])

  const estimatedKeys = useMemo(
    () => rows.filter((r) => r.source_type === "seed_estimate" || r.source_type === "paid_api_ready" || r.source_type === "estimated").map((r) => r.signal_key),
    [rows],
  )
  const researchedCount = rows.filter((r) => r.source_type === "researched").length

  const prompt = useMemo(() => {
    if (!city || estimatedKeys.length === 0) return ""
    return buildResearchPrompt({
      cityName: city.name,
      country: city.country,
      signalKeys: estimatedKeys,
    })
  }, [city, estimatedKeys])

  // Parse paste on change
  useEffect(() => {
    if (!pastedJson.trim()) {
      setParsed(null)
      setParseError(null)
      return
    }
    try {
      setParsed(parseResearchResponse(pastedJson))
      setParseError(null)
    } catch (err) {
      setParsed(null)
      setParseError(String((err as Error).message ?? err))
    }
  }, [pastedJson])

  const rowMap = useMemo(() => {
    const m: Record<string, DataSourceRow> = {}
    for (const r of rows) m[r.signal_key] = r
    return m
  }, [rows])

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const apply = async () => {
    if (!parsed || !city) return
    setApplying(true)
    setResult(null)
    const payload = {
      citySlug: city.slug,
      signals: Object.entries(parsed)
        .filter(([k, v]) => !skipSet.has(k) && v.value !== null && typeof v.source_url === "string")
        .map(([k, v]) => ({
          signal_key: k,
          value: v.value,
          source_url: v.source_url,
          source_name: v.source_name,
          source_date: v.source_date,
          confidence: v.confidence,
          notes: v.notes,
        })),
    }
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch("/api/admin/research/apply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token || ""}`,
      },
      body: JSON.stringify(payload),
    })
    const j = await res.json()
    setApplying(false)
    if (!res.ok) {
      setResult(`Error: ${j.error || "unknown"}`)
    } else {
      setResult(`Applied ${j.applied} · Failed ${j.failed}`)
      // Reload signals
      const { data: ds } = await supabase
        .from("city_data_sources")
        .select("signal_key, signal_value, source_type, source_name, source_url, fetched_at")
        .eq("city_slug", city.slug)
        .order("signal_key")
      setRows((ds as DataSourceRow[]) || [])
      setPastedJson("")
    }
  }

  if (loading) return <div className="p-8 text-[var(--text-secondary)]">Loading...</div>
  if (!user || !ADMIN_EMAILS.includes(user.email || "")) return null
  if (!city) return <div className="p-8 text-[var(--text-secondary)]">Loading city...</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Research · {city.name}</h1>
          <p className="text-xs text-[var(--text-secondary)]">
            {city.country} · {researchedCount} researched · {estimatedKeys.length} still estimated
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={slug}
            onChange={(e) => router.push(`/admin/research/${e.target.value}`)}
            className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs outline-none focus:border-[var(--accent-green)]"
          >
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name} · {c.researched}R/{c.estimated}E
              </option>
            ))}
          </select>
          <Link href="/admin" className="text-xs text-[var(--accent-green)] hover:underline">&larr; Admin</Link>
        </div>
      </div>

      {/* Step 1 — prompt */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-medium">Step 1 · Copy prompt</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Paste into Claude.ai (web-enabled). Covers {estimatedKeys.length} estimated signals.
            </p>
          </div>
          <button
            onClick={copyPrompt}
            disabled={estimatedKeys.length === 0}
            className="px-4 py-2 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] font-medium text-xs hover:opacity-90 disabled:opacity-50"
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
        {estimatedKeys.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] py-6 text-center">
            Nothing estimated for this city — every signal is already live or researched. 🎉
          </p>
        ) : (
          <textarea
            readOnly
            value={prompt}
            rows={10}
            className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-3 text-xs font-mono text-[var(--text-primary)] outline-none resize-none"
          />
        )}
      </section>

      {/* Step 2 — paste response */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
        <div>
          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-medium">Step 2 · Paste Claude&apos;s JSON response</p>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Paste the full JSON output below. Malformed JSON will show a parse error; fix it and re-paste.
          </p>
        </div>
        <textarea
          value={pastedJson}
          onChange={(e) => setPastedJson(e.target.value)}
          placeholder='{\n  "childSafety.streetCrime": { "value": 82, "source_url": "https://...", ... }\n}'
          rows={8}
          className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-3 text-xs font-mono text-[var(--text-primary)] outline-none resize-y focus:border-[var(--accent-green)]"
        />
        {parseError && (
          <p className="text-xs text-[var(--score-low)]">{parseError}</p>
        )}
      </section>

      {/* Step 3 — diff + apply */}
      {parsed && Object.keys(parsed).length > 0 && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-medium">Step 3 · Review and apply</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Uncheck any row you don&apos;t trust. Null values are auto-skipped.
              </p>
            </div>
            <button
              onClick={apply}
              disabled={applying}
              className="px-5 py-2 rounded-lg bg-[var(--accent-green)] text-[var(--bg)] font-medium text-xs hover:opacity-90 disabled:opacity-50"
            >
              {applying ? "Applying..." : "Apply"}
            </button>
          </div>
          {result && (
            <p className="text-xs text-[var(--accent-green)]">{result}</p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border)]">
                  <th className="py-2 pr-3 font-medium w-8"></th>
                  <th className="py-2 pr-3 font-medium">Signal</th>
                  <th className="py-2 pr-3 font-medium">Current</th>
                  <th className="py-2 pr-3 font-medium">Incoming</th>
                  <th className="py-2 pr-3 font-medium">Source</th>
                  <th className="py-2 pr-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(parsed).map(([key, incoming]) => {
                  const current = rowMap[key]?.signal_value ?? "—"
                  const isNull = incoming.value === null
                  const unchanged = !isNull && String(incoming.value) === current
                  const skipped = skipSet.has(key)
                  const bg = isNull
                    ? "bg-[rgb(var(--score-low-rgb,255,64,64)/0.08)]"
                    : unchanged
                      ? "bg-transparent"
                      : "bg-[rgb(var(--accent-green-rgb)/0.08)]"
                  return (
                    <tr key={key} className={`border-b border-[var(--border)] ${bg} ${skipped ? "opacity-40" : ""}`}>
                      <td className="py-2 pr-3">
                        <input
                          type="checkbox"
                          checked={!skipped && !isNull}
                          disabled={isNull}
                          onChange={(e) => {
                            const next = new Set(skipSet)
                            if (e.target.checked) next.delete(key); else next.add(key)
                            setSkipSet(next)
                          }}
                        />
                      </td>
                      <td className="py-2 pr-3 font-mono text-[10px]">{key}</td>
                      <td className="py-2 pr-3 text-[var(--text-secondary)]">{current}</td>
                      <td className="py-2 pr-3 font-medium">
                        {isNull ? <span className="text-[var(--score-low)]">null</span> : String(incoming.value)}
                      </td>
                      <td className="py-2 pr-3 max-w-[180px]">
                        {incoming.source_url ? (
                          <a
                            href={incoming.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[var(--accent-green)] hover:underline truncate block"
                            title={incoming.source_url}
                          >
                            {incoming.source_name}
                          </a>
                        ) : (
                          <span className="text-[var(--text-secondary)]">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-[var(--text-secondary)] max-w-[240px] truncate" title={incoming.notes}>
                        {incoming.notes || "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
