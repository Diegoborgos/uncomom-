import { BUCKET, db, getSettings, MediaItem, saveSettings, Settings } from "./db"
import { graph, graphPages, MetaError, refreshUserTokenIfNeeded, withToken } from "./meta"

// Vercel Hobby functions stop at 60s. Stop starting new work after this.
const SOFT_DEADLINE_MS = 45_000
const MAX_FILE_BYTES = Number(process.env.MAX_FILE_MB || 50) * 1024 * 1024
const MAX_DOWNLOAD_ATTEMPTS = 5

const CHILD_FIELDS = "children{id,media_type,media_url}"
const CORE_FIELDS = `id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count,${CHILD_FIELDS}`
const HASHTAG_FIELDS = `${CORE_FIELDS},media_product_type`
const TAG_FIELDS = `${CORE_FIELDS},username,thumbnail_url,media_product_type`

type IgMedia = {
  id: string
  username?: string
  caption?: string
  media_type?: string
  media_product_type?: string
  media_url?: string
  thumbnail_url?: string
  permalink?: string
  timestamp?: string
  like_count?: number
  comments_count?: number
  children?: { data: { id: string; media_type?: string; media_url?: string }[] }
}

type Row = {
  id: string
  hashtags: string[]
  sources: string[]
  username: string | null
  caption: string | null
  media_type: string | null
  media_product_type: string | null
  permalink: string | null
  posted_at: string | null
  like_count: number | null
  comments_count: number | null
  media: MediaItem[]
  thumb_url: string | null
}

function toRow(m: IgMedia, source: string, hashtags: string[]): Row {
  const media: MediaItem[] = m.children?.data?.length
    ? m.children.data.map((c) => ({ type: c.media_type ?? "IMAGE", url: c.media_url ?? null, path: null }))
    : [{ type: m.media_type ?? "IMAGE", url: m.media_url ?? null, path: null }]
  return {
    id: m.id,
    hashtags,
    sources: [source],
    username: m.username ?? null,
    caption: m.caption ?? null,
    media_type: m.media_type ?? null,
    media_product_type: m.media_product_type ?? null,
    permalink: m.permalink ?? null,
    posted_at: m.timestamp ?? null,
    like_count: m.like_count ?? null,
    comments_count: m.comments_count ?? null,
    media,
    thumb_url: m.thumbnail_url ?? null,
  }
}

/** Same post can come back from several sources in one run: merge before saving. */
function mergeRows(rows: Row[]): Row[] {
  const byId = new Map<string, Row>()
  for (const r of rows) {
    const prev = byId.get(r.id)
    if (!prev) {
      byId.set(r.id, r)
      continue
    }
    byId.set(r.id, {
      ...prev,
      sources: Array.from(new Set([...prev.sources, ...r.sources])),
      hashtags: Array.from(new Set([...prev.hashtags, ...r.hashtags])),
      username: prev.username ?? r.username,
      thumb_url: prev.thumb_url ?? r.thumb_url,
    })
  }
  return Array.from(byId.values())
}

/** Ask for the nice-to-have fields; if Meta rejects one (error 100), retry with the core set. */
async function fetchMedia(
  path: string,
  fields: string,
  fallbackFields: string,
  extra: Record<string, string>,
  token: string,
  maxPages: number,
  deadline: number,
): Promise<IgMedia[]> {
  try {
    return await graphPages<IgMedia>(path, { ...extra, fields, limit: 50 }, token, maxPages, deadline)
  } catch (e) {
    if (!(e instanceof MetaError) || e.code !== 100) throw e
    return graphPages<IgMedia>(path, { ...extra, fields: fallbackFields, limit: 50 }, token, maxPages, deadline)
  }
}

