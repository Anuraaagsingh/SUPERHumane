import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "./lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  console.log("[v0] Middleware - path:", request.nextUrl.pathname)
  
  const { supabase, response } = createClient(request)

  try {
    // Refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
    const { data: { session } } = await supabase.auth.getSession()
    
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    console.log("[v0] Middleware - user:", !!user, "email:", user?.email, "path:", request.nextUrl.pathname, "error:", error)

    const protectedRoutes = ["/inbox", "/settings"]
    const authRoutes = ["/login"]

    const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))
    const isAuthRoute = authRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

    // Protect authenticated routes
    if (isProtectedRoute && (!user || error)) {
      console.log("[v0] Middleware - redirecting to login (no user or error)")
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // Only redirect authenticated users away from login if they're not in the middle of OAuth flow
    if (isAuthRoute && user && !error && !request.nextUrl.pathname.includes("/callback")) {
      console.log("[v0] Middleware - redirecting to inbox (user exists)")
      return NextResponse.redirect(new URL("/inbox", request.url))
    }
  } catch (error) {
    console.error("[v0] Middleware - auth error:", error)
    // If there's an error, redirect to login for protected routes
    const protectedRoutes = ["/inbox", "/settings"]
    const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))
    
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
