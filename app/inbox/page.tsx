import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { InboxLayout } from "@/components/inbox/inbox-layout"

export default async function InboxPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return <InboxLayout user={user} />
}
