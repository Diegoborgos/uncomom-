import { NextResponse } from "next/server"
import { connectInstagram } from "@/lib/meta"

export async function POST(req: Request) {
  const { token } = await req.json().catch(() => ({ token: "" }))
  if (typeof token !== "string" || token.trim().length < 20) {
    return NextResponse.json({ error: "Paste the access token from the Graph API Explorer" }, { status: 400 })
  }
  try {
    return NextResponse.json({ ok: true, ...(await connectInstagram(token)) })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }
}
