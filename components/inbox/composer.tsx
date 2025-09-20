"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Send, Paperclip, Bold, Italic, Link } from "lucide-react"
import { cn } from "@/lib/utils"

interface ComposerProps {
  isOpen: boolean
  onClose: () => void
  initialData?: {
    to?: string
    cc?: string
    bcc?: string
    subject?: string
    body?: string
  }
  mode?: "compose" | "reply" | "forward"
}

export function Composer({ isOpen, onClose, initialData, mode = "compose" }: ComposerProps) {
  const [to, setTo] = useState(initialData?.to || "")
  const [cc, setCc] = useState(initialData?.cc || "")
  const [bcc, setBcc] = useState(initialData?.bcc || "")
  const [subject, setSubject] = useState(initialData?.subject || "")
  const [body, setBody] = useState(initialData?.body || "")
  const [showCc, setShowCc] = useState(!!initialData?.cc)
  const [showBcc, setShowBcc] = useState(!!initialData?.bcc)
  const [isSending, setIsSending] = useState(false)

  if (!isOpen) return null

  const handleSend = async () => {
    if (!to.trim() || !subject.trim()) return

    setIsSending(true)
    try {
      // Here you would implement the actual send functionality
      console.log("Sending email:", { to, cc, bcc, subject, body })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Reset form
      setTo("")
      setCc("")
      setBcc("")
      setSubject("")
      setBody("")
      
      onClose()
    } catch (error) {
      console.error("Send error:", error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose()
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSend()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl h-[80vh] flex flex-col">
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <CardTitle>
              {mode === "reply" ? "Reply" : mode === "forward" ? "Forward" : "Compose"}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="to" className="w-12 text-sm font-medium">
                To
              </Label>
              <Input
                id="to"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Recipients"
                className="flex-1"
                onKeyDown={handleKeyDown}
              />
            </div>
            
            {showCc && (
              <div className="flex items-center gap-2">
                <Label htmlFor="cc" className="w-12 text-sm font-medium">
                  Cc
                </Label>
                <Input
                  id="cc"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="Carbon copy"
                  className="flex-1"
                  onKeyDown={handleKeyDown}
                />
              </div>
            )}
            
            {showBcc && (
              <div className="flex items-center gap-2">
                <Label htmlFor="bcc" className="w-12 text-sm font-medium">
                  Bcc
                </Label>
                <Input
                  id="bcc"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="Blind carbon copy"
                  className="flex-1"
                  onKeyDown={handleKeyDown}
                />
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Label htmlFor="subject" className="w-12 text-sm font-medium">
                Subject
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="flex-1"
                onKeyDown={handleKeyDown}
              />
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCc(!showCc)}
                className="h-auto p-0 text-xs"
              >
                {showCc ? "Hide" : "Show"} Cc
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBcc(!showBcc)}
                className="h-auto p-0 text-xs"
              >
                {showBcc ? "Hide" : "Show"} Bcc
              </Button>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-2 p-2 border-b">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Bold className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Italic className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Link className="w-4 h-4" />
              </Button>
              <div className="flex-1" />
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Paperclip className="w-4 h-4" />
              </Button>
            </div>
            
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Compose your message..."
              className="flex-1 border-0 resize-none focus:ring-0"
              onKeyDown={handleKeyDown}
            />
          </div>
          
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-muted-foreground">
              Press Cmd+Enter to send
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSend} 
                disabled={!to.trim() || !subject.trim() || isSending}
              >
                {isSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}