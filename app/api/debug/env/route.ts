import { NextResponse } from "next/server"

export async function GET() {
  // Only return whether variables are set, not their values (for security)
  return NextResponse.json({
    supabase: {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    site: {
      url: process.env.NEXT_PUBLIC_SITE_URL || "Not set (will use localhost:3000)",
    },
    google: {
      clientId: !!process.env.GOOGLE_CLIENT_ID,
      clientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    }
  })
}
