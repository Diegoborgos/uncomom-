"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Entry, MediaItem, Status } from "@/lib/db"

type Filter = "all" | "unreviewed" | "shortlisted" | "winner" | "rejected"
type Sort = "newest" | "oldest" | "engagement"
type LastRun = { started_at: string; ok: boolean | null; note: string | null } | null

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unreviewed", label: "Not reviewed" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "winner", label: "Winners" },
  { key: "rejected", label: "Rejected" },
]

const STATUS_STYLE: Record<Status, string> = {
  unreviewed: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  shortlisted: "bg-amber-400 text-amber-950",
  winner: "bg-emerald-500 text-white",
  rejected: "bg-neutral-500 text-white",
}
const STATUS_LABEL: Record<Status, string> = {
  unreviewed: "Not reviewed",
  shortlisted: "Shortlisted",
  winner: "Winner",
  rejected: "Rejected",
}

function mediaSrc(item: MediaItem | undefined): string | null {
  if (!item) return null
  if (item.path) return `/api/media/${item.path.split("/").map(encodeURIComponent).join("/")}`
  return item.url // not copied yet; Instagram link may have expired
}

function engagement(e: Entry) {
  return (e.like_count ?? 0) + (e.comments_count ?? 0)
}

function formatDate(iso: string | null) {
  if (!iso) return ""
  return new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return `${mins} min ago`
  if (mins < 48 * 60) return `${Math.round(mins / 60)} h ago`
  return `${Math.round(mins / 1440)} days ago`
}

/** Only load a video's first frame once the card scrolls into view (saves phone data). */
function Thumb({ entry }: { entry: Entry }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { rootMargin: "300px" })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const first = entry.media[0]
  const thumb = entry.thumb_path ? mediaSrc({ type: "IMAGE", url: null, path: entry.thumb_path }) : entry.thumb_url
  const src = mediaSrc(first)
  const isVideo = first?.type === "VIDEO"

  return (
    <div ref={ref} className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-200 dark:bg-neutral-800">
      {visible &&
        (thumb || (!isVideo && src) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={(thumb || src)!} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : isVideo && src ? (
          <video src={`${src}#t=0.1`} preload="metadata" muted playsInline className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center text-xs text-neutral-500">
            No preview
          </div>
        ))}
      {isVideo && (
        <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">▶</span>
      )}
      {entry.media.length > 1 && (
        <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
          1/{entry.media.length}
        </span>
      )}
      {entry.status !== "unreviewed" && (
        <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[entry.status]}`}>
          {STATUS_LABEL[entry.status]}
        </span>
      )}
    </div>
  )
}

function StatusButtons({ status, onChange, size = "sm" }: { status: Status; onChange: (s: Status) => void; size?: "sm" | "lg" }) {
  const pad = size === "lg" ? "py-3 text-sm" : "py-1.5 text-xs"
  const btn = (s: Status, icon: string, label: string) => {
    const active = status === s
    return (
      <button
        key={s}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onChange(active ? "unreviewed" : s) // tap again to undo
        }}
        aria-label={label}
        title={label}
        className={`flex-1 rounded-lg font-medium transition ${pad} ${
          active ? STATUS_STYLE[s] : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
        }`}
      >
        {icon}
        <span className={size === "lg" ? " ml-1" : "ml-1 hidden md:inline"}>{label}</span>
      </button>
    )
  }
  return (
    <div className="flex gap-1.5">
      {btn("shortlisted", "★", "Shortlist")}
      {btn("winner", "🏆", "Winner")}
      {btn("rejected", "✕", "Reject")}
    </div>
  )
}

function Viewer({
  entry,
  onClose,
  onPrev,
  onNext,
  onUpdate,
}: {
  entry: Entry
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
  onUpdate: (patch: Partial<Entry>) => Promise<boolean>
}) {
  const [index, setIndex] = useState(0)
  const [notes, setNotes] = useState(entry.notes ?? "")
  const [username, setUsername] = useState(entry.username ?? "")
  const [saved, setSaved] = useState("")

  useEffect(() => {
    setIndex(0)
    setNotes(entry.notes ?? "")
    setUsername(entry.username ?? "")
    setSaved("")
  }, [entry.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement).tagName === "TEXTAREA" || (e.target as HTMLElement).tagName === "INPUT") return
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") onPrev?.()
      if (e.key === "ArrowRight") onNext?.()
    }
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [onClose, onPrev, onNext])

  async function saveField(patch: Partial<Entry>) {
    setSaved("Saving…")
    setSaved((await onUpdate(patch)) ? "Saved" : "Could not save, try again")
  }

  const item = entry.media[index]
  // Not copied yet: try Instagram's link, unless saving already failed (link is likely dead)
  const src = item?.path || !entry.download_error ? mediaSrc(item) : null

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/80 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="flex w-full max-w-5xl flex-col overflow-y-auto bg-white dark:bg-neutral-900 sm:max-h-[95vh] sm:flex-row sm:overflow-hidden sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex shrink-0 items-center justify-center bg-black sm:w-3/5">
          {src ? (
            item.type === "VIDEO" ? (
              <video key={src} src={src} controls autoPlay playsInline className="max-h-[70vh] w-full sm:max-h-[95vh]" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="" className="max-h-[70vh] w-full object-contain sm:max-h-[95vh]" />
            )
          ) : (
            <div className="space-y-3 px-6 pb-10 pt-16 text-center text-sm text-neutral-300">
              <p>No copy of this file could be saved{entry.download_error ? `: ${entry.download_error}` : "."}</p>
              {entry.permalink && (
                <a href={entry.permalink} target="_blank" rel="noreferrer" className="inline-block rounded-lg bg-white px-4 py-2 font-medium text-neutral-900">
                  Watch on Instagram ↗
                </a>
              )}
            </div>
          )}
          {entry.media.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
              {entry.media.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-2.5 w-2.5 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`}
                  aria-label={`Show item ${i + 1}`}
                />
              ))}
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1.5 text-sm text-white sm:hidden"
          >
            ✕ Close
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-4 sm:overflow-y-auto sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <button onClick={onPrev} disabled={!onPrev} className="rounded-lg bg-neutral-100 px-3 py-1.5 text-sm disabled:opacity-30 dark:bg-neutral-800">
                ← Prev
              </button>
              <button onClick={onNext} disabled={!onNext} className="rounded-lg bg-neutral-100 px-3 py-1.5 text-sm disabled:opacity-30 dark:bg-neutral-800">
                Next →
              </button>
            </div>
            <button onClick={onClose} className="hidden rounded-lg px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 sm:block">
              ✕ Close
            </button>
          </div>

          <StatusButtons status={entry.status} onChange={(status) => saveField({ status })} size="lg" />

          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Creator</span>
            <div className="mt-1 flex items-center rounded-lg border border-neutral-300 px-3 dark:border-neutral-700">
              <span className="text-neutral-400">@</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => username !== (entry.username ?? "") && saveField({ username })}
                placeholder="unknown (see the post on Instagram)"
                className="w-full bg-transparent py-2 pl-1 text-base outline-none"
              />
            </div>
          </label>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600 dark:text-neutral-400">
            <span>{formatDate(entry.posted_at)}</span>
            <span>♥ {entry.like_count ?? "hidden"}</span>
            <span>💬 {entry.comments_count ?? 0}</span>
            <span>via {entry.sources.join(", ")}</span>
          </div>

          {entry.permalink && (
            <a href={entry.permalink} target="_blank" rel="noreferrer" className="text-sm font-medium text-pink-600 underline">
              Open original post on Instagram ↗
            </a>
          )}

          {entry.caption && <p className="whitespace-pre-wrap text-sm leading-relaxed">{entry.caption}</p>}

          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => notes !== (entry.notes ?? "") && saveField({ notes })}
              rows={4}
              placeholder="Private notes for you and your teammate"
              className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent p-3 text-base dark:border-neutral-700"
            />
          </label>
          <p className="h-4 text-xs text-neutral-500">{saved}</p>
        </div>
      </div>
    </div>
  )
}

