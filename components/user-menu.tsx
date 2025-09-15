"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Settings, LogOut, User, Moon, Sun } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

interface UserMenuProps {
  user: {
    id: string
    email: string
    name?: string
    avatar_url?: string
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      router.push("/auth")
    } catch (error) {
      console.error("Sign out error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email[0].toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.name || user.email} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleTheme}>
          {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} disabled={isLoading}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
