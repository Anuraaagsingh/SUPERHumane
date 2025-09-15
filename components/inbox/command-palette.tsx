"use client"

import { useState } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Search, Edit, Archive, Star, Clock, Trash2, Settings, RefreshCw, Keyboard, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

interface CommandPaletteProps {
  onClose: () => void
  onCompose: () => void
  onSync: () => void
}

export function CommandPalette({ onClose, onCompose, onSync }: CommandPaletteProps) {
  const [search, setSearch] = useState("")
  const { theme, setTheme } = useTheme()

  const commands = [
    {
      group: "Actions",
      items: [
        { id: "compose", label: "Compose new email", icon: Edit, shortcut: "C", action: onCompose },
        { id: "sync", label: "Sync emails", icon: RefreshCw, action: onSync },
        { id: "search", label: "Search emails", icon: Search, shortcut: "/" },
        { id: "archive", label: "Archive selected", icon: Archive, shortcut: "E" },
        { id: "star", label: "Star selected", icon: Star, shortcut: "S" },
        { id: "snooze", label: "Snooze selected", icon: Clock },
        { id: "delete", label: "Delete selected", icon: Trash2 },
      ],
    },
    {
      group: "Navigation",
      items: [
        { id: "inbox", label: "Go to Inbox", shortcut: "G I" },
        { id: "sent", label: "Go to Sent", shortcut: "G S" },
        { id: "drafts", label: "Go to Drafts", shortcut: "G D" },
        { id: "starred", label: "Go to Starred", shortcut: "G *" },
        { id: "archive", label: "Go to Archive", shortcut: "G A" },
      ],
    },
    {
      group: "Settings",
      items: [
        { id: "settings", label: "Open Settings", icon: Settings },
        { id: "shortcuts", label: "Keyboard Shortcuts", icon: Keyboard, shortcut: "?" },
        {
          id: "theme",
          label: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
          icon: theme === "dark" ? Sun : Moon,
          action: () => setTheme(theme === "dark" ? "light" : "dark"),
        },
      ],
    },
  ]

  const filteredCommands = commands
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.label.toLowerCase().includes(search.toLowerCase())),
    }))
    .filter((group) => group.items.length > 0)

  const handleSelect = (command: any) => {
    if (command.action) {
      command.action()
    }
    onClose()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="p-0 max-w-2xl">
        <Command>
          <CommandInput
            placeholder="Type a command or search..."
            value={search}
            onValueChange={setSearch}
            className="border-0"
          />
          <CommandList className="max-h-96">
            <CommandEmpty>No results found.</CommandEmpty>
            {filteredCommands.map((group) => (
              <CommandGroup key={group.group} heading={group.group}>
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <CommandItem key={item.id} onSelect={() => handleSelect(item)} className="flex items-center gap-2">
                      {Icon && <Icon className="w-4 h-4" />}
                      <span className="flex-1">{item.label}</span>
                      {item.shortcut && (
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                          {item.shortcut}
                        </kbd>
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
