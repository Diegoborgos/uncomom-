import { City, Filters, SortOption, CostRange } from "./types"
import { calculateDefaultFIS } from "./fis"

export function filterCities(cities: City[], filters: Filters): City[] {
  let result = [...cities]

  // Search
  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q)
    )
  }

  // Continent
  if (filters.continents.length > 0) {
    result = result.filter((c) => filters.continents.includes(c.continent))
  }

  // Cost range
  if (filters.costRange.length > 0) {
    result = result.filter((c) =>
      filters.costRange.some((range) => matchesCostRange(c.cost.familyMonthly, range))
    )
  }

  // Homeschool
  if (filters.homeschool.length > 0) {
    result = result.filter((c) => {
      if (filters.homeschool.includes("legal") && c.meta.homeschoolLegal === "Yes") return true
      if (filters.homeschool.includes("grey") && c.meta.homeschoolLegal === "Yes (grey area)") return true
      if (filters.homeschool.includes("any")) return true
      return false
    })
  }

  // Tags
  if (filters.tags.length > 0) {
    result = result.filter((c) =>
      filters.tags.some((tag) => c.tags.includes(tag))
    )
  }

  // Climate (mapped from tags)
  if (filters.climate.length > 0) {
    result = result.filter((c) =>
      filters.climate.some((climate) => c.tags.includes(climate))
    )
  }

  // Sort
  result = sortCities(result, filters.sort)

  return result
}

function matchesCostRange(cost: number, range: CostRange): boolean {
  switch (range) {
    case "under-2k": return cost < 2000
    case "2-3k": return cost >= 2000 && cost < 3000
    case "3-4k": return cost >= 3000 && cost < 4000
    case "over-4k": return cost >= 4000
  }
}

function sortCities(cities: City[], sort: SortOption): City[] {
  return cities.sort((a, b) => {
    switch (sort) {
      case "fis": return calculateDefaultFIS(b).score - calculateDefaultFIS(a).score
      case "family": return b.scores.family - a.scores.family
      case "cost": return a.cost.familyMonthly - b.cost.familyMonthly
      case "childSafety": return b.scores.childSafety - a.scores.childSafety
      case "nature": return b.scores.nature - a.scores.nature
      case "internet": return b.scores.internet - a.scores.internet
      case "familiesNow": return b.meta.familiesNow - a.meta.familiesNow
      case "returnRate": return b.meta.returnRate - a.meta.returnRate
      default: return calculateDefaultFIS(b).score - calculateDefaultFIS(a).score
    }
  })
}

export function filtersToParams(filters: Filters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.search) params.set("search", filters.search)
  if (filters.sort !== "fis") params.set("sort", filters.sort)
  if (filters.continents.length) params.set("continent", filters.continents.join(","))
  if (filters.costRange.length) params.set("cost", filters.costRange.join(","))
  if (filters.climate.length) params.set("climate", filters.climate.join(","))
  if (filters.homeschool.length) params.set("homeschool", filters.homeschool.join(","))
  if (filters.tags.length) params.set("tags", filters.tags.join(","))
  return params
}

export function paramsToFilters(params: URLSearchParams): Filters {
  return {
    search: params.get("search") || "",
    sort: (params.get("sort") as SortOption) || "fis",
    continents: params.get("continent")?.split(",").filter(Boolean) || [],
    costRange: (params.get("cost")?.split(",").filter(Boolean) as CostRange[]) || [],
    climate: (params.get("climate")?.split(",").filter(Boolean) || []) as Filters["climate"],
    homeschool: params.get("homeschool")?.split(",").filter(Boolean) || [],
    tags: params.get("tags")?.split(",").filter(Boolean) || [],
  }
}

export const defaultFilters: Filters = {
  search: "",
  sort: "fis",
  continents: [],
  costRange: [],
  climate: [],
  homeschool: [],
  tags: [],
}
