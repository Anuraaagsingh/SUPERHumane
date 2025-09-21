import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { GmailApiService } from "@/lib/gmail/gmail-api-service"
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
    console.log("[DEBUG] Gmail Test - User:", user.email)
    
    // Get user's email accounts
    const { data: accounts, error: accountsError } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("user_id", user.id)

    if (accountsError) {
      return NextResponse.json({ 
        error: "Failed to fetch accounts", 
        details: accountsError 
      }, { status: 500 })
    }

    console.log("[DEBUG] Found accounts:", accounts?.length || 0)

    // Get session info
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    const debugInfo = {
      user: {
        id: user.id,
        email: user.email,
        provider: user.app_metadata?.provider,
        hasSession: !!session,
        hasProviderToken: !!session?.provider_token,
        hasProviderRefreshToken: !!session?.provider_refresh_token,
      },
      accounts: accounts?.map(acc => ({
        id: acc.id,
        provider: acc.provider,
        email: acc.email,
        hasAccessToken: !!acc.access_token,
        hasRefreshToken: !!acc.refresh_token,
      })) || [],
      environment: {
        hasGoogleClientId: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      }
    }

    // Try to fetch messages if it's a Gmail account
    let gmailTest = null
    if (accounts?.some(acc => acc.provider === 'google')) {
      try {
        const gmailService = new GmailApiService()
        const messages = await gmailService.getMessages(user.id, 5) // Just 5 messages for testing
        gmailTest = {
          success: true,
          messageCount: messages.length,
          messages: messages.map(msg => ({
            subject: msg.subject,
            sender: msg.sender_email,
            snippet: msg.snippet.substring(0, 100) + '...',
            received_at: msg.received_at
          }))
        }
      } catch (error: any) {
        gmailTest = {
          success: false,
          error: error.message,
          details: error.toString()
        }
      }
    }

    return NextResponse.json({
      ...debugInfo,
      gmailTest
    })
  } catch (error: any) {
    console.error("Gmail test error:", error)
    return NextResponse.json({ 
      error: error.message || "Gmail test failed", 
      details: error.toString() 
    }, { status: 500 })
  }
}
