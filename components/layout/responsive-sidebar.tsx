"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Inbox, 
  Star, 
  Send, 
  Drafts, 
  Trash2, 
  Archive, 
  Settings, 
  LogOut,
  Mail,
  Clock,
  Tag
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase"

interface ResponsiveSidebarProps {
  onCompose?: () => void
  activeFolder?: string
  onFolderSelect?: (folder: string) => void
}

export function ResponsiveSidebar({ 
  onCompose, 
  activeFolder = "inbox", 
  onFolderSelect 
}: ResponsiveSidebarProps) {
  const { user } = useAuth()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const folders = [
    { id: "inbox", label: "Inbox", icon: Inbox, count: 12, color: "blue" },
    { id: "starred", label: "Starred", icon: Star, count: 3, color: "yellow" },
    { id: "sent", label: "Sent", icon: Send, count: 0, color: "green" },
    { id: "drafts", label: "Drafts", icon: Drafts, count: 2, color: "gray" },
    { id: "archive", label: "Archive", icon: Archive, count: 0, color: "purple" },
    { id: "trash", label: "Trash", icon: Trash2, count: 0, color: "red" },
  ]

  const labels = [
    { id: "work", label: "Work", color: "blue", count: 8 },
    { id: "personal", label: "Personal", color: "green", count: 5 },
    { id: "important", label: "Important", color: "red", count: 2 },
    { id: "newsletters", label: "Newsletters", color: "purple", count: 15 },
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
      yellow: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20",
      green: "text-green-600 bg-green-50 dark:bg-green-900/20",
      gray: "text-gray-600 bg-gray-50 dark:bg-gray-900/20",
      purple: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
      red: "text-red-600 bg-red-50 dark:bg-red-900/20",
    }
    return colors[color as keyof typeof colors] || colors.gray
  }

  return (
    <div className="h-full flex flex-col">
      {/* User Profile */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user?.user_metadata?.full_name || user?.email || "User"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Compose Button - Mobile/Tablet */}
      <div className="p-4 lg:hidden">
        <Button 
          onClick={onCompose}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <Mail className="h-4 w-4 mr-2" />
          Compose
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        {/* Folders */}
        <div className="p-2">
          <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Folders
          </h3>
          <nav className="space-y-1">
            {folders.map((folder) => {
              const Icon = folder.icon
              const isActive = activeFolder === folder.id
              
              return (
                <Button
                  key={folder.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start h-10 px-3 ${
                    isActive 
                      ? "bg-gray-100 dark:bg-gray-700" 
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => onFolderSelect?.(folder.id)}
                >
                  <Icon className={`h-4 w-4 mr-3 ${getColorClasses(folder.color).split(' ')[0]}`} />
                  <span className="flex-1 text-left">{folder.label}</span>
                  {folder.count > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {folder.count}
                    </Badge>
                  )}
                </Button>
              )
            })}
          </nav>
        </div>

        {/* Labels */}
        <div className="p-2">
          <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Labels
          </h3>
          <nav className="space-y-1">
            {labels.map((label) => {
              const isActive = activeFolder === label.id
              
              return (
                <Button
                  key={label.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start h-10 px-3 ${
                    isActive 
                      ? "bg-gray-100 dark:bg-gray-700" 
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => onFolderSelect?.(label.id)}
                >
                  <div className={`w-3 h-3 rounded-full mr-3 ${getColorClasses(label.color).split(' ')[1]}`} />
                  <span className="flex-1 text-left">{label.label}</span>
                  {label.count > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {label.count}
                    </Badge>
                  )}
                </Button>
              )
            })}
          </nav>
        </div>

        {/* Quick Actions */}
        <div className="p-2">
          <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Quick Actions
          </h3>
          <nav className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start h-10 px-3 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Clock className="h-4 w-4 mr-3 text-gray-500" />
              <span className="flex-1 text-left">Snoozed</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-10 px-3 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Tag className="h-4 w-4 mr-3 text-gray-500" />
              <span className="flex-1 text-left">Scheduled</span>
            </Button>
          </nav>
        </div>
      </div>

      {/* Settings & Sign Out */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
        <nav className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start h-10 px-3 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Settings className="h-4 w-4 mr-3 text-gray-500" />
            <span className="flex-1 text-left">Settings</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start h-10 px-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-red-600 hover:text-red-700"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-3" />
            <span className="flex-1 text-left">Sign Out</span>
          </Button>
        </nav>
      </div>
    </div>
  )
}
