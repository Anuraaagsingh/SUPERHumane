import { type CookieOptions, createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/inbox"

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: "", ...options })
          },
        },
      }
    )

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error("Auth callback error:", error)
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent(
            `Sorry, we couldn't log you in. (${error.message})`
          )}`
        )
      }
      
      // The user is authenticated, redirect them to the inbox
      return NextResponse.redirect(`${origin}${next}`)
    } catch (error: any) {
      console.error("Auth callback exception:", error)
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(
          "Sorry, an unexpected error occurred."
        )}`
      )
    }
  }

  // If no code is provided, redirect to login with an error
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("No authorization code provided.")}`
  )
}