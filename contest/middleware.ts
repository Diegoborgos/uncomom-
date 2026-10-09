import { NextRequest, NextResponse } from "next/server"
import { isValidSession, SESSION_COOKIE } from "./lib/session"

export async function middleware(req: NextRequest) {
  if (await isValidSession(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next()
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 })
  }
  return NextResponse.redirect(new URL("/login", req.url))
}

export const config = {
  // Everything is private except the login page and the cron endpoint (which checks CRON_SECRET).
  matcher: ["/((?!login|api/login|api/cron|_next/static|_next/image|favicon.ico|icon.svg).*)"],
}
