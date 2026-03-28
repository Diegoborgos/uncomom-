import { Metadata } from "next"
import { calculatorPageJsonLd } from "@/lib/structured-data"

export const metadata: Metadata = {
  title: "Family Cost Calculator — Compare Living Costs Worldwide | Uncomun",
  description: "How much does it cost to live abroad with a family? Compare monthly costs across 45+ cities. Adjust for family size, kids, and education approach.",
}

export default function CalculatorLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = calculatorPageJsonLd()
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  )
}