async function hashtagId(s: Settings, tag: string, token: string): Promise<string> {
  if (s.hashtag_ids[tag]) return s.hashtag_ids[tag]
  // Each new hashtag counts toward Meta's limit of 30 unique hashtags per 7 days.
  const res = await graph<{ data: { id: string }[] }>("ig_hashtag_search", { user_id: s.ig_user_id!, q: tag }, token)
  const id = res.data[0]?.id
  if (!id) throw new MetaError(`Instagram has no hashtag #${tag} yet`)
  s.hashtag_ids = { ...s.hashtag_ids, [tag]: id }
  await saveSettings({ hashtag_ids: s.hashtag_ids })
  return id
}

/** Which contest hashtags appear in a caption (for tagged posts). */
function hashtagsIn(caption: string | undefined, tags: string[]): string[] {
  const found = new Set((caption ?? "").toLowerCase().match(/#[^\s#!-/:-@[-^`{-~]+/g)?.map((t) => t.slice(1)) ?? [])
  return tags.filter((t) => found.has(t))
}

export type CollectResult = {
  ok: boolean
  found: number
  newEntries: number
  downloaded: number
  notes: string[]
}

export async function collect(): Promise<CollectResult> {
  const started = Date.now()
  const deadline = started + SOFT_DEADLINE_MS
  const notes: string[] = []
  const rows: Row[] = []
  let ok = true

  const { data: log } = await db().from("contest_fetch_log").insert({}).select("id").single()

  const s = await getSettings()
  if (!s.ig_user_id) {
    notes.push("Instagram is not connected yet (Settings → Connect Instagram).")
    ok = false
  } else {
    const since = s.contest_start ? new Date(s.contest_start).getTime() : 0

    // A post only counts if its caption uses EVERY contest hashtag, and was posted after the
    // contest start (top_media includes popular posts of any age).
    let skipped = 0
    const isEntry = (m: IgMedia) => {
      const ok =
        (!since || (m.timestamp && new Date(m.timestamp).getTime() >= since)) &&
        hashtagsIn(m.caption, s.hashtags).length === s.hashtags.length
      if (!ok) skipped++
      return ok
    }

    // Only the first (priority, most unique) hashtag is searched on Instagram; the others are
    // checked in the caption. This avoids pulling in a busy hashtag's whole feed.
    const searchTag = s.hashtags[0]
    if (searchTag) {
      const tag = searchTag
      try {
        await withToken(s, async (token) => {
          const id = await hashtagId(s, tag, token)
          const extra = { user_id: s.ig_user_id! }
          // recent_media only covers the last 24 hours, hence the hourly schedule.
          const recent = await fetchMedia(`${id}/recent_media`, HASHTAG_FIELDS, CORE_FIELDS, extra, token, 6, deadline)
          rows.push(...recent.filter(isEntry).map((m) => toRow(m, "recent", s.hashtags)))
          const top = await fetchMedia(`${id}/top_media`, HASHTAG_FIELDS, CORE_FIELDS, extra, token, 2, deadline)
          rows.push(...top.filter(isEntry).map((m) => toRow(m, "top", s.hashtags)))
        })
      } catch (e) {
        ok = false
        notes.push(`#${tag}: ${(e as Error).message}`)
      }
    } else {
      notes.push("No hashtags set yet (Settings).")
    }

    try {
      await withToken(s, async (token) => {
        // Tagged posts come newest first; stop paging once we pass the contest start.
        const tagged = await fetchMedia(
          `${s.ig_user_id}/tags`,
          TAG_FIELDS,
          `${CORE_FIELDS},username`,
          {},
          token,
          since ? 10 : 2,
          deadline,
        )
        rows.push(...tagged.filter(isEntry).map((m) => toRow(m, "tagged", s.hashtags)))
      })
    } catch (e) {
      ok = false
      notes.push(`Tagged posts: ${(e as Error).message}`)
    }
    if (skipped && s.hashtags.length > 1) {
      notes.push(`Ignored ${skipped} posts without all of: ${s.hashtags.map((t) => `#${t}`).join(" ")} (or from before the contest start).`)
    } else if (skipped) {
      notes.push(`Ignored ${skipped} posts from before the contest start or without the hashtag.`)
    }
  }

  const merged = mergeRows(rows)
  let newEntries = 0
  if (merged.length) {
    const { data, error } = await db().rpc("contest_upsert_entries", { items: merged })
    if (error) {
      ok = false
      notes.push(`Saving: ${error.message}`)
    } else {
      newEntries = data as number
    }
  }

  const downloaded = await downloadPending(deadline, notes)

  const refresh = await refreshUserTokenIfNeeded()
  if (refresh) notes.push(refresh)

  if (log) {
    await db()
      .from("contest_fetch_log")
      .update({
        finished_at: new Date().toISOString(),
        ok,
        found: merged.length,
        new_entries: newEntries,
        downloaded,
        note: notes.join(" | ") || null,
      })
      .eq("id", log.id)
  }

  return { ok, found: merged.length, newEntries, downloaded, notes }
}

function extension(contentType: string, fallbackType: string): string {
  if (contentType.includes("mp4")) return "mp4"
  if (contentType.includes("quicktime")) return "mov"
  if (contentType.includes("png")) return "png"
  if (contentType.includes("webp")) return "webp"
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg"
  return fallbackType === "VIDEO" ? "mp4" : "jpg"
}

async function copyToStorage(url: string, pathBase: string, type: string): Promise<string> {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error(`download failed (${res.status}) – the Instagram link may have expired`)
  const size = Number(res.headers.get("content-length") || 0)
  if (size > MAX_FILE_BYTES) throw new Error(`file is ${Math.round(size / 1048576)} MB, over the ${MAX_FILE_BYTES / 1048576} MB limit`)
  const contentType = res.headers.get("content-type") || (type === "VIDEO" ? "video/mp4" : "image/jpeg")
  const body = await res.arrayBuffer()
  const path = `${pathBase}.${extension(contentType, type)}`
  const { error } = await db().storage.from(BUCKET).upload(path, body, { contentType, upsert: true })
  if (error) throw new Error(`storage upload failed: ${error.message}`)
  return path
}

/** Copy Instagram files into Supabase Storage, because Instagram URLs expire. */
export async function downloadPending(deadline: number, notes: string[]): Promise<number> {
  const { data: pending, error } = await db()
    .from("contest_entries")
    .select("id, media, thumb_url, thumb_path, download_attempts")
    .is("stored_at", null)
    .lt("download_attempts", MAX_DOWNLOAD_ATTEMPTS)
    .order("first_seen_at", { ascending: true })
    .limit(25)
  if (error) {
    notes.push(`Downloads: ${error.message}`)
    return 0
  }

  let done = 0
  for (const entry of pending ?? []) {
    if (Date.now() > deadline) {
      notes.push("Some downloads left for the next run.")
      break
    }
    const media = (entry.media as MediaItem[]).map((m) => ({ ...m }))
    let thumbPath: string | null = entry.thumb_path
    try {
      for (let i = 0; i < media.length; i++) {
        if (media[i].path) continue
        if (!media[i].url) throw new Error("Instagram did not return a media URL (often the case for posts with copyrighted music)")
        media[i].path = await copyToStorage(media[i].url!, `${entry.id}/${i}`, media[i].type)
      }
      if (entry.thumb_url && !thumbPath) {
        thumbPath = await copyToStorage(entry.thumb_url, `${entry.id}/thumb`, "IMAGE")
      }
      await db()
        .from("contest_entries")
        .update({ media, thumb_path: thumbPath, stored_at: new Date().toISOString(), download_error: null })
        .eq("id", entry.id)
      done++
    } catch (e) {
      await db()
        .from("contest_entries")
        .update({
          media,
          thumb_path: thumbPath,
          download_attempts: entry.download_attempts + 1,
          download_error: (e as Error).message,
        })
        .eq("id", entry.id)
    }
  }
  return done
}
