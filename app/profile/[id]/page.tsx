"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

// Redirect /profile/[id] to /[username] for backward compatibility
export default function ProfileRedirect() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  useEffect(() => {
    const resolve = async () => {
      const isUUID = id.includes("-") && id.length > 30

      if (!isUUID) {
        // Already a username — redirect directly
        router.replace(`/${id}`)
        return
      }

      // Lookup username from UUID
      const { data } = await supabase
        .from("families")
        .select("username")
        .eq("id", id)
        .single()

      if (data?.username) {
        router.replace(`/${data.username}`)
      } else {
        // No username — use UUID on the new route
        router.replace(`/${id}`)
      }
    }
    resolve()
  }, [id, router])

  return <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">Redirecting...</div>
}
