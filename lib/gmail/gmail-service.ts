import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

export class GmailService {
  private oauth2Client: OAuth2Client

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL || 'http://localhost:3000/login/callback'
    )
  }

  async getAuthUrl(): Promise<string> {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ]

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    })
  }

  async getTokens(code: string) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code)
      this.oauth2Client.setCredentials(tokens)
      return tokens
    } catch (error) {
      console.error('Error getting tokens:', error)
      throw new Error('Failed to get Gmail tokens')
    }
  }

  async getUserInfo(accessToken: string) {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken })
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client })
      const { data } = await oauth2.userinfo.get()
      return data
    } catch (error) {
      console.error('Error getting user info:', error)
      throw new Error('Failed to get user info')
    }
  }

  async getMessages(accessToken: string, refreshToken: string, maxResults = 50) {
    try {
      this.oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken
      })

      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })
      
      // Get message list
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: 'in:inbox'
      })

      const messages = response.data.messages || []
      const detailedMessages = []

      // Get detailed message data
      for (const message of messages.slice(0, 20)) { // Limit to 20 for performance
        try {
          const detailResponse = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'full'
          })

          const parsedMessage = this.parseGmailMessage(detailResponse.data)
          detailedMessages.push(parsedMessage)
        } catch (error) {
          console.error(`Error fetching message ${message.id}:`, error)
          // Continue with other messages
        }
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

  async refreshAccessToken(refreshToken: string) {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      })

      const { credentials } = await this.oauth2Client.refreshAccessToken()
      return credentials
    } catch (error) {
      console.error('Error refreshing token:', error)
      throw new Error('Failed to refresh access token')
    }
  }
}
