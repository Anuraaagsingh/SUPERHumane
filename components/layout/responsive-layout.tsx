"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Search, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface ResponsiveLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  searchValue?: string
  onSearchChange?: (value: string) => void
  onCompose?: () => void
}

export function ResponsiveLayout({ 
  children, 
  sidebar, 
  searchValue = "", 
  onSearchChange,
  onCompose 
}: ResponsiveLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile/Tablet Header */}
      <div className="lg:hidden bg-card border-b px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Hamburger Menu */}
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 h-8 w-8 sm:h-9 sm:w-9"
              >
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="left" 
              className="w-72 p-0 sm:w-80"
            >
              {sidebar}
            </SheetContent>
          </Sheet>

          {/* Center: MasterMail Logo */}
          <div className="flex-1 flex justify-center min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate sm:text-xl">
              MasterMail
            </h1>
          </div>

          {/* Right: Search Icon */}
          <div className="w-8 h-8 flex items-center justify-center sm:w-9 sm:h-9">
            <Search className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
          </div>
        </div>

        {/* Search Bar for Mobile/Tablet */}
        {onSearchChange && (
          <div className="mt-2 sm:mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search emails..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block bg-card border-b px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: MasterMail Logo */}
          <h1 className="text-2xl font-bold text-foreground">
            MasterMail
          </h1>

          {/* Center: Search */}
          {onSearchChange && (
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search emails..."
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {/* Right: Compose Button */}
          {onCompose && (
            <Button 
              onClick={onCompose} 
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Compose
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)]">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 bg-card border-r overflow-y-auto">
          {sidebar}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>

      {/* Mobile/Tablet Floating Compose Button */}
      {onCompose && (
        <div className="fixed bottom-4 right-4 lg:hidden z-50">
          <Button
            onClick={onCompose}
            size="lg"
            className={cn(
              "rounded-full shadow-lg transition-all duration-200",
              "w-12 h-12 sm:w-14 sm:h-14",
              "bg-primary hover:bg-primary/90 hover:scale-105"
            )}
          >
            <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="sr-only">Compose</span>
          </Button>
        </div>
      )}
    </div>
  )
}
