// middleware.ts
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Improved middleware for Supabase + Next.js (Edge)
 * - Uses a safe cookie adapter: read from request, write/delete on response only
 * - Logs raw cookie + auth header for easier debugging on Vercel
 * - Skips protecting public & static routes (prevents OAuth redirect loops)
 * - Minimal, explicit protected/auth route logic
 */

const PUBLIC_PATHS = [
  "/login",
  "/auth",                // any custom auth pages, e.g. /auth/callback if you have one
  "/api",                 // allow API endpoints (adjust if you have protected API routes)
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p)
  );
}

export async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;
    console.log("[v0] Middleware - path:", pathname);

    // log raw cookie header & authorization header (very useful)
    console.log("[v0] Middleware - cookie header:", request.headers.get("cookie"));
    console.log("[v0] Middleware - authorization header:", request.headers.get("authorization"));

    // Create a NextResponse we can mutate (for setting cookies if needed)
    let response = NextResponse.next();

    // Exempt public/static routes from auth checks to avoid redirect loops
    if (isPublicPath(pathname)) {
      return response;
    }

    // Create Supabase server client with a proper cookie adapter
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          // read from incoming request cookies
          get(name: string) {
            return request.cookies.get(name)?.value ?? null;
          },
          // write to response cookies only — DO NOT mutate request.cookies
          set(name: string, value: string, options: any) {
            // NextResponse.cookies.set accepts either (name, value, opts) or an object
            try {
              response.cookies.set({
                name,
                value,
                ...options,
              });
            } catch (e) {
              console.error("[v0] cookie set error:", e);
            }
          },
          // delete cookie on response
          delete(name: string, options: any) {
            try {
              // Use response.cookies.delete if available, else set empty with past expiry
              if (typeof response.cookies.delete === "function") {
                response.cookies.delete(name);
              } else {
                response.cookies.set({
                  name,
                  value: "",
                  maxAge: 0,
                  ...options,
                });
              }
            } catch (e) {
              console.error("[v0] cookie delete error:", e);
            }
          },
        },
      }
    );

    // Ask supabase for the user using server-side cookies/adapter
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      // log the error; do not crash middleware
      console.log("[v0] Middleware - supabase.getUser error:", error);
    }

    console.log("[v0] Middleware - user:", !!user, "email:", user?.email, "path:", pathname);

    // Your protected & auth routes (adjust as you need)
    const protectedRoutes = ["/inbox", "/settings"];
    const authRoutes = ["/login"];

    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    // Protect certain routes: if user missing -> redirect to login
    if (isProtectedRoute && !user) {
      console.log("[v0] Middleware - redirecting to login (no user)");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // If user exists and is on login page -> redirect to inbox
    if (isAuthRoute && user) {
      console.log("[v0] Middleware - redirecting to inbox (user exists)");
      return NextResponse.redirect(new URL("/inbox", request.url));
    }

    // If we set any cookies above, they are already on 'response' object.
    return response;
  } catch (err) {
    console.error("[v0] Middleware - unexpected error:", err);
    // on unexpected errors, allow request to continue (avoid locking users out)
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
