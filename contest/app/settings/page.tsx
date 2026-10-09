import SettingsForm from "@/components/SettingsForm"
import { db, getSettings } from "@/lib/db"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const [s, runs] = await Promise.all([
    getSettings(),
    db().from("contest_fetch_log").select("*").order("started_at", { ascending: false }).limit(15),
  ])
  return (
    <SettingsForm
      hashtag={s.hashtag}
      contestStart={s.contest_start}
      igUsername={s.ig_username}
      connected={Boolean(s.ig_user_id)}
      hasPageToken={Boolean(s.page_token)}
      userTokenExpiresAt={s.user_token_expires_at}
      runs={runs.data ?? []}
    />
  )
}
