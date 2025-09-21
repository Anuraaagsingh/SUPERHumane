"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Search, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile/Tablet Header */}
      <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Hamburger Menu */}
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              {sidebar}
            </SheetContent>
          </Sheet>

          {/* Center: MasterMail Logo */}
          <div className="flex-1 flex justify-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              MasterMail
            </h1>
          </div>

          {/* Right: Search */}
          <div className="w-8 h-8 flex items-center justify-center">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
        </div>

        {/* Search Bar for Mobile/Tablet */}
        {onSearchChange && (
          <div className="mt-3">
            <Input
              placeholder="Search emails..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: MasterMail Logo */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            MasterMail
          </h1>

          {/* Center: Search */}
          {onSearchChange && (
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
            <Button onClick={onCompose} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Compose
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          {sidebar}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-screen">
          {children}
        </div>
      </div>

      {/* Mobile/Tablet Floating Compose Button */}
      {onCompose && (
        <div className="fixed bottom-6 right-6 lg:hidden">
          <Button
            onClick={onCompose}
            size="lg"
            className="rounded-full w-14 h-14 bg-blue-600 hover:bg-blue-700 shadow-lg"
          >
            <Plus className="h-6 w-6" />
            <span className="sr-only">Compose</span>
          </Button>
        </div>
      )}
    </div>
  )
}
