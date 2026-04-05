"use client"

/**
 * PersonalBadge — the ONLY way to show personalization across the entire app.
 * Yellow text on yellow/15 bg, rounded-full, always 9px text.
 *
 * Usage:
 *   <PersonalBadge />                          → "For you"
 *   <PersonalBadge label="Medium passport" />  → "Medium passport"
 *   <PersonalBadge label="Personalized" />     → "Personalized"
 */
export default function PersonalBadge({ label = "For you" }: { label?: string }) {
  return (
    <span className="text-[9px] px-2 py-0.5 rounded-full bg-[rgb(var(--accent-green-rgb)/0.15)] text-[var(--accent-green)] whitespace-nowrap">
      {label}
    </span>
  )
}
