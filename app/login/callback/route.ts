import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSupabaseConfig } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/inbox"
  const error = searchParams.get("error")

  console.log("[v0] OAuth callback - code:", !!code, "next:", next, "error:", error)

  // Handle OAuth errors
  if (error) {
    console.log("[v0] OAuth error:", error)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`)
  }

  if (code) {
    const cookieStore = cookies()
    const { url, anonKey } = getSupabaseConfig()
    
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.delete({ name, ...options })
        },
      },
    })

    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      console.log("[v0] Auth exchange result - user:", !!data?.user, "error:", exchangeError)

      if (exchangeError) {
        console.error("[v0] Auth exchange error:", exchangeError)
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(exchangeError.message)}`)
      }

      if (data?.user) {
        // Set up user profile and email account
        try {
          const setupResponse = await fetch(`${origin}/api/auth/setup-profile`, {
            method: "POST",
            headers: {
              Cookie: cookieStore.toString(),
            },
          })

          console.log("[v0] Profile setup response:", setupResponse.status)
        } catch (setupError) {
          console.error("Profile setup error:", setupError)
          // Continue anyway, profile can be set up later
        }

        console.log("[v0] Redirecting to:", `${origin}${next}`)
        return NextResponse.redirect(`${origin}${next}`)
      }
    } catch (error) {
      console.error("[v0] Auth exchange exception:", error)
      return NextResponse.redirect(`${origin}/login?error=Authentication failed`)
    }
  }

  console.log("[v0] No code provided, redirecting to login")
  return NextResponse.redirect(`${origin}/login?error=No authorization code provided`)
}
