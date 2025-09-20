import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getSupabaseConfig } from "@/lib/supabase"

export async function POST(request: NextRequest) {
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

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get the demo account
    const { data: account, error: accountError } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("email", "demo@mastermail.com")
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: "Demo account not found", details: accountError }, { status: 404 })
    }

    console.log("[DEBUG] Found demo account:", account.id)

    // Clear existing demo emails
    const { error: deleteError } = await supabase
      .from("email_metadata")
      .delete()
      .eq("account_id", account.id)

    if (deleteError) {
      console.error("Delete error:", deleteError)
    }

    // Insert fresh demo emails
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
        received_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
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
        received_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
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
        received_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
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
        received_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
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
        snooze_until: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        received_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      }
    ]

    const { data: insertedEmails, error: insertError } = await supabase
      .from("email_metadata")
      .insert(demoEmails)
      .select()

    if (insertError) {
      console.error("Insert error:", insertError)
      return NextResponse.json({ error: "Failed to insert demo emails", details: insertError }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Demo emails populated successfully",
      count: insertedEmails?.length || 0,
      accountId: account.id
    })
  } catch (error: any) {
    console.error("Populate demo API error:", error)
    return NextResponse.json({ error: error.message || "Failed to populate demo emails" }, { status: 500 })
  }
}
