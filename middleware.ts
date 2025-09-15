import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  console.log("[v0] Middleware - path:", request.nextUrl.pathname)

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] Middleware - user:", !!user, "email:", user?.email, "path:", request.nextUrl.pathname)

  const protectedRoutes = ["/inbox", "/settings"]
  const authRoutes = ["/login"]

  const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))
  const isAuthRoute = authRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  // Protect authenticated routes
  if (isProtectedRoute && !user) {
    console.log("[v0] Middleware - redirecting to login (no user)")
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Redirect authenticated users away from login pages
  if (isAuthRoute && user) {
    console.log("[v0] Middleware - redirecting to inbox (user exists)")
    return NextResponse.redirect(new URL("/inbox", request.url))
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
