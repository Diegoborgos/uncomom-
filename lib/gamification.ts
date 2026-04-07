// Gamification constants, types, and helpers for Uncomun Points (UP)

export type BadgeTier = "journey" | "contribution" | "status"

export type BadgeDef = {
  name: string
  description: string
  tier: BadgeTier
  iconLabel: string
}

export type LevelInfo = {
  level: number
  title: string
  threshold: number
}

export type AwardResult = {
  points: number
  totalPoints: number
  level: LevelInfo
  leveledUp: boolean
  newBadges: BadgeDef[]
  streak: number
}

// Action → point value mapping
export const POINT_VALUES: Record<string, number> = {
  complete_onboarding: 50,
  field_report: 100,
  city_review: 75,
  log_trip: 25,
  save_city: 10,
  answer_question: 30,
  send_message: 15,
  school_review: 50,
  post_meetup: 40,
  invite_family: 100,
  daily_checkin: 5,
  update_profile: 20,
}

// 7 levels from Explorer to Legend
export const LEVELS: LevelInfo[] = [
  { level: 1, title: "Explorer", threshold: 0 },
  { level: 2, title: "Pathfinder", threshold: 100 },
  { level: 3, title: "Navigator", threshold: 300 },
  { level: 4, title: "Trailblazer", threshold: 750 },
  { level: 5, title: "Ambassador", threshold: 1500 },
  { level: 6, title: "Luminary", threshold: 3000 },
  { level: 7, title: "Legend", threshold: 5000 },
]

export function getLevelForPoints(points: number): {
  current: LevelInfo
  next: LevelInfo | null
  progress: number
} {
  let current = LEVELS[0]
  for (const lvl of LEVELS) {
    if (points >= lvl.threshold) current = lvl
    else break
  }

  const nextIndex = LEVELS.indexOf(current) + 1
  const next = nextIndex < LEVELS.length ? LEVELS[nextIndex] : null

  const progress = next
    ? (points - current.threshold) / (next.threshold - current.threshold)
    : 1

  return { current, next, progress }
}

// 19 collectible badges across 3 tiers
export const BADGES: Record<string, BadgeDef> = {
  // Journey tier (green) — travel milestones
  first_steps: { name: "First Steps", description: "Complete onboarding", tier: "journey", iconLabel: "seedling" },
  globe_trotter: { name: "Globe Trotter", description: "Log 3 trips", tier: "journey", iconLabel: "globe" },
  world_citizen: { name: "World Citizen", description: "Log 10 trips", tier: "journey", iconLabel: "earth" },
  polyglot: { name: "Polyglot", description: "Add 3+ languages to your profile", tier: "journey", iconLabel: "speech" },
  culture_collector: { name: "Culture Collector", description: "Save 10 cities", tier: "journey", iconLabel: "compass" },
  year_abroad: { name: "Year Abroad", description: "Active for 52 weeks", tier: "journey", iconLabel: "calendar" },

  // Contribution tier (blue) — data contributions
  first_report: { name: "First Report", description: "Submit your first field report", tier: "contribution", iconLabel: "telescope" },
  scout: { name: "Scout", description: "Submit 5 field reports", tier: "contribution", iconLabel: "binoculars" },
  intel_officer: { name: "Intel Officer", description: "Submit 10 field reports", tier: "contribution", iconLabel: "radar" },
  city_expert: { name: "City Expert", description: "Write 10 reviews for the same city", tier: "contribution", iconLabel: "star" },
  reviewer: { name: "Reviewer", description: "Write 5 city reviews", tier: "contribution", iconLabel: "pencil" },
  connector: { name: "Connector", description: "Send your first message", tier: "contribution", iconLabel: "link" },
  host: { name: "Host", description: "Post a meetup", tier: "contribution", iconLabel: "flag" },

  // Status tier (gold) — elite achievements
  ambassador: { name: "Ambassador", description: "Reach Level 5", tier: "status", iconLabel: "crown" },
  pathfinder: { name: "Pathfinder", description: "Reach Level 2", tier: "status", iconLabel: "trail" },
  pioneer: { name: "Pioneer", description: "Among the first 100 families", tier: "status", iconLabel: "rocket" },
  top_contributor: { name: "Top Contributor", description: "Earn 2000+ UP", tier: "status", iconLabel: "trophy" },
  city_champion: { name: "City Champion", description: "Top contributor for a city", tier: "status", iconLabel: "shield" },
  founding_family: { name: "Founding Family", description: "Joined during beta", tier: "status", iconLabel: "diamond" },
}

export const TIER_COLORS: Record<BadgeTier, string> = {
  journey: "#EBFF00",
  contribution: "#60A5FA",
  status: "#FBBF24",
}
