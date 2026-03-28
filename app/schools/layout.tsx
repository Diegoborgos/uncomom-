import { Metadata } from "next"

export const metadata: Metadata = {
  title: "International Schools for Traveling Families | Uncomun",
  description: "Find international schools across 20+ cities. Compare curricula, fees, and family reviews. IB, British, American, Montessori, and more.",
  openGraph: {
    title: "International Schools for Traveling Families | Uncomun",
    description: "Find international schools across 20+ cities. Compare curricula, fees, and family reviews.",
  },
}

export default function SchoolsLayout({ children }: { children: React.ReactNode }) {
  return children
}
