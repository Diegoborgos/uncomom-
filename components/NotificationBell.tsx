"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import NotificationItem from "./NotificationItem"

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

export default function NotificationBell() {
  const [unread, setUnread] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchUnread = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      const res = await fetch("/api/notifications?limit=1&unread=true", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      setUnread(data.unread || 0)
    } catch { /* */ }
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      const res = await fetch("/api/notifications?limit=20", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnread(data.unread || 0)
    } catch { /* */ }
    setLoading(false)
  }, [])

  // Poll for unread count
  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 60000) // every 60s
    return () => clearInterval(interval)
  }, [fetchUnread])

  // Fetch all when dropdown opens
  useEffect(() => {
    if (open) fetchAll()
  }, [open, fetchAll])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell icon — desktop: toggle dropdown, mobile: link to /notifications */}
      {/* Desktop */}
      <button
        onClick={() => setOpen(!open)}
        className="hidden md:block relative hover:opacity-80 transition-opacity"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-[var(--accent-green)] text-black text-[9px] font-bold flex items-center justify-center px-1">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Mobile — link instead of dropdown */}
      <Link href="/notifications" className="md:hidden relative hover:opacity-80 transition-opacity">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-[var(--accent-green)] text-black text-[9px] font-bold flex items-center justify-center px-1">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Link>

      {/* Desktop dropdown */}
      {open && (
        <div className="hidden md:block absolute right-0 top-full mt-2 w-96 max-h-[480px] rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-xl overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <h3 className="font-serif font-bold text-sm">Notifications</h3>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-[10px] text-[var(--accent-green)] hover:underline">
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[400px]">
            {loading ? (
              <div className="p-6 text-center text-sm text-[var(--text-secondary)]">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-[var(--text-secondary)]">No notifications yet</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Save cities and follow families to get updates</p>
              </div>
            ) : (
              notifications.map(n => (
                <NotificationItem key={n.id} notification={n} onRead={markRead} />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center py-2.5 text-xs text-[var(--accent-green)] hover:bg-[var(--surface)] border-t border-[var(--border)]"
            >
              See all notifications
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
