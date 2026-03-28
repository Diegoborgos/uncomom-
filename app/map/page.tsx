"use client"

import dynamic from "next/dynamic"
import { cities } from "@/data/cities"

const CityMap = dynamic(() => import("@/components/CityMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[calc(100vh-73px)] flex items-center justify-center bg-[var(--bg)]">
      <p className="text-[var(--text-secondary)]">Loading map...</p>
    </div>
  ),
})

export default function MapPage() {
  return (
    <div className="w-full h-[calc(100vh-73px)]">
      <CityMap cities={cities} />
    </div>
  )
}
