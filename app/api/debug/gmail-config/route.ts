import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const config = {
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: !!process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV,
      },
      gmail: {
        hasClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        clientIdPreview: process.env.GOOGLE_CLIENT_ID ? 
          `${process.env.GOOGLE_CLIENT_ID.substring(0, 10)}...` : 'MISSING'
      },
      site: {
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
        expectedRedirectUri: process.env.NEXT_PUBLIC_SITE_URL ? 
          `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/gmail-callback` : 
          'https://super-humane-mvt9kmllb-anurags-projects-47784640.vercel.app/api/auth/gmail-callback'
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(config)
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to get config',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
