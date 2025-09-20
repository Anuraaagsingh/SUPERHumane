import { createBrowserClient } from "@supabase/ssr"

// Get environment variables with fallbacks
export const getSupabaseConfig = () => ({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key'
})

// Create browser client
export const createClient = () => {
  const { url, anonKey } = getSupabaseConfig()
  return createBrowserClient(url, anonKey)
}
