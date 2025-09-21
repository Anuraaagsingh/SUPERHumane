import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST() {
  console.log("[SETUP] Setup profile API called")
  const supabase = createClient()

  // Get session to extract provider tokens
  const { data: { session } } = await supabase.auth.getSession()
  
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  console.log("[DEBUG] Setup profile - User:", user?.email, "Auth error:", authError)
  if (user) {
    console.log("[SETUP] User metadata:", JSON.stringify(user?.app_metadata, null, 2))
  }

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Check if user profile already exists
    const { data: existingProfile } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single()

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
        if (profileError.code === 'PGRST205') {
          return NextResponse.json({ 
            error: "Database tables not found", 
            details: "Please run the database setup script in Supabase SQL Editor",
            code: "TABLES_MISSING"
          }, { status: 500 })
        }
        return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
      }
    }

    // Create email account record
    const provider = user.app_metadata?.provider || "google"
    
    // Extract tokens from session
    const providerToken = session?.provider_token
    const providerRefreshToken = session?.provider_refresh_token
    
    // Extract expiry time if available
    const tokenExpiresAt = session?.expires_at 
      ? new Date(session.expires_at * 1000).toISOString() 
      : new Date(Date.now() + 3600 * 1000).toISOString() // Default 1 hour
    
    console.log("[SETUP] Provider:", provider)
    console.log("[SETUP] Token present:", !!providerToken)
    console.log("[SETUP] Refresh token present:", !!providerRefreshToken)
    console.log("[SETUP] Token expires at:", tokenExpiresAt)
    
    if (!providerToken && provider !== "demo") {
      console.error("[SETUP] Provider token not found in session for non-demo user")
      // Continue without error as this might be a simple email/password login
    }

    // Always create an email account for the user
    const { data: accountData, error: accountError } = await supabase.from("email_accounts").upsert(
      {
        user_id: user.id,
        provider: user.email === "demo@mastermail.com" ? "demo" : provider,
        email: user.email!,
        display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email!.split("@")[0],
        access_token: providerToken || "demo_access_token",
        refresh_token: providerRefreshToken || "demo_refresh_token",
        token_expires_at: tokenExpiresAt,
        is_active: true,
        settings: {
          sync_enabled: user.email === "demo@mastermail.com" ? false : true,
          sync_frequency: 300, // 5 minutes
          last_sync: null,
          scopes: provider === "google" ? 
            "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify" : 
            null
        },
      },
      {
        onConflict: "user_id,provider,email",
      },
    ).select().single()

    if (accountError) {
      console.error("Account creation error:", accountError)
      return NextResponse.json({ error: "Failed to create email account" }, { status: 500 })
    }

    // For demo accounts, populate demo emails
    if (user.email === "demo@mastermail.com") {
      console.log("[DEBUG] Setting up demo account emails for user:", user.id)
      await populateDemoEmails(user.id, supabase)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Setup profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function populateDemoEmails(userId: string, supabase: any) {
  try {
    // Get the demo account ID
    const { data: account } = await supabase
      .from("email_accounts")
      .select("id")
      .eq("user_id", userId)
      .eq("email", "demo@mastermail.com")
      .single()

    if (!account) return

    // Check if demo emails already exist
    const { data: existingEmails } = await supabase
      .from("email_metadata")
      .select("id")
      .eq("account_id", account.id)
      .limit(1)

    if (existingEmails && existingEmails.length > 0) {
      return // Demo emails already exist
    }

    // Insert demo emails
    const demoEmails = [
      {
        account_id: account.id,
        message_id: "msg_001",
        thread_id: "thread_001",
        subject: "Q4 Project Update - Mobile App Launch",
        sender_email: "sarah.chen@techcorp.com",
        sender_name: "Sarah Chen",
        recipient_emails: ["demo@mastermail.com"],
        labels: ["work", "important"],
        snippet: "Hi team, I wanted to update everyone on our Q4 mobile app launch progress. We're on track for the December release with some exciting new features...",
        has_attachments: true,
        is_read: false,
        is_starred: true,
        is_archived: false,
        received_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      },
      {
        account_id: account.id,
        message_id: "msg_002",
        thread_id: "thread_002",
        subject: "🔥 Black Friday: 70% OFF Everything! Limited Time",
        sender_email: "deals@shopmart.com",
        sender_name: "ShopMart Deals",
        recipient_emails: ["demo@mastermail.com"],
        labels: ["promotions"],
        snippet: "Don't miss out on our biggest sale of the year! Get 70% off on all items including electronics, clothing, and home goods. Limited time offer ends Sunday...",
        has_attachments: false,
        is_read: true,
        is_starred: false,
        is_archived: false,
        received_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      },
      {
        account_id: account.id,
        message_id: "msg_012",
        thread_id: "thread_012",
        subject: "You're invited: Annual Company Holiday Party",
        sender_email: "events@techcorp.com",
        sender_name: "HR Events Team",
        recipient_emails: ["demo@mastermail.com"],
        labels: ["personal", "event", "ARCHIVED"],
        snippet: "You're cordially invited to our Annual Company Holiday Party! Join us on December 15th at the Grand Ballroom for an evening of celebration, food, and fun...",
        has_attachments: true,
        is_read: true,
        is_starred: false,
        is_archived: true,
        received_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      }
    ]

    const { error } = await supabase.from("email_metadata").insert(demoEmails)

    if (error) {
      console.error("Demo emails insertion error:", error)
    } else {
      console.log(`Demo emails populated successfully: ${demoEmails.length} emails inserted`)
    }
  } catch (error) {
    console.error("Populate demo emails error:", error)
  }
}
