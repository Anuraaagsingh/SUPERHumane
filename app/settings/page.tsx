import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SettingsForm } from "@/components/settings-form"

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = createClient()
  
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login")
  }

  // Get user profile
  const { data: profile, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single()

  if (error || !profile) {
    console.error("Error fetching profile:", error)
    throw new Error("Could not fetch user profile.")
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and email preferences</p>
        </div>
        <SettingsForm user={user} profile={profile} />
      </div>
    </div>
  )
}
