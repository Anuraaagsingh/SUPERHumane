"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ShortcutIndicatorProps {
  firstKey: string | null
  className?: string
}

export function ShortcutIndicator({ firstKey, className }: ShortcutIndicatorProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (firstKey) {
      setVisible(true)
    } else {
      const timer = setTimeout(() => setVisible(false), 200)
      return () => clearTimeout(timer)
    }
  }, [firstKey])

  if (!visible) return null

  return (
    <div className={cn("fixed top-4 right-4 z-50", className)}>
      <Badge variant="secondary" className="text-sm font-mono">
        {firstKey ? `${firstKey.toUpperCase()} then...` : ""}
      </Badge>
    </div>
  )
}
