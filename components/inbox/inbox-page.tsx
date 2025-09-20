"use client"

import { useAuth } from "@/hooks/use-auth"
import { InboxLayout } from "@/components/inbox/inbox-layout"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function InboxPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user && !loading) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect via useEffect
  }

  return <InboxLayout user={user} />
}
