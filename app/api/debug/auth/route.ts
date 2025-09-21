import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    return NextResponse.json({
      hasSession: !!session,
      hasUser: !!user,
      provider: user?.app_metadata?.provider || null,
      email: user?.email || null,
      sessionError: sessionError?.message || null,
      userError: userError?.message || null,
      // Don't return tokens for security reasons
      hasProviderToken: !!session?.provider_token,
      hasAccessToken: !!session?.access_token,
      expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: "Failed to check auth status",
      message: error.message
    }, { status: 500 })
  }
}
