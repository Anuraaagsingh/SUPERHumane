import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { cache } from "react"

export const createServerSupabaseClient = cache(() => {
  const cookieStore = cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
})

export const getCurrentUser = cache(async () => {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
})

export const getUserProfile = cache(async () => {
  const supabase = createServerSupabaseClient()
  const user = await getCurrentUser()

  if (!user) return null

  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  return profile
})
