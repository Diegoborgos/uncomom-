export function getScoreColor(score: number): string {
  if (score >= 70) return "#4ADE80"
  if (score >= 50) return "#EBFF00"
  return "#FF4444"
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent"
  if (score >= 60) return "Good"
  if (score >= 40) return "Fair"
  return "Low"
}

export function countryCodeToFlag(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("")
}

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getVisaBadgeColor(status: string): string {
  switch (status) {
    case "Excellent":
      return "var(--score-high)"
    case "Good":
      return "var(--score-mid)"
    case "OK":
      return "var(--score-mid)"
    default:
      return "var(--score-low)"
  }
}

export function getHomeschoolBadgeColor(status: string): string {
  switch (status) {
    case "Yes":
      return "var(--score-high)"
    case "Yes (grey area)":
      return "var(--score-mid)"
    default:
      return "var(--score-low)"
  }
}
