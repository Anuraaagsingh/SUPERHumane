import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { google } from "googleapis"

export async function GET() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 })
  }
    
  if (session.user.email === "demo@mastermail.com") {
      const { data, error } = await supabase
        .from("email_metadata")
        .select("*")
        .order("received_at", { ascending: false })

      if (error) {
          return NextResponse.json({ error: "Failed to fetch demo emails" }, { status: 500 })
      }
      return NextResponse.json(data)
  }

  const providerToken = session.provider_token

  if (!providerToken) {
    return NextResponse.json({ error: "Gmail provider token not found" }, { status: 400 })
  }

  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: providerToken })

  const gmail = google.gmail({ version: "v1", auth: oauth2Client })

  try {
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 30,
      q: "in:inbox",
    })

    const messages = response.data.messages || []

    if (messages.length === 0) {
      return NextResponse.json([])
    }

    const emailPromises = messages.map((message) =>
      gmail.users.messages.get({
        userId: "me",
        id: message.id!,
        format: "METADATA",
        metadataHeaders: ["Subject", "From", "Date", "Snippet"],
      })
    )

    const emails = await Promise.all(emailPromises)
    
    const formattedEmails = emails.map((email) => {
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
    })

    return NextResponse.json(formattedEmails)
  } catch (error) {
    console.error("Error fetching from Gmail:", error)
    return NextResponse.json({ error: "Failed to fetch emails from Gmail" }, { status: 500 })
  }
}
