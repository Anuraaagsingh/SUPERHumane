import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getSupabaseConfig } from "@/lib/supabase"

export async function POST() {
  console.log("[DEBUG] Setup profile API called")
  const cookieStore = cookies()
  const { url, anonKey } = getSupabaseConfig()
  
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  console.log("[DEBUG] Setup profile - User:", user?.email, "Auth error:", authError)

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

    // For demo accounts or when no provider token, create a demo account
    if (providerToken || user.email === "demo@mastermail.com") {
      const { error: accountError } = await supabase.from("email_accounts").upsert(
        {
          user_id: user.id,
          provider: user.email === "demo@mastermail.com" ? "demo" : provider,
          email: user.email!,
          display_name: user.user_metadata?.full_name || user.user_metadata?.name,
          access_token: providerToken || "demo_access_token",
          refresh_token: providerRefreshToken || "demo_refresh_token",
          settings: {
            sync_enabled: user.email === "demo@mastermail.com" ? false : true,
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

      // For demo accounts, populate demo emails
      if (user.email === "demo@mastermail.com") {
        await populateDemoEmails(user.id, supabase)
      }
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
        is_read: false,
        is_starred: true,
        is_archived: false,
        is_snoozed: false,
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
        is_read: true,
        is_starred: false,
        is_archived: false,
        is_snoozed: false,
        received_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      },
      {
        account_id: account.id,
        message_id: "msg_003",
        thread_id: "thread_003",
        subject: "Your verification code: 847392",
        sender_email: "noreply@securebank.com",
        sender_name: "SecureBank Security",
        recipient_emails: ["demo@mastermail.com"],
        labels: ["important", "security"],
        is_read: false,
        is_starred: false,
        is_archived: false,
        is_snoozed: false,
        received_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      },
      {
        account_id: account.id,
        message_id: "msg_004",
        thread_id: "thread_004",
        subject: "You have 3 new mentions on Twitter",
        sender_email: "notifications@twitter.com",
        sender_name: "Twitter",
        recipient_emails: ["demo@mastermail.com"],
        labels: ["social"],
        is_read: true,
        is_starred: false,
        is_archived: false,
        is_snoozed: false,
        received_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      },
      {
        account_id: account.id,
        message_id: "msg_005",
        thread_id: "thread_005",
        subject: "Meeting: Product Strategy Review - Tomorrow 2PM",
        sender_email: "mike.johnson@techcorp.com",
        sender_name: "Mike Johnson",
        recipient_emails: ["demo@mastermail.com", "team@techcorp.com"],
        labels: ["work", "meeting"],
        is_read: false,
        is_starred: false,
        is_archived: false,
        is_snoozed: true,
        snooze_until: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        received_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      },
      {
        account_id: account.id,
        message_id: "msg_006",
        thread_id: "thread_006",
        subject: "Weekly Tech Digest: AI Breakthroughs & Startup News",
        sender_email: "newsletter@techweekly.com",
        sender_name: "Tech Weekly",
        recipient_emails: ["demo@mastermail.com"],
        labels: ["newsletters"],
        is_read: true,
        is_starred: false,
        is_archived: false,
        is_snoozed: false,
        received_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      },
      {
        account_id: account.id,
        message_id: "msg_007",
        thread_id: "thread_007",
        subject: "Thanksgiving Plans - Can you make it?",
        sender_email: "mom@family.com",
        sender_name: "Mom",
        recipient_emails: ["demo@mastermail.com"],
        labels: ["personal", "family"],
        is_read: false,
        is_starred: true,
        is_archived: false,
        is_snoozed: false,
        received_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      },
      {
        account_id: account.id,
        message_id: "msg_008",
        thread_id: "thread_008",
        subject: "PR Review: Feature/user-authentication",
        sender_email: "alex.kim@techcorp.com",
        sender_name: "Alex Kim",
        recipient_emails: ["demo@mastermail.com"],
        labels: ["work", "code-review"],
        is_read: false,
        is_starred: false,
        is_archived: false,
        is_snoozed: false,
        received_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      },
      {
        account_id: account.id,
        message_id: "msg_009",
        thread_id: "thread_009",
        subject: "Your Premium Subscription expires in 7 days",
        sender_email: "billing@premiumservice.com",
        sender_name: "Premium Service",
        recipient_emails: ["demo@mastermail.com"],
        labels: ["billing", "important"],
        is_read: true,
        is_starred: false,
        is_archived: false,
        is_snoozed: false,
        received_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      },
      {
        account_id: account.id,
        message_id: "msg_010",
        thread_id: "thread_010",
        subject: "You have 5 new connection requests on LinkedIn",
        sender_email: "notifications@linkedin.com",
        sender_name: "LinkedIn",
        recipient_emails: ["demo@mastermail.com"],
        labels: ["social", "linkedin"],
        is_read: true,
        is_starred: false,
        is_archived: false,
        is_snoozed: false,
        received_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      },
      {
        account_id: account.id,
        message_id: "msg_011",
        thread_id: "thread_011",
        subject: "URGENT: Critical bug in payment system",
        sender_email: "qa.team@techcorp.com",
        sender_name: "QA Team",
        recipient_emails: ["demo@mastermail.com", "dev-team@techcorp.com"],
        labels: ["work", "urgent", "bug"],
        is_read: false,
        is_starred: true,
        is_archived: false,
        is_snoozed: false,
        received_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
      },
      {
        account_id: account.id,
        message_id: "msg_012",
        thread_id: "thread_012",
        subject: "You're invited: Annual Company Holiday Party",
        sender_email: "events@techcorp.com",
        sender_name: "HR Events Team",
        recipient_emails: ["demo@mastermail.com"],
        labels: ["personal", "event"],
        is_read: true,
        is_starred: false,
        is_archived: true,
        is_snoozed: false,
        received_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      },
    ]

    const { error } = await supabase.from("email_metadata").insert(demoEmails)
    
    if (error) {
      console.error("Demo emails insertion error:", error)
    } else {
      console.log("Demo emails populated successfully")
    }
  } catch (error) {
    console.error("Populate demo emails error:", error)
  }
}
