import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/profile", "/onboarding", "/auth/"],
      },
    ],
    sitemap: "https://uncomom.vercel.app/sitemap.xml",
  }
}
