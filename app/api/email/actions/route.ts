import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseConfig } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const { url, anonKey } = getSupabaseConfig()
  
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { action, messageId, data } = await request.json()

    // Get the email account for this user
    const { data: account } = await supabase
      .from("email_accounts")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!account) {
      return NextResponse.json({ error: "Email account not found" }, { status: 404 })
    }

    // Get the message
    const { data: message } = await supabase
      .from("email_metadata")
      .select("*")
      .eq("id", messageId)
      .eq("account_id", account.id)
      .single()

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    switch (action) {
      case "star":
        const { error: starError } = await supabase
          .from("email_metadata")
          .update({ is_starred: data.isStarred })
          .eq("id", messageId)

        if (starError) throw starError
        return NextResponse.json({ success: true })

      case "archive":
        const { error: archiveError } = await supabase
          .from("email_metadata")
          .update({ is_archived: data.isArchived })
          .eq("id", messageId)

        if (archiveError) throw archiveError
        return NextResponse.json({ success: true })

      case "read":
        const { error: readError } = await supabase
          .from("email_metadata")
          .update({ is_read: data.isRead })
          .eq("id", messageId)

        if (readError) throw readError
        return NextResponse.json({ success: true })

      case "snooze":
        const { error: snoozeError } = await supabase
          .from("email_metadata")
          .update({ 
            is_snoozed: data.isSnoozed,
            snooze_until: data.snoozeUntil || null
          })
          .eq("id", messageId)

        if (snoozeError) throw snoozeError
        return NextResponse.json({ success: true })

      case "addLabel":
        const currentLabels = message.labels || []
        const newLabels = [...currentLabels, data.label].filter((label, index, arr) => arr.indexOf(label) === index)
        
        const { error: addLabelError } = await supabase
          .from("email_metadata")
          .update({ labels: newLabels })
          .eq("id", messageId)

        if (addLabelError) throw addLabelError
        return NextResponse.json({ success: true, labels: newLabels })

      case "removeLabel":
        const updatedLabels = (message.labels || []).filter((label: string) => label !== data.label)
        
        const { error: removeLabelError } = await supabase
          .from("email_metadata")
          .update({ labels: updatedLabels })
          .eq("id", messageId)

        if (removeLabelError) throw removeLabelError
        return NextResponse.json({ success: true, labels: updatedLabels })

      case "reply":
        // Create a new email in the composer
        const replyData = {
          mode: "reply",
          to: message.sender_email,
          subject: message.subject.startsWith("Re:") ? message.subject : `Re: ${message.subject}`,
          body: `\n\n--- Original Message ---\nFrom: ${message.sender_name || message.sender_email}\nDate: ${new Date(message.received_at).toLocaleString()}\nSubject: ${message.subject}\n\n${message.body?.text || message.snippet}`,
          inReplyTo: message.message_id,
          threadId: message.thread_id
        }
        
        return NextResponse.json({ success: true, replyData })

      case "forward":
        // Create a new email in the composer
        const forwardData = {
          mode: "forward",
          subject: message.subject.startsWith("Fwd:") ? message.subject : `Fwd: ${message.subject}`,
          body: `\n\n--- Forwarded Message ---\nFrom: ${message.sender_name || message.sender_email}\nDate: ${new Date(message.received_at).toLocaleString()}\nSubject: ${message.subject}\nTo: ${message.recipient_emails?.join(", ")}\n\n${message.body?.text || message.snippet}`,
          originalMessageId: message.message_id
        }
        
        return NextResponse.json({ success: true, forwardData })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Email action error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
