"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { X, User, Bell, Keyboard, Palette, Shield, Settings, Code, Database, Server } from "lucide-react"
import { useTheme } from "next-themes"
import { useToast } from "@/hooks/use-toast"

interface SettingsOverlayProps {
  isOpen: boolean
  onClose: () => void
  user: {
    id: string
    email: string
    name?: string
    avatar_url?: string
  }
}

export function SettingsOverlay({ isOpen, onClose, user }: SettingsOverlayProps) {
  const { toast } = useToast()

  if (!isOpen) return null

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Here you would implement the actual save functionality
      console.log("Saving settings:", {
        name,
        email,
        keyboardShortcuts,
        emailNotifications,
        pushNotifications,
        theme,
      })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated",
      })
      
      onClose()
    } catch (error) {
      toast({
        title: "Save failed",
        description: "There was an error saving your settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Developer Settings
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* User Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{user.name || user.email}</span>
              <Badge variant="secondary" className="text-xs">
                {user.email === "demo@mastermail.com" ? "Demo" : "Live"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>

          <Separator />

          {/* Developer Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Developer Options</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Debug Logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable detailed console logging
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>API Debugging</Label>
                  <p className="text-sm text-muted-foreground">
                    Log API requests and responses
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Database Queries</Label>
                  <p className="text-sm text-muted-foreground">
                    Show database query logs
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>

          <Separator />

          {/* System Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">System Information</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Environment:</span>
                <span className="font-mono">
                  {typeof window !== 'undefined' ? 'browser' : process.env.NODE_ENV || 'development'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">User ID:</span>
                <span className="font-mono">{user.id.slice(0, 8)}...</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Debug Actions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Debug Actions</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.open('/api/debug/supabase-config', '_blank')
                }}
              >
                Check Supabase Config
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.open('/api/debug/gmail-test', '_blank')
                }}
              >
                Test Gmail API
              </Button>

              {user.email === "demo@mastermail.com" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/debug/populate-demo', {
                        method: 'POST',
                      })
                      if (response.ok) {
                        toast({
                          title: "Demo emails refreshed",
                          description: "Demo emails have been repopulated",
                        })
                      }
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to refresh demo emails",
                        variant: "destructive",
                      })
                    }
                  }}
                >
                  Refresh Demo Emails
                </Button>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
