"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "./sidebar"
import { EmailList } from "./email-list"
import { MessageView } from "./message-view"
import { Composer } from "./composer"
import { CommandPalette } from "./command-palette"
import { UserMenu } from "@/components/user-menu"
import { SettingsOverlay } from "@/components/settings-overlay"
import { KeyboardShortcutsHelp } from "@/components/keyboard/keyboard-shortcuts-help"
import { ShortcutIndicator } from "@/components/keyboard/shortcut-indicator"
import { Button } from "@/components/ui/button"
import { Search, RefreshCw, Edit, HelpCircle, PanelLeft, PanelRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useEmailSync, useMessages, useInfiniteMessages, useInfiniteScroll } from "@/hooks/use-email-sync"
import { useGmailShortcuts, useTwoKeyShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { createClient } from "@/lib/supabase"
import { useQuery } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { logger } from "@/lib/logger"

interface InboxLayoutProps {
  user: any
}

export function InboxLayout({ user }: InboxLayoutProps) {
  const [selectedFolder, setSelectedFolder] = useState("inbox")
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(0)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [composerData, setComposerData] = useState<any>(null)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isQuickView, setIsQuickView] = useState(false)
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
        console.error("[DEBUG] Accounts error:", error)
      }
      return data || []
    },
  })

  // Set first account as current if available
  useEffect(() => {
    if (accounts && accounts.length > 0 && !currentAccount) {
      setCurrentAccount(accounts[0])
    }
  }, [accounts, currentAccount])

  const { syncAccount, isSyncing } = useEmailSync()
  const { 
    data: messages, 
    isLoading: isLoadingMessages, 
    error: messagesError
  } = useMessages(currentAccount?.id, searchQuery || undefined)
  
  console.log("[DEBUG] Current account:", currentAccount)
  console.log("[DEBUG] Messages loading:", isLoadingMessages)
  console.log("[DEBUG] Messages error:", messagesError)
  console.log("[DEBUG] Messages data:", messages)
  console.log("[DEBUG] Accounts loading:", accountsLoading)
  console.log("[DEBUG] Accounts:", accounts)
  
  // Removed infinite scroll for now - using simple messages

  // Update selected message when messages change
  useEffect(() => {
    if (messages && messages.length > 0) {
      if (selectedMessageIndex < messages.length) {
        setSelectedMessage(messages[selectedMessageIndex])
      } else {
        setSelectedMessageIndex(0)
        setSelectedMessage(messages[0])
      }
    } else {
      setSelectedMessage(null)
      setSelectedMessageIndex(0)
    }
  }, [messages, selectedMessageIndex])

  const handleSync = () => {
    if (currentAccount) {
      syncAccount(currentAccount.id)
    }
  }

  const handleDebugEmails = async () => {
    try {
      const response = await fetch('/api/debug/emails')
      const data = await response.json()
      logger.info('Debug emails response', data)
      
      if (data.code === 'TABLES_MISSING') {
        toast({
          title: "Database Setup Required",
          description: "Please run the database setup script in Supabase SQL Editor",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Debug Info",
          description: `Found ${data.totalEmails} emails across ${data.accounts.length} accounts`,
        })
      }
    } catch (error) {
      logger.error('Debug error', error)
      toast({
        title: "Debug Failed",
        description: "Could not fetch debug information",
        variant: "destructive",
      })
    }
  }

  const handlePopulateDemo = async () => {
    try {
      const response = await fetch('/api/debug/populate-demo', { method: 'POST' })
      const data = await response.json()
      logger.info('Populate demo response', data)
      toast({
        title: "Demo Emails",
        description: data.message || "Demo emails populated",
      })
      // Refresh the page to see changes
      window.location.reload()
    } catch (error) {
      logger.error('Populate demo error', error)
      toast({
        title: "Demo Failed",
        description: "Could not populate demo emails",
        variant: "destructive",
      })
    }
  }

  const handleDatabaseHealth = async () => {
    try {
      const response = await fetch('/api/health/database')
      const data = await response.json()
      logger.info('Database health check', data)
      
      if (data.status === 'healthy') {
        toast({
          title: "Database Healthy",
          description: "All tables are working correctly",
        })
      } else {
        toast({
          title: "Database Issues",
          description: `Status: ${data.status}. Check console for details.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      logger.error('Database health check error', error)
      toast({
        title: "Health Check Failed",
        description: "Could not check database status",
        variant: "destructive",
      })
    }
  }

  const handleEnvCheck = async () => {
    try {
      const response = await fetch('/api/health/env')
      const data = await response.json()
      logger.info('Environment check', data)
      
      if (data.status === 'healthy') {
        toast({
          title: "Environment Healthy",
          description: "All required variables are set",
        })
      } else if (data.status === 'warning') {
        toast({
          title: "Environment Warning",
          description: `${data.warnings.length} warnings. Check console for details.`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Environment Error",
          description: `${data.errors.length} errors. Check console for details.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      logger.error('Environment check error', error)
      toast({
        title: "Environment Check Failed",
        description: "Could not check environment variables",
        variant: "destructive",
      })
    }
  }

  const handleAction = (action: string) => {
    if (!selectedMessage) {
      toast({
        title: "No message selected",
        description: "Please select a message first",
        variant: "destructive",
      })
      return
    }

    switch (action) {
      case "archive":
        toast({ title: "Archived", description: "Message archived" })
        break
      case "star":
        toast({ title: "Starred", description: "Message starred" })
        break
      case "snooze":
        toast({ title: "Snoozed", description: "Message snoozed" })
        break
      case "delete":
        toast({ title: "Deleted", description: "Message deleted" })
        break
      case "markRead":
        toast({ title: "Marked as read" })
        break
      case "markUnread":
        toast({ title: "Marked as unread" })
        break
      default:
        console.log(`Action: ${action}`)
    }
  }

  // Gmail-style keyboard shortcuts
  const shortcuts = useGmailShortcuts({
    compose: () => setIsComposerOpen(true),
    reply: () => {
      if (selectedMessage) {
        setIsComposerOpen(true)
      }
    },
    replyAll: () => {
      if (selectedMessage) {
        setIsComposerOpen(true)
      }
    },
    forward: () => {
      if (selectedMessage) {
        setIsComposerOpen(true)
      }
    },
    archive: () => handleAction("archive"),
    star: () => handleAction("star"),
    snooze: () => handleAction("snooze"),
    delete: () => handleAction("delete"),
    markRead: () => handleAction("markRead"),
    markUnread: () => handleAction("markUnread"),
    goToInbox: () => setSelectedFolder("inbox"),
    goToSent: () => setSelectedFolder("sent"),
    goToDrafts: () => setSelectedFolder("drafts"),
    goToStarred: () => setSelectedFolder("starred"),
    goToArchive: () => setSelectedFolder("archive"),
    search: () => document.getElementById("search-input")?.focus(),
    commandPalette: () => setIsCommandPaletteOpen(true),
    nextMessage: () => {
      if (messages && messages.length > 0) {
        const newIndex = Math.min(selectedMessageIndex + 1, messages.length - 1)
        setSelectedMessageIndex(newIndex)
      }
    },
    prevMessage: () => {
      if (messages && messages.length > 0) {
        const newIndex = Math.max(selectedMessageIndex - 1, 0)
        setSelectedMessageIndex(newIndex)
      }
    },
    openMessage: () => {
      if (messages && messages[selectedMessageIndex]) {
        setSelectedMessage(messages[selectedMessageIndex])
      }
    },
    selectMessage: () => {
      // Toggle message selection
      console.log("Toggle message selection")
    },
    refresh: handleSync,
  })

  // Two-key shortcuts (G then I, etc.)
  const firstKey = useTwoKeyShortcuts({
    g: {
      i: () => setSelectedFolder("inbox"),
      s: () => setSelectedFolder("sent"),
      d: () => setSelectedFolder("drafts"),
      "*": () => setSelectedFolder("starred"),
      a: () => setSelectedFolder("archive"),
    },
  })

  // Global shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Help dialog
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault()
          setIsShortcutsHelpOpen(true)
        }
      }
      // Escape key
      if (e.key === "Escape") {
        setSelectedMessage(null)
        setIsComposerOpen(false)
        setIsCommandPaletteOpen(false)
        setIsShortcutsHelpOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">MasterMail</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              id="search-input"
              placeholder="Search emails... (⌘K for more)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsQuickView(!isQuickView)}
            title={isQuickView ? "Show message view" : "Hide message view"}
          >
            {isQuickView ? <PanelRight className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSync} disabled={isSyncing || !currentAccount}>
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDebugEmails} title="Debug emails">
            🔍
          </Button>
          <Button variant="ghost" size="sm" onClick={handlePopulateDemo} title="Populate demo">
            📧
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDatabaseHealth} title="Check database">
            🏥
          </Button>
          <Button variant="ghost" size="sm" onClick={handleEnvCheck} title="Check environment">
            ⚙️
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsComposerOpen(true)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsShortcutsHelpOpen(true)}>
            <HelpCircle className="w-4 h-4" />
          </Button>
          <UserMenu user={user} onSettingsClick={() => setIsSettingsOpen(true)} />
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          selectedFolder={selectedFolder}
          onFolderSelect={setSelectedFolder}
          accounts={accounts || []}
          currentAccount={currentAccount}
          onAccountChange={setCurrentAccount}
          onSettingsClick={() => setIsSettingsOpen(true)}
        />

        {/* Email list */}
        <div className={`${isQuickView ? 'flex-1' : 'w-80'} border-r border-border flex flex-col`}>
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold capitalize">{selectedFolder}</h2>
              <span className="text-sm text-muted-foreground">
                {messages?.length || 0} {messages?.length === 1 ? "email" : "emails"}
              </span>
            </div>
          </div>
          <EmailList
            messages={messages || []}
            selectedMessage={selectedMessage}
            selectedIndex={selectedMessageIndex}
            onMessageSelect={(message, index) => {
              setSelectedMessage(message)
              setSelectedMessageIndex(index)
            }}
            isLoading={isLoadingMessages}
          />
        </div>

        {/* Message view */}
        {!isQuickView && (
          <div className="flex-1">
            {selectedMessage ? (
              <MessageView 
                message={selectedMessage} 
                account={currentAccount}
                onReply={(replyData) => {
                  setComposerData(replyData)
                  setIsComposerOpen(true)
                }}
                onForward={(forwardData) => {
                  setComposerData(forwardData)
                  setIsComposerOpen(true)
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">No message selected</h3>
                  <p className="text-sm">Choose an email from the list to read it</p>
                  <div className="mt-4 text-xs space-y-1">
                    <p>
                      Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">C</kbd> to compose
                    </p>
                    <p>
                      Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">⌘K</kbd> for commands
                    </p>
                    <p>
                      Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">?</kbd> for help
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Shortcut indicator */}
      <ShortcutIndicator firstKey={firstKey} />

      {/* Composer modal */}
      {isComposerOpen && (
        <Composer
          isOpen={isComposerOpen}
          onClose={() => {
            setIsComposerOpen(false)
            setComposerData(null)
          }}
          initialData={composerData}
          mode={composerData?.mode || "compose"}
        />
      )}

      {/* Command palette */}
      {isCommandPaletteOpen && (
        <CommandPalette
          onClose={() => setIsCommandPaletteOpen(false)}
          onCompose={() => {
            setIsCommandPaletteOpen(false)
            setIsComposerOpen(true)
          }}
          onSync={handleSync}
        />
      )}

      {/* Keyboard shortcuts help */}
      <KeyboardShortcutsHelp open={isShortcutsHelpOpen} onOpenChange={setIsShortcutsHelpOpen} shortcuts={shortcuts} />

      {/* Settings overlay */}
      <SettingsOverlay 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        user={user} 
      />
    </div>
  )
}