export default function Gallery({
  entries: initial,
  hashtag,
  connected,
  lastRun,
}: {
  entries: Entry[]
  hashtag: string | null
  connected: boolean
  lastRun: LastRun
}) {
  const [entries, setEntries] = useState(initial)
  const [filter, setFilter] = useState<Filter>("all")
  const [sort, setSort] = useState<Sort>("newest")
  const [query, setQuery] = useState("")
  const [openId, setOpenId] = useState<string | null>(null)
  // Freeze the order while the viewer is open, so marking an entry doesn't make it vanish mid-review.
  const [navIds, setNavIds] = useState<string[]>([])
  const [fetching, setFetching] = useState(false)
  const [message, setMessage] = useState("")

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: entries.length, unreviewed: 0, shortlisted: 0, winner: 0, rejected: 0 }
    for (const e of entries) c[e.status]++
    return c
  }, [entries])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = entries.filter(
      (e) =>
        (filter === "all" || e.status === filter) &&
        (!q || e.caption?.toLowerCase().includes(q) || e.username?.toLowerCase().includes(q) || e.notes?.toLowerCase().includes(q)),
    )
    const time = (e: Entry) => (e.posted_at ? new Date(e.posted_at).getTime() : 0)
    return list.sort((a, b) =>
      sort === "engagement" ? engagement(b) - engagement(a) : sort === "oldest" ? time(a) - time(b) : time(b) - time(a),
    )
  }, [entries, filter, sort, query])

  const update = useCallback(async (id: string, patch: Partial<Entry>) => {
    let before: Entry | undefined
    setEntries((list) =>
      list.map((e) => {
        if (e.id !== id) return e
        before = e
        return { ...e, ...patch }
      }),
    )
    const res = await fetch(`/api/entries/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => null)
    if (!res?.ok) {
      if (before) setEntries((list) => list.map((e) => (e.id === id ? before! : e)))
      setMessage("Could not save that change. Check your connection and try again.")
      return false
    }
    return true
  }, [])

  async function fetchNow() {
    setFetching(true)
    setMessage("Fetching from Instagram… this can take up to a minute.")
    const res = await fetch("/api/fetch-now", { method: "POST" }).catch(() => null)
    const data = await res?.json().catch(() => null)
    setFetching(false)
    if (!data) {
      setMessage("Fetch failed. Try again in a minute.")
      return
    }
    setMessage(
      `Found ${data.found} posts, ${data.newEntries} new, ${data.downloaded} files saved.` +
        (data.notes?.length ? ` ${data.notes.join(" ")}` : "") +
        (data.newEntries || data.downloaded ? " Reloading…" : ""),
    )
    if (data.newEntries || data.downloaded) setTimeout(() => window.location.reload(), 1500)
  }

  const openIndex = openId ? navIds.indexOf(openId) : -1
  const open = openId ? entries.find((e) => e.id === openId) ?? null : null

  return (
    <main className="mx-auto max-w-7xl px-3 pb-16 pt-4 sm:px-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">{hashtag ? `#${hashtag}` : "Contest Gallery"}</h1>
          <p className="text-xs text-neutral-500">
            {lastRun
              ? `Last fetch ${timeAgo(lastRun.started_at)}${lastRun.ok === false ? " – had a problem, see Settings" : ""}`
              : "No fetch has run yet"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <button onClick={fetchNow} disabled={fetching} className="rounded-lg bg-pink-600 px-3 py-2 font-medium text-white disabled:opacity-50">
            {fetching ? "Fetching…" : "Fetch now"}
          </button>
          <a href="/api/export?status=winner,shortlisted" className="rounded-lg bg-neutral-200 px-3 py-2 dark:bg-neutral-800">
            Export CSV
          </a>
          <Link href="/settings" className="rounded-lg bg-neutral-200 px-3 py-2 dark:bg-neutral-800">
            Settings
          </Link>
        </div>
      </header>

      {(!connected || !hashtag) && (
        <div className="mb-4 rounded-xl bg-amber-100 p-4 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
          Setup not finished: {!connected && "connect Instagram"}
          {!connected && !hashtag && " and "}
          {!hashtag && "set your contest hashtag"} in{" "}
          <Link href="/settings" className="underline">
            Settings
          </Link>
          .
        </div>
      )}
      {message && (
        <div className="mb-4 rounded-xl bg-neutral-200 p-3 text-sm dark:bg-neutral-800" onClick={() => setMessage("")}>
          {message}
        </div>
      )}

      <div className="sticky top-0 z-10 -mx-3 mb-4 space-y-2 bg-neutral-50/95 px-3 py-2 backdrop-blur dark:bg-neutral-950/95 sm:-mx-6 sm:px-6">
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
                filter === f.key ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "bg-neutral-200 dark:bg-neutral-800"
              }`}
            >
              {f.label} <span className="opacity-60">{counts[f.key]}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search caption, creator, notes"
            className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-base dark:border-neutral-700"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-lg border border-neutral-300 bg-transparent px-2 py-2 text-sm dark:border-neutral-700"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="engagement">Most engagement</option>
          </select>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-20 text-center text-neutral-500">
          {entries.length === 0 ? "No entries yet. They appear here after the next fetch." : "Nothing in this filter."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((e) => (
            <article
              key={e.id}
              onClick={() => {
                setNavIds(visible.map((v) => v.id))
                setOpenId(e.id)
              }}
              className="cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-md dark:bg-neutral-900 dark:ring-white/10"
            >
              <Thumb entry={e} />
              <div className="space-y-1.5 p-2.5">
                <div>
                  <p className="truncate text-sm font-medium">{e.username ? `@${e.username}` : "creator unknown"}</p>
                  <p className="text-xs text-neutral-500">{formatDate(e.posted_at)}</p>
                </div>
                <p className="line-clamp-2 min-h-[2.5em] text-xs text-neutral-600 dark:text-neutral-400">{e.caption}</p>
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>
                    ♥ {e.like_count ?? "–"} · 💬 {e.comments_count ?? 0}
                  </span>
                  {e.permalink && (
                    <a href={e.permalink} target="_blank" rel="noreferrer" onClick={(ev) => ev.stopPropagation()} className="underline">
                      Instagram ↗
                    </a>
                  )}
                </div>
                <StatusButtons status={e.status} onChange={(status) => update(e.id, { status })} />
              </div>
            </article>
          ))}
        </div>
      )}

      {open && (
        <Viewer
          entry={open}
          onClose={() => setOpenId(null)}
          onPrev={openIndex > 0 ? () => setOpenId(navIds[openIndex - 1]) : undefined}
          onNext={openIndex >= 0 && openIndex < navIds.length - 1 ? () => setOpenId(navIds[openIndex + 1]) : undefined}
          onUpdate={(patch) => update(open.id, patch)}
        />
      )}
    </main>
  )
}
