"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { KeyboardShortcut } from "@/hooks/use-keyboard-shortcuts"

interface KeyboardShortcutsHelpProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shortcuts: KeyboardShortcut[]
}

export function KeyboardShortcutsHelp({ open, onOpenChange, shortcuts }: KeyboardShortcutsHelpProps) {
  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = []
      }
      acc[shortcut.category].push(shortcut)
      return acc
    },
    {} as Record<string, KeyboardShortcut[]>,
  )

  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const keys = []
    if (shortcut.metaKey) keys.push("⌘")
    if (shortcut.ctrlKey) keys.push("Ctrl")
    if (shortcut.shiftKey) keys.push("⇧")
    if (shortcut.altKey) keys.push("⌥")
    keys.push(shortcut.key.toUpperCase())
    return keys.join(" + ")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-3">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categoryShortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                    <span className="text-sm">{shortcut.description}</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {formatShortcut(shortcut)}
                    </Badge>
                  </div>
                ))}
              </div>
              {category !== Object.keys(groupedShortcuts)[Object.keys(groupedShortcuts).length - 1] && (
                <Separator className="mt-4" />
              )}
            </div>
          ))}

          <div>
            <h3 className="text-lg font-semibold mb-3">Two-Key Shortcuts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                <span className="text-sm">Go to Inbox</span>
                <Badge variant="outline" className="font-mono text-xs">
                  G then I
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                <span className="text-sm">Go to Sent</span>
                <Badge variant="outline" className="font-mono text-xs">
                  G then S
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                <span className="text-sm">Go to Drafts</span>
                <Badge variant="outline" className="font-mono text-xs">
                  G then D
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                <span className="text-sm">Go to Starred</span>
                <Badge variant="outline" className="font-mono text-xs">
                  G then *
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                <span className="text-sm">Go to Archive</span>
                <Badge variant="outline" className="font-mono text-xs">
                  G then A
                </Badge>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Shortcuts work when not typing in input fields</p>
            <p>• Press Escape to cancel any action or close dialogs</p>
            <p>• Two-key shortcuts have a 2-second timeout</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
