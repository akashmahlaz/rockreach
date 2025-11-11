import { auth } from "@/auth"
import { UnifiedNavbar } from "@/components/unified-navbar"

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const user = session?.user ? { ...session.user, role: session.user.role } : null

  return (
    <>
      <UnifiedNavbar user={user} />
      {children}
    </>
  )
}
