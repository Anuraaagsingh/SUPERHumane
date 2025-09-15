import { getCurrentUser, getUserProfile } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SettingsForm } from "@/components/settings-form"

export default async function SettingsPage() {
  const user = await getCurrentUser()
  const profile = await getUserProfile()

  if (!user) {
    redirect("/auth")
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
