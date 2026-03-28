"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function Hero() {
  const [where, setWhere] = useState("")
  const router = useRouter()

  const handleSearch = () => {
    if (where.trim()) {
      router.push(`/?search=${encodeURIComponent(where.trim())}`)
    } else {
      router.push("/")
    }
  }

  return (
    <section className="relative w-full h-[85vh] min-h-[600px] overflow-hidden">
      {/* Background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.unsplash.com/photo-1502086223501-7ea363882e93?w=1600&h=900&fit=crop"
        alt="Family traveling"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)]/40 via-transparent to-[var(--bg)]" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 text-center">
        <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight max-w-4xl mb-6">
          Your family belongs<br />everywhere
        </h1>
        <p className="text-lg sm:text-xl text-white/80 max-w-xl mb-10">
          Find your next city, connect with families on the road, and build a life without borders.
        </p>

        {/* Search bar — WeRoad style */}
        <div className="bg-white rounded-2xl shadow-2xl flex items-center w-full max-w-lg overflow-hidden">
          <div className="flex-1 px-5 py-4">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-0.5">Where?</p>
            <input
              type="text"
              value={where}
              onChange={(e) => setWhere(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Anywhere"
              className="text-gray-900 text-lg font-medium w-full outline-none placeholder-gray-900 bg-transparent"
            />
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div className="px-5 py-4">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-0.5">Families</p>
            <p className="text-gray-900 text-lg font-medium">45 cities</p>
          </div>
          <button
            onClick={handleSearch}
            className="bg-[var(--accent-warm)] hover:bg-[#c47a3f] transition-colors h-full px-5 flex items-center justify-center shrink-0 m-2 rounded-xl"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M16.5 16.5L21 21" />
            </svg>
          </button>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-8 mt-8 text-white/70 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌍</span>
            <span>45 cities</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏠</span>
            <span>For families</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <span>Schools & visas</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40">
        <span className="text-xs">Explore cities</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 6l4 4 4-4" />
        </svg>
      </div>
    </section>
  )
}
