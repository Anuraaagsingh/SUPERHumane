import { createClient } from '@/lib/supabase'
import { google } from 'googleapis'

export class GmailApiService {
  private supabase = createClient()

  async getMessages(userId: string, maxResults = 50) {
    try {
      console.log('[Gmail API] Starting message fetch for user:', userId)
      
      // Get the user's session to access provider tokens
      const { data: { user }, error: userError } = await this.supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      console.log('[Gmail API] User authenticated:', user.email)

      // Get user's email account
      const { data: account, error: accountError } = await this.supabase
        .from('email_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', 'google')
        .single()

      if (accountError || !account) {
        console.log('[Gmail API] No Gmail account found, creating one...')
        // Create account if it doesn't exist
        const newAccount = await this.createGmailAccount(userId, user)
        if (!newAccount) {
          throw new Error('Failed to create Gmail account')
        }
        return await this.getMessages(userId, maxResults) // Retry with new account
      }

      console.log('[Gmail API] Found account:', account.email)

      // Get access token from Supabase session
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession()
      
      if (sessionError || !session) {
        throw new Error('No active session found')
      }

      // For Supabase OAuth, we need to get the provider token from the session
      const providerToken = session.provider_token
      const providerRefreshToken = session.provider_refresh_token

      if (!providerToken) {
        throw new Error('No Gmail access token available. Please re-authenticate.')
      }

      console.log('[Gmail API] Got provider token, fetching messages...')

      // Set up OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login/callback`
      )

      oauth2Client.setCredentials({
        access_token: providerToken,
        refresh_token: providerRefreshToken,
      })

      // Create Gmail client
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

      // Fetch messages
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: maxResults,
        q: 'in:inbox'
      })

      const messages = response.data.messages || []
      console.log('[Gmail API] Found', messages.length, 'messages')

      // Get detailed message data for first 20 messages
      const detailedMessages = []
      for (const message of messages.slice(0, 20)) {
        try {
          const detailResponse = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'full'
          })

          const parsedMessage = this.parseGmailMessage(detailResponse.data)
          detailedMessages.push(parsedMessage)
        } catch (error) {
          console.error(`[Gmail API] Error fetching message ${message.id}:`, error)
          // Continue with other messages
        }
      }

      console.log('[Gmail API] Parsed', detailedMessages.length, 'detailed messages')

      // Save messages to database
      if (detailedMessages.length > 0) {
        await this.saveMessagesToDatabase(account.id, detailedMessages)
      }

      return detailedMessages
    } catch (error) {
      console.error('[Gmail API] Error getting Gmail messages:', error)
      throw new Error(`Failed to fetch Gmail messages: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async createGmailAccount(userId: string, user: any) {
    try {
      console.log('[Gmail API] Creating Gmail account for user:', user.email)
      
      const { data: account, error } = await this.supabase
        .from('email_accounts')
        .insert({
          user_id: userId,
          provider: 'google',
          email: user.email,
          display_name: user.user_metadata?.full_name || user.email,
          access_token: 'supabase_managed', // Supabase manages the token
          refresh_token: 'supabase_managed',
          settings: {
            sync_enabled: true,
            sync_frequency: 300
          }
        })
        .select()
        .single()

      if (error) {
        console.error('[Gmail API] Error creating account:', error)
        return null
      }

      console.log('[Gmail API] Created account:', account.id)
      return account
    } catch (error) {
      console.error('[Gmail API] Error creating Gmail account:', error)
      return null
    }
  }

  private parseGmailMessage(message: any) {
    const headers = message.payload?.headers || []
    const getHeader = (name: string) => 
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value

    // Extract snippet
    let snippet = message.snippet || ''
    
    // Check for attachments
    const hasAttachments = this.checkForAttachments(message.payload)

    // Extract sender info
    const fromHeader = getHeader('From') || ''
    const senderEmail = this.extractEmail(fromHeader)
    const senderName = this.extractName(fromHeader)

    return {
      id: message.id,
      threadId: message.threadId,
      subject: getHeader('Subject') || 'No Subject',
      sender_email: senderEmail,
      sender_name: senderName,
      recipient_emails: [getHeader('To') || ''],
      snippet: snippet.substring(0, 200),
      has_attachments: hasAttachments,
      is_read: !message.labelIds?.includes('UNREAD'),
      is_starred: message.labelIds?.includes('STARRED'),
      labels: message.labelIds || [],
      received_at: new Date(parseInt(message.internalDate)),
      message_id: message.id,
      thread_id: message.threadId
    }
  }

  private extractEmail(fromString: string): string {
    const match = fromString.match(/<(.+)>/)
    return match ? match[1] : fromString
  }

  private extractName(fromString: string): string {
    const match = fromString.match(/^(.+)\s<.+>/)
    return match ? match[1].trim().replace(/"/g, '') : this.extractEmail(fromString)
  }

  private checkForAttachments(payload: any): boolean {
    if (!payload) return false
    
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.filename || part.body?.attachmentId) {
          return true
        }
        if (part.parts && this.checkForAttachments(part)) {
          return true
        }
      }
    }
    
    if (payload.filename || payload.body?.attachmentId) {
      return true
    }
    
    return false
  }

  private async saveMessagesToDatabase(accountId: string, messages: any[]) {
    try {
      console.log('[Gmail API] Saving', messages.length, 'messages to database')
      
      const messageData = messages.map(msg => ({
        account_id: accountId,
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

      const { error } = await this.supabase
        .from('email_metadata')
        .upsert(messageData, {
          onConflict: 'account_id,message_id'
        })

      if (error) {
        console.error('[Gmail API] Error saving messages:', error)
      } else {
        console.log('[Gmail API] Successfully saved messages to database')
      }
    } catch (error) {
      console.error('[Gmail API] Error saving messages to database:', error)
    }
  }
}
