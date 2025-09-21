import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/inbox"

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options })
          },
        },
      }
    )

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error("Gmail callback error:", error)
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Gmail authentication failed: " + error.message)}`)
      }

      if (data?.user) {
        console.log("Gmail user authenticated successfully:", data.user.email)
        return NextResponse.redirect(`${origin}${next}`)
      }
    } catch (error: any) {
      console.error("Gmail callback exception:", error)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Gmail authentication failed")}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("No Gmail authorization code provided")}`)
}
