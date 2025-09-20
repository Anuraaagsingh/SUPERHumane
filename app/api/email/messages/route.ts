import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { EmailSyncService } from "@/lib/email/sync-service"
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
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get("accountId")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const query = searchParams.get("query")

    if (!accountId) {
      return NextResponse.json({ error: "Account ID required" }, { status: 400 })
    }

    // Verify account belongs to user
    const { data: account, error: accountError } = await supabase
      .from("email_accounts")
      .select("id")
      .eq("id", accountId)
      .eq("user_id", user.id)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    // Get account details to check provider
    const { data: accountDetails } = await supabase
      .from("email_accounts")
      .select("provider, settings")
      .eq("id", accountId)
      .single()

    let messages
    let hasMore = false

    // For Gmail accounts, try to sync first if no messages exist
    if (accountDetails?.provider === "google") {
      const { data: existingMessages } = await supabase
        .from("email_metadata")
        .select("id")
        .eq("account_id", accountId)
        .limit(1)

      // If no messages exist, try to sync from Gmail
      if (!existingMessages || existingMessages.length === 0) {
        try {
          const syncService = new EmailSyncService()
          await syncService.syncAccount(accountId)
        } catch (syncError) {
          console.error("Gmail sync error:", syncError)
          // Continue with empty results if sync fails
        }
      }
    }

    // Get messages from database
    if (query) {
      const { data: searchResults, error: searchError } = await supabase
        .from("email_metadata")
        .select("*")
        .eq("account_id", accountId)
        .or(`subject.ilike.%${query}%,sender_name.ilike.%${query}%,sender_email.ilike.%${query}%`)
        .order("received_at", { ascending: false })
        .limit(limit)

      if (searchError) throw searchError
      messages = searchResults || []
    } else {
      const { data: messageResults, error: messageError } = await supabase
        .from("email_metadata")
        .select("*")
        .eq("account_id", accountId)
        .order("received_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (messageError) throw messageError
      messages = messageResults || []
    }

    hasMore = messages.length === limit

    return NextResponse.json({ messages, hasMore })
  } catch (error: any) {
    console.error("Messages API error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch messages" }, { status: 500 })
  }
}