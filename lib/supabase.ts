import { createBrowserClient } from "@supabase/ssr"

// Get environment variables with fallbacks
export const getSupabaseConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key'
  
  // Debug logging for Vercel deployment
  if (typeof window === 'undefined') {
    console.log('[v0] Supabase Config - URL:', url)
    console.log('[v0] Supabase Config - AnonKey:', anonKey ? 'Present' : 'Missing')
    console.log('[v0] Environment - NODE_ENV:', process.env.NODE_ENV)
  }
  
  return { url, anonKey }
}

// Create browser client
export const createClient = () => {
  const { url, anonKey } = getSupabaseConfig()
  return createBrowserClient(url, anonKey)
}
