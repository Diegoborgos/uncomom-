import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const maxDuration = 30

const ADMIN_EMAILS = ["hello@uncomun.com", "diego@diegoborgo.com"]

type IncomingSignal = {
  signal_key: string
  value: number | string | boolean | null
  source_url: string
  source_name: string
  source_date?: string
  confidence?: number
  notes?: string
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

  // Admin-only. Admin bearer token path (same as /api/cron/*).
  let adminEmail: string | null = null
  if (token) {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user } } = await userClient.auth.getUser()
    if (user?.email && ADMIN_EMAILS.includes(user.email)) {
      adminEmail = user.email
    }
  }
  if (!adminEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const citySlug: string | undefined = body.citySlug
  const signals: IncomingSignal[] | undefined = body.signals

  if (!citySlug || !Array.isArray(signals) || signals.length === 0) {
    return NextResponse.json({ error: "Missing citySlug or signals[]" }, { status: 400 })
  }

  // Load the city's current signals so we know which keys are real.
  const { data: city } = await supabase
    .from("cities")
    .select("slug, signals")
    .eq("slug", citySlug)
    .single()
  if (!city) return NextResponse.json({ error: "City not found" }, { status: 404 })

  const currentSignals = (city.signals ?? {}) as Record<string, Record<string, unknown>>

  const results: Array<{ signal_key: string; ok: boolean; error?: string }> = []
  const nowIso = new Date().toISOString()
  const validUntilIso = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

  for (const s of signals) {
    if (typeof s.signal_key !== "string") {
      results.push({ signal_key: String(s.signal_key), ok: false, error: "Invalid signal_key" })
      continue
    }
    if (s.value === null || s.value === undefined) {
      // Skip nulls — these are cases where Claude couldn't find a source.
      results.push({ signal_key: s.signal_key, ok: false, error: "Skipped (null value)" })
      continue
    }
    if (typeof s.source_url !== "string" || !s.source_url.startsWith("http")) {
      results.push({ signal_key: s.signal_key, ok: false, error: "Missing/invalid source_url" })
      continue
    }

    const [section, field] = s.signal_key.split(".")
    if (!section || !field) {
      results.push({ signal_key: s.signal_key, ok: false, error: "Bad signal key shape" })
      continue
    }

    const oldValue = currentSignals[section]?.[field]
    const newValue = s.value

    // Upsert provenance row
    const confidence = typeof s.confidence === "number"
      ? Math.min(100, Math.max(0, Math.round(s.confidence)))
      : 70

    const { error: upsertErr } = await supabase
      .from("city_data_sources")
      .upsert({
        city_slug: citySlug,
        signal_key: s.signal_key,
        signal_value: String(newValue),
        source_name: s.source_name || "Web research",
        source_url: s.source_url,
        source_type: "researched",
        fetched_at: nowIso,
        valid_until: validUntilIso,
        confidence,
        notes: s.notes ?? (s.source_date ? `Source date: ${s.source_date}` : null),
      }, { onConflict: "city_slug,signal_key", ignoreDuplicates: false })

    if (upsertErr) {
      results.push({ signal_key: s.signal_key, ok: false, error: upsertErr.message })
      continue
    }

    // Update the city.signals JSONB leaf so FIS recalculates
    const nextSignals = { ...currentSignals }
    nextSignals[section] = { ...(nextSignals[section] ?? {}), [field]: newValue }
    currentSignals[section] = nextSignals[section]

    // Changelog
    await supabase.from("city_data_changelog").insert({
      city_slug: citySlug,
      field_changed: s.signal_key,
      old_value: oldValue !== undefined ? JSON.stringify(oldValue) : null,
      new_value: JSON.stringify(newValue),
      change_source: "researched",
      changed_by: adminEmail,
      change_reason: `Applied research batch — ${s.source_name || "Web research"}`,
    })

    results.push({ signal_key: s.signal_key, ok: true })
  }

  // Persist the rebuilt cities.signals object once at the end.
  await supabase
    .from("cities")
    .update({
      signals: currentSignals,
      last_manual_update: nowIso,
      updated_at: nowIso,
    })
    .eq("slug", citySlug)

  const applied = results.filter((r) => r.ok).length
  const failed = results.filter((r) => !r.ok).length

  return NextResponse.json({
    ok: true,
    citySlug,
    applied,
    failed,
    results,
  })
}
