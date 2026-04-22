"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

const ADMIN_EMAILS = ["hello@uncomun.com", "diego@diegoborgo.com"]

type Row = {
  slug: string
  name: string
  country: string
  total: number
  live: number
  researched: number
  estimated: number
}

export default function ResearchIndexPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [rows, setRows] = useState<Row[]>([])
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<"estimated" | "researched" | "name">("estimated")

  useEffect(() => {
    if (!loading && (!user || !ADMIN_EMAILS.includes(user.email || ""))) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    (async () => {
      const { data: cities } = await supabase.from("cities").select("slug, name, country").order("name")
      const { data: sources } = await supabase.from("city_data_sources").select("city_slug, source_type")
      const agg: Record<string, { total: number; live: number; researched: number; estimated: number }> = {}
      for (const s of (sources as Array<{ city_slug: string; source_type: string }>) || []) {
        if (!agg[s.city_slug]) agg[s.city_slug] = { total: 0, live: 0, researched: 0, estimated: 0 }
        agg[s.city_slug].total++
        if (["public_api", "field_report", "admin_manual", "manual"].includes(s.source_type)) agg[s.city_slug].live++
        if (s.source_type === "researched") agg[s.city_slug].researched++
        if (["seed_estimate", "paid_api_ready", "estimated"].includes(s.source_type)) agg[s.city_slug].estimated++
      }
      const out: Row[] = ((cities as Array<{ slug: string; name: string; country: string }>) || []).map((c) => ({
        slug: c.slug, name: c.name, country: c.country,
        total: agg[c.slug]?.total ?? 0,
        live: agg[c.slug]?.live ?? 0,
        researched: agg[c.slug]?.researched ?? 0,
        estimated: agg[c.slug]?.estimated ?? 0,
      }))
      setRows(out)
    })()
  }, [])

  if (loading || !user || !ADMIN_EMAILS.includes(user.email || "")) return null

  const filtered = rows
    .filter((r) => !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.country.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name)
      if (sort === "researched") return b.researched - a.researched
      return b.estimated - a.estimated
    })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Research</h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Pick a city to research all its estimated signals with Claude.
          </p>
        </div>
        <Link href="/admin" className="text-xs text-[var(--accent-green)] hover:underline">&larr; Admin</Link>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search cities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs outline-none focus:border-[var(--accent-green)]"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs outline-none"
        >
          <option value="estimated">Most estimated first</option>
          <option value="researched">Most researched first</option>
          <option value="name">Name (A→Z)</option>
        </select>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        {filtered.map((r) => (
          <Link
            key={r.slug}
            href={`/admin/research/${r.slug}`}
            className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface-elevated)] transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{r.name}</p>
              <p className="text-[10px] text-[var(--text-secondary)]">{r.country}</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-[var(--accent-green)]">{r.live}L</span>
              <span className="text-[var(--text-secondary)]">{r.researched}R</span>
              <span className="text-[var(--accent-warm)]">{r.estimated}E</span>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-[var(--text-secondary)] py-8 text-center">No cities match.</p>
        )}
      </div>
    </div>
  )
}
