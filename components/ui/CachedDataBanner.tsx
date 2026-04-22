"use client"

/**
 * CachedDataBanner — slim banner rendered at the top of public pages when
 * the site is serving bundled fallback data (Supabase query errored or
 * returned empty and lib/*-db.ts fell back to the static /data/*.ts
 * import). Makes the degraded state visible instead of silent.
 *
 * Hidden by default; only renders when `fromFallback` is true.
 */

type Props = {
  fromFallback: boolean
  dataset?: string  // e.g. "cities", "schools", "visas", "homeschool laws"
}

export default function CachedDataBanner({ fromFallback, dataset }: Props) {
  if (!fromFallback) return null
  const subject = dataset ?? "data"
  return (
    <div className="w-full bg-[rgb(var(--accent-warm-rgb)/0.12)] border-b border-[rgb(var(--accent-warm-rgb)/0.3)] text-[var(--accent-warm)] text-xs px-4 py-2 text-center">
      <span className="font-medium">Showing cached {subject}.</span>
      <span className="opacity-80 ml-1">Live refresh is temporarily unavailable — some values may be out of date.</span>
    </div>
  )
}
