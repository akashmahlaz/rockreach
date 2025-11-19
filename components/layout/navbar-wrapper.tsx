import { auth } from "@/auth"
import { Navbar } from "./navbar"

/**
 * Server component wrapper that fetches user session and passes to Navbar
 * Use this in pages where you want to display the navbar
 */
export async function NavbarWrapper() {
  const session = await auth()
  const user = session?.user ? { ...session.user, role: session.user.role } : null
  
  return <Navbar user={user} />
}
