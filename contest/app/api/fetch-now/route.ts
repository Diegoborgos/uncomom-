import { NextResponse } from "next/server"
import { collect } from "@/lib/collect"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// "Fetch now" button. Protected by the login middleware.
export async function POST() {
  try {
    return NextResponse.json(await collect())
  } catch (e) {
    return NextResponse.json({ ok: false, notes: [(e as Error).message] }, { status: 500 })
  }
}
