import { NextRequest, NextResponse } from 'next/server'
import { GmailService } from '@/lib/gmail/gmail-service'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseConfig } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  console.log('[Gmail OAuth] Callback received:', { code: !!code, state, error })

  // Determine the correct base URL based on environment
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_SITE_URL || 'https://super-humane-mvt9kmllb-anurags-projects-47784640.vercel.app'
    : 'http://localhost:3000'

  if (error) {
    console.error('[Gmail OAuth] Error:', error)
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    console.error('[Gmail OAuth] No code provided')
    return NextResponse.redirect(`${baseUrl}/login?error=No authorization code provided`)
  }

  try {
    const gmailService = new GmailService()
    
    // Exchange code for tokens
    const tokens = await gmailService.getTokens(code)
    console.log('[Gmail OAuth] Tokens received:', { 
      access_token: !!tokens.access_token, 
      refresh_token: !!tokens.refresh_token 
    })

    // Get user info
    const userInfo = await gmailService.getUserInfo(tokens.access_token!)
    console.log('[Gmail OAuth] User info:', userInfo)

    // Create Supabase client
    const cookieStore = cookies()
    const { url, anonKey } = getSupabaseConfig()
    
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.delete({ name, ...options })
        },
      },
    })

    // Create or update user in Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userInfo.email!,
      password: 'gmail_oauth_user' // Temporary password for OAuth users
    })

    if (authError) {
      // If user doesn't exist, create them
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: userInfo.email!,
        password: 'gmail_oauth_user',
        options: {
          data: {
            full_name: userInfo.name,
            avatar_url: userInfo.picture,
            provider: 'google'
          }
        }
      })

      if (signUpError) {
        console.error('[Gmail OAuth] Sign up error:', signUpError)
        return NextResponse.redirect(`${baseUrl}/login?error=Failed to create user`)
      }

      // Sign in after creating user
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: userInfo.email!,
        password: 'gmail_oauth_user'
      })

      if (signInError) {
        console.error('[Gmail OAuth] Sign in error:', signInError)
        return NextResponse.redirect(`${baseUrl}/login?error=Failed to sign in`)
      }
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('[Gmail OAuth] User error:', userError)
      return NextResponse.redirect(`${baseUrl}/login?error=Failed to get user`)
    }

    // Create or update email account
    const { error: accountError } = await supabase
      .from('email_accounts')
      .upsert({
        user_id: user.id,
        provider: 'google',
        email: userInfo.email!,
        display_name: userInfo.name,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        settings: {
          sync_enabled: true,
          sync_frequency: 300
        }
      }, {
        onConflict: 'user_id,provider,email'
      })

    if (accountError) {
      console.error('[Gmail OAuth] Account error:', accountError)
      // Continue anyway, account can be created later
    }

    // Sync Gmail messages
    try {
      const messages = await gmailService.getMessages(tokens.access_token!, tokens.refresh_token!)
      console.log('[Gmail OAuth] Fetched messages:', messages.length)

      // Get the account ID
      const { data: account } = await supabase
        .from('email_accounts')
        .select('id')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single()

      if (account && messages.length > 0) {
        // Save messages to database
        const messageData = messages.map(msg => ({
          account_id: account.id,
          message_id: msg.message_id,
          thread_id: msg.thread_id,
          subject: msg.subject,
          sender_email: msg.sender_email,
          sender_name: msg.sender_name,
          recipient_emails: msg.recipient_emails,
          labels: msg.labels,
          snippet: msg.snippet,
          has_attachments: msg.has_attachments,
          is_read: msg.is_read,
          is_starred: msg.is_starred,
          received_at: msg.received_at.toISOString()
        }))

        const { error: messagesError } = await supabase
          .from('email_metadata')
          .upsert(messageData, {
            onConflict: 'account_id,message_id'
          })

        if (messagesError) {
          console.error('[Gmail OAuth] Messages error:', messagesError)
        } else {
          console.log('[Gmail OAuth] Messages saved successfully')
        }
      }
    } catch (syncError) {
      console.error('[Gmail OAuth] Sync error:', syncError)
      // Continue anyway, user can sync manually later
    }

    console.log('[Gmail OAuth] Success, redirecting to inbox')
    return NextResponse.redirect(`${baseUrl}/inbox`)

  } catch (error) {
    console.error('[Gmail OAuth] Unexpected error:', error)
    return NextResponse.redirect(`${baseUrl}/login?error=Gmail authentication failed`)
  }
}
