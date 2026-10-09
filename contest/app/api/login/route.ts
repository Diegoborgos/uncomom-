import { NextResponse } from "next/server"
import { checkPassword, createSessionValue, SESSION_COOKIE, SESSION_DAYS } from "@/lib/session"

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }))
  if (!process.env.APP_PASSWORD) {
    return NextResponse.json({ error: "APP_PASSWORD is not set in Vercel yet" }, { status: 500 })
  }
  if (typeof password !== "string" || !checkPassword(password)) {
    // Slow down password guessing
    await new Promise((r) => setTimeout(r, 1000))
    return NextResponse.json({ error: "Wrong password" }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, await createSessionValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  })
  return res
}
