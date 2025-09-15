import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    },
  )

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Check if user profile already exists
    const { data: existingProfile } = await supabase.from("users").select("id").eq("id", user.id).single()

    if (!existingProfile) {
      // Create user profile
      const { error: profileError } = await supabase.from("users").insert({
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email!.split("@")[0],
        avatar_url: user.user_metadata?.avatar_url,
        settings: {
          theme: "light",
          keyboard_shortcuts: true,
          notifications: {
            email: true,
            push: false,
          },
          inbox_splits: [
            { name: "Primary", rules: [] },
            { name: "Social", rules: [{ type: "sender_domain", value: "twitter.com" }] },
            { name: "Updates", rules: [{ type: "sender_domain", value: "github.com" }] },
          ],
        },
      })

      if (profileError) {
        console.error("Profile creation error:", profileError)
        return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
      }
    }

    // Create email account record
    const provider = user.app_metadata?.provider || "google"
    const providerToken = user.session?.provider_token
    const providerRefreshToken = user.session?.provider_refresh_token

    if (providerToken) {
      const { error: accountError } = await supabase.from("email_accounts").upsert(
        {
          user_id: user.id,
          provider,
          email: user.email!,
          display_name: user.user_metadata?.full_name || user.user_metadata?.name,
          access_token: providerToken,
          refresh_token: providerRefreshToken,
          settings: {
            sync_enabled: true,
            sync_frequency: 300, // 5 minutes
          },
        },
        {
          onConflict: "user_id,provider,email",
        },
      )

      if (accountError) {
        console.error("Account creation error:", accountError)
        return NextResponse.json({ error: "Failed to create email account" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Setup profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
