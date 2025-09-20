import { NextRequest, NextResponse } from 'next/server'
import { GmailService } from '@/lib/gmail/gmail-service'

export async function GET(request: NextRequest) {
  try {
    const gmailService = new GmailService()
    const authUrl = await gmailService.getAuthUrl()
    
    console.log('[Gmail Auth] Generated auth URL')
    
    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('[Gmail Auth] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate Gmail auth URL' },
      { status: 500 }
    )
  }
}
