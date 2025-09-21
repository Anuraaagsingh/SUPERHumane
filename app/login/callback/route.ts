import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'
// Remove edge runtime to allow Node.js modules to work

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/inbox"

  console.log("[AUTH] Callback received with code:", !!code, "next:", next)

  if (code) {
    const supabase = createClient()

    try {
      console.log("[AUTH] Exchanging code for session...")
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error("[AUTH] Callback error:", error)
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent(
            `Sorry, we couldn't log you in. (${error.message})`
          )}`
        )
      }
      
      // Log session details for debugging
      console.log("[AUTH] Session established:", {
        hasUser: !!data.session?.user,
        email: data.session?.user?.email,
        provider: data.session?.user?.app_metadata?.provider,
        hasProviderToken: !!data.session?.provider_token,
      })
      
      // Call the setup-profile API to ensure user data is saved
      try {
        const setupResponse = await fetch(`${origin}/api/auth/setup-profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })
        
        if (!setupResponse.ok) {
          console.warn("[AUTH] Profile setup warning:", await setupResponse.text())
        }
      } catch (setupError) {
        console.error("[AUTH] Profile setup error:", setupError)
        // Continue with redirect even if profile setup fails
      }
      
      // The user is authenticated, redirect them to the inbox
      return NextResponse.redirect(`${origin}${next}`)
    } catch (error: any) {
      console.error("[AUTH] Callback exception:", error)
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(
          "Sorry, an unexpected error occurred during login."
        )}`
      )
    }
  }

  // If no code is provided, redirect to login with an error
  console.error("[AUTH] No authorization code provided in callback")
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("No authorization code was provided. Please try again.")}`
  )
}