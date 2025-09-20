"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Star, Paperclip, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { useEmailActions } from "@/hooks/use-email-actions"

interface EmailListProps {
  messages: any[]
  selectedMessage: any
  selectedIndex: number
  onMessageSelect: (message: any, index: number) => void
  isLoading: boolean
  isFetchingMore?: boolean
  hasMore?: boolean
}

export function EmailList({ messages, selectedMessage, selectedIndex, onMessageSelect, isLoading, isFetchingMore, hasMore }: EmailListProps) {
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set())
  const { starMessage } = useEmailActions()

  useEffect(() => {
    if (messages && messages.length > 0 && selectedIndex >= 0 && selectedIndex < messages.length) {
      const message = messages[selectedIndex]
      if (message && message.id !== selectedMessage?.id) {
        onMessageSelect(message, selectedIndex)
      }
    }
  }, [selectedIndex, messages, selectedMessage, onMessageSelect])

  if (isLoading) {
    return (
      <div className="flex-1 p-4">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3 p-3">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <h3 className="font-medium mb-1">No emails found</h3>
          <p className="text-sm">Your inbox is empty or try a different search</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="divide-y divide-border">
        {messages.map((message, index) => {
          const isSelected = selectedMessage?.id === message.id
          const isFocused = index === selectedIndex
          const isChecked = selectedMessages.has(message.id)
          const senderInitials = message.sender_name
            ? message.sender_name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
            : message.sender_email[0].toUpperCase()

          return (
            <div
              key={message.id}
              className={cn(
                "flex items-center space-x-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors",
                isSelected && "bg-secondary",
                isFocused && "ring-1 ring-primary ring-inset",
                !message.is_read && "bg-background font-medium",
              )}
              onClick={() => onMessageSelect(message, index)}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={(checked) => {
                  setSelectedMessages((prev) => {
                    const newSet = new Set(prev)
                    if (checked) {
                      newSet.add(message.id)
                    } else {
                      newSet.delete(message.id)
                    }
                    return newSet
                  })
                }}
                onClick={(e) => e.stopPropagation()}
              />

              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto hover:bg-transparent"
                onClick={async (e) => {
                  e.stopPropagation()
                  try {
                    await starMessage(message.id, !message.is_starred)
                    // The parent component should refresh the messages to show updated state
                  } catch (error) {
                    // Error is handled in the hook
                  }
                }}
              >
                <Star className={cn("w-4 h-4", message.is_starred ? "fill-yellow-400 text-yellow-400" : "")} />
              </Button>

              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs">{senderInitials}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={cn("text-sm truncate", !message.is_read && "font-semibold")}>
                    {message.sender_name || message.sender_email}
                  </span>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    {message.has_attachments && <Paperclip className="w-3 h-3" />}
                    {message.is_snoozed && <Clock className="w-3 h-3" />}
                    <span>{formatDistanceToNow(new Date(message.received_at), { addSuffix: true })}</span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground truncate mb-1">{message.subject}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {message.snippet || "No preview available"}
                </div>
                {message.labels && message.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {message.labels.slice(0, 2).map((label: string) => (
                      <Badge key={label} variant="outline" className="text-xs">
                        {label}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        
        {/* Loading indicator for infinite scroll */}
        {isFetchingMore && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span className="ml-2 text-sm text-muted-foreground">Loading more emails...</span>
          </div>
        )}
        
        {/* End of list indicator */}
        {!hasMore && messages.length > 0 && (
          <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
            No more emails to load
          </div>
        )}
      </div>
    </div>
  )
}
