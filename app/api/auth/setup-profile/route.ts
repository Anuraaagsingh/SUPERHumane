import { type CookieOptions, createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getSupabaseConfig } from "@/lib/supabase"

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export async function POST() {
  console.log("[SETUP] Setup profile API called")
  const cookieStore = cookies()
  const { url, anonKey } = getSupabaseConfig()
  
  const response = NextResponse.next()
  
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options })
        response.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: "", ...options })
        response.cookies.set({ name, value: "", ...options })
      },
    },
  })

  const { data: { session } } = await supabase.auth.getSession()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  console.log("[DEBUG] Setup profile - User:", user?.email, "Auth error:", authError)
  console.log("[SETUP] User metadata:", JSON.stringify(user?.app_metadata, null, 2))

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
        snippet: "Don't miss out on our biggest sale of the year! Get 70% off on all items including electronics, clothing, and home goods. Limited time offer ends Sunday...",
        has_attachments: false,
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
        snippet: "Your verification code is: 847392. This code will expire in 10 minutes. If you didn't request this code, please contact our support team immediately.",
        has_attachments: false,
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
        snippet: "You have 3 new mentions on Twitter. @john_doe mentioned you in a tweet about the new product launch. @tech_news shared your latest article...",
        has_attachments: false,
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
        snippet: "Hi team, just a reminder about our Product Strategy Review meeting tomorrow at 2PM. We'll be discussing the Q1 roadmap and budget allocation. Please prepare your updates...",
        has_attachments: true,
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
        snippet: "This week in tech: OpenAI releases GPT-5 with enhanced reasoning capabilities, Tesla announces breakthrough in battery technology, and 3 new unicorn startups emerge...",
        has_attachments: false,
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
        snippet: "Hi honey, just wanted to check if you can make it to Thanksgiving dinner this year. Grandma is asking about you and we'd love to have you here. Let me know soon...",
        has_attachments: false,
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
        snippet: "Hey, could you review the user authentication feature PR? I've implemented OAuth2 with Google and Microsoft providers. The main changes are in the auth service...",
        has_attachments: false,
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
        snippet: "Your Premium subscription will expire in 7 days. To continue enjoying all our premium features, please renew your subscription. We're offering a 20% discount...",
        has_attachments: false,
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
        snippet: "You have 5 new connection requests waiting for your response. Sarah Johnson, Product Manager at TechCorp, wants to connect. View all requests to expand your network...",
        has_attachments: false,
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
        snippet: "URGENT: We've discovered a critical bug in the payment processing system that's causing duplicate charges. This affects 15% of transactions. Immediate fix required...",
        has_attachments: true,
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
        snippet: "You're cordially invited to our Annual Company Holiday Party! Join us on December 15th at the Grand Ballroom for an evening of celebration, food, and fun...",
        has_attachments: true,
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
      return NextResponse.json({
        error: "Failed to populate demo emails",
        details: error.message
      }, { status: 500 })
    } else {
      console.log(`Demo emails populated successfully: ${demoEmails.length} emails inserted`)
    }
  } catch (error) {
    console.error("Populate demo emails error:", error)
  }
}
