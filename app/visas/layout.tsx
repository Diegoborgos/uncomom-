import { Metadata } from "next"
import { visasPageJsonLd } from "@/lib/structured-data"

export const metadata: Metadata = {
  title: "Visa Guide for Traveling Families | Uncomun",
  description: "Digital nomad visas, residency permits, and tourist visa options for families. Duration, cost, income requirements, and family eligibility for 15+ countries.",
}

export default function VisasLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = visasPageJsonLd()
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  )
}
