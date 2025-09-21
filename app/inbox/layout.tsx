"use client"

import type React from "react"

export default function InboxLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="h-screen flex flex-col">{children}</div>
}
