import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { EmailSyncService } from "@/lib/email/sync-service"

export async function GET(request: NextRequest) {
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

    const syncService = new EmailSyncService()
    let messages

    if (query) {
      messages = await syncService.searchMessages(accountId, query, limit)
    } else {
      messages = await syncService.getAccountMessages(accountId, limit, offset)
    }

    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error("Messages API error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch messages" }, { status: 500 })
  }
}
