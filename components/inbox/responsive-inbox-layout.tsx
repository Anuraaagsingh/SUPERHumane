"use client"

import { useState, useEffect } from "react"
import { ResponsiveLayout } from "@/components/layout/responsive-layout"
import { ResponsiveSidebar } from "@/components/layout/responsive-sidebar"
import { EmailList } from "./email-list"
import { MessageView } from "./message-view"
import { Composer } from "./composer"
import { CommandPalette } from "./command-palette"
import { SettingsOverlay } from "@/components/settings-overlay"
import { KeyboardShortcutsHelp } from "@/components/keyboard/keyboard-shortcuts-help"
import { ShortcutIndicator } from "@/components/keyboard/shortcut-indicator"
import { Button } from "@/components/ui/button"
import { Search, RefreshCw, Edit, HelpCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useEmailSync, useMessages, useInfiniteMessages, useInfiniteScroll } from "@/hooks/use-email-sync"
import { useGmailShortcuts, useTwoKeyShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { createClient } from "@/lib/supabase"
import { useQuery } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { logger } from "@/lib/logger"

interface ResponsiveInboxLayoutProps {
  user: any
}

export function ResponsiveInboxLayout({ user }: ResponsiveInboxLayoutProps) {
  const [selectedFolder, setSelectedFolder] = useState("inbox")
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(0)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [composerData, setComposerData] = useState<any>(null)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentAccount, setCurrentAccount] = useState<any>(null)
  const { toast } = useToast()

  const supabase = createClient()

  // Get user's email accounts
  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ["email-accounts", user.id],
    queryFn: async () => {
      console.log("[DEBUG] Fetching accounts for user:", user.id)
      const { data, error } = await supabase.from("email_accounts").select("*").eq("user_id", user.id)
      console.log("[DEBUG] Accounts data:", data, "Error:", error)
      if (error) {
        logger.error("Failed to fetch accounts", error)
        throw error
      }
      return data || []
    },
    enabled: !!user?.id,
  })

  // Set current account
  useEffect(() => {
    if (accounts && accounts.length > 0 && !currentAccount) {
      console.log("[DEBUG] Setting current account:", accounts[0].email)
      setCurrentAccount(accounts[0])
    }
  }, [accounts, currentAccount])

  // Debug: Log when accounts or currentAccount changes
  useEffect(() => {
    console.log("[DEBUG] Accounts:", accounts?.length || 0, "accounts")
    console.log("[DEBUG] Current account:", currentAccount?.email)
    console.log("[DEBUG] Messages:", messages?.length || 0, "messages")
  }, [accounts, currentAccount, messages])

  // Get messages for the current account
  const {
    data: messages,
    isLoading: messagesLoading,
    error: messagesError,
    refetch: refetchMessages,
  } = useMessages(currentAccount?.id, selectedFolder, searchQuery)

  // Infinite scroll for messages
  const {
    data: infiniteMessages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteMessages(currentAccount?.id, selectedFolder, searchQuery)

  // Sync mutation
  const syncMutation = useEmailSync()

  // Keyboard shortcuts
  useGmailShortcuts({
    onCompose: () => setIsComposerOpen(true),
    onSearch: () => {
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
      searchInput?.focus()
    },
    onRefresh: () => handleRefresh(),
    onHelp: () => setIsShortcutsHelpOpen(true),
    onSettings: () => setIsSettingsOpen(true),
  })

  // Two-key shortcuts
  useTwoKeyShortcuts({
    onCompose: () => setIsComposerOpen(true),
    onSearch: () => {
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
      searchInput?.focus()
    },
  })

  // Handle refresh
  const handleRefresh = async () => {
    if (currentAccount) {
      try {
        await syncMutation.mutateAsync(currentAccount.id)
        await refetchMessages()
        toast({
          title: "Sync complete",
          description: "Your emails have been synchronized",
        })
      } catch (error) {
        logger.error("Sync failed", error)
        toast({
          title: "Sync failed",
          description: "Failed to synchronize emails",
          variant: "destructive",
        })
      }
    }
  }

  // Handle message selection
  const handleMessageSelect = (message: any, index: number) => {
    setSelectedMessage(message)
    setSelectedMessageIndex(index)
  }

  // Handle compose
  const handleCompose = (data?: any) => {
    setComposerData(data)
    setIsComposerOpen(true)
  }

  // Handle folder selection
  const handleFolderSelect = (folder: string) => {
    setSelectedFolder(folder)
    setSelectedMessage(null)
  }

  // Render sidebar
  const renderSidebar = () => (
    <ResponsiveSidebar
      onCompose={() => handleCompose()}
      activeFolder={selectedFolder}
      onFolderSelect={handleFolderSelect}
    />
  )

  // Render main content
  const renderMainContent = () => {
    if (isComposerOpen) {
      return (
        <Composer
          isOpen={isComposerOpen}
          onClose={() => setIsComposerOpen(false)}
          initialData={composerData}
          onSend={() => {
            setIsComposerOpen(false)
            setComposerData(null)
            handleRefresh()
          }}
        />
      )
    }

    if (selectedMessage) {
      return (
        <MessageView
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
          onReply={() => handleCompose({ 
            to: selectedMessage.sender_email,
            subject: `Re: ${selectedMessage.subject}`,
            body: `\n\n---\n${selectedMessage.snippet}`
          })}
          onForward={() => handleCompose({ 
            subject: `Fwd: ${selectedMessage.subject}`,
            body: `\n\n---\n${selectedMessage.snippet}`
          })}
          onArchive={() => {
            // Handle archive
            setSelectedMessage(null)
            handleRefresh()
          }}
          onDelete={() => {
            // Handle delete
            setSelectedMessage(null)
            handleRefresh()
          }}
        />
      )
    }

    return (
      <div className="h-full flex flex-col">
        {/* Email List */}
        <div className="flex-1 overflow-hidden">
          <EmailList
            messages={messages || []}
            isLoading={messagesLoading}
            onMessageSelect={handleMessageSelect}
            selectedMessageIndex={selectedMessageIndex}
            onLoadMore={hasNextPage ? fetchNextPage : undefined}
            isFetchingMore={isFetchingNextPage}
          />
        </div>
      </div>
    )
  }

  return (
    <>
      <ResponsiveLayout
        sidebar={renderSidebar()}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onCompose={() => handleCompose()}
      >
        {renderMainContent()}
      </ResponsiveLayout>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onCompose={() => handleCompose()}
        onSearch={() => {
          const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
          searchInput?.focus()
        }}
      />

      {/* Settings Overlay */}
      <SettingsOverlay
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
      />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        isOpen={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
      />

      {/* Shortcut Indicator */}
      <ShortcutIndicator />
    </>
  )
}
