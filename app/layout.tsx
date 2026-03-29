import type { Metadata } from "next"
import "./globals.css"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { AuthProvider } from "@/lib/auth-context"
import JoinOverlay from "@/components/JoinOverlay"
import { homepageJsonLd } from "@/lib/structured-data"

export const metadata: Metadata = {
  title: {
    default: "Uncomun — Family Travel City Directory",
    template: "%s | Uncomun",
  },
  description: "Find your family's next home. A city directory for entrepreneurial families who travel and live globally. Family Scores, costs, schools, visas for 45+ cities.",
  openGraph: {
    title: "Uncomun — Family Travel City Directory",
    description: "City scores, costs, schools, and visa guides for families who travel and live globally.",
    siteName: "Uncomun",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Uncomun — Family Travel City Directory",
    description: "City scores, costs, schools, and visa guides for families who travel and live globally.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = homepageJsonLd()

  return (
    <html lang="en">
      <head>
        {jsonLd.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <JoinOverlay />
        </AuthProvider>
      </body>
    </html>
  )
}
