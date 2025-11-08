import { auth } from "@/auth"
import SignOut from "@/components/auth/sign-out"
import SignIn from "@/components/auth/sign-in"
import Link from "next/link"

export async function Navbar() {
  const session = await auth();
  // @ts-expect-error - role added to session
  const userRole = session?.user?.role;

  return (
    <header className="w-full border-b border-neutral-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-neutral-900 font-semibold text-lg hover:text-neutral-700">
              RocketReach Lead Gen
            </Link>
            
            {/* Public Navigation */}
            {!session?.user && (
              <div className="hidden md:flex items-center space-x-6">
                <Link href="/#features" className="text-neutral-700 hover:text-neutral-900 text-sm font-medium">
                  Features
                </Link>
                <Link href="/#pricing" className="text-neutral-700 hover:text-neutral-900 text-sm font-medium">
                  Pricing
                </Link>
              </div>
            )}

            {/* User Navigation */}
            {session?.user && userRole === "user" && (
              <div className="hidden md:flex items-center space-x-6">
                <Link href="/dashboard" className="text-neutral-700 hover:text-neutral-900 text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/leads/search" className="text-neutral-700 hover:text-neutral-900 text-sm font-medium">
                  Search Leads
                </Link>
                <Link href="/leads" className="text-neutral-700 hover:text-neutral-900 text-sm font-medium">
                  My Leads
                </Link>
              </div>
            )}

            {/* Admin Navigation */}
            {session?.user && userRole === "admin" && (
              <div className="hidden md:flex items-center space-x-6">
                <Link href="/admin" className="text-neutral-700 hover:text-neutral-900 text-sm font-medium">
                  Admin
                </Link>
                <Link href="/leads/search" className="text-neutral-700 hover:text-neutral-900 text-sm font-medium">
                  Search Leads
                </Link>
                <Link href="/admin/settings" className="text-neutral-700 hover:text-neutral-900 text-sm font-medium">
                  Settings
                </Link>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {session?.user ? (
              <>
                <span className="text-sm text-neutral-600 hidden sm:block">
                  {session.user.name || session.user.email}
                </span>
                <SignOut />
              </>
            ) : (
              <SignIn />
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
