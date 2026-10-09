import { db, Entry, Status, STATUSES } from "@/lib/db"

export const dynamic = "force-dynamic"

function cell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v)
  // Quote everything; neutralise spreadsheet formulas
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
  return `"${safe.replace(/"/g, '""')}"`
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const wanted = (url.searchParams.get("status") || "winner,shortlisted")
    .split(",")
    .filter((s): s is Status => STATUSES.includes(s as Status))

  const { data, error } = await db()
    .from("contest_entries")
    .select("*")
    .in("status", wanted)
    .order("status", { ascending: false })
    .order("posted_at", { ascending: false })
  if (error) return new Response(error.message, { status: 500 })

  const header = ["status", "username", "profile_link", "post_link", "posted_at", "likes", "comments", "hashtags", "caption", "notes", "media_id", "found_via"]
  const lines = (data as Entry[]).map((e) =>
    [
      e.status,
      e.username,
      e.username ? `https://www.instagram.com/${e.username}/` : "",
      e.permalink,
      e.posted_at,
      e.like_count,
      e.comments_count,
      e.hashtags.map((t) => `#${t}`).join(" "),
      e.caption,
      e.notes,
      e.id,
      e.sources.join(" "),
    ]
      .map(cell)
      .join(","),
  )
  const csv = "﻿" + [header.map(cell).join(","), ...lines].join("\r\n")
  const date = new Date().toISOString().slice(0, 10)
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="contest-${wanted.join("-")}-${date}.csv"`,
    },
  })
}
