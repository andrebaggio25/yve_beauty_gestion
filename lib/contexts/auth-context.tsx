'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { UserProfile, AuthContext as AuthContextType } from '@/types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

let supabaseInstance: ReturnType<typeof createClient> | null = null

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getSupabaseClient = useCallback(() => {
    if (!supabaseInstance) {
      supabaseInstance = createClient()
    }
    return supabaseInstance
  }, [])

  useEffect(() => {
    const supabase = getSupabaseClient()

    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          
          try {
            // Add timeout to prevent infinite hang
            const profilePromise = supabase
              .from('user_profile')
              .select('*')
              .eq('auth_user_id', session.user.id)
              .single()

            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile fetch timeout after 10s')), 10000)
            )

            const { data: profile, error: profileError } = await Promise.race([
              profilePromise,
              timeoutPromise
            ]) as any


            if (profileError) {
              // PGRST116 = no rows
              if (profileError.code === 'PGRST116') {
                // No profile found - this is OK
              } else if (profileError.code !== 'PGRST116') {
                throw profileError
              }
            }
            
            if (profile) {
              // Profile loaded successfully
            }
            
            // profile may not exist for newly created users; allow app to proceed
            setUserProfile(profile ?? null)
          } catch (profileFetchError) {
            // Continue anyway - don't block auth
            setUserProfile(null)
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch session'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      
      // DON'T set loading=true here - it causes the app to wait for profile fetch again
      // Initial fetch already has the profile
      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (newSession?.user) {
        try {
          const profilePromise = supabase
            .from('user_profile')
            .select('*')
            .eq('auth_user_id', newSession.user.id)
            .single()

          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile fetch timeout after 10s')), 10000)
          )

          const { data: profile, error: profileError } = await Promise.race([
            profilePromise,
            timeoutPromise
          ]) as any


          if (profileError) {
            if (profileError.code === 'PGRST116') {
            } else if (profileError.code !== 'PGRST116') {
              throw profileError
            }
          }
          
          if (profile) {
          }
          
          // proceed even if profile doesn't exist
          setUserProfile(profile ?? null)
        } catch (err) {
          setUserProfile(null)
        }
      } else {
        setUserProfile(null)
        // Only set loading=false when logging out
        setLoading(false)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [getSupabaseClient])

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        session,
        loading,
        error,
      }}
    >
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
