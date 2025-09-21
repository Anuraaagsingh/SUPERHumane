"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[Supabase Auth] State change:", {
          event,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          provider: session?.user?.app_metadata?.provider
        })
        
        setUser(session?.user ?? null)
        setLoading(false)

        if (event === 'SIGNED_IN' && session?.user) {
          console.log("[Supabase Auth] User signed in, setting up profile...")
          
          // Call setup profile for all logins
          try {
            const response = await fetch('/api/auth/setup-profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            })
            
            if (response.ok) {
              console.log('[Supabase Auth] Profile setup successful')
              // Redirect to inbox after successful setup
              router.push('/inbox')
            } else {
              console.error('[Supabase Auth] Profile setup failed:', response.status)
              // Still redirect to inbox even if setup fails
              router.push('/inbox')
            }
          } catch (error) {
            console.error('[Supabase Auth] Profile setup error:', error)
            // Still redirect to inbox even if setup fails
            router.push('/inbox')
          }
        } else if (event === 'SIGNED_OUT') {
          console.log("[Supabase Auth] User signed out")
          // Redirect to login after sign out
          router.push('/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, supabase.auth])

  return { user, loading }
}
