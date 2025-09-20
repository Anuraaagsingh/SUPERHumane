"use client"

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect, useCallback } from "react"

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

export function useInfiniteMessages(accountId: string, query?: string) {
  return useInfiniteQuery({
    queryKey: ["messages-infinite", accountId, query],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams({
        accountId,
        page: pageParam.toString(),
        limit: "20",
        ...(query && { query }),
      })

      const response = await fetch(`/api/email/messages?${params}`)

      if (!response.ok) {
        throw new Error("Failed to fetch messages")
      }

      const data = await response.json()
      return {
        messages: data.messages || [],
        nextCursor: data.hasMore ? pageParam + 1 : null
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!accountId,
    initialPageParam: 0,
  })
}

export function useInfiniteScroll(callback: () => void, hasNextPage: boolean, isFetching: boolean) {
  const [isLoading, setIsLoading] = useState(false)

  const handleScroll = useCallback(() => {
    if (isLoading || isFetching || !hasNextPage) return

    const { scrollTop, scrollHeight, clientHeight } = document.documentElement
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 1000

    if (isNearBottom) {
      setIsLoading(true)
      callback()
    }
  }, [callback, hasNextPage, isFetching, isLoading])

  useEffect(() => {
    const handleScrollThrottled = throttle(handleScroll, 200)
    window.addEventListener('scroll', handleScrollThrottled)
    return () => window.removeEventListener('scroll', handleScrollThrottled)
  }, [handleScroll])

  useEffect(() => {
    if (!isFetching) {
      setIsLoading(false)
    }
  }, [isFetching])

  return { isLoading }
}

function throttle(func: Function, limit: number) {
  let inThrottle: boolean
  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
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
