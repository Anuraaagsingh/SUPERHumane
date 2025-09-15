"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Trash2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { format } from "date-fns"

interface ScheduledEmail {
  id: string
  type: string
  payload: {
    to: string[]
    subject: string
    body: string
  }
  scheduled_for: string
  status: string
  created_at: string
}

export function ScheduledEmailsManager() {
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadScheduledEmails()
  }, [])

  const loadScheduledEmails = async () => {
    const { data, error } = await supabase
      .from("scheduled_jobs")
      .select("*")
      .eq("type", "send_email")
      .in("status", ["pending", "processing"])
      .order("scheduled_for", { ascending: true })

    if (!error && data) {
      setScheduledEmails(data)
    }
  }

  const cancelScheduledEmail = async (id: string) => {
    const { error } = await supabase.from("scheduled_jobs").update({ status: "failed" }).eq("id", id)

    if (!error) {
      loadScheduledEmails()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "default"
      case "processing":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Scheduled Emails</h2>
      </div>

      <div className="grid gap-4">
        {scheduledEmails.map((email) => (
          <Card key={email.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{email.payload.subject || "No subject"}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant={getStatusColor(email.status)}>{email.status}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => cancelScheduledEmail(email.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">To: {email.payload.to.join(", ")}</div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 mr-1" />
                  Scheduled for {format(new Date(email.scheduled_for), "MMM d, yyyy h:mm a")}
                </div>
                <div className="text-sm text-muted-foreground line-clamp-2">
                  {email.payload.body.substring(0, 150)}...
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {scheduledEmails.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">No scheduled emails</div>
      )}
    </div>
  )
}
