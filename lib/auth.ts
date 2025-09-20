import { createServerSupabaseClient as createSupabaseClient } from "@/lib/supabase-server"
import { cache } from "react"

export const createServerSupabaseClient = cache(() => createSupabaseClient())

export const getCurrentUser = cache(async () => {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    // During build time or when Supabase is not configured, return null
    console.log("Auth check failed:", error)
    return null
  }
})

export const getUserProfile = cache(async () => {
  try {
    const supabase = createServerSupabaseClient()
    const user = await getCurrentUser()

    if (!user) return null

    const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

    return profile
  } catch (error) {
    console.log("Profile fetch failed:", error)
    return null
  }
})
