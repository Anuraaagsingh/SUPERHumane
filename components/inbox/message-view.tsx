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
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { cn } from "@/lib/utils"

interface MessageViewProps {
  message: any
  account: any
}

export function MessageView({ message, account }: MessageViewProps) {
  const [isStarred, setIsStarred] = useState(message.is_starred)
  const [showFullHeaders, setShowFullHeaders] = useState(false)

  const senderInitials = message.sender_name
    ? message.sender_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : message.sender_email[0].toUpperCase()

  const handleAction = (action: string) => {
    console.log(`Action: ${action} on message:`, message.id)
    // Implement actions
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => handleAction("reply")}>
              <Reply className="w-4 h-4 mr-1" />
              Reply
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleAction("replyAll")}>
              <ReplyAll className="w-4 h-4 mr-1" />
              Reply All
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleAction("forward")}>
              <Forward className="w-4 h-4 mr-1" />
              Forward
            </Button>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={() => setIsStarred(!isStarred)}>
              <Star className={cn("w-4 h-4", isStarred ? "fill-yellow-400 text-yellow-400" : "")} />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleAction("archive")}>
              <Archive className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleAction("snooze")}>
              <Clock className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleAction("share")}>
              <Share className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleAction("delete")}>
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

          {message.labels && message.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {message.labels.map((label: string) => (
                <Badge key={label} variant="secondary" className="text-xs">
                  {label}
                </Badge>
              ))}
            </div>
          )}
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
