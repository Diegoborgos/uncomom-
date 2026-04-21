import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { runIntelligenceUpdate } from "@/lib/intelligence-update"

/**
 * Nightly intelligence pipeline.
 * Reads family_events → updates family_intelligence for each family.
 * Trigger via cron or admin panel.
 */

export const maxDuration = 60

export async function GET(req: NextRequest) {
  return POST(req)
}

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
    if (user?.email && ["hello@uncomun.com", "diego@diegoborgo.com"].includes(user.email)) authorized = true
  }
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const result = await runIntelligenceUpdate(supabase)
  return NextResponse.json(result)
}
