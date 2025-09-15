"use client"

import type React from "react"
import { useJobProcessor } from "@/hooks/use-job-processor"

export default function InboxLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useJobProcessor()

  return <div className="h-screen flex flex-col">{children}</div>
}
