"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { cities } from "@/data/cities"
import { countryCodeToFlag, formatEuro } from "@/lib/scores"

const EDUCATION_OPTIONS = [
  { value: "international", label: "International school", multiplier: 1 },
  { value: "local", label: "Local school", multiplier: 0 },
  { value: "homeschool", label: "Homeschool", multiplier: 0 },
]

function calcTotal(
  city: typeof cities[0],
  numKids: number,
  numAdults: number,
  edu: string
): number {
  const schoolCost = edu === "international"
    ? city.cost.internationalSchool * numKids
    : edu === "local"
      ? city.cost.localSchool * numKids
      : 0
  const childcareCost = numKids > 0 ? city.cost.childcare : 0
  return city.cost.rent2br + schoolCost + childcareCost + (numKids > 0 ? 400 : 200) * (numKids + numAdults)
}

export default function CalculatorPage() {
  const [adults, setAdults] = useState(2)
  const [kids, setKids] = useState(2)
  const [education, setEducation] = useState("international")
  const [selectedCity, setSelectedCity] = useState("")

  const sorted = useMemo(() => {
    return [...cities].sort((a, b) => {
      const costA = calcTotal(a, kids, adults, education)
      const costB = calcTotal(b, kids, adults, education)
      return costA - costB
    })
  }, [kids, adults, education])

  const selected = selectedCity ? cities.find((c) => c.slug === selectedCity) : null

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-bold mb-2">Family Cost Calculator</h1>
        <p className="text-[var(--text-secondary)]">
          How far does your budget stretch? Compare the real cost of family life across {cities.length} cities.
        </p>
      </div>

      {/* Inputs */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-2">Adults</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAdults(Math.max(1, adults - 1))}
                className="w-8 h-8 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)] transition-colors"
              >
                −
              </button>
              <span className="font-mono text-xl font-bold w-6 text-center">{adults}</span>
              <button
                onClick={() => setAdults(Math.min(4, adults + 1))}
                className="w-8 h-8 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)] transition-colors"
              >
                +
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-2">Kids</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setKids(Math.max(0, kids - 1))}
                className="w-8 h-8 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)] transition-colors"
              >
                −
              </button>
              <span className="font-mono text-xl font-bold w-6 text-center">{kids}</span>
              <button
                onClick={() => setKids(Math.min(6, kids + 1))}
                className="w-8 h-8 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-green)] transition-colors"
              >
                +
              </button>
            </div>
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-[var(--text-secondary)] mb-2">Education approach</label>
            <div className="flex gap-2">
              {EDUCATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setEducation(opt.value)}
                  className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${
                    education === opt.value
                      ? "bg-[rgb(var(--accent-green-rgb)/0.15)] border-[var(--accent-green)] text-[var(--accent-green)]"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* City ranking */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-4 text-xs text-[var(--text-secondary)] font-medium">
          <span>City</span>
          <span>Est. monthly ({adults} adult{adults > 1 ? "s" : ""} + {kids} kid{kids !== 1 ? "s" : ""})</span>
        </div>
        {sorted.map((city, i) => {
          const total = calcTotal(city, kids, adults, education)
          const isSelected = city.slug === selectedCity
          return (
            <button
              key={city.slug}
              onClick={() => setSelectedCity(isSelected ? "" : city.slug)}
              className={`w-full flex items-center justify-between rounded-xl border p-4 text-left transition-colors ${
                isSelected
                  ? "border-[var(--accent-green)] bg-[rgb(var(--accent-green-rgb)/0.05)]"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[rgb(var(--accent-green-rgb)/0.5)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--text-secondary)] w-6 font-mono">{i + 1}</span>
                <span className="font-medium">
                  {countryCodeToFlag(city.countryCode)} {city.name}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">{city.country}</span>
              </div>
              <span className="font-mono font-bold text-[var(--accent-warm)]">
                {formatEuro(total)}/mo
              </span>
            </button>
          )
        })}
      </div>

      {/* Expanded city detail */}
      {selected && (
        <div className="mt-6 rounded-xl border border-[rgb(var(--accent-green-rgb)/0.3)] bg-[var(--surface)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-xl font-bold">
              {countryCodeToFlag(selected.countryCode)} {selected.name} — Cost Breakdown
            </h3>
            <Link
              href={`/cities/${selected.slug}`}
              className="text-sm text-[var(--accent-green)] hover:underline"
            >
              View city →
            </Link>
          </div>
          <div className="space-y-3 text-sm">
            <CostRow label="🏠 Rent (2br furnished)" value={selected.cost.rent2br} />
            {kids > 0 && education === "international" && (
              <CostRow label={`🎓 International school (${kids} kid${kids > 1 ? "s" : ""})`} value={selected.cost.internationalSchool * kids} />
            )}
            {kids > 0 && education === "local" && (
              <CostRow label={`🏫 Local school (${kids} kid${kids > 1 ? "s" : ""})`} value={selected.cost.localSchool * kids} />
            )}
            {kids > 0 && (
              <CostRow label="👶 Childcare" value={selected.cost.childcare} />
            )}
            <CostRow label={`🍽 Living expenses (${adults + kids} people est.)`} value={(kids + adults) * (kids > 0 ? 400 : 200)} />
            <div className="border-t border-[var(--border)] pt-3 flex justify-between font-bold">
              <span>Total estimated</span>
              <span className="font-mono text-lg text-[var(--accent-warm)]">
                {formatEuro(calcTotal(selected, kids, adults, education))}/mo
              </span>
            </div>
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] mt-4">
            Rough estimates. Actual costs vary by neighbourhood, lifestyle, and season. Living expenses include food, transport, activities, and healthcare.
          </p>
          <p className="text-[10px] text-[var(--text-secondary)] mt-1">
            Per-person living costs are a heuristic (€400/person with kids, €200/person without). Per-city rates will activate when Numbeo data is live.
          </p>
        </div>
      )}
    </div>
  )
}

function CostRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className="font-mono">{formatEuro(value)}/mo</span>
    </div>
  )
}
