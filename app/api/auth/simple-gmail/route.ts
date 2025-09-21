import { NextRequest, NextResponse } from 'next/server'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    // Simple environment check
    const hasClientId = !!process.env.GOOGLE_CLIENT_ID
    const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://super-humane-mvt9kmllb-anurags-projects-47784640.vercel.app'
    
    console.log('[Simple Gmail Auth] Check:', {
      hasClientId,
      hasClientSecret,
      siteUrl,
      nodeEnv: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL
    })

    if (!hasClientId || !hasClientSecret) {
      return NextResponse.json({
        error: 'Gmail OAuth not configured',
        details: 'Missing Google OAuth credentials. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel environment variables.',
        setupRequired: true
      }, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    // Build the OAuth URL manually
    const redirectUri = `${siteUrl}/api/auth/gmail-callback`
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ].join(' ')

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent`

    console.log('[Simple Gmail Auth] Generated URL:', {
      redirectUri,
      authUrl: authUrl.substring(0, 100) + '...'
    })

    return NextResponse.json({ 
      authUrl,
      redirectUri,
      status: 'success'
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })

  } catch (error: any) {
    console.error('[Simple Gmail Auth] Error:', error)
    return NextResponse.json({
      error: 'Failed to generate Gmail auth URL',
      details: error.message || 'Unknown error occurred'
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    })
  }
}
