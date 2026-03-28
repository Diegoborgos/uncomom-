import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Family Travel Map — Cities for Traveling Families | Uncomun",
  description: "Interactive map of family-friendly cities worldwide. View Family Scores, costs, and community data at a glance.",
}

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 flex flex-col">{children}</div>
}
