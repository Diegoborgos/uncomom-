import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { runIntelligenceUpdate } from "@/lib/intelligence-update"
import { finishCronRun, startCronRun } from "@/lib/cron-log"

export const maxDuration = 60

const ADMIN_EMAILS = ["hello@uncomun.com", "diego@diegoborgo.com"]
const ROUTE = "cron/intelligence"

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
  const isMonday = new Date().getUTCDay() === 1

  try {
    const update = await runIntelligenceUpdate(supabase)

    // On Mondays, also kick off engine + briefing via internal fetch.
    // These each run in their own function invocation so they get their own
    // 60s budget (separate from this wrapper's budget). We fire them without
    // awaiting full completion — errors will show up in their own logs.
    let engineTriggered = false
    let briefingTriggered = false
    if (isMonday) {
      const origin = req.nextUrl.origin
      const secret = process.env.CRON_SECRET || ""
      const headers = { "x-cron-secret": secret, "Content-Type": "application/json" }
      const engineP = fetch(`${origin}/api/intelligence/engine`, { method: "POST", headers })
        .then((r) => { engineTriggered = r.ok; return r.text() })
        .catch((e) => { console.error("[cron/intelligence] engine trigger failed:", String(e)) })
      const briefingP = fetch(`${origin}/api/intelligence/briefing`, { method: "POST", headers })
        .then((r) => { briefingTriggered = r.ok; return r.text() })
        .catch((e) => { console.error("[cron/intelligence] briefing trigger failed:", String(e)) })
      // Wait at most 5s for them to start; don't block on completion.
      await Promise.race([
        Promise.all([engineP, briefingP]),
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ])
    }

    await finishCronRun(supabase, runId, startedAt, {
      ok: true,
      cities_processed: update.processed,
      note: isMonday
        ? `families=${update.processed}/${update.total}; engine_triggered=${engineTriggered}; briefing_triggered=${briefingTriggered}`
        : `families=${update.processed}/${update.total}`,
    })
    return NextResponse.json({
      ok: true,
      processed: update.processed,
      total: update.total,
      isMonday,
      engineTriggered,
      briefingTriggered,
    })
  } catch (err) {
    const note = String(err)
    console.error(`[${ROUTE}] FAILED:`, note)
    await finishCronRun(supabase, runId, startedAt, { ok: false, note })
    return NextResponse.json({ ok: false, error: note }, { status: 500 })
  }
}
