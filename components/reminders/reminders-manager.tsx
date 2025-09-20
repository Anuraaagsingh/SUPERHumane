"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, Plus, Trash2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { format, addDays, addHours } from "date-fns"

interface Reminder {
  id: string
  message_id: string
  remind_at: string
  created_at: string
  message?: {
    subject: string
    sender_name: string
  }
}

export function RemindersManager() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedMessageId, setSelectedMessageId] = useState("")
  const [reminderTime, setReminderTime] = useState("")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadReminders()
  }, [loadReminders])

  const loadReminders = useCallback(async () => {
    const { data, error } = await supabase
      .from("reminders")
      .select(`
        *,
        message:messages(subject, sender_name)
      `)
      .gte("remind_at", new Date().toISOString())
      .order("remind_at", { ascending: true })

    if (!error && data) {
      setReminders(data)
    }
  }, [supabase])

  const createReminder = async () => {
    if (!selectedMessageId || !reminderTime) return

    let remindAt: Date
    const now = new Date()

    switch (reminderTime) {
      case "1hour":
        remindAt = addHours(now, 1)
        break
      case "4hours":
        remindAt = addHours(now, 4)
        break
      case "tomorrow":
        remindAt = addDays(now, 1)
        break
      case "nextweek":
        remindAt = addDays(now, 7)
        break
      default:
        return
    }

    const { error } = await supabase.from("reminders").insert({
      message_id: selectedMessageId,
      remind_at: remindAt.toISOString(),
    })

    if (!error) {
      loadReminders()
      setIsDialogOpen(false)
      setSelectedMessageId("")
      setReminderTime("")
    }
  }

  const deleteReminder = async (id: string) => {
    const { error } = await supabase.from("reminders").delete().eq("id", id)

    if (!error) {
      loadReminders()
    }
  }

  const getReminderTimeLabel = (remindAt: string) => {
    const date = new Date(remindAt)
    const now = new Date()
    const diffHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (diffHours < 24) {
      return `Today at ${format(date, "h:mm a")}`
    } else if (diffHours < 48) {
      return `Tomorrow at ${format(date, "h:mm a")}`
    } else {
      return format(date, "MMM d, h:mm a")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Reminders</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Reminder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Reminder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Message ID</label>
                <Input
                  value={selectedMessageId}
                  onChange={(e) => setSelectedMessageId(e.target.value)}
                  placeholder="Enter message ID"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Remind me</label>
                <Select value={reminderTime} onValueChange={setReminderTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1hour">In 1 hour</SelectItem>
                    <SelectItem value="4hours">In 4 hours</SelectItem>
                    <SelectItem value="tomorrow">Tomorrow</SelectItem>
                    <SelectItem value="nextweek">Next week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createReminder}>Create Reminder</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {reminders.map((reminder) => (
          <Card key={reminder.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{reminder.message?.subject || "Untitled"}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => deleteReminder(reminder.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {reminder.message?.sender_name || "Unknown sender"}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {getReminderTimeLabel(reminder.remind_at)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {reminders.length === 0 && <div className="text-center py-8 text-muted-foreground">No upcoming reminders</div>}
    </div>
  )
}
