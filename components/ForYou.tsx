"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Trip, Review } from "@/lib/database.types"
import { cities } from "@/data/cities"
import WeatherCard from "@/components/for-you/WeatherCard"
import CostCard from "@/components/for-you/CostCard"
import RateCard from "@/components/for-you/RateCard"
import CityCompareCard from "@/components/for-you/CityCompareCard"
import ProfileCompleteCard from "@/components/for-you/ProfileCompleteCard"
import FamiliesNowCard from "@/components/for-you/FamiliesNowCard"

type Intelligence = {
  top_candidate_cities?: string[]
  dismissed_cities?: string[]
  primary_anxiety?: string
  decision_stage?: string
  real_budget_max?: number
  continent_preference?: string
  engagement?: string
}

type ForYouCard = {
  id: string
  priority: number
  component: React.ReactNode
}

export default function ForYou({ trips, reviews }: { trips: Trip[]; reviews: Review[] }) {
  const { family, isPaid } = useAuth()
  const [intelligence, setIntelligence] = useState<Intelligence | null>(null)

  useEffect(() => {
    if (!family) return
    supabase
      .from("family_intelligence")
      .select("top_candidate_cities, dismissed_cities, primary_anxiety, decision_stage, real_budget_max, continent_preference, engagement")
      .eq("family_id", family.id)
      .maybeSingle()
      .then(({ data }) => setIntelligence(data))
  }, [family])

  if (!family || !isPaid) return null

  const cards: ForYouCard[] = []
  const reviewedCitySlugs = new Set(reviews.map((r) => r.city_slug))
  const tripSlugs = new Set(trips.map((t) => t.city_slug))
  const candidateCities = (intelligence?.top_candidate_cities || [])
    .map((slug) => cities.find((c) => c.slug === slug))
    .filter(Boolean)

  // 1. Rate unreviewed past trips (highest priority — data collection)
  const unreviewed = trips
    .filter((t) => t.status === "been_here" && !reviewedCitySlugs.has(t.city_slug))
    .filter((t, i, arr) => arr.findIndex((a) => a.city_slug === t.city_slug) === i)
    .slice(0, 1)

  unreviewed.forEach((trip) => {
    const city = cities.find((c) => c.slug === trip.city_slug)
    if (city) {
      cards.push({
        id: `rate-${trip.city_slug}`,
        priority: 100,
        component: <RateCard key={`rate-${trip.city_slug}`} city={city} familyId={family.id} />,
      })
    }
  })

  // 2. City comparison — if researching/comparing 2+ cities
  if (candidateCities.length >= 2) {
    cards.push({
      id: "compare",
      priority: 90,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component: <CityCompareCard key="compare" cityA={candidateCities[0] as any} cityB={candidateCities[1] as any} familyEducation={family.education_approach} />,
    })
  }

  // 3. Weather window — candidate cities entering best months
  const currentMonth = new Date().toLocaleString("en-US", { month: "long" })
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleString("en-US", { month: "long" })

  const weatherCities = candidateCities.length > 0 ? candidateCities : cities.slice(0, 10)
  for (const city of weatherCities) {
    if (!city) continue
    const bestMonths = city.meta?.bestMonths || []
    if (bestMonths.includes(nextMonth) && !bestMonths.includes(currentMonth) && !tripSlugs.has(city.slug)) {
      cards.push({
        id: `weather-${city.slug}`,
        priority: 85,
        component: <WeatherCard key={`weather-${city.slug}`} city={city} nextMonth={nextMonth} />,
      })
      break
    }
    if (bestMonths.includes(currentMonth) && !tripSlugs.has(city.slug)) {
      cards.push({
        id: `weather-now-${city.slug}`,
        priority: 80,
        component: <WeatherCard key={`weather-now-${city.slug}`} city={city} nextMonth={currentMonth} isNow />,
      })
      break
    }
  }

  // 4. Cost comparison — if budget data exists
  if (intelligence?.real_budget_max && candidateCities.length > 0) {
    const affordableCities = candidateCities
      .filter((c) => c && c.cost.familyMonthly <= (intelligence.real_budget_max || 0))
    if (affordableCities.length > 0) {
      cards.push({
        id: "cost",
        priority: 75,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component: <CostCard key="cost" cities={affordableCities as any[]} budget={intelligence.real_budget_max} />,
      })
    }
  }

  // 5. Families in candidate cities
  if (candidateCities.length > 0) {
    cards.push({
      id: "families-now",
      priority: 70,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component: <FamiliesNowCard key="families-now" candidateCities={candidateCities as any[]} familyId={family.id} kidsAges={family.kids_ages || []} />,
    })
  }

  // 6. Profile completion
  const fields = [family.parent_work_type, family.education_approach, family.travel_style, family.languages?.length, family.interests?.length, family.bio, family.kids_ages?.length]
  const completeness = Math.round((fields.filter(Boolean).length / fields.length) * 100)
  if (completeness < 100) {
    const missing: string[] = []
    if (!family.parent_work_type) missing.push("work type")
    if (!family.education_approach) missing.push("education approach")
    if (!family.travel_style) missing.push("travel style")
    if (!family.languages?.length) missing.push("languages")
    if (!family.interests?.length) missing.push("interests")
    if (!family.bio) missing.push("bio")
    if (!family.kids_ages?.length) missing.push("kids ages")

    cards.push({
      id: "profile-complete",
      priority: 50,
      component: <ProfileCompleteCard key="profile-complete" completeness={completeness} missingFields={missing} />,
    })
  }

  // If no intelligence data and no trips — show discovery cards
  if (cards.length === 0) {
    // Show top-rated cities for their education preference
    const topCities = cities
      .filter((c) => c.scores.family >= 80)
      .sort((a, b) => b.scores.family - a.scores.family)
      .slice(0, 2)

    if (topCities.length >= 2) {
      cards.push({
        id: "discover-compare",
        priority: 60,
        component: <CityCompareCard key="discover-compare" cityA={topCities[0]} cityB={topCities[1]} familyEducation={family.education_approach} />,
      })
    }
  }

  if (cards.length === 0) return null

  const sorted = cards.sort((a, b) => b.priority - a.priority).slice(0, 4)

  return (
    <section className="mb-8">
      <h2 className="font-serif text-xl font-bold mb-4">For you</h2>
      <div className="space-y-3">
        {sorted.map((card) => card.component)}
      </div>
    </section>
  )
}
