import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { EmailSyncService } from "@/lib/email/sync-service"

export async function POST(request: NextRequest) {
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
    const { accountId } = await request.json()

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
    await syncService.syncAccount(accountId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Sync API error:", error)
    return NextResponse.json({ error: error.message || "Sync failed" }, { status: 500 })
  }
}
