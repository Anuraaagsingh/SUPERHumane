import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Test Supabase connection
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // Get Supabase configuration
    const config = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      user: user ? {
        id: user.id,
        email: user.email,
        provider: user.app_metadata?.provider,
        hasSession: !!user.session
      } : null,
      userError: userError?.message,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(config)
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to get Supabase config',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
