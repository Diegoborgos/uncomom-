import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Family Cost Calculator — Compare Living Costs Worldwide | Uncomun",
  description: "How much does it cost to live abroad with a family? Compare monthly costs across 30+ cities. Adjust for family size, kids, and education approach.",
  openGraph: {
    title: "Family Cost Calculator — Compare Living Costs Worldwide | Uncomun",
    description: "How much does it cost to live abroad with a family? Compare monthly costs across 30+ cities.",
  },
}

export default function CalculatorLayout({ children }: { children: React.ReactNode }) {
  return children
}
