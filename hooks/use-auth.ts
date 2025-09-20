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
        console.log("[v0] Auth state change:", event, !!session?.user)
        setUser(session?.user ?? null)
        setLoading(false)

        if (event === 'SIGNED_IN' && session?.user) {
          // Redirect to inbox after successful sign in
          router.push('/inbox')
        } else if (event === 'SIGNED_OUT') {
          // Redirect to login after sign out
          router.push('/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, supabase.auth])

  return { user, loading }
}
