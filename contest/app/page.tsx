import Gallery from "@/components/Gallery"
import { db, Entry, getSettings } from "@/lib/db"

export const dynamic = "force-dynamic"

export default async function Home() {
  const [settings, entries, lastRun] = await Promise.all([
    getSettings(),
    db().from("contest_entries").select("*").order("posted_at", { ascending: false }).limit(5000),
    db().from("contest_fetch_log").select("*").order("started_at", { ascending: false }).limit(1).maybeSingle(),
  ])
  if (entries.error) throw new Error(entries.error.message)
  return (
    <Gallery
      entries={(entries.data ?? []) as Entry[]}
      hashtag={settings.hashtag}
      connected={Boolean(settings.ig_user_id)}
      lastRun={lastRun.data}
    />
  )
}
