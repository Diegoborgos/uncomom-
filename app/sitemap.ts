import { MetadataRoute } from "next"
import { cities } from "@/data/cities"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://uncomom.vercel.app"

  const cityPages = cities.map((city) => ({
    url: `${baseUrl}/cities/${city.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  const staticPages = [
    { url: baseUrl, priority: 1.0 },
    { url: `${baseUrl}/map`, priority: 0.7 },
    { url: `${baseUrl}/schools`, priority: 0.7 },
    { url: `${baseUrl}/visas`, priority: 0.7 },
    { url: `${baseUrl}/compare`, priority: 0.6 },
    { url: `${baseUrl}/calculator`, priority: 0.7 },
    { url: `${baseUrl}/families`, priority: 0.6 },
    { url: `${baseUrl}/meetups`, priority: 0.6 },
    { url: `${baseUrl}/member-map`, priority: 0.5 },
    { url: `${baseUrl}/kids-finder`, priority: 0.6 },
    { url: `${baseUrl}/membership`, priority: 0.7 },
    { url: `${baseUrl}/tracker`, priority: 0.6 },
    { url: `${baseUrl}/homeschool-laws`, priority: 0.8 },
    { url: `${baseUrl}/about`, priority: 0.4 },
  ].map((page) => ({
    ...page,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
  }))

  return [...staticPages, ...cityPages]
}
