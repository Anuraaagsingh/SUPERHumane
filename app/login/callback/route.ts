import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSupabaseConfig } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/inbox"

  console.log("[v0] OAuth callback - code:", !!code, "next:", next)

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

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    console.log("[v0] Auth exchange error:", error)

    if (!error) {
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
  }

  console.log("[v0] Auth failed, redirecting to login")
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`)
}
