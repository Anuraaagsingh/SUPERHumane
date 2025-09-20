"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export function useEmailActions() {
  const [loading, setLoading] = useState<string | null>(null)
  const { toast } = useToast()

  const performAction = async (action: string, messageId: string, data: any = {}) => {
    setLoading(action)
    try {
      const response = await fetch("/api/email/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, messageId, data }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Action failed")
      }

      toast({
        title: "Success",
        description: `${action.charAt(0).toUpperCase() + action.slice(1)} action completed`,
      })

      return result
    } catch (error: any) {
      console.error(`${action} error:`, error)
      toast({
        title: "Error",
        description: error.message || `Failed to ${action}`,
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(null)
    }
  }

  const starMessage = (messageId: string, isStarred: boolean) =>
    performAction("star", messageId, { isStarred })

  const archiveMessage = (messageId: string, isArchived: boolean) =>
    performAction("archive", messageId, { isArchived })

  const markAsRead = (messageId: string, isRead: boolean) =>
    performAction("read", messageId, { isRead })

  const snoozeMessage = (messageId: string, isSnoozed: boolean, snoozeUntil?: string) =>
    performAction("snooze", messageId, { isSnoozed, snoozeUntil })

  const addLabel = (messageId: string, label: string) =>
    performAction("addLabel", messageId, { label })

  const removeLabel = (messageId: string, label: string) =>
    performAction("removeLabel", messageId, { label })

  const replyToMessage = (messageId: string) =>
    performAction("reply", messageId, {})

  const forwardMessage = (messageId: string) =>
    performAction("forward", messageId, {})

  return {
    loading,
    starMessage,
    archiveMessage,
    markAsRead,
    snoozeMessage,
    addLabel,
    removeLabel,
    replyToMessage,
    forwardMessage,
  }
}
