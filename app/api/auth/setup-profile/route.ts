import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST() {
  console.log("[SETUP] Setup profile API called")
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: existingProfile } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .single()

  if (!existingProfile) {
    const { error: profileError } = await supabase.from("users").insert({
      id: user.id,
      email: user.email!,
      name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email!.split("@")[0],
      avatar_url: user.user_metadata?.avatar_url,
    })

    if (profileError) {
      console.error("Profile creation error:", profileError)
      return NextResponse.json(
        { error: "Failed to create profile" },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ success: true })
}
