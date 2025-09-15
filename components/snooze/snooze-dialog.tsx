"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock, Calendar } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { addHours, addDays, format } from "date-fns"

interface SnoozeDialogProps {
  isOpen: boolean
  onClose: () => void
  messageId: string
  onSnooze?: () => void
}

export function SnoozeDialog({ isOpen, onClose, messageId, onSnooze }: SnoozeDialogProps) {
  const [snoozeTime, setSnoozeTime] = useState("")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const snoozeOptions = [
    { value: "1hour", label: "In 1 hour", icon: Clock },
    { value: "4hours", label: "In 4 hours", icon: Clock },
    { value: "tomorrow", label: "Tomorrow morning", icon: Calendar },
    { value: "nextweek", label: "Next week", icon: Calendar },
    { value: "weekend", label: "This weekend", icon: Calendar },
  ]

  const handleSnooze = async () => {
    if (!snoozeTime) return

    let snoozeUntil: Date
    const now = new Date()

    switch (snoozeTime) {
      case "1hour":
        snoozeUntil = addHours(now, 1)
        break
      case "4hours":
        snoozeUntil = addHours(now, 4)
        break
      case "tomorrow":
        snoozeUntil = addDays(now, 1)
        snoozeUntil.setHours(9, 0, 0, 0) // 9 AM tomorrow
        break
      case "nextweek":
        snoozeUntil = addDays(now, 7)
        snoozeUntil.setHours(9, 0, 0, 0)
        break
      case "weekend":
        const daysUntilSaturday = (6 - now.getDay()) % 7 || 7
        snoozeUntil = addDays(now, daysUntilSaturday)
        snoozeUntil.setHours(9, 0, 0, 0)
        break
      default:
        return
    }

    // Update message to be snoozed
    const { error } = await supabase
      .from("messages")
      .update({
        snoozed_until: snoozeUntil.toISOString(),
        is_snoozed: true,
      })
      .eq("id", messageId)

    if (!error) {
      onSnooze?.()
      onClose()
      setSnoozeTime("")
    }
  }

  const getPreviewTime = (option: string) => {
    let previewDate: Date
    const now = new Date()

    switch (option) {
      case "1hour":
        previewDate = addHours(now, 1)
        return format(previewDate, "h:mm a")
      case "4hours":
        previewDate = addHours(now, 4)
        return format(previewDate, "h:mm a")
      case "tomorrow":
        previewDate = addDays(now, 1)
        return "Tomorrow at 9:00 AM"
      case "nextweek":
        previewDate = addDays(now, 7)
        return format(previewDate, "EEE, MMM d") + " at 9:00 AM"
      case "weekend":
        const daysUntilSaturday = (6 - now.getDay()) % 7 || 7
        previewDate = addDays(now, daysUntilSaturday)
        return format(previewDate, "EEE, MMM d") + " at 9:00 AM"
      default:
        return ""
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Snooze Message</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            {snoozeOptions.map((option) => {
              const Icon = option.icon
              return (
                <Button
                  key={option.value}
                  variant={snoozeTime === option.value ? "default" : "ghost"}
                  className="justify-start h-auto p-4"
                  onClick={() => setSnoozeTime(option.value)}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-muted-foreground">{getPreviewTime(option.value)}</div>
                  </div>
                </Button>
              )
            })}
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSnooze} disabled={!snoozeTime}>
              Snooze
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
