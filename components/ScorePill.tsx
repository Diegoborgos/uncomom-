"use client"

import { getScoreColor } from "@/lib/scores"

export default function ScorePill({
  label,
  score,
  size = "sm",
}: {
  label?: string
  score: number
  size?: "sm" | "lg"
}) {
  const color = getScoreColor(score)
  const isLg = size === "lg"

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-mono font-medium ${
        isLg ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-xs"
      }`}
      style={{ backgroundColor: color + "22", color }}
    >
      {label && <span className="opacity-70">{label}</span>}
      {score}
    </span>
  )
}
