"use client"

import Link from "next/link"
import { useState } from "react"

type Run = {
  id: number
  started_at: string
  finished_at: string | null
  ok: boolean | null
  found: number | null
  new_entries: number | null
  downloaded: number | null
  note: string | null
}

function toLocalInput(iso: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default function SettingsForm(props: {
  hashtags: string[]
  contestStart: string | null
  igUsername: string | null
  connected: boolean
  hasPageToken: boolean
  userTokenExpiresAt: string | null
  runs: Run[]
}) {
  const [hashtags, setHashtags] = useState(props.hashtags.map((t) => `#${t}`).join(" "))
  const [start, setStart] = useState(toLocalInput(props.contestStart))
  const [token, setToken] = useState("")
  const [msg, setMsg] = useState("")
  const [connectMsg, setConnectMsg] = useState("")
  const [busy, setBusy] = useState(false)

  async function saveContest(e: React.FormEvent) {
    e.preventDefault()
    const added = hashtags
      .split(/[\s,]+/)
      .map((t) => t.replace(/^#/, "").toLowerCase())
      .filter((t) => t && !props.hashtags.includes(t))
    if (
      added.length &&
      props.hashtags.length &&
      !confirm(`Each new hashtag uses one of your 30 hashtag lookups for this week (adding: #${added.join(", #")}). Continue?`)
    )
      return
    setBusy(true)
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hashtags, contest_start: start ? new Date(start).toISOString() : "" }),
    })
    setBusy(false)
    setMsg(res.ok ? "Saved." : (await res.json().catch(() => ({}))).error ?? "Could not save")
  }

  async function connect(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setConnectMsg("Connecting…")
    const res = await fetch("/api/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (res.ok) {
      setToken("")
      setConnectMsg(`Connected to @${data.instagram} (via Facebook Page "${data.page}"). Reloading…`)
      setTimeout(() => window.location.reload(), 1500)
    } else {
      setConnectMsg(data.error ?? "Could not connect")
    }
  }

  const daysLeft = props.userTokenExpiresAt
    ? Math.round((new Date(props.userTokenExpiresAt).getTime() - Date.now()) / 86_400_000)
    : null

  const input = "w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2.5 text-base dark:border-neutral-700"
  const card = "space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10"

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 pb-16 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <Link href="/" className="rounded-lg bg-neutral-200 px-3 py-2 text-sm dark:bg-neutral-800">
          ← Gallery
        </Link>
      </div>

      <form onSubmit={saveContest} className={card}>
        <h2 className="font-semibold">Contest</h2>
        <label className="block space-y-1">
          <span className="text-sm">Hashtags (separate with spaces)</span>
          <input
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="#mycontest2026 #mybrand"
            autoCapitalize="none"
            autoCorrect="off"
            className={input}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm">Contest start (posts from before this are ignored)</span>
          <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className={input} />
        </label>
        <div className="flex items-center gap-3">
          <button disabled={busy} className="rounded-lg bg-pink-600 px-4 py-2 font-medium text-white disabled:opacity-50">
            Save
          </button>
          <span className="text-sm text-neutral-500">{msg}</span>
        </div>
      </form>

      <form onSubmit={connect} className={card}>
        <h2 className="font-semibold">Instagram connection</h2>
        {props.connected ? (
          <p className="text-sm">
            ✅ Connected to <strong>@{props.igUsername}</strong>.{" "}
            {props.hasPageToken
              ? "Using a Page token, which does not expire."
              : daysLeft !== null && `Token expires in ${daysLeft} days.`}
            {daysLeft !== null && props.hasPageToken && ` Backup user token: ${daysLeft} days left (refreshed automatically).`}
          </p>
        ) : (
          <p className="text-sm">Not connected yet.</p>
        )}
        <label className="block space-y-1">
          <span className="text-sm">{props.connected ? "Reconnect: paste" : "Paste"} an access token from the Graph API Explorer</span>
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            rows={3}
            placeholder="EAAG…"
            className={`${input} font-mono text-xs`}
          />
        </label>
        <div className="flex items-center gap-3">
          <button disabled={busy || !token} className="rounded-lg bg-pink-600 px-4 py-2 font-medium text-white disabled:opacity-50">
            Connect
          </button>
          <span className="text-sm text-neutral-500">{connectMsg}</span>
        </div>
      </form>

      <section className={card}>
        <h2 className="font-semibold">Recent fetches</h2>
        {props.runs.length === 0 ? (
          <p className="text-sm text-neutral-500">None yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
            {props.runs.map((r) => (
              <li key={r.id} className="py-2">
                <div className="flex justify-between gap-2">
                  <span>
                    {r.ok === null ? "⏳" : r.ok ? "✅" : "⚠️"} {new Date(r.started_at).toLocaleString()}
                  </span>
                  <span className="text-neutral-500">
                    {r.found ?? 0} found · {r.new_entries ?? 0} new · {r.downloaded ?? 0} saved
                  </span>
                </div>
                {r.note && <p className="mt-1 text-xs text-neutral-500">{r.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        onClick={async () => {
          await fetch("/api/logout", { method: "POST" })
          window.location.href = "/login"
        }}
        className="w-full rounded-lg bg-neutral-200 py-3 text-sm dark:bg-neutral-800"
      >
        Log out
      </button>
    </main>
  )
}
