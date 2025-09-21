"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmailList } from "./email-list"
import { MessageView } from "./message-view"
import { Composer } from "./composer"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ResponsiveSidebar } from "@/components/layout/responsive-sidebar"
import { SettingsOverlay } from "@/components/settings-overlay"
import { KeyboardShortcutsHelp } from "@/components/keyboard/keyboard-shortcuts-help"
import { ShortcutIndicator } from "@/components/keyboard/shortcut-indicator"
import {
  Search,
  RefreshCw,
  Settings,
  User,
  Menu,
  ArrowLeft,
  Plus,
  MoreVertical
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useEmailSync, useMessages } from "@/hooks/use-email-sync"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase"
import { cn } from "@/lib/utils"

interface MobileFirstInboxProps {
  user: any
}

export function MobileFirstInbox({ user }: MobileFirstInboxProps) {
  const [selectedFolder, setSelectedFolder] = useState("inbox")
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [composerData, setComposerData] = useState<any>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentAccount, setCurrentAccount] = useState<any>(null)
  const [showSidebar, setShowSidebar] = useState(false)

  const supabase = createClient()

  // Get user's email accounts
  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ["email-accounts", user.id],
    queryFn: async () => {
      console.log("[DEBUG] Fetching accounts for user:", user.id)
      const { data, error } = await supabase.from("email_accounts").select("*").eq("user_id", user.id)
      console.log("[DEBUG] Accounts data:", data, "Error:", error)
      if (error) {
        console.error("Failed to fetch accounts", error)
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

  // Get messages for the current account
  const {
    data: messages,
    isLoading: messagesLoading,
    error: messagesError,
    refetch: refetchMessages,
  } = useMessages(currentAccount?.id, searchQuery)

  // Handle message selection
  const handleMessageSelect = (message: any, index: number) => {
    setSelectedMessage(message)
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
    setShowSidebar(false)
  }

  // Handle back from message view
  const handleBack = () => {
    setSelectedMessage(null)
  }

  // Handle refresh
  const handleRefresh = async () => {
    if (currentAccount) {
      try {
        await fetch("/api/email/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountId: currentAccount.id }),
        })
        refetchMessages()
      } catch (error) {
        console.error("Refresh error:", error)
      }
    }
  }

  // Render sidebar
  const renderSidebar = () => (
    <ResponsiveSidebar
      onCompose={() => handleCompose()}
      activeFolder={selectedFolder}
      onFolderSelect={handleFolderSelect}
    />
  )

  // Mobile/Tablet header
  const renderMobileHeader = () => (
    <div className="lg:hidden bg-card border-b px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!selectedMessage ? (
            <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                {renderSidebar()}
              </SheetContent>
            </Sheet>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
              onClick={handleBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          <h1 className="text-lg font-bold text-foreground">
            {selectedMessage ? "Mail" : "MasterMail"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
      </div>

      {!selectedMessage && (
        <div className="mt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search MasterMail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full bg-muted/50"
            />
          </div>
        </div>
      )}
    </div>
  )

  // Desktop header
  const renderDesktopHeader = () => (
    <div className="hidden lg:block bg-card border-b px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left: MasterMail Logo */}
        <h1 className="text-2xl font-bold text-foreground">
          MasterMail
        </h1>

        {/* Center: Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={() => handleCompose()}>
            <Plus className="h-4 w-4 mr-2" />
            Compose
          </Button>
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center ml-2">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
      </div>
    </div>
  )

  // Main content
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
          onClose={handleBack}
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
            setSelectedMessage(null)
            handleRefresh()
          }}
          onDelete={() => {
            setSelectedMessage(null)
            handleRefresh()
          }}
        />
      )
    }

    return (
      <div className="flex-1 overflow-hidden">
        <EmailList
          messages={messages || []}
          isLoading={messagesLoading}
          onMessageSelect={handleMessageSelect}
          selectedMessageIndex={0}
        />
      </div>
    )
  }

  // Floating compose button for mobile/tablet
  const renderFloatingCompose = () => (
    <div className="fixed bottom-6 right-6 lg:hidden z-50">
      <Button
        onClick={() => handleCompose()}
        size="lg"
        className={cn(
          "rounded-full shadow-lg transition-all duration-200",
          "w-14 h-14 bg-primary hover:bg-primary/90 hover:scale-105"
        )}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {renderMobileHeader()}
      {renderDesktopHeader()}

      {/* Main Content */}
      <div className="flex h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)]">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 bg-card border-r overflow-y-auto">
          {renderSidebar()}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {renderMainContent()}
        </div>
      </div>

      {renderFloatingCompose()}

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

      <ShortcutIndicator />
    </div>
  )
}
