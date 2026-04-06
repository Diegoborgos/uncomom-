"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import NotificationItem from "@/components/NotificationItem"

type Notification = {
  id: string
  type: string
  title: string
  body: string | null
  icon_url: string | null
  action_url: string | null
  read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!authLoading && !user) router.push("/login")
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      const res = await fetch("/api/notifications?limit=50", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnread(data.unread || 0)
      setLoading(false)
    }
    load()
  }, [user])

  const markRead = async (notificationId: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ notificationId }),
    })
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n))
    setUnread(prev => Math.max(0, prev - 1))
  }

  const markAllRead = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ markAllRead: true }),
    })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnread(0)
  }

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold">Notifications</h1>
        {unread > 0 && (
          <button onClick={markAllRead} className="text-xs text-[var(--accent-green)] hover:underline">
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center">
          <p className="text-[var(--text-secondary)] mb-2">No notifications yet</p>
          <p className="text-xs text-[var(--text-secondary)]">
            Save cities and follow families to get updates here.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map(n => (
            <NotificationItem key={n.id} notification={n} onRead={markRead} />
          ))}
        </div>
      )}
    </div>
  )
}
