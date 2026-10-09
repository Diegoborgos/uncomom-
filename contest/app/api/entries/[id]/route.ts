import { NextResponse } from "next/server"
import { db, Status, STATUSES } from "@/lib/db"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}))
  const patch: { status?: Status; notes?: string | null; username?: string | null } = {}
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return NextResponse.json({ error: "Bad status" }, { status: 400 })
    patch.status = body.status
  }
  if (typeof body.notes === "string") patch.notes = body.notes.slice(0, 5000) || null
  if (typeof body.username === "string") patch.username = body.username.trim().replace(/^@/, "").slice(0, 100) || null
  const { error } = await db().from("contest_entries").update(patch).eq("id", params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
