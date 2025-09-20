import { LoginPage } from "@/components/login-page"

export default function AuthPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return <LoginPage error={searchParams.error} />
}
