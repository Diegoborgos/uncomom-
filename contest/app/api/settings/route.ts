import { NextResponse } from "next/server"
import { getSettings, saveSettings } from "@/lib/db"

const MAX_HASHTAGS = 10

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const current = await getSettings()

  let hashtags = current.hashtags
  if (typeof body.hashtags === "string") {
    // "#one, #two three" → ["one", "two", "three"]
    hashtags = Array.from(
      new Set(
        body.hashtags
          .split(/[\s,]+/)
          .map((t: string) => t.replace(/^#/, "").toLowerCase())
          .filter(Boolean),
      ),
    )
    // Letters (any language), numbers and _ only: no spaces or ASCII punctuation
    const bad = hashtags.find((t) => !/^[^\s!-/:-@[-^`{-~]+$/.test(t))
    if (bad) {
      return NextResponse.json({ error: `#${bad}: hashtags can only contain letters, numbers and _` }, { status: 400 })
    }
    if (hashtags.length > MAX_HASHTAGS) {
      return NextResponse.json({ error: `Use at most ${MAX_HASHTAGS} hashtags` }, { status: 400 })
    }
  }

  const contestStart =
    typeof body.contest_start === "string" && body.contest_start
      ? new Date(body.contest_start).toISOString()
      : body.contest_start === ""
        ? null
        : current.contest_start

  await saveSettings({
    hashtags,
    contest_start: contestStart,
    // Keep IDs Instagram already gave us, so re-saving doesn't use up hashtag lookups
    hashtag_ids: Object.fromEntries(Object.entries(current.hashtag_ids).filter(([t]) => hashtags.includes(t))),
  })
  return NextResponse.json({ ok: true })
}
