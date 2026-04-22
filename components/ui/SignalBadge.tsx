"use client"

/**
 * SignalBadge — compact provenance pill driven by source_type.
 *
 * One pill, five visual states, consistent across the app. Pair it with
 * any number/pill/gauge where the user might reasonably ask "where did
 * this come from?".
 *
 * Usage:
 *   <SignalBadge sourceType="public_api" fetchedAt={iso} />     → "Live · 2h ago"
 *   <SignalBadge sourceType="field_report" reportCount={5} />   → "From 5 families"
 *   <SignalBadge sourceType="admin_manual" />                   → "Verified"
 *   <SignalBadge sourceType="seed_estimate" />                  → "Estimated"
 *   <SignalBadge sourceType="paid_api_ready" />                 → "Estimated"
 *   <SignalBadge sourceType={null} />                           → "Estimated"  (fallback)
 */

export type SignalSourceType =
  | "public_api"
  | "field_report"
  | "admin_manual"
  | "seed_estimate"
  | "paid_api_ready"
  | "manual"      // legacy, treated as admin_manual
  | "estimated"   // legacy, treated as seed_estimate
  | null
  | undefined

type Props = {
  sourceType: SignalSourceType
  fetchedAt?: string | null
  reportCount?: number
  /** Compact mode drops the timestamp / count suffix */
  compact?: boolean
  className?: string
}

export default function SignalBadge({
  sourceType,
  fetchedAt,
  reportCount,
  compact = false,
  className = "",
}: Props) {
  const { label, tone } = resolve(sourceType, fetchedAt, reportCount, compact)
  const toneClasses = tone === "green"
    ? "bg-[rgb(var(--accent-green-rgb)/0.15)] text-[var(--accent-green)]"
    : "bg-[rgb(var(--accent-warm-rgb)/0.15)] text-[var(--accent-warm)]"
  return (
    <span
      className={`text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap ${toneClasses} ${className}`}
      title={tooltip(sourceType, fetchedAt, reportCount)}
    >
      {label}
    </span>
  )
}

function resolve(
  sourceType: SignalSourceType,
  fetchedAt?: string | null,
  reportCount?: number,
  compact?: boolean,
): { label: string; tone: "green" | "warm" } {
  switch (sourceType) {
    case "public_api": {
      const suffix = compact || !fetchedAt ? "" : ` · ${timeAgo(fetchedAt)}`
      return { label: `Live${suffix}`, tone: "green" }
    }
    case "field_report": {
      const n = reportCount ?? 0
      return {
        label: n > 0 ? `From ${n} famil${n === 1 ? "y" : "ies"}` : "Family-reported",
        tone: "green",
      }
    }
    case "admin_manual":
    case "manual":
      return { label: "Verified", tone: "green" }
    case "paid_api_ready":
    case "seed_estimate":
    case "estimated":
    case null:
    case undefined:
    default:
      return { label: "Estimated", tone: "warm" }
  }
}

function tooltip(
  sourceType: SignalSourceType,
  fetchedAt?: string | null,
  reportCount?: number,
): string {
  switch (sourceType) {
    case "public_api":
      return fetchedAt
        ? `Live data from a public API. Last refreshed ${timeAgo(fetchedAt)}.`
        : "Live data from a public API."
    case "field_report":
      return reportCount
        ? `Derived from ${reportCount} Uncomun family report${reportCount === 1 ? "" : "s"}.`
        : "Derived from Uncomun family reports."
    case "admin_manual":
    case "manual":
      return "Manually verified by the Uncomun team."
    case "paid_api_ready":
      return "Estimated. Will upgrade to live data once the matching paid API is activated."
    case "seed_estimate":
    case "estimated":
    default:
      return "Estimated. No live source configured yet."
  }
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}
