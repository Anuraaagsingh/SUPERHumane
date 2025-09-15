import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { google } from "googleapis"
import { Client } from "@microsoft/microsoft-graph-client"

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const { accountId, to, cc, bcc, subject, body } = payload

    // Create Supabase client
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
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    })

    // Get account details
    const { data: account, error: accountError } = await supabase
      .from("email_accounts")
      .select("*")
      .eq("id", accountId)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    // Send email based on provider
    if (account.provider === "gmail") {
      await sendGmailEmail(account, { to, cc, bcc, subject, body })
    } else if (account.provider === "outlook") {
      await sendOutlookEmail(account, { to, cc, bcc, subject, body })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending scheduled email:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}

async function sendGmailEmail(account: any, emailData: any) {
  const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)

  auth.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
  })

  const gmailClient = google.gmail({ version: "v1", auth })

  const message = [
    `To: ${emailData.to}`,
    emailData.cc ? `Cc: ${emailData.cc}` : "",
    emailData.bcc ? `Bcc: ${emailData.bcc}` : "",
    `Subject: ${emailData.subject}`,
    "",
    emailData.body,
  ]
    .filter(Boolean)
    .join("\n")

  const encodedMessage = Buffer.from(message).toString("base64url")

  await gmailClient.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedMessage,
    },
  })
}

async function sendOutlookEmail(account: any, emailData: any) {
  const client = Client.init({
    authProvider: {
      getAccessToken: async () => account.access_token,
    },
  })

  const message = {
    subject: emailData.subject,
    body: {
      contentType: "HTML",
      content: emailData.body,
    },
    toRecipients: emailData.to.split(",").map((email: string) => ({
      emailAddress: { address: email.trim() },
    })),
    ccRecipients: emailData.cc
      ? emailData.cc.split(",").map((email: string) => ({
          emailAddress: { address: email.trim() },
        }))
      : [],
    bccRecipients: emailData.bcc
      ? emailData.bcc.split(",").map((email: string) => ({
          emailAddress: { address: email.trim() },
        }))
      : [],
  }

  await client.api("/me/sendMail").post({
    message,
  })
}
