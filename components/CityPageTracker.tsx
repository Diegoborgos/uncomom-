"use client"

import { useEffect } from "react"
import { track, trackPageTime } from "@/lib/tracking"

export default function CityPageTracker({ citySlug, cityName }: { citySlug: string; cityName: string }) {
  useEffect(() => {
    track("city_viewed", { citySlug, cityName })
    const cleanup = trackPageTime(`city_${citySlug}`)
    return cleanup
  }, [citySlug, cityName])

  return null
}
