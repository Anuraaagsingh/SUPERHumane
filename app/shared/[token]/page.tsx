import { Suspense } from "react"
import { notFound } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { EmailList } from "@/components/inbox/email-list"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"

interface SharedViewPageProps {
  params: {
    token: string
  }
}

async function getSharedView(token: string) {
  const cookieStore = cookies()

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  const { data: sharedView, error } = await supabase
    .from("shared_views")
    .select("*")
    .eq("share_token", token)
    .eq("is_public", true)
    .single()

  if (error || !sharedView) {
    return null
  }

  return sharedView
}

export default async function SharedViewPage({ params }: SharedViewPageProps) {
  const sharedView = await getSharedView(params.token)

  if (!sharedView) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{sharedView.name}</CardTitle>
            <p className="text-sm text-muted-foreground font-mono">{sharedView.query}</p>
          </CardHeader>
        </Card>

        <Suspense fallback={<div>Loading emails...</div>}>
          <EmailList searchQuery={sharedView.query} isSharedView={true} />
        </Suspense>
      </div>
    </div>
  )
}
