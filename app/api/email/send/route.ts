import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { google } from "googleapis"
import { Client } from "@microsoft/microsoft-graph-client"

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
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

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { accountId, to, cc, bcc, subject, body, scheduledFor } = await request.json()

    if (!accountId || !to || !subject || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get account details
    const { data: account, error: accountError } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("id", accountId)
      .eq("user_id", user.id)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    const message = {
      to: Array.isArray(to) ? to : [to],
      cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
      bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined,
      subject,
      body,
    }

    if (scheduledFor) {
      // Schedule for later
      const { error: scheduleError } = await supabase.from("scheduled_emails").insert({
        account_id: accountId,
        to_emails: message.to,
        cc_emails: message.cc || [],
        bcc_emails: message.bcc || [],
        subject: message.subject,
        body: message.body,
        scheduled_for: scheduledFor,
      })

      if (scheduleError) throw scheduleError

      return NextResponse.json({ success: true, scheduled: true })
    } else {
      // Send immediately
      let result

      if (account.provider === "google") {
        result = await sendGmailEmail(account, message)
      } else if (account.provider === "azure") {
        result = await sendOutlookEmail(account, message)
      } else {
        throw new Error("Unsupported provider")
      }

      return NextResponse.json({ success: true, messageId: result?.id })
    }
  } catch (error: any) {
    console.error("Send email error:", error)
    return NextResponse.json({ error: error.message || "Failed to send email" }, { status: 500 })
  }
}

async function sendGmailEmail(account: any, message: any) {
  const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)

  auth.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
  })

  const gmailClient = google.gmail({ version: "v1", auth })

  const emailMessage = [
    `To: ${message.to.join(", ")}`,
    message.cc?.length ? `Cc: ${message.cc.join(", ")}` : "",
    message.bcc?.length ? `Bcc: ${message.bcc.join(", ")}` : "",
    `Subject: ${message.subject}`,
    "Content-Type: text/html; charset=utf-8",
    "",
    message.body,
  ]
    .filter(Boolean)
    .join("\r\n")

  const response = await gmailClient.users.messages.send({
    userId: "me",
    requestBody: {
      raw: Buffer.from(emailMessage).toString("base64url"),
    },
  })

  return response.data
}

async function sendOutlookEmail(account: any, message: any) {
  const client = Client.init({
    authProvider: {
      getAccessToken: async () => account.access_token,
    },
  })

  const emailMessage = {
    subject: message.subject,
    body: {
      contentType: "HTML",
      content: message.body,
    },
    toRecipients: message.to.map((email: string) => ({
      emailAddress: { address: email.trim() },
    })),
    ccRecipients: message.cc
      ? message.cc.map((email: string) => ({
          emailAddress: { address: email.trim() },
        }))
      : [],
    bccRecipients: message.bcc
      ? message.bcc.map((email: string) => ({
          emailAddress: { address: email.trim() },
        }))
      : [],
  }

  const response = await client.api("/me/sendMail").post({
    message: emailMessage,
  })

  return response
}
