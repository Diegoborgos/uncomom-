import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Visa Guide for Traveling Families | Uncomun",
  description: "Digital nomad visas, residency permits, and tourist visa options for families. Duration, cost, income requirements, and family eligibility.",
  openGraph: {
    title: "Visa Guide for Traveling Families | Uncomun",
    description: "Digital nomad visas, residency permits, and tourist visa options for families.",
  },
}

export default function VisasLayout({ children }: { children: React.ReactNode }) {
  return children
}
