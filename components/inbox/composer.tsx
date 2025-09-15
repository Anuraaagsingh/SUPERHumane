"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  X,
  Send,
  Paperclip,
  Clock,
  Minimize2,
  Maximize2,
  Bold,
  Italic,
  Underline,
  Link,
  ImageIcon,
  Smile,
} from "lucide-react"
import { useSendEmail } from "@/hooks/use-email-sync"
import { jobScheduler } from "@/lib/jobs/scheduler"

interface ComposerProps {
  account: any
  onClose: () => void
  replyTo?: any
  draft?: any
}

export function Composer({ account, onClose, replyTo, draft }: ComposerProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [to, setTo] = useState(replyTo?.sender_email || "")
  const [cc, setCc] = useState("")
  const [bcc, setBcc] = useState("")
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : "")
  const [body, setBody] = useState("")
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState("")

  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const sendEmail = useSendEmail()

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      if (to || subject || body) {
        // Save draft logic here
        console.log("Auto-saving draft...")
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [to, subject, body])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault()
        handleSend()
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "Enter") {
        e.preventDefault()
        setIsScheduled(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [to, subject, body])

  const handleSend = async () => {
    if (!to || !subject || !body) {
      return
    }

    const emailData = {
      accountId: account.id,
      to: to.split(",").map((email) => email.trim()),
      cc: cc ? cc.split(",").map((email) => email.trim()) : undefined,
      bcc: bcc ? bcc.split(",").map((email) => email.trim()) : undefined,
      subject,
      body,
    }

    if (isScheduled && scheduledDate) {
      try {
        await jobScheduler.scheduleEmail(emailData, new Date(scheduledDate))
        console.log("[v0] Email scheduled successfully")
        onClose()
      } catch (error) {
        console.error("[v0] Error scheduling email:", error)
      }
    } else {
      // Send immediately
      sendEmail.mutate(emailData, {
        onSuccess: () => {
          onClose()
        },
      })
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachments((prev) => [...prev, ...files])
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-80 shadow-lg">
          <CardHeader className="p-3 cursor-pointer" onClick={() => setIsMinimized(false)}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium truncate">{subject || "New message"}</span>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsMinimized(false)}>
                  <Maximize2 className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-4xl max-h-[90vh] mx-4 flex flex-col">
        <CardHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{replyTo ? "Reply" : "New message"}</h2>
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" onClick={() => setIsMinimized(true)}>
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
          {/* Recipients */}
          <div className="p-4 space-y-3 border-b">
            <div className="flex items-center space-x-2">
              <Label htmlFor="to" className="w-12 text-sm">
                To
              </Label>
              <Input
                id="to"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Recipients"
                className="flex-1"
              />
              <div className="flex items-center space-x-1">
                <Button variant="link" size="sm" className="text-xs p-0 h-auto" onClick={() => setShowCc(!showCc)}>
                  Cc
                </Button>
                <Button variant="link" size="sm" className="text-xs p-0 h-auto" onClick={() => setShowBcc(!showBcc)}>
                  Bcc
                </Button>
              </div>
            </div>

            {showCc && (
              <div className="flex items-center space-x-2">
                <Label htmlFor="cc" className="w-12 text-sm">
                  Cc
                </Label>
                <Input id="cc" value={cc} onChange={(e) => setCc(e.target.value)} placeholder="Cc recipients" />
              </div>
            )}

            {showBcc && (
              <div className="flex items-center space-x-2">
                <Label htmlFor="bcc" className="w-12 text-sm">
                  Bcc
                </Label>
                <Input id="bcc" value={bcc} onChange={(e) => setBcc(e.target.value)} placeholder="Bcc recipients" />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Label htmlFor="subject" className="w-12 text-sm">
                Subject
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="flex-1"
              />
            </div>
          </div>

          {/* Formatting toolbar */}
          <div className="p-2 border-b flex items-center space-x-1">
            <Button variant="ghost" size="sm">
              <Bold className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Italic className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Underline className="w-4 h-4" />
            </Button>
            <div className="w-px h-4 bg-border mx-1" />
            <Button variant="ghost" size="sm">
              <Link className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <ImageIcon className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Smile className="w-4 h-4" />
            </Button>
            <div className="flex-1" />
            <input type="file" multiple onChange={handleFileUpload} className="hidden" id="file-upload" accept="*/*" />
            <Button variant="ghost" size="sm" onClick={() => document.getElementById("file-upload")?.click()}>
              <Paperclip className="w-4 h-4" />
            </Button>
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="p-4 border-b">
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                    <span className="text-xs">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Message body */}
          <div className="flex-1 p-4">
            <Textarea
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              className="w-full h-full resize-none border-0 focus-visible:ring-0 text-sm leading-relaxed"
            />
          </div>

          {/* Schedule options */}
          {isScheduled && (
            <div className="p-4 border-t bg-muted/30">
              <div className="flex items-center space-x-2">
                <Label htmlFor="schedule" className="text-sm">
                  Send at:
                </Label>
                <Input
                  id="schedule"
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-auto"
                />
                <Button variant="ghost" size="sm" onClick={() => setIsScheduled(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 border-t flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button onClick={handleSend} disabled={!to || !subject || !body || sendEmail.isPending}>
                <Send className="w-4 h-4 mr-1" />
                {isScheduled ? "Schedule" : "Send"}
              </Button>
              <Button variant="outline" onClick={() => setIsScheduled(!isScheduled)}>
                <Clock className="w-4 h-4 mr-1" />
                Send later
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Press <kbd className="px-1 py-0.5 bg-muted rounded">⌘Enter</kbd> to send
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
