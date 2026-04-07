"use client"

import { useEffect, useState } from "react"

interface CelebrationToastProps {
  data: {
    points: number
    action: string
    newBadges?: Array<{ key: string; name: string; tier: string }>
    leveledUp?: boolean
    level?: { level: number; title: string }
  }
  onDismiss: () => void
}

export function CelebrationToast({ data, onDismiss }: CelebrationToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, 4000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: `translateX(-50%) translateY(${visible ? "0" : "20px"})`,
      }}
    >
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-xl px-5 py-3 flex items-center gap-3 min-w-[200px]">
        <span className="text-lg font-mono font-bold text-[var(--accent-green)]">+{data.points}</span>
        <div>
          <p className="text-xs font-medium text-[var(--text-primary)]">UP earned</p>
          {data.leveledUp && data.level && (
            <p className="text-[10px] text-[var(--accent-green)]">Level up! {data.level.title}</p>
          )}
          {data.newBadges && data.newBadges.length > 0 && (
            <p className="text-[10px] text-[var(--text-secondary)]">🏆 {data.newBadges[0].name} unlocked!</p>
          )}
        </div>
      </div>
    </div>
  )
}
