import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { google } from "googleapis"
import { Client } from "@microsoft/microsoft-graph-client"

export class EmailSyncService {
  private supabase: any

  constructor() {
    this.initSupabase()
  }

  private async initSupabase() {
    const cookieStore = await cookies()
    this.supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    })
  }

  async syncAccount(accountId: string) {
    try {
      await this.initSupabase()

      // Get account details
      const { data: account, error: accountError } = await this.supabase
        .from("email_accounts")
        .select("*")
        .eq("id", accountId)
        .single()

      if (accountError || !account) {
        throw new Error("Account not found")
      }

      if (account.provider === "google") {
        await this.syncGmailAccount(account)
      } else if (account.provider === "azure") {
        await this.syncGraphAccount(account)
      }

      // Update last sync time
      await this.supabase.from("email_accounts").update({ updated_at: new Date().toISOString() }).eq("id", accountId)
    } catch (error) {
      console.error("Sync account error:", error)
      throw error
    }
  }

  private async syncGmailAccount(account: any) {
    const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)

    auth.setCredentials({
      access_token: account.access_token,
      refresh_token: account.refresh_token,
    })

    const gmailClient = google.gmail({ version: "v1", auth })

    try {
      // Get recent messages
      const response = await gmailClient.users.messages.list({
        userId: "me",
        maxResults: 100,
      })

      const messages = response.data.messages || []

      for (const messageRef of messages) {
        // Check if we already have this message
        const { data: existingMessage } = await this.supabase
          .from("email_metadata")
          .select("id")
          .eq("account_id", account.id)
          .eq("message_id", messageRef.id)
          .single()

        if (!existingMessage) {
          // Fetch full message details
          const fullMessageResponse = await gmailClient.users.messages.get({
            userId: "me",
            id: messageRef.id!,
            format: "full",
          })

          const fullMessage = this.parseGmailMessage(fullMessageResponse.data)
          await this.saveMessage(account.id, fullMessage, "gmail")
        }
      }
    } catch (error) {
      console.error("Gmail sync error:", error)
      throw error
    }
  }

  private async syncGraphAccount(account: any) {
    const client = Client.init({
      authProvider: {
        getAccessToken: async () => account.access_token,
      },
    })

    try {
      // Get recent messages
      const response = await client.api("/me/messages").top(100).get()
      const messages = response.value || []

      for (const message of messages) {
        // Check if we already have this message
        const { data: existingMessage } = await this.supabase
          .from("email_metadata")
          .select("id")
          .eq("account_id", account.id)
          .eq("message_id", message.id)
          .single()

        if (!existingMessage) {
          await this.saveMessage(account.id, message, "outlook")
        }
      }
    } catch (error) {
      console.error("Graph sync error:", error)
      throw error
    }
  }

  private parseGmailMessage(message: any) {
    const headers = message.payload?.headers || []
    const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value

    return {
      id: message.id,
      threadId: message.threadId,
      subject: getHeader("Subject") || "",
      from: getHeader("From") || "",
      to: getHeader("To") || "",
      isRead: !message.labelIds?.includes("UNREAD"),
      isStarred: message.labelIds?.includes("STARRED"),
      internalDate: new Date(Number.parseInt(message.internalDate)),
      labelIds: message.labelIds || [],
    }
  }

  private async saveMessage(accountId: string, message: any, provider: string) {
    try {
      const messageData = {
        account_id: accountId,
        message_id: message.id,
        thread_id: message.threadId,
        subject: message.subject,
        sender_email: provider === "gmail" ? this.extractEmail(message.from) : message.from?.emailAddress?.address,
        sender_name: provider === "gmail" ? this.extractName(message.from) : message.from?.emailAddress?.name,
        recipient_emails: provider === "gmail" ? [message.to] : [message.toRecipients?.[0]?.emailAddress?.address],
        labels: provider === "gmail" ? message.labelIds : message.categories,
        is_read: message.isRead,
        is_starred: provider === "gmail" ? message.isStarred : message.flag?.flagStatus === "flagged",
        received_at: provider === "gmail" ? message.internalDate : new Date(message.receivedDateTime),
      }

      const { error } = await this.supabase.from("email_metadata").insert(messageData)

      if (error) {
        console.error("Save message error:", error)
      }
    } catch (error) {
      console.error("Save message error:", error)
    }
  }

  private extractEmail(fromString: string): string {
    const match = fromString.match(/<(.+)>/)
    return match ? match[1] : fromString
  }

  private extractName(fromString: string): string {
    const match = fromString.match(/^(.+)\s<.+>/)
    return match ? match[1].trim().replace(/"/g, "") : this.extractEmail(fromString)
  }

  async getAccountMessages(accountId: string, limit = 50, offset = 0) {
    try {
      const { data: messages, error } = await this.supabase
        .from("email_metadata")
        .select("*")
        .eq("account_id", accountId)
        .order("received_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      return messages || []
    } catch (error) {
      console.error("Get account messages error:", error)
      throw error
    }
  }

  async searchMessages(accountId: string, query: string, limit = 50) {
    try {
      const { data: messages, error } = await this.supabase
        .from("email_metadata")
        .select("*")
        .eq("account_id", accountId)
        .or(`subject.ilike.%${query}%,sender_name.ilike.%${query}%,sender_email.ilike.%${query}%`)
        .order("received_at", { ascending: false })
        .limit(limit)

      if (error) throw error

      return messages || []
    } catch (error) {
      console.error("Search messages error:", error)
      throw error
    }
  }
}
