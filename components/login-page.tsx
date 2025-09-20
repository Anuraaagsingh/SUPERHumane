"use client"

import { useAuth } from "@/hooks/use-auth"
import { AuthForm } from "@/components/auth-form"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !loading) {
      router.push("/inbox")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="text-slate-300 mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">MasterMail</h1>
          <p className="text-slate-300">Built for speed</p>
        </div>
        <AuthForm />
      </div>
    </div>
  )
}
