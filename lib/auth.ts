import { createClient as createSupabaseClient } from "@/lib/supabase/server"
import { cache } from "react"

export const createClient = cache(() => createSupabaseClient())

export const getCurrentUser = cache(async () => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export const getUserProfile = cache(async () => {
  const supabase = createClient()
  const user = await getCurrentUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single()

  return profile
})
