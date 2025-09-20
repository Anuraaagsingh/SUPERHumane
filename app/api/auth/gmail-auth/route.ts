import { NextRequest, NextResponse } from 'next/server'
import { GmailService } from '@/lib/gmail/gmail-service'

export async function GET(request: NextRequest) {
  try {
    // Check if required environment variables are set
    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error('[Gmail Auth] Missing GOOGLE_CLIENT_ID environment variable')
      return NextResponse.json(
        { 
          error: 'Gmail OAuth not configured',
          details: 'GOOGLE_CLIENT_ID environment variable is missing. Please create a .env.local file with your Google OAuth credentials. See setup-oauth.md for instructions.',
          setupRequired: true
        },
        { status: 500 }
      )
    }

    if (!process.env.GOOGLE_CLIENT_SECRET) {
      console.error('[Gmail Auth] Missing GOOGLE_CLIENT_SECRET environment variable')
      return NextResponse.json(
        { 
          error: 'Gmail OAuth not configured',
          details: 'GOOGLE_CLIENT_SECRET environment variable is missing. Please create a .env.local file with your Google OAuth credentials. See setup-oauth.md for instructions.',
          setupRequired: true
        },
        { status: 500 }
      )
    }

    const gmailService = new GmailService()
    const authUrl = await gmailService.getAuthUrl()
    
    console.log('[Gmail Auth] Generated auth URL successfully')
    
    return NextResponse.json({ authUrl })
  } catch (error: any) {
    console.error('[Gmail Auth] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate Gmail auth URL',
        details: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
