import { NextRequest, NextResponse } from 'next/server'
import { GmailService } from '@/lib/gmail/gmail-service'

export async function GET(request: NextRequest) {
  try {
    console.log('[Gmail Auth] Environment check:', {
      nodeEnv: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL,
      vercelEnv: process.env.VERCEL_ENV,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET
    })

    // Check if required environment variables are set
    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error('[Gmail Auth] Missing GOOGLE_CLIENT_ID environment variable')
      return NextResponse.json(
        { 
          error: 'Gmail OAuth not configured',
          details: 'GOOGLE_CLIENT_ID environment variable is missing. Please set this in your Vercel dashboard under Environment Variables.',
          setupRequired: true,
          debug: {
            nodeEnv: process.env.NODE_ENV,
            vercel: !!process.env.VERCEL,
            allEnvKeys: Object.keys(process.env).filter(key => key.includes('GOOGLE') || key.includes('SITE'))
          }
        },
        { status: 500 }
      )
    }

    if (!process.env.GOOGLE_CLIENT_SECRET) {
      console.error('[Gmail Auth] Missing GOOGLE_CLIENT_SECRET environment variable')
      return NextResponse.json(
        { 
          error: 'Gmail OAuth not configured',
          details: 'GOOGLE_CLIENT_SECRET environment variable is missing. Please set this in your Vercel dashboard under Environment Variables.',
          setupRequired: true,
          debug: {
            nodeEnv: process.env.NODE_ENV,
            vercel: !!process.env.VERCEL,
            allEnvKeys: Object.keys(process.env).filter(key => key.includes('GOOGLE') || key.includes('SITE'))
          }
        },
        { status: 500 }
      )
    }

    const gmailService = new GmailService()
    const authUrl = await gmailService.getAuthUrl()
    
    console.log('[Gmail Auth] Generated auth URL successfully:', {
      authUrl: authUrl.substring(0, 100) + '...',
      redirectUri: authUrl.includes('redirect_uri=') ? 
        decodeURIComponent(authUrl.split('redirect_uri=')[1]?.split('&')[0] || '') : 'Not found'
    })
    
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
