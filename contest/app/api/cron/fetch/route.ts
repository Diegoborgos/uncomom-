import { NextResponse } from "next/server"
import { collect } from "@/lib/collect"
import { isCronRequest } from "@/lib/session"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// Called every hour by Supabase pg_cron (and once a day by Vercel Cron as a backup).
export async function GET(req: Request) {
  if (!isCronRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json(await collect())
}
