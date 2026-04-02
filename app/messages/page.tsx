"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"

type Conversation = {
  id: string
  otherFamily: {
    id: string
    family_name: string
    username: string | null
    avatar_url: string | null
    country_code: string
  }
  lastMessageText: string | null
  lastMessageAt: string | null
  unreadCount: number
}

type Message = {
  id: string
  sender_id: string
  text: string
  read_at: string | null
  created_at: string
}

function MessagesContent() {
  const { user, family, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeChatId = searchParams.get("chat")

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [myFamilyId, setMyFamilyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [msgLoading, setMsgLoading] = useState(false)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) { setLoading(false); return }

    try {
      const res = await fetch("/api/conversations", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      setConversations(data.conversations || [])
      setMyFamilyId(data.myFamilyId || null)
    } catch { /* */ }
    setLoading(false)
  }, [])

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (convoId: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return

    setMsgLoading(true)
    try {
      const res = await fetch(`/api/messages?conversationId=${convoId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      setMessages(data.messages || [])
      setMyFamilyId(data.myFamilyId || myFamilyId)
    } catch { /* */ }
    setMsgLoading(false)
  }, [myFamilyId])

  // Initial load
  useEffect(() => {
    if (!authLoading && user) fetchConversations()
    else if (!authLoading && !user) { setLoading(false) }
  }, [authLoading, user, fetchConversations])

  // Load messages when active chat changes
  useEffect(() => {
    if (activeChatId) fetchMessages(activeChatId)
  }, [activeChatId, fetchMessages])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input
  useEffect(() => {
    if (activeChatId && !sending) inputRef.current?.focus()
  }, [activeChatId, sending])

  // Real-time subscription for active conversation
  useEffect(() => {
    if (!activeChatId) return

    const channel = supabase
      .channel(`messages:${activeChatId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${activeChatId}`,
      }, (payload) => {
        const newMsg = payload.new as Message
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })
        // Update conversation list preview
        setConversations(prev => prev.map(c =>
          c.id === activeChatId
            ? { ...c, lastMessageText: newMsg.text, lastMessageAt: newMsg.created_at, unreadCount: 0 }
            : c
        ))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeChatId])

  // Send message
  const send = async () => {
    if (!input.trim() || sending || !activeChatId) return
    const text = input.trim()
    setInput("")
    setSending(true)

    // Optimistic update
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      sender_id: myFamilyId || "",
      text,
      read_at: null,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ conversationId: activeChatId, text }),
      })
      const data = await res.json()

      // Replace optimistic with real message
      if (data.message) {
        setMessages(prev => prev.map(m => m.id === optimistic.id ? data.message : m))
      }

      // Update conversation preview
      setConversations(prev => prev.map(c =>
        c.id === activeChatId
          ? { ...c, lastMessageText: text, lastMessageAt: new Date().toISOString() }
          : c
      ))
    } catch { /* */ }
    setSending(false)
  }

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">Loading...</div>
  if (!user) {
    router.push("/login")
    return null
  }

  const activeConvo = conversations.find(c => c.id === activeChatId)

  // Mobile: show chat view if active, else show list
  const showChat = !!activeChatId

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Conversation list — hidden on mobile when chat is active */}
      <div className={`${showChat ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 border-r border-[var(--border)] bg-[var(--bg)]`}>
        <div className="p-4 border-b border-[var(--border)]">
          <h1 className="font-serif text-xl font-bold">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-[var(--text-secondary)] mb-2">No messages yet</p>
              <p className="text-xs text-[var(--text-secondary)]">Visit a family profile and click &quot;Message&quot; to start.</p>
            </div>
          ) : (
            conversations.map(convo => (
              <Link
                key={convo.id}
                href={`/messages?chat=${convo.id}`}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface)] transition-colors border-b border-[var(--border)] ${
                  activeChatId === convo.id ? "bg-[var(--surface)]" : ""
                }`}
              >
                {/* Avatar */}
                {convo.otherFamily.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={convo.otherFamily.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--accent-green)] text-black flex items-center justify-center text-xs font-bold shrink-0">
                    {convo.otherFamily.family_name?.slice(0, 2).toUpperCase() || "??"}
                  </div>
                )}
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${convo.unreadCount > 0 ? "font-bold" : "font-medium"}`}>
                      {convo.otherFamily.family_name}
                    </p>
                    {convo.lastMessageAt && (
                      <span className="text-[10px] text-[var(--text-secondary)] shrink-0 ml-2">
                        {timeAgo(convo.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs text-[var(--text-secondary)] truncate flex-1">
                      {convo.lastMessageText || "No messages yet"}
                    </p>
                    {convo.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[var(--accent-green)] text-black text-[10px] font-bold flex items-center justify-center shrink-0">
                        {convo.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Chat view */}
      <div className={`${showChat ? "flex" : "hidden md:flex"} flex-col flex-1 bg-[var(--bg)]`}>
        {!activeChatId ? (
          <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]">
            <div className="text-center">
              <p className="text-lg mb-1">Select a conversation</p>
              <p className="text-xs">Or visit a profile to start a new one</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
              {/* Back button — mobile only */}
              <Link href="/messages" className="md:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 4l-6 6 6 6" />
                </svg>
              </Link>
              {activeConvo && (
                <Link href={`/profile/${activeConvo.otherFamily.username || activeConvo.otherFamily.id}`} className="flex items-center gap-3 hover:opacity-80">
                  {activeConvo.otherFamily.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={activeConvo.otherFamily.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--accent-green)] text-black flex items-center justify-center text-[10px] font-bold">
                      {activeConvo.otherFamily.family_name?.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <p className="text-sm font-medium">{activeConvo.otherFamily.family_name}</p>
                </Link>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {msgLoading ? (
                <div className="flex items-center justify-center h-full text-[var(--text-secondary)] text-sm">Loading...</div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-[var(--text-secondary)] text-sm">
                  Say hello! Start the conversation.
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.sender_id === myFamilyId
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed ${
                        isMe
                          ? "bg-[var(--accent-green)] text-black rounded-2xl rounded-br-md"
                          : "bg-[var(--surface)] text-[var(--text-primary)] rounded-2xl rounded-bl-md"
                      }`}>
                        {msg.text}
                        <p className={`text-[9px] mt-1 ${isMe ? "text-black/50" : "text-[var(--text-secondary)]"}`}>
                          {new Date(msg.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-[var(--border)]">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
                  disabled={sending}
                  placeholder="Type a message..."
                  className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--accent-green)] transition-colors disabled:opacity-50"
                />
                <button
                  onClick={send}
                  disabled={sending || !input.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[var(--accent-green)] text-black font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "now"
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[var(--text-secondary)]">Loading...</div>}>
      <MessagesContent />
    </Suspense>
  )
}
