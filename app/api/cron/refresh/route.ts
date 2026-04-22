import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { runRefreshPublicData } from "@/lib/refresh-public-data"
import { finishCronRun, startCronRun } from "@/lib/cron-log"

export const maxDuration = 60

const ADMIN_EMAILS = ["hello@uncomun.com", "diego@diegoborgo.com"]
const ROUTE = "cron/refresh"

export async function GET(req: NextRequest) { return POST(req) }

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get("x-cron-secret")
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

  let authorized = cronSecret === process.env.CRON_SECRET || token === process.env.CRON_SECRET
  if (!authorized && token) {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user } } = await userClient.auth.getUser()
    if (user?.email && ADMIN_EMAILS.includes(user.email)) authorized = true
  }
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const startedAt = Date.now()
  const runId = await startCronRun(supabase, ROUTE)

  try {
    const summary = await runRefreshPublicData(supabase, { runAggregate: true })
    await finishCronRun(supabase, runId, startedAt, {
      ok: true,
      batch_offset: summary.batchOffset,
      cities_processed: summary.cities,
      signals_ok: summary.signals,
      signals_err: summary.errors,
      errors_by_city: Object.keys(summary.errorsByCity).length > 0 ? summary.errorsByCity : null,
    })
    return NextResponse.json({
      ok: true,
      cities: summary.cities,
      signals: summary.signals,
      errors: summary.errors,
      batchOffset: summary.batchOffset,
      processed: summary.processedSlugs,
      errorsByCity: summary.errorsByCity,
    })
  } catch (err) {
    const note = String(err)
    console.error(`[${ROUTE}] FAILED:`, note)
    await finishCronRun(supabase, runId, startedAt, { ok: false, note })
    return NextResponse.json({ ok: false, error: note }, { status: 500 })
  }
}
