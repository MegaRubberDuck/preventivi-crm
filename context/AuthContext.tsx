'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseClient()

    const initAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Failed to get session:', error.message)
        }
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      return { error: error.message }
    }
    return { error: null }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) {
      return { error: error.message }
    }
    return { error: null }
  }, [])

  const signOut = useCallback(async (): Promise<void> => {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out failed:', error.message)
      throw error
    }
    window.location.href = '/login'
  }, [])

  const value = useMemo(
    () => ({ user, session, loading, signIn, signUp, signOut }),
    [user, session, loading, signIn, signUp, signOut]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}