import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

export function createClient(request: NextRequest) {
  // Create an unmodified response
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
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is updated, update the cookies for the request and response
          const cookieOptions = {
            name,
            value,
            ...options,
            // Ensure cookies are properly set for auth
            path: options.path || '/',
            sameSite: options.sameSite || 'lax',
            httpOnly: options.httpOnly !== false,
            secure: process.env.NODE_ENV === 'production' || options.secure,
          };
          
          try {
            request.cookies.set(cookieOptions);
          } catch (e) {
            console.warn("[Cookie Warning] Failed to set request cookie:", e);
          }
          
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          
          try {
            response.cookies.set(cookieOptions);
          } catch (e) {
            console.warn("[Cookie Warning] Failed to set response cookie:", e);
          }
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the cookies for the request and response
          const cookieOptions = {
            name,
            value: "",
            ...options,
            path: options.path || '/',
            expires: new Date(0),
          };
          
          try {
            request.cookies.set(cookieOptions);
          } catch (e) {
            console.warn("[Cookie Warning] Failed to remove request cookie:", e);
          }
          
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          
          try {
            response.cookies.set(cookieOptions);
          } catch (e) {
            console.warn("[Cookie Warning] Failed to remove response cookie:", e);
          }
        },
      },
    }
  )

  return { supabase, response }
}
