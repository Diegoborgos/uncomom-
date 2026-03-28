"use client"

import dynamic from "next/dynamic"
import { useAuth } from "@/lib/auth-context"
import Paywall from "@/components/Paywall"

const MemberMapContent = dynamic(() => import("@/components/MemberMapContent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[calc(100vh-180px)] flex items-center justify-center bg-[var(--bg)]">
      <p className="text-[var(--text-secondary)]">Loading map...</p>
    </div>
  ),
})

export default function MemberMapPage() {
  const { isPaid } = useAuth()

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="font-serif text-3xl font-bold mb-1">Member Map</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Where Uncomun families are right now.
        </p>
      </div>

      {isPaid ? (
        <div className="w-full h-[calc(100vh-180px)]">
          <MemberMapContent />
        </div>
      ) : (
        <Paywall feature="Member Map is for members" preview={
          <div className="w-full h-[400px] bg-[var(--surface)]" />
        }>
          <div className="w-full h-[calc(100vh-180px)]">
            <MemberMapContent />
          </div>
        </Paywall>
      )}
    </div>
  )
}
