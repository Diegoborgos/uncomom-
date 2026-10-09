import { NextResponse } from "next/server"
import { BUCKET, db } from "@/lib/db"

export const dynamic = "force-dynamic"

// Files live in a private bucket. Logged-in users get a short-lived signed link.
export async function GET(_req: Request, { params }: { params: { path: string[] } }) {
  const path = params.path.map(decodeURIComponent).join("/")
  const { data, error } = await db().storage.from(BUCKET).createSignedUrl(path, 60 * 60)
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const res = NextResponse.redirect(data.signedUrl, 302)
  res.headers.set("Cache-Control", "private, max-age=3000")
  return res
}
