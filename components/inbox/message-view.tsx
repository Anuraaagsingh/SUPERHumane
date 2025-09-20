"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Reply,
  ReplyAll,
  Forward,
  Archive,
  Trash2,
  Star,
  Clock,
  Share,
  MoreHorizontal,
  Paperclip,
  Download,
  Tag,
  X,
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { cn } from "@/lib/utils"
import { useEmailActions } from "@/hooks/use-email-actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface MessageViewProps {
  message: any
  account: any
  onReply?: (replyData: any) => void
  onForward?: (forwardData: any) => void
}

export function MessageView({ message, account, onReply, onForward }: MessageViewProps) {
  const [isStarred, setIsStarred] = useState(message.is_starred)
  const [isArchived, setIsArchived] = useState(message.is_archived)
  const [isRead, setIsRead] = useState(message.is_read)
  const [labels, setLabels] = useState(message.labels || [])
  const [showFullHeaders, setShowFullHeaders] = useState(false)
  const [showAddLabel, setShowAddLabel] = useState(false)
  const [newLabel, setNewLabel] = useState("")

  const {
    loading,
    starMessage,
    archiveMessage,
    markAsRead,
    addLabel,
    removeLabel,
    replyToMessage,
    forwardMessage,
  } = useEmailActions()

  const senderInitials = message.sender_name
    ? message.sender_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : message.sender_email[0].toUpperCase()

  const handleStar = async () => {
    try {
      await starMessage(message.id, !isStarred)
      setIsStarred(!isStarred)
    } catch (error) {
      // Error is handled in the hook
    }
  }

  const handleArchive = async () => {
    try {
      await archiveMessage(message.id, !isArchived)
      setIsArchived(!isArchived)
    } catch (error) {
      // Error is handled in the hook
    }
  }

  const handleMarkAsRead = async () => {
    try {
      await markAsRead(message.id, !isRead)
      setIsRead(!isRead)
    } catch (error) {
      // Error is handled in the hook
    }
  }

  const handleReply = async () => {
    try {
      const result = await replyToMessage(message.id)
      if (onReply && result.replyData) {
        onReply(result.replyData)
      }
    } catch (error) {
      // Error is handled in the hook
    }
  }

  const handleForward = async () => {
    try {
      const result = await forwardMessage(message.id)
      if (onForward && result.forwardData) {
        onForward(result.forwardData)
      }
    } catch (error) {
      // Error is handled in the hook
    }
  }

  const handleAddLabel = async () => {
    if (!newLabel.trim()) return
    
    try {
      const result = await addLabel(message.id, newLabel.trim())
      setLabels(result.labels)
      setNewLabel("")
      setShowAddLabel(false)
    } catch (error) {
      // Error is handled in the hook
    }
  }

  const handleRemoveLabel = async (label: string) => {
    try {
      const result = await removeLabel(message.id, label)
      setLabels(result.labels)
    } catch (error) {
      // Error is handled in the hook
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleReply}
              disabled={loading === "reply"}
            >
              <Reply className="w-4 h-4 mr-1" />
              Reply
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleReply}
              disabled={loading === "reply"}
            >
              <ReplyAll className="w-4 h-4 mr-1" />
              Reply All
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleForward}
              disabled={loading === "forward"}
            >
              <Forward className="w-4 h-4 mr-1" />
              Forward
            </Button>
          </div>
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleStar}
              disabled={loading === "star"}
            >
              <Star className={cn("w-4 h-4", isStarred ? "fill-yellow-400 text-yellow-400" : "")} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleArchive}
              disabled={loading === "archive"}
            >
              <Archive className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleMarkAsRead()}
              disabled={loading === "read"}
            >
              <Clock className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => console.log("Share clicked")}>
              <Share className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => console.log("Delete clicked")}>
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-xl font-semibold text-balance">{message.subject}</h1>

          <div className="flex items-start space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback>{senderInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{message.sender_name || message.sender_email}</div>
                  <div className="text-sm text-muted-foreground">to {message.recipient_emails?.join(", ") || "me"}</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <div>{format(new Date(message.received_at), "MMM d, yyyy 'at' h:mm a")}</div>
                  <div className="text-xs">
                    {formatDistanceToNow(new Date(message.received_at), { addSuffix: true })}
                  </div>
                </div>
              </div>

              {showFullHeaders && (
                <div className="mt-3 p-3 bg-muted rounded text-xs space-y-1">
                  <div>
                    <strong>From:</strong> {message.sender_email}
                  </div>
                  <div>
                    <strong>To:</strong> {message.recipient_emails?.join(", ")}
                  </div>
                  <div>
                    <strong>Date:</strong> {format(new Date(message.received_at), "PPpp")}
                  </div>
                  <div>
                    <strong>Message-ID:</strong> {message.message_id}
                  </div>
                </div>
              )}

              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-xs text-muted-foreground mt-1"
                onClick={() => setShowFullHeaders(!showFullHeaders)}
              >
                {showFullHeaders ? "Hide" : "Show"} details
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 items-center">
            {labels.length > 0 && (
              <>
                {labels.map((label: string) => (
                  <Badge key={label} variant="secondary" className="text-xs flex items-center gap-1">
                    {label}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 w-4 h-4 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleRemoveLabel(label)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </>
            )}
            {showAddLabel ? (
              <div className="flex items-center gap-1">
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Add label..."
                  className="h-6 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddLabel()
                    } else if (e.key === "Escape") {
                      setShowAddLabel(false)
                      setNewLabel("")
                    }
                  }}
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={handleAddLabel}
                  disabled={!newLabel.trim()}
                >
                  Add
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    setShowAddLabel(false)
                    setNewLabel("")
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowAddLabel(true)}
              >
                <Tag className="w-3 h-3 mr-1" />
                Add Label
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Attachments */}
      {message.attachments && message.attachments.length > 0 && (
        <div className="border-b border-border p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Paperclip className="w-4 h-4" />
            <span className="text-sm font-medium">{message.attachments.length} attachment(s)</span>
          </div>
          <div className="space-y-2">
            {message.attachments.map((attachment: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <div className="flex items-center space-x-2">
                  <Paperclip className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{attachment.filename}</span>
                  <span className="text-xs text-muted-foreground">({Math.round(attachment.size / 1024)}KB)</span>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message body */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="prose prose-sm max-w-none">
          {message.body?.html ? (
            <div
              dangerouslySetInnerHTML={{ __html: message.body.html }}
              className="email-content"
              style={{ wordBreak: "break-word" }}
            />
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {message.body?.text || message.snippet || "No content available"}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
