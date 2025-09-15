import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export default async function HomePage() {
  console.log("[v0] HomePage - checking auth")

  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    },
  )

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    console.log("[v0] HomePage - user:", !!user, "error:", error)

    if (user) {
      console.log("[v0] HomePage - redirecting to inbox")
      redirect("/inbox")
    } else {
      console.log("[v0] HomePage - redirecting to login")
      redirect("/login")
    }
  } catch (error) {
    console.error("[v0] HomePage - auth error:", error)
    redirect("/login")
  }
}
