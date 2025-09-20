"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Copy, Plus, Trash2, ExternalLink, Eye, EyeOff } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { toast } from "@/hooks/use-toast"

interface SharedView {
  id: string
  name: string
  query: string
  is_public: boolean
  share_token: string
  created_at: string
}

export function SharedViewsManager() {
  const [sharedViews, setSharedViews] = useState<SharedView[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [name, setName] = useState("")
  const [query, setQuery] = useState("")
  const [isPublic, setIsPublic] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadSharedViews()
  }, [loadSharedViews])

  const loadSharedViews = useCallback(async () => {
    const { data, error } = await supabase.from("shared_views").select("*").order("created_at", { ascending: false })

    if (!error && data) {
      setSharedViews(data)
    }
  }, [supabase])

  const createSharedView = async () => {
    if (!name.trim() || !query.trim()) return

    const shareToken = Math.random().toString(36).substring(2, 15)

    const { error } = await supabase.from("shared_views").insert({
      name: name.trim(),
      query: query.trim(),
      is_public: isPublic,
      share_token: shareToken,
    })

    if (!error) {
      loadSharedViews()
      resetForm()
    }
  }

  const togglePublic = async (id: string, currentPublic: boolean) => {
    const { error } = await supabase.from("shared_views").update({ is_public: !currentPublic }).eq("id", id)

    if (!error) {
      loadSharedViews()
    }
  }

  const deleteSharedView = async (id: string) => {
    const { error } = await supabase.from("shared_views").delete().eq("id", id)

    if (!error) {
      loadSharedViews()
    }
  }

  const copyShareLink = (shareToken: string) => {
    const url = `${window.location.origin}/shared/${shareToken}`
    navigator.clipboard.writeText(url)
    toast({
      title: "Link copied",
      description: "Share link has been copied to clipboard",
    })
  }

  const resetForm = () => {
    setName("")
    setQuery("")
    setIsPublic(false)
    setIsDialogOpen(false)
  }

  const getQueryPreview = (query: string) => {
    if (query.length <= 50) return query
    return query.substring(0, 50) + "..."
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Shared Views</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              New Shared View
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Shared View</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Important Emails, Team Updates"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Search Query</label>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., from:team@company.com is:unread"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
                <label htmlFor="public" className="text-sm font-medium">
                  Make public
                </label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button onClick={createSharedView}>Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {sharedViews.map((view) => (
          <Card key={view.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{view.name}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant={view.is_public ? "default" : "secondary"}>
                    {view.is_public ? (
                      <>
                        <Eye className="w-3 h-3 mr-1" />
                        Public
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3 mr-1" />
                        Private
                      </>
                    )}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => togglePublic(view.id, view.is_public)}>
                    {view.is_public ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => copyShareLink(view.share_token)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteSharedView(view.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground font-mono">{getQueryPreview(view.query)}</p>
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={() => copyShareLink(view.share_token)}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Copy Share Link
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sharedViews.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No shared views yet. Create one to share your email searches!
        </div>
      )}
    </div>
  )
}
