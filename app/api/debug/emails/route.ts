import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getSupabaseConfig } from "@/lib/supabase"

export async function GET(request: NextRequest) {
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
    // Get all accounts for user
    const { data: accounts, error: accountsError } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("user_id", user.id)

    console.log("[DEBUG] User accounts:", accounts)

    if (accountsError) {
      console.error("[DEBUG] Accounts error:", accountsError)
      if (accountsError.code === 'PGRST205') {
        return NextResponse.json({ 
          error: "Database tables not found", 
          details: "Please run the database setup script in Supabase SQL Editor",
          code: "TABLES_MISSING"
        }, { status: 500 })
      }
      return NextResponse.json({ error: "Failed to fetch accounts", details: accountsError }, { status: 500 })
    }

    // Get all emails for each account
    const accountEmails = []
    for (const account of accounts || []) {
      const { data: emails, error: emailsError } = await supabase
        .from("email_metadata")
        .select("*")
        .eq("account_id", account.id)
        .order("received_at", { ascending: false })

      console.log(`[DEBUG] Account ${account.id} emails:`, emails?.length || 0)

      if (emailsError) {
        console.error(`[DEBUG] Account ${account.id} emails error:`, emailsError)
      } else {
        accountEmails.push({
          account: account,
          emails: emails || [],
          count: emails?.length || 0
        })
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      accounts: accounts || [],
      accountEmails,
      totalEmails: accountEmails.reduce((sum, acc) => sum + acc.count, 0)
    })
  } catch (error: any) {
    console.error("Debug API error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch debug data" }, { status: 500 })
  }
}
