"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Search } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface Snippet {
  id: string
  shortcut: string
  content: string
  created_at: string
}

export function SnippetsManager() {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null)
  const [shortcut, setShortcut] = useState("")
  const [content, setContent] = useState("")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadSnippets()
  }, [])

  const loadSnippets = async () => {
    const { data, error } = await supabase.from("snippets").select("*").order("created_at", { ascending: false })

    if (!error && data) {
      setSnippets(data)
    }
  }

  const saveSnippet = async () => {
    if (!shortcut.trim() || !content.trim()) return

    if (editingSnippet) {
      const { error } = await supabase
        .from("snippets")
        .update({ shortcut: shortcut.trim(), content: content.trim() })
        .eq("id", editingSnippet.id)

      if (!error) {
        loadSnippets()
        resetForm()
      }
    } else {
      const { error } = await supabase.from("snippets").insert({ shortcut: shortcut.trim(), content: content.trim() })

      if (!error) {
        loadSnippets()
        resetForm()
      }
    }
  }

  const deleteSnippet = async (id: string) => {
    const { error } = await supabase.from("snippets").delete().eq("id", id)

    if (!error) {
      loadSnippets()
    }
  }

  const resetForm = () => {
    setShortcut("")
    setContent("")
    setEditingSnippet(null)
    setIsDialogOpen(false)
  }

  const startEdit = (snippet: Snippet) => {
    setEditingSnippet(snippet)
    setShortcut(snippet.shortcut)
    setContent(snippet.content)
    setIsDialogOpen(true)
  }

  const filteredSnippets = snippets.filter(
    (snippet) =>
      snippet.shortcut.toLowerCase().includes(searchTerm.toLowerCase()) ||
      snippet.content.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Snippets</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              New Snippet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSnippet ? "Edit Snippet" : "Create Snippet"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Shortcut</label>
                <Input
                  value={shortcut}
                  onChange={(e) => setShortcut(e.target.value)}
                  placeholder="e.g., sig, thanks, meeting"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter your snippet content..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button onClick={saveSnippet}>{editingSnippet ? "Update" : "Create"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search snippets..."
          className="pl-10"
        />
      </div>

      <div className="grid gap-4">
        {filteredSnippets.map((snippet) => (
          <Card key={snippet.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  <Badge variant="secondary" className="mr-2">
                    {snippet.shortcut}
                  </Badge>
                </CardTitle>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(snippet)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteSnippet(snippet.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{snippet.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSnippets.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? "No snippets found" : "No snippets yet. Create your first one!"}
        </div>
      )}
    </div>
  )
}
