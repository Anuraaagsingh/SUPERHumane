"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Chrome, Loader2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export function AuthForm() {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [showEmailAuth, setShowEmailAuth] = useState(false) // Added email auth state
  const [email, setEmail] = useState("") // Added email state
  const [password, setPassword] = useState("") // Added password state
  const router = useRouter()
  const { toast } = useToast()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleGoogleAuth = async () => {
    console.log("[v0] Starting Google OAuth")
    setIsLoading("google")
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          scopes:
            "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify",
        },
      })
      console.log("[v0] Google OAuth result - error:", error)
      if (error) throw error
    } catch (error: any) {
      console.error("[v0] Google auth error:", error)
      toast({
        title: "Authentication failed",
        description: error.message || "Failed to authenticate with Google",
        variant: "destructive",
      })
    } finally {
      setIsLoading(null)
    }
  }

  const handleMicrosoftAuth = async () => {
    setIsLoading("microsoft")
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "azure",
        options: {
          scopes:
            "https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/Mail.ReadWrite",
        },
      })
      if (error) throw error
    } catch (error: any) {
      console.error("Microsoft auth error:", error)
      toast({
        title: "Authentication failed",
        description: error.message || "Failed to authenticate with Microsoft",
        variant: "destructive",
      })
    } finally {
      setIsLoading(null)
    }
  }

  const handleEmailAuth = async (isSignUp: boolean) => {
    setIsLoading(isSignUp ? "signup" : "signin")
    try {
      const { error } = isSignUp
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/login/callback`,
            },
          })
        : await supabase.auth.signInWithPassword({ email, password })

      if (error) throw error

      if (isSignUp) {
        toast({
          title: "Check your email",
          description: "We sent you a confirmation link",
        })
      } else {
        toast({
          title: "Login Successful",
          description: "Welcome to MasterMail!",
        })
        // Don't manually redirect, let the auth system handle it
      }
    } catch (error: any) {
      toast({
        title: "Authentication failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(null)
    }
  }

  const handleDemoLogin = async () => {
    setEmail("demo@mastermail.com")
    setPassword("demo123")
    setIsLoading("demo")

    try {
      // Try to sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: "demo@mastermail.com",
        password: "demo123",
      })

      if (signInError) {
        // If sign in fails, try to sign up the demo user
        const { error: signUpError } = await supabase.auth.signUp({
          email: "demo@mastermail.com",
          password: "demo123",
          options: {
            data: {
              full_name: "Demo User",
              avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
            },
          },
        })

        if (signUpError) throw signUpError

        toast({
          title: "Demo account created",
          description: "Welcome to MasterMail! Check your email to confirm.",
        })
      } else {
        toast({
          title: "Demo login successful",
          description: "Welcome to MasterMail!",
        })
        router.push("/inbox")
      }
    } catch (error: any) {
      console.error("[v0] Demo login error:", error)
      toast({
        title: "Demo login failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader className="text-center">
        <CardTitle className="text-white">Connect Your Email</CardTitle>
        <CardDescription className="text-slate-300">
          {showEmailAuth
            ? "Sign in with email and password"
            : "Get started with Gmail or Outlook to experience lightning-fast email"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showEmailAuth ? (
          <>
            <Button
              onClick={handleDemoLogin}
              disabled={isLoading !== null}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
            >
              {isLoading === "demo" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              Try Demo Account
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-400">Or connect your email</span>
              </div>
            </div>

            <Button
              onClick={handleGoogleAuth}
              disabled={isLoading !== null}
              className="w-full bg-white text-slate-900 hover:bg-slate-100 transition-colors"
            >
              {isLoading === "google" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Chrome className="w-4 h-4 mr-2" />
              )}
              Continue with Gmail
            </Button>

            <Button
              onClick={handleMicrosoftAuth}
              disabled={isLoading !== null}
              className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent transition-colors"
              variant="outline"
            >
              {isLoading === "microsoft" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              Continue with Outlook
            </Button>

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => setShowEmailAuth(true)}
                className="text-slate-300 hover:text-white"
              >
                Or continue with email
              </Button>
            </div>

            <div className="text-center text-xs text-slate-400 bg-white/5 p-3 rounded-md">
              <p className="font-medium text-slate-300">Demo Credentials:</p>
              <p>Email: demo@mastermail.com</p>
              <p>Password: demo123</p>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-slate-400"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-slate-400"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleEmailAuth(false)}
                  disabled={isLoading !== null || !email || !password}
                  className="flex-1 bg-white text-slate-900 hover:bg-slate-100"
                >
                  {isLoading === "signin" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Sign In
                </Button>
                <Button
                  onClick={() => handleEmailAuth(true)}
                  disabled={isLoading !== null || !email || !password}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  {isLoading === "signup" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Sign Up
                </Button>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowEmailAuth(false)}
                className="w-full text-slate-300 hover:text-white"
              >
                Back to OAuth
              </Button>
            </div>
          </>
        )}

        <div className="text-center text-sm text-slate-400 mt-6 space-y-2">
          <p>We'll sync your emails securely and never store your passwords</p>
          <p className="text-xs">
            By continuing, you agree to our{" "}
            <a href="/privacy" className="text-white hover:underline">
              Privacy Policy
            </a>{" "}
            and{" "}
            <a href="/terms" className="text-white hover:underline">
              Terms of Service
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
