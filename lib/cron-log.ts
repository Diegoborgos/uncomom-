import type { SupabaseClient } from "@supabase/supabase-js"

export type CronRunFinish = {
  ok: boolean
  batch_offset?: string | null
  cities_processed?: number
  signals_ok?: number
  signals_err?: number
  errors_by_city?: Record<string, string[]> | null
  note?: string
}

export async function startCronRun(
  supabase: SupabaseClient,
  route: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("cron_run_log")
    .insert({ route, started_at: new Date().toISOString() })
    .select("id")
    .single()
  if (error) {
    console.error(`[cron-log] startCronRun(${route}) failed:`, error.message)
    return null
  }
  return data?.id ?? null
}

export async function finishCronRun(
  supabase: SupabaseClient,
  id: string | null,
  startedAtMs: number,
  payload: CronRunFinish,
): Promise<void> {
  if (!id) return
  const finishedAt = new Date()
  const { error } = await supabase
    .from("cron_run_log")
    .update({
      finished_at: finishedAt.toISOString(),
      duration_ms: finishedAt.getTime() - startedAtMs,
      ok: payload.ok,
      batch_offset: payload.batch_offset ?? null,
      cities_processed: payload.cities_processed ?? null,
      signals_ok: payload.signals_ok ?? null,
      signals_err: payload.signals_err ?? null,
      errors_by_city: payload.errors_by_city ?? null,
      note: payload.note ?? null,
    })
    .eq("id", id)
  if (error) console.error(`[cron-log] finishCronRun(${id}) failed:`, error.message)
}
