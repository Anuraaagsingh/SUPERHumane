import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  console.log("[v0] HomePage - checking auth")

  const supabase = createClient()

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
