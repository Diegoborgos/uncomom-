"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { User, Session } from "@supabase/supabase-js"
import { supabase, isSupabaseConfigured } from "./supabase"
import { Family } from "./database.types"

type AuthState = {
  user: User | null
  family: Family | null
  session: Session | null
  loading: boolean
  isPaid: boolean
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshFamily: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  family: null,
  session: null,
  loading: true,
  isPaid: false,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  refreshFamily: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [family, setFamily] = useState<Family | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchFamily = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from("families")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()
      setFamily(data)
    } catch {
      setFamily(null)
    }
  }, [])

  const refreshFamily = useCallback(async () => {
    if (user) await fetchFamily(user.id)
  }, [user, fetchFamily])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        try { await fetchFamily(session.user.id) } catch { /* */ }
      }
      setLoading(false)
    })

    if (!isSupabaseConfigured) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          try { await fetchFamily(session.user.id) } catch { /* */ }
        } else {
          setFamily(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchFamily])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error?.message ?? null }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setFamily(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, family, session, loading, isPaid: family?.membership_tier === "paid", signUp, signIn, signOut, refreshFamily }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
