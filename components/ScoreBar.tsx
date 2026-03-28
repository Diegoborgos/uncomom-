"use client"

import { getScoreColor } from "@/lib/scores"

export default function ScoreBar({
  label,
  score,
}: {
  label: string
  score: number
}) {
  const color = getScoreColor(score)

  return (
    <div className="flex items-center gap-3">
      <span className="w-32 text-sm text-[var(--text-secondary)] shrink-0">
        {label}
      </span>
      <div className="flex-1 h-2 rounded-full bg-[var(--surface)]">
        <div
          className="h-2 rounded-full score-bar-animated"
          style={
            {
              "--bar-width": `${score}%`,
              backgroundColor: color,
              width: `${score}%`,
            } as React.CSSProperties
          }
        />
      </div>
      <span className="w-8 text-right text-sm font-mono" style={{ color }}>
        {score}
      </span>
    </div>
  )
}
