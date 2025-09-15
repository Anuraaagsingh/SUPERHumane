"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"

export function useEmailSync() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const syncMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const response = await fetch("/api/email/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      })

      if (!response.ok) {
        throw new Error("Sync failed")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] })
      toast({
        title: "Sync complete",
        description: "Your emails have been synchronized",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync emails",
        variant: "destructive",
      })
    },
  })

  return {
    syncAccount: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
  }
}

export function useMessages(accountId: string, query?: string) {
  return useQuery({
    queryKey: ["messages", accountId, query],
    queryFn: async () => {
      const params = new URLSearchParams({
        accountId,
        ...(query && { query }),
      })

      const response = await fetch(`/api/email/messages?${params}`)

      if (!response.ok) {
        throw new Error("Failed to fetch messages")
      }

      const data = await response.json()
      return data.messages
    },
    enabled: !!accountId,
  })
}

export function useSendEmail() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (emailData: any) => {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      })

      if (!response.ok) {
        throw new Error("Failed to send email")
      }

      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["messages"] })
      toast({
        title: data.scheduled ? "Email scheduled" : "Email sent",
        description: data.scheduled ? "Your email has been scheduled" : "Your email has been sent successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Send failed",
        description: error.message || "Failed to send email",
        variant: "destructive",
      })
    },
  })
}
