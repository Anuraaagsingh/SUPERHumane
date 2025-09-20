import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseConfig } from "@/lib/supabase"

export async function middleware(request: NextRequest) {
  console.log("[v0] Middleware - path:", request.nextUrl.pathname)

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const { url, anonKey } = getSupabaseConfig()
  
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        request.cookies.set({
          name,
          value,
          ...options,
        })
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({
          name,
          value,
          ...options,
        })
      },
      remove(name: string, options: any) {
        request.cookies.set({
          name,
          value: "",
          ...options,
        })
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({
          name,
          value: "",
          ...options,
        })
      },
    },
  })

  try {
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

    // Redirect authenticated users away from login pages
    if (isAuthRoute && user && !error) {
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
