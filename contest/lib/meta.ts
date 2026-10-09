import { getSettings, saveSettings, Settings } from "./db"

const VERSION = process.env.META_GRAPH_VERSION || "v25.0"
const BASE = `https://graph.facebook.com/${VERSION}`

export class MetaError extends Error {
  constructor(message: string, public code?: number, public subcode?: number) {
    super(message)
  }
}

type Params = Record<string, string | number | undefined>

export async function graph<T>(path: string, params: Params, token?: string): Promise<T> {
  const url = new URL(path.startsWith("http") ? path : `${BASE}/${path.replace(/^\//, "")}`)
  for (const [k, v] of Object.entries(params)) if (v !== undefined) url.searchParams.set(k, String(v))
  if (token) url.searchParams.set("access_token", token)
  const res = await fetch(url, { cache: "no-store" })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body.error) {
    const e = body.error ?? {}
    throw new MetaError(e.message ?? `Meta API error ${res.status}`, e.code, e.error_subcode)
  }
  return body as T
}

/** Follow `paging.next` links. Pagination URLs already carry the token. */
export async function graphPages<T>(
  path: string,
  params: Params,
  token: string,
  maxPages: number,
  deadline: number,
): Promise<T[]> {
  const out: T[] = []
  let page = await graph<{ data: T[]; paging?: { next?: string } }>(path, params, token)
  out.push(...page.data)
  for (let i = 1; i < maxPages && page.paging?.next && Date.now() < deadline; i++) {
    page = await graph(page.paging.next, {})
    out.push(...page.data)
  }
  return out
}

/**
 * Run a Meta call with the Page token (never expires), falling back to the
 * long-lived user token if Meta rejects the Page token for that endpoint.
 */
export async function withToken<T>(s: Settings, fn: (token: string) => Promise<T>): Promise<T> {
  const tokens = [s.page_token, s.user_token].filter(Boolean) as string[]
  if (tokens.length === 0) throw new MetaError("Instagram is not connected yet. Open Settings and connect it.")
  let lastError: unknown
  for (const token of tokens) {
    try {
      return await fn(token)
    } catch (e) {
      lastError = e
      // 190 = invalid/expired token, 10/200 = permission. Anything else: don't retry.
      if (!(e instanceof MetaError) || ![190, 10, 200].includes(e.code ?? 0)) throw e
    }
  }
  throw lastError
}

function requireAppKeys() {
  const id = process.env.META_APP_ID
  const secret = process.env.META_APP_SECRET
  if (!id || !secret) throw new MetaError("META_APP_ID and META_APP_SECRET must be set in Vercel")
  return { id, secret }
}

async function exchangeForLongLived(token: string) {
  const { id, secret } = requireAppKeys()
  return graph<{ access_token: string; expires_in?: number }>("oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: id,
    client_secret: secret,
    fb_exchange_token: token,
  })
}

function expiresAt(expiresIn?: number): string | null {
  // Meta sometimes omits expires_in; long-lived user tokens last about 60 days.
  return new Date(Date.now() + (expiresIn ?? 60 * 24 * 60 * 60) * 1000).toISOString()
}

type PageAccount = {
  id: string
  name: string
  access_token: string
  instagram_business_account?: { id: string; username?: string }
}

/**
 * Takes the short-lived token from the Graph API Explorer, swaps it for a
 * 60-day user token, then finds the Facebook Page linked to the Instagram
 * account and stores that Page's token (which does not expire).
 */
export async function connectInstagram(shortToken: string) {
  const long = await exchangeForLongLived(shortToken.trim())
  const pages = await graph<{ data: PageAccount[] }>(
    "me/accounts",
    { fields: "id,name,access_token,instagram_business_account{id,username}", limit: 100 },
    long.access_token,
  )
  const page = pages.data.find((p) => p.instagram_business_account)
  if (!page?.instagram_business_account) {
    throw new MetaError(
      "No Facebook Page with a linked Instagram professional account was found for this token. " +
        "Check that the Page is linked to your Instagram account and that you ticked the Page when granting access.",
    )
  }
  await saveSettings({
    user_token: long.access_token,
    user_token_expires_at: expiresAt(long.expires_in),
    page_id: page.id,
    page_token: page.access_token,
    ig_user_id: page.instagram_business_account.id,
    ig_username: page.instagram_business_account.username ?? null,
  })
  return { page: page.name, instagram: page.instagram_business_account.username }
}

/** Called by the hourly job: keep the user token fresh while it is still valid. */
export async function refreshUserTokenIfNeeded(): Promise<string | null> {
  const s = await getSettings()
  if (!s.user_token || !s.user_token_expires_at) return null
  const daysLeft = (new Date(s.user_token_expires_at).getTime() - Date.now()) / 86_400_000
  if (daysLeft > 20 || daysLeft <= 0) return null
  try {
    const fresh = await exchangeForLongLived(s.user_token)
    await saveSettings({ user_token: fresh.access_token, user_token_expires_at: expiresAt(fresh.expires_in) })
    return "user token refreshed"
  } catch (e) {
    return `user token refresh failed: ${(e as Error).message}`
  }
}
