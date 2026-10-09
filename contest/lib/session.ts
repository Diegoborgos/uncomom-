// Signed login cookie. Uses Web Crypto so it runs in middleware (edge) and routes.

export const SESSION_COOKIE = "contest_session"
export const SESSION_DAYS = 30

async function key(): Promise<CryptoKey> {
  // Changing APP_PASSWORD logs everyone out, because the key is derived from it.
  const secret = `${process.env.APP_PASSWORD ?? ""}|${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
}

async function sign(value: string): Promise<string> {
  const sig = await crypto.subtle.sign("HMAC", await key(), new TextEncoder().encode(value))
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("")
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function createSessionValue(): Promise<string> {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  return `${expires}.${await sign(`v1.${expires}`)}`
}

export async function isValidSession(value: string | undefined): Promise<boolean> {
  if (!value || !process.env.APP_PASSWORD) return false
  const [expires, sig] = value.split(".")
  if (!expires || !sig || Number(expires) < Date.now()) return false
  return safeEqual(sig, await sign(`v1.${expires}`))
}

export function checkPassword(input: string): boolean {
  const passwords = (process.env.APP_PASSWORD ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
  return passwords.some((p) => safeEqual(p, input))
}

export function isCronRequest(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return safeEqual(req.headers.get("authorization") ?? "", `Bearer ${secret}`)
}
