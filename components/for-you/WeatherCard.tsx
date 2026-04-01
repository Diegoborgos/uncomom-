"use client"

import Link from "next/link"
import { City } from "@/lib/types"
import { countryCodeToFlag } from "@/lib/scores"

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

export default function WeatherCard({ city, nextMonth, isNow }: { city: City; nextMonth: string; isNow?: boolean }) {
  const bestMonths = new Set(city.meta?.bestMonths || [])
  const flag = countryCodeToFlag(city.countryCode)

  return (
    <Link href={`/cities/${city.slug}`} className="block rounded-xl overflow-hidden border border-[var(--border)] hover:border-[var(--accent-green)] transition-colors">
      <div className="relative h-28 bg-black">
        {city.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={city.photo} alt={city.name} className="w-full h-full object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
        <div className="absolute inset-0 p-4 flex flex-col justify-between">
          <div>
            <p className="text-[10px] text-[var(--accent-green)] font-medium uppercase tracking-wider">
              {isNow ? "☀️ Best season right now" : "☀️ Best season starting soon"}
            </p>
            <p className="text-lg font-serif font-bold text-white mt-1">
              {flag} {city.name}
              {isNow
                ? " is in its best months right now"
                : ` enters peak season in ${nextMonth}`}
            </p>
          </div>
        </div>
      </div>
      {/* Month bar */}
      <div className="bg-[var(--surface)] px-4 py-3">
        <div className="flex gap-0.5">
          {MONTHS.map((m) => (
            <div
              key={m}
              className={`flex-1 h-2 rounded-full ${bestMonths.has(m) ? "bg-[var(--accent-green)]" : "bg-[var(--surface-elevated)]"}`}
              title={m}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-[var(--text-secondary)]">Jan</span>
          <span className="text-[9px] text-[var(--text-secondary)]">Dec</span>
        </div>
      </div>
    </Link>
  )
}
