import { NextResponse } from "next/server"
import { getSettings, saveSettings } from "@/lib/db"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const current = await getSettings()
  const hashtag =
    typeof body.hashtag === "string" ? body.hashtag.trim().replace(/^#/, "").toLowerCase() || null : current.hashtag
  // Letters (any language), numbers and _ only: no spaces or ASCII punctuation
  if (hashtag && !/^[^\s!-/:-@[-^`{-~]+$/.test(hashtag)) {
    return NextResponse.json({ error: "Hashtags can only contain letters, numbers and _" }, { status: 400 })
  }
  const contestStart =
    typeof body.contest_start === "string" && body.contest_start
      ? new Date(body.contest_start).toISOString()
      : body.contest_start === ""
        ? null
        : current.contest_start
  await saveSettings({
    hashtag,
    contest_start: contestStart,
    // New hashtag → look its ID up again on the next fetch
    hashtag_id: hashtag === current.hashtag ? current.hashtag_id : null,
  })
  return NextResponse.json({ ok: true })
}
