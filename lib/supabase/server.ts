import { type CookieOptions, createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ 
              name, 
              value, 
              ...options,
              // Ensure cookies are properly set for auth
              path: options.path || '/',
              sameSite: options.sameSite || 'lax',
              httpOnly: options.httpOnly !== false,
              secure: process.env.NODE_ENV === 'production' || options.secure,
            })
          } catch (error) {
            console.warn('[Cookie Error] Failed to set cookie in server component:', error)
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ 
              name, 
              value: "", 
              ...options,
              path: options.path || '/',
              expires: new Date(0),
            })
          } catch (error) {
            console.warn('[Cookie Error] Failed to remove cookie in server component:', error)
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
