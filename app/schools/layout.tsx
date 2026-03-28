import { Metadata } from "next"
import { schoolsPageJsonLd } from "@/lib/structured-data"

export const metadata: Metadata = {
  title: "International Schools for Traveling Families | Uncomun",
  description: "Find international schools across 20+ cities. Compare curricula, fees, and family reviews. IB, British, American, Montessori, and more.",
}

export default function SchoolsLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = schoolsPageJsonLd()
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  )
}
