"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Inbox,
  Star,
  Send,
  FileText,
  Clock,
  Calendar,
  Archive,
  Trash2,
  AlertCircle,
  Users,
  Briefcase,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  selectedFolder: string
  onFolderSelect: (folder: string) => void
  accounts: any[]
  currentAccount: any
  onAccountChange: (account: any) => void
}

const folders = [
  { id: "inbox", label: "Inbox", icon: Inbox, count: 12 },
  { id: "starred", label: "Starred", icon: Star, count: 3 },
  { id: "sent", label: "Sent", icon: Send },
  { id: "drafts", label: "Drafts", icon: FileText, count: 2 },
  { id: "snoozed", label: "Snoozed", icon: Clock, count: 1 },
  { id: "scheduled", label: "Scheduled", icon: Calendar },
  { id: "archive", label: "Archive", icon: Archive },
  { id: "spam", label: "Spam", icon: AlertCircle },
  { id: "trash", label: "Trash", icon: Trash2 },
]

const splits = [
  { id: "primary", label: "Primary", count: 8 },
  { id: "social", label: "Social", count: 2 },
  { id: "updates", label: "Updates", count: 2 },
  { id: "team", label: "Team", icon: Users },
  { id: "work", label: "Work", icon: Briefcase },
]

export function Sidebar({ selectedFolder, onFolderSelect, accounts, currentAccount, onAccountChange }: SidebarProps) {
  return (
    <div className="w-64 border-r border-border bg-muted/30 flex flex-col">
      {/* Account selector */}
      {accounts.length > 1 && (
        <div className="p-4 border-b border-border">
          <select
            value={currentAccount?.id || ""}
            onChange={(e) => {
              const account = accounts.find((a) => a.id === e.target.value)
              if (account) onAccountChange(account)
            }}
            className="w-full p-2 rounded border border-border bg-background"
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.display_name || account.email}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Main folders */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-1">
          {folders.map((folder) => {
            const Icon = folder.icon
            return (
              <Button
                key={folder.id}
                variant={selectedFolder === folder.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  selectedFolder === folder.id && "bg-secondary text-secondary-foreground",
                )}
                onClick={() => onFolderSelect(folder.id)}
              >
                <Icon className="w-4 h-4 mr-3" />
                <span className="flex-1 text-left">{folder.label}</span>
                {folder.count && folder.count > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {folder.count}
                  </Badge>
                )}
              </Button>
            )
          })}
        </div>

        {/* Splits */}
        <div className="px-4 pb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2 px-2">SPLITS</div>
          <div className="space-y-1">
            {splits.map((split) => {
              const Icon = split.icon
              return (
                <Button
                  key={split.id}
                  variant={selectedFolder === split.id ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-start text-sm",
                    selectedFolder === split.id && "bg-secondary text-secondary-foreground",
                  )}
                  onClick={() => onFolderSelect(split.id)}
                >
                  {Icon ? <Icon className="w-3 h-3 mr-2" /> : <div className="w-2 h-2 rounded-full bg-primary mr-3" />}
                  <span className="flex-1 text-left">{split.label}</span>
                  {split.count && split.count > 0 && (
                    <Badge variant="outline" className="ml-auto text-xs">
                      {split.count}
                    </Badge>
                  )}
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="p-4 border-t border-border">
        <Button variant="ghost" className="w-full justify-start" onClick={() => window.open("/settings", "_blank")}>
          <Settings className="w-4 h-4 mr-3" />
          Settings
        </Button>
      </div>
    </div>
  )
}
