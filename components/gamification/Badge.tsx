"use client"

import { BADGES, TIER_COLORS } from "@/lib/gamification"

type BadgeProps = {
  badgeKey: string
  earned: boolean
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  earnedAt?: string
}

const SIZE_MAP = { sm: 40, md: 56, lg: 80 } as const

function BadgeIcon({ badgeKey, color }: { badgeKey: string; color: string }) {
  const s = { stroke: color, fill: "none", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
  const f = { fill: color, stroke: "none" }

  switch (badgeKey) {
    // Journey tier
    case "first_steps": // seedling
      return (
        <g>
          <circle cx={24} cy={32} r={3} {...f} />
          <line x1={24} y1={29} x2={24} y2={20} {...s} />
          <path d="M24 24c3-3 7-2 8 0s-2 5-5 4" {...s} />
        </g>
      )
    case "globe_trotter": // globe
      return (
        <g>
          <circle cx={24} cy={24} r={9} {...s} />
          <ellipse cx={24} cy={24} rx={4} ry={9} {...s} />
          <line x1={15} y1={24} x2={33} y2={24} {...s} />
        </g>
      )
    case "world_citizen": // folded map
      return (
        <g>
          <polyline points="16,17 21,19 27,17 32,19 32,33 27,31 21,33 16,31" {...s} />
          <line x1={21} y1={19} x2={21} y2={33} {...s} />
          <line x1={27} y1={17} x2={27} y2={31} {...s} />
        </g>
      )
    case "polyglot": // overlapping speech bubbles
      return (
        <g>
          <rect x={15} y={17} width={12} height={9} rx={2} {...s} />
          <rect x={21} y={22} width={12} height={9} rx={2} {...s} />
          <polyline points="19,26 19,30" {...s} />
        </g>
      )
    case "culture_collector": // paper airplane
      return (
        <g>
          <path d="M16 18l16 6-16 6 3-6-3-6z" {...s} />
          <line x1={19} y1={24} x2={32} y2={24} {...s} />
        </g>
      )
    case "year_abroad": // calendar with checkmark
      return (
        <g>
          <rect x={16} y={17} width={16} height={15} rx={2} {...s} />
          <line x1={16} y1={22} x2={32} y2={22} {...s} />
          <polyline points="20,27 23,30 28,24" {...s} />
        </g>
      )

    // Contribution tier
    case "first_report": // pencil on paper
      return (
        <g>
          <rect x={17} y={16} width={14} height={17} rx={1} {...s} />
          <line x1={20} y1={22} x2={28} y2={22} {...s} />
          <line x1={20} y1={26} x2={26} y2={26} {...s} />
        </g>
      )
    case "scout": // telescope
      return (
        <g>
          <line x1={18} y1={32} x2={24} y2={22} {...s} />
          <line x1={30} y1={32} x2={24} y2={22} {...s} />
          <ellipse cx={27} cy={18} rx={5} ry={3} transform="rotate(-30 27 18)" {...s} />
        </g>
      )
    case "intel_officer": // eye
      return (
        <g>
          <path d="M14 24s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" {...s} />
          <circle cx={24} cy={24} r={3} {...f} />
        </g>
      )
    case "city_expert": // trophy cup
      return (
        <g>
          <path d="M18 17h12v8c0 3-2.5 5-6 5s-6-2-6-5v-8z" {...s} />
          <line x1={24} y1={30} x2={24} y2={33} {...s} />
          <line x1={20} y1={33} x2={28} y2={33} {...s} />
        </g>
      )
    case "reviewer": // 5-point star
      return (
        <g>
          <polygon
            points="24,15 26.5,21 33,21.5 28,26 29.5,33 24,29.5 18.5,33 20,26 15,21.5 21.5,21"
            {...s}
          />
        </g>
      )
    case "connector": // two linked circles
      return (
        <g>
          <circle cx={20} cy={24} r={5} {...s} />
          <circle cx={28} cy={24} r={5} {...s} />
        </g>
      )
    case "host": // flag
      return (
        <g>
          <line x1={18} y1={15} x2={18} y2={34} {...s} />
          <path d="M18 15h12l-3 5 3 5H18" {...s} />
        </g>
      )

    // Status tier
    case "ambassador": // megaphone
      return (
        <g>
          <path d="M17 22v4l14-4v12l-14-4" {...s} />
          <rect x={14} y={22} width={3} height={4} rx={1} {...f} />
        </g>
      )
    case "pathfinder": // compass
      return (
        <g>
          <circle cx={24} cy={24} r={9} {...s} />
          <polygon points="24,16 26,23 24,32 22,23" {...f} />
          <circle cx={24} cy={24} r={2} {...s} />
        </g>
      )
    case "pioneer": // mountain peak
      return (
        <g>
          <polyline points="14,33 24,16 34,33" {...s} />
          <polyline points="20,33 27,24 34,33" {...s} />
        </g>
      )
    case "top_contributor": // crown
      return (
        <g>
          <path d="M16 30l2-12 6 5 6-5 2 12z" {...s} />
          <line x1={16} y1={30} x2={32} y2={30} {...s} />
        </g>
      )
    case "city_champion": // medal with ribbon
      return (
        <g>
          <circle cx={24} cy={27} r={6} {...s} />
          <polyline points="20,21 20,15 24,18 28,15 28,21" {...s} />
        </g>
      )
    case "founding_family": // ornate key
      return (
        <g>
          <circle cx={20} cy={20} r={4} {...s} />
          <line x1={24} y1={20} x2={33} y2={20} {...s} />
          <line x1={33} y1={20} x2={33} y2={24} {...s} />
          <line x1={29} y1={20} x2={29} y2={23} {...s} />
        </g>
      )
    default:
      return <circle cx={24} cy={24} r={4} {...f} />
  }
}

function LockIcon({ color }: { color: string }) {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50">
      <rect x={5} y={11} width={14} height={10} rx={2} fill={color} />
      <path d="M8 11V7a4 4 0 018 0v4" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
    </svg>
  )
}

export default function Badge({ badgeKey, earned, size = "md", showLabel = false }: BadgeProps) {
  const badge = BADGES[badgeKey]
  if (!badge) return null

  const tierColor = TIER_COLORS[badge.tier]
  const px = SIZE_MAP[size]
  const ringColor = earned ? tierColor : "#333"
  const fillColor = earned ? "#1A1A1A" : "#0A0A0A"
  const iconColor = earned ? tierColor : "#444"

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative rounded-full"
        style={{
          width: px,
          height: px,
          boxShadow: earned ? `0 0 12px ${tierColor}4D` : "none",
        }}
      >
        <svg
          width={px}
          height={px}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx={24} cy={24} r={22} stroke={ringColor} strokeWidth={2} fill="none" />
          <circle cx={24} cy={24} r={20} fill={fillColor} />
          <BadgeIcon badgeKey={badgeKey} color={iconColor} />
        </svg>
        {!earned && <LockIcon color="#666" />}
      </div>
      {showLabel && (
        <span
          className={`text-[10px] text-center leading-tight max-w-[${px + 8}px] ${
            earned ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
          }`}
        >
          {badge.name}
        </span>
      )}
    </div>
  )
}
