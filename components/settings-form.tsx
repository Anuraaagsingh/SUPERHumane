"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@supabase/ssr"

interface SettingsFormProps {
  user: any
  profile: any
}

export function SettingsForm({ user, profile }: SettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState(profile?.settings || {})
  const { toast } = useToast()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.from("users").update({ settings }).eq("id", user.id)

      if (error) throw error

      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateSetting = (key: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [key]: value,
    }))
  }

  const updateNestedSetting = (parent: string, key: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [key]: value,
      },
    }))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your basic account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input id="name" value={profile?.name || ""} placeholder="Your display name" disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your email experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Keyboard Shortcuts</Label>
              <p className="text-sm text-muted-foreground">Enable Gmail-style keyboard shortcuts</p>
            </div>
            <Switch
              checked={settings.keyboard_shortcuts !== false}
              onCheckedChange={(checked) => updateSetting("keyboard_shortcuts", checked)}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <Label>Notifications</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive email notifications for important messages</p>
                </div>
                <Switch
                  checked={settings.notifications?.email !== false}
                  onCheckedChange={(checked) => updateNestedSetting("notifications", "email", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Push Notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive browser push notifications</p>
                </div>
                <Switch
                  checked={settings.notifications?.push === true}
                  onCheckedChange={(checked) => updateNestedSetting("notifications", "push", checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
