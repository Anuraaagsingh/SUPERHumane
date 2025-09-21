import { createClient } from "@/lib/supabase/client"
import { SupabaseClient } from "@supabase/supabase-js"

export class SupabaseGmailService {
  private supabase = createClient()

  async getMessages(userId: string, maxResults = 50) {
    try {
      // Get the user's session to access provider tokens
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession()
      
      if (sessionError || !session) {
        throw new Error('User not authenticated')
      }

      const providerToken = session?.provider_token
      if (!providerToken) {
        throw new Error('No Gmail access token available')
      }

      // Get user's email account
      const { data: account, error: accountError } = await this.supabase
        .from('email_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', 'google')
        .single()

      if (accountError || !account) {
        throw new Error('No Gmail account found')
      }

      // Fetch messages from Gmail API
      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=in:inbox`,
        {
          headers: {
            'Authorization': `Bearer ${providerToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Gmail API error: ${response.status}`)
      }

      const data = await response.json()
      const messages = data.messages || []

      // Get detailed message data
      const detailedMessages = []
      for (const message of messages.slice(0, 20)) { // Limit to 20 for performance
        try {
          const detailResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
            {
              headers: {
                'Authorization': `Bearer ${providerToken}`,
                'Content-Type': 'application/json'
              }
            }
          )

          if (detailResponse.ok) {
            const messageData = await detailResponse.json()
            const parsedMessage = this.parseGmailMessage(messageData)
            detailedMessages.push(parsedMessage)
          }
        } catch (error) {
          console.error(`Error fetching message ${message.id}:`, error)
          // Continue with other messages
        }
      }

      // Save messages to database
      if (detailedMessages.length > 0) {
        const messageData = detailedMessages.map(msg => ({
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

        await this.supabase
          .from('email_metadata')
          .upsert(messageData, {
            onConflict: 'account_id,message_id'
          })
      }

      return detailedMessages
    } catch (error) {
      console.error('Error getting Gmail messages:', error)
      throw new Error('Failed to fetch Gmail messages')
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
}
