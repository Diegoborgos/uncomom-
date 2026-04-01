"use client"

export default function ProfileCompleteCard({ completeness, missingFields }: { completeness: number; missingFields: string[] }) {
  const circumference = 2 * Math.PI * 18
  const offset = circumference - (completeness / 100) * circumference

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex items-center gap-4">
      {/* Progress ring */}
      <div className="relative w-14 h-14 shrink-0">
        <svg width="56" height="56" viewBox="0 0 44 44" className="-rotate-90">
          <circle cx="22" cy="22" r="18" fill="none" stroke="var(--surface-elevated)" strokeWidth="3" />
          <circle
            cx="22" cy="22" r="18" fill="none"
            stroke="var(--accent-green)" strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-mono text-[var(--accent-green)]">
          {completeness}%
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium mb-0.5">Complete your profile</p>
        <p className="text-xs text-[var(--text-secondary)]">
          Add your <span className="text-[var(--accent-green)]">{missingFields.slice(0, 2).join(" & ")}</span>
          {missingFields.length > 2 && ` + ${missingFields.length - 2} more`}
          {" "}to get better matches
        </p>
      </div>
    </div>
  )
}
