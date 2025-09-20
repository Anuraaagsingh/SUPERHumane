import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getSupabaseConfig } from "./supabase"

// Create server client
export const createServerSupabaseClient = () => {
  const { url, anonKey } = getSupabaseConfig()
  const cookieStore = cookies()
  
  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}

