"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { X, User, Bell, Keyboard, Palette, Sun, Moon, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

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
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState(user.name || user.email?.split("@")[0] || "")
  const [keyboardShortcuts, setKeyboardShortcuts] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const supabase = createClient()

  if (!isOpen) return null

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Save user profile settings
      const { error } = await supabase
        .from("users")
        .update({
          name,
          settings: {
            theme: theme || "light",
            keyboard_shortcuts: keyboardShortcuts,
            notifications: {
              email: emailNotifications,
              push: pushNotifications,
            },
          },
        })
        .eq("id", user.id)

      if (error) throw error
      
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated",
      })
      
      onClose()
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message || "There was an error saving your settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      })
      onClose()
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      })
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
              <User className="w-5 h-5" />
              Settings
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* User Profile */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Profile</span>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your display name"
                />
              </div>
              <div>
                <Label>Email</Label>
                <div className="flex items-center gap-2">
                  <Input value={user.email} disabled className="text-muted-foreground" />
                  <Badge variant="secondary" className="text-xs">
                    {user.email === "demo@mastermail.com" ? "Demo" : "Live"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Theme Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Appearance</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
                className="flex items-center gap-2"
              >
                <Sun className="w-4 h-4" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
                className="flex items-center gap-2"
              >
                <Moon className="w-4 h-4" />
                Dark
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("system")}
                className="flex items-center gap-2"
              >
                <Monitor className="w-4 h-4" />
                Auto
              </Button>
            </div>
          </div>

          <Separator />

          {/* Preferences */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Preferences</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="keyboard-shortcuts" className="text-sm">
                  Keyboard shortcuts
                </Label>
                <Switch
                  id="keyboard-shortcuts"
                  checked={keyboardShortcuts}
                  onCheckedChange={setKeyboardShortcuts}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Notifications</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications" className="text-sm">
                  Email notifications
                </Label>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications" className="text-sm">
                  Push notifications
                </Label>
                <Switch
                  id="push-notifications"
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}