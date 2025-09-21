"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SettingsOverlay } from "@/components/settings-overlay"
import {
  Search,
  RefreshCw,
  Settings,
  User,
  Menu,
  ArrowLeft,
  Plus,
  MoreVertical,
  Star,
  Archive,
  Trash2,
  Mail,
  MailOpen,
  Clock,
  Paperclip,
  LogOut,
  Sun,
  Moon
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { useMemo } from "react"

interface SimpleInboxProps {
  user: any
}

interface Email {
  id: string
  message_id: string
  subject: string
  sender_name: string
  sender_email: string
  snippet: string
  received_at: string
  is_read: boolean
  is_starred: boolean
  is_archived: boolean
  has_attachments: boolean
  labels: string[]
}

export function SimpleInbox({ user }: SimpleInboxProps) {
  const [selectedMessage, setSelectedMessage] = useState<Email | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSidebar, setShowSidebar] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState("inbox")

  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const [needsReauth, setNeedsReauth] = useState(false)
  
  // Fetch emails
  const { data: allEmails = [], isLoading, refetch, error } = useQuery({
    queryKey: ["emails", user.id],
    queryFn: async () => {
      try {
        const response = await fetch('/api/gmail/messages');
        const data = await response.json();
        
        if (!response.ok) {
          // Check if we need to re-authenticate
          if (response.status === 401 || data.needsReauth) {
            console.error("Authentication error, need to re-login")
            setNeedsReauth(true)
            throw new Error(data.error || 'Authentication failed');
          }
          throw new Error(data.error || 'Failed to fetch emails');
        }

        return data || []
      } catch (err) {
        console.error("Error fetching emails:", err)
        throw err;
      }
    },
    retry: 1, // Only retry once
  })

  const emails = useMemo(() => {
    let filteredData = allEmails;
    if (selectedFolder === "starred") {
      filteredData = allEmails.filter((e: Email) => e.is_starred);
    } else if (selectedFolder === "archived") {
      filteredData = allEmails.filter((e: Email) => e.is_archived); 
    } else if (selectedFolder === "sent") {
      filteredData = allEmails.filter((e: Email) => e.labels?.includes("SENT"));
    } else { // Inbox
      filteredData = allEmails.filter((e: Email) => !e.is_archived);
    }
    return filteredData
  }, [allEmails, selectedFolder])


  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEmailAction = async (emailId: string, action: string) => {
    const message = allEmails.find((e: Email) => e.id === emailId)
    if (!message) return

    try {
      const updates: Partial<Email> & { is_archived?: boolean } = {}
      
      switch (action) {
        case "star":
          updates.is_starred = !message.is_starred
          break
        case "read":
          updates.is_read = true
          break
        case "unread":
          updates.is_read = false
          break
        case "archive":
          updates.is_archived = true
          break
        case "unarchive":
          updates.is_archived = false
          break
      }

      const { error } = await supabase
        .from("email_metadata")
        .update(updates)
        .eq("id", emailId)

      if (error) throw error

      refetch()
      toast({
        title: "Email updated",
        description: `Email ${action}ed successfully.`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to ${action} email.`,
        variant: "destructive",
      })
    }
  }

  // Handle re-authentication if needed
  useEffect(() => {
    if (needsReauth) {
      toast({
        title: "Authentication Required",
        description: "Your Gmail session has expired. Please log in again.",
        variant: "destructive",
      })
      
      // Sign out and redirect to login
      const handleReauth = async () => {
        try {
          await supabase.auth.signOut()
          router.push("/login")
        } catch (error) {
          console.error("Error signing out for reauth:", error)
          // Force redirect even if signout fails
          router.push("/login")
        }
      }
      
      handleReauth()
    }
  }, [needsReauth, toast, supabase.auth, router])

  const filteredEmails = emails.filter((email: Email) =>
    searchQuery === "" ||
    email.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.sender_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.snippet?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const folders = useMemo(() => [
    { id: "inbox", name: "Inbox", icon: Mail, count: allEmails.filter((e: Email) => !e.is_archived).length },
    { id: "starred", name: "Starred", icon: Star, count: allEmails.filter((e: Email) => e.is_starred).length },
    { id: "sent", name: "Sent", icon: MailOpen, count: allEmails.filter((e: Email) => e.labels?.includes("SENT")).length },
    { id: "archived", name: "Archive", icon: Archive, count: allEmails.filter((e: Email) => !!e.is_archived).length },
  ], [allEmails])

  return (
    <div className="h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 border-r bg-muted/10 flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <Mail className="h-6 w-6" />
            <span className="font-semibold">MasterMail</span>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-2">
          {folders.map((folder) => (
            <Button
              key={folder.id}
              variant={selectedFolder === folder.id ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedFolder(folder.id)}
            >
              <folder.icon className="h-4 w-4 mr-2" />
              {folder.name}
              {folder.count > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {folder.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        <div className="p-4 border-t space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Mobile Menu */}
            <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="p-4 border-b">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-6 w-6" />
                    <span className="font-semibold">MasterMail</span>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {folders.map((folder) => (
                    <Button
                      key={folder.id}
                      variant={selectedFolder === folder.id ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedFolder(folder.id)
                        setShowSidebar(false)
                      }}
                    >
                      <folder.icon className="h-4 w-4 mr-2" />
                      {folder.name}
                      {folder.count > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                          {folder.count}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  >
                    {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setIsSettingsOpen(true)
                      setShowSidebar(false)
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <h1 className="text-xl font-semibold capitalize">{selectedFolder}</h1>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback>
                {user.email?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Email List and Detail View */}
        <div className="flex-1 flex">
          {/* Email List */}
          <div className={cn(
            "border-r bg-muted/5",
            selectedMessage ? "hidden lg:block lg:w-96" : "flex-1"
          )}>
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-4">Loading emails...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="text-red-500 mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <p className="text-muted-foreground mb-2">
                  There was an error loading your emails.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => refetch()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="p-8 text-center">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No emails found matching your search." : "No emails in this folder."}
                </p>
              </div>
            ) : (
              <EmailList 
                messages={filteredEmails}
                selectedMessage={selectedMessage}
                onMessageSelect={(message) => setSelectedMessage(message)}
                onStar={(emailId, is_starred) => handleEmailAction(emailId, "star")}
              />
            )}
          </div>

          {/* Message Detail View */}
          {selectedMessage && (
            <div className="flex-1 flex flex-col">
              <div className="border-b p-4 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMessage(null)}
                  className="lg:hidden"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEmailAction(selectedMessage.id, "star")}
                  >
                    <Star className={cn("h-4 w-4", selectedMessage.is_starred && "text-yellow-500 fill-current")} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEmailAction(selectedMessage.id, selectedMessage.is_archived ? "unarchive" : "archive")}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEmailAction(selectedMessage.id, selectedMessage.is_read ? "unread" : "read")}
                  >
                    {selectedMessage.is_read ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex-1 p-6">
                <div className="max-w-4xl mx-auto">
                  <div className="mb-6">
                    <h1 className="text-2xl font-semibold mb-4">{selectedMessage.subject}</h1>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {selectedMessage.sender_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{selectedMessage.sender_name}</p>
                          <p>{selectedMessage.sender_email}</p>
                        </div>
                      </div>
                      <div className="ml-auto">
                        <p>{formatDistanceToNow(new Date(selectedMessage.received_at), { addSuffix: true })}</p>
                      </div>
                    </div>
                  </div>

                  <div className="prose max-w-none">
                    <p className="text-base leading-relaxed">
                      {selectedMessage.snippet}
                    </p>
                    <div className="mt-8 p-4 bg-muted/20 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        This is a demo email. In a real application, the full email content would be displayed here.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Overlay */}
      <SettingsOverlay
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
      />
    </div>
  )
}
