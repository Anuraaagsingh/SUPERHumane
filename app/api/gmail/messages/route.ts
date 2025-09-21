import { type CookieOptions, createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { google } from "googleapis"

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export async function GET() {
  console.log("[GMAIL] Fetching messages")
  const cookieStore = cookies()
  const response = NextResponse.next()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options })
          response.cookies.set({ name, value: "", ...options })
        },
      },
    }
  )

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session) {
    console.error("[GMAIL] Not authorized - no session:", sessionError)
    return NextResponse.json({ error: "Not authorized" }, { status: 401 })
  }
    
  // Handle demo account by fetching from email_metadata table
  if (session.user.email === "demo@mastermail.com") {
      console.log("[GMAIL] Fetching demo emails")
      const { data, error } = await supabase
        .from("email_metadata")
        .select("*")
        .order("received_at", { ascending: false })

      if (error) {
          console.error("[GMAIL] Failed to fetch demo emails:", error)
          return NextResponse.json({ error: "Failed to fetch demo emails" }, { status: 500 })
      }
      return NextResponse.json(data)
  }
  
  // For real Gmail accounts, try to get the token from the session first
  let accessToken = session.provider_token
  
  // If token is not in session, try to get it from the database
  if (!accessToken) {
    console.log("[GMAIL] Token not found in session, trying database")
    try {
      // Get the user's email account from the database
      const { data: account, error: accountError } = await supabase
        .from("email_accounts")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("provider", "google")
        .single()
      
      if (accountError || !account) {
        console.error("[GMAIL] Failed to get account:", accountError)
        return NextResponse.json({ error: "Gmail account not found" }, { status: 400 })
      }
      
      // Check if token is expired
      const isExpired = account.token_expires_at && 
        new Date(account.token_expires_at) < new Date()
      
      if (isExpired) {
        console.warn("[GMAIL] Token expired, needs refresh flow")
        return NextResponse.json({ 
          error: "Gmail token expired", 
          needsReauth: true 
        }, { status: 401 })
      }
      
      accessToken = account.access_token
    } catch (error) {
      console.error("[GMAIL] Error getting token from database:", error)
      return NextResponse.json({ error: "Failed to get Gmail token" }, { status: 500 })
    }
  }

  if (!accessToken) {
    console.error("[GMAIL] No access token available")
    return NextResponse.json({ 
      error: "Gmail provider token not found", 
      needsReauth: true 
    }, { status: 400 })
  }
  
  console.log("[GMAIL] Initializing Gmail API with token")
  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: accessToken })

  const gmail = google.gmail({ version: "v1", auth: oauth2Client })

  try {
    console.log("[GMAIL] Listing messages from inbox")
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 30,
      q: "in:inbox",
    })

    const messages = response.data.messages || []
    console.log("[GMAIL] Found", messages.length, "messages")

    if (messages.length === 0) {
      return NextResponse.json([])
    }

    // Limit to 30 messages for performance
    const limitedMessages = messages.slice(0, 30)
    
    console.log("[GMAIL] Fetching details for", limitedMessages.length, "messages")
    const emailPromises = limitedMessages.map((message) =>
      gmail.users.messages.get({
        userId: "me",
        id: message.id!,
        format: "METADATA",
        metadataHeaders: ["Subject", "From", "Date", "Snippet"],
      }).catch(err => {
        console.error("[GMAIL] Error fetching message", message.id, ":", err)
        return null // Return null for failed messages
      })
    )

    const emailResponses = await Promise.all(emailPromises)
    const emails = emailResponses.filter(Boolean) // Remove any null responses
    
    console.log("[GMAIL] Successfully fetched", emails.length, "messages")
    
    const formattedEmails = emails.map((email) => {
        if (!email || !email.data) return null
        
        try {
          const headers = email.data.payload?.headers
          const getHeader = (name: string) => headers?.find((h) => h.name === name)?.value || ""
  
          const fromHeader = getHeader("From")
          const senderName = fromHeader.includes('<') ? fromHeader.split('<')[0].trim() : fromHeader
          const senderEmail = fromHeader.includes('<') ? fromHeader.split('<')[1].replace('>', '') : fromHeader
  
          return {
              id: email.data.id,
              message_id: email.data.id,
              subject: getHeader("Subject"),
              sender_name: senderName,
              sender_email: senderEmail,
              snippet: email.data.snippet,
              received_at: getHeader("Date"),
              is_read: !email.data.labelIds?.includes("UNREAD"),
              is_starred: email.data.labelIds?.includes("STARRED"),
              has_attachments: false, // This would require a more detailed fetch
              labels: email.data.labelIds,
          }
        } catch (err) {
          console.error("[GMAIL] Error formatting email:", err)
          return null
        }
    }).filter(Boolean) // Remove any null items

    console.log("[GMAIL] Returning", formattedEmails.length, "formatted emails")
    return NextResponse.json(formattedEmails)
  } catch (error: any) {
    console.error("[GMAIL] Error fetching from Gmail:", error)
    
    // Check for token-related errors
    if (error.code === 401 || error.message?.includes('invalid_grant') || error.message?.includes('Invalid Credentials')) {
      console.error("[GMAIL] Authentication error - token likely expired or revoked")
      return NextResponse.json({ 
        error: "Gmail authentication failed", 
        message: error.message,
        needsReauth: true 
      }, { status: 401 })
    }
    
    return NextResponse.json({ 
      error: "Failed to fetch emails from Gmail",
      message: error.message
    }, { status: 500 })
  }
}
