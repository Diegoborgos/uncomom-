"use client"

import dynamic from "next/dynamic"
import { useAuth } from "@/lib/auth-context"
import { PaywallGate } from "@/components/Paywall"

const MemberMapContent = dynamic(() => import("@/components/MemberMapContent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-[var(--bg)]">
      <p className="text-[var(--text-secondary)]">Loading map...</p>
    </div>
  ),
})

export default function MemberMapPage() {
  const { isPaid, loading } = useAuth()

  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-[var(--bg)]">
        <p className="text-[var(--text-secondary)]">Loading...</p>
      </div>
    )
  }

  if (!isPaid) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20">
        <PaywallGate feature="Member Map" />
      </div>
    )
  }

  return (
    <div className="relative w-full h-[calc(100vh-64px)]">
      <MemberMapContent />
    </div>
  )
}
