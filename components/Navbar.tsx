import Link from "next/link"
import SignIn from "@/components/auth/sign-in"
import SignOut from "@/components/auth/sign-out"

interface BrillanceNavProps {
  user?: {
    name?: string | null
    email?: string | null
    role?: string
  } | null
}

export function BrillanceNav({ user }: BrillanceNavProps) {
  const isAdmin = user?.role === "admin"
  const isUser = user?.role === "user"

  return (
    <div className="w-full h-12 sm:h-14 md:h-16 lg:h-[84px] absolute left-0 top-0 flex justify-center items-center z-20 px-6 sm:px-8 md:px-12 lg:px-0">
      <div className="w-full h-0 absolute left-0 top-6 sm:top-7 md:top-8 lg:top-[42px] border-t border-[rgba(55,50,47,0.12)] shadow-[0px_1px_0px_white]"></div>

      <div className="w-full max-w-[calc(100%-32px)] sm:max-w-[calc(100%-48px)] md:max-w-[calc(100%-64px)] lg:max-w-[700px] lg:w-[700px] h-10 sm:h-11 md:h-12 py-1.5 sm:py-2 px-3 sm:px-4 md:px-4 pr-2 sm:pr-3 bg-[#F7F5F3] backdrop-blur-sm shadow-[0px_0px_0px_2px_white] overflow-hidden rounded-[50px] flex justify-between items-center relative z-30">
        {/* Left side - Logo and Nav */}
        <div className="flex justify-center items-center">
          <Link href="/" className="flex justify-start items-center">
            <div className="flex flex-col justify-center text-[#2F3037] text-sm sm:text-base md:text-lg lg:text-xl font-medium leading-5 font-sans">
              RocketReach
            </div>
          </Link>

          {/* Public Navigation */}
          {!user && (
            <div className="pl-3 sm:pl-4 md:pl-5 lg:pl-5 hidden sm:flex justify-start items-start flex-row gap-2 sm:gap-3 md:gap-4 lg:gap-4">
              <a href="#features" className="flex justify-start items-center">
                <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans hover:text-[#37322F] transition-colors">
                  Features
                </div>
              </a>
              <a href="#pricing" className="flex justify-start items-center">
                <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans hover:text-[#37322F] transition-colors">
                  Pricing
                </div>
              </a>
              <a href="#faq" className="flex justify-start items-center">
                <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans hover:text-[#37322F] transition-colors">
                  FAQ
                </div>
              </a>
            </div>
          )}

          {/* User Navigation */}
          {user && isUser && (
            <div className="pl-3 sm:pl-4 md:pl-5 lg:pl-5 hidden sm:flex justify-start items-start flex-row gap-2 sm:gap-3 md:gap-4 lg:gap-4">
              <Link href="/dashboard" className="flex justify-start items-center">
                <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans hover:text-[#37322F] transition-colors">
                  Dashboard
                </div>
              </Link>
              <Link href="/leads/search" className="flex justify-start items-center">
                <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans hover:text-[#37322F] transition-colors">
                  Search
                </div>
              </Link>
              <Link href="/leads" className="flex justify-start items-center">
                <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans hover:text-[#37322F] transition-colors">
                  My Leads
                </div>
              </Link>
            </div>
          )}

          {/* Admin Navigation */}
          {user && isAdmin && (
            <div className="pl-3 sm:pl-4 md:pl-5 lg:pl-5 hidden sm:flex justify-start items-start flex-row gap-2 sm:gap-3 md:gap-4 lg:gap-4">
              <Link href="/admin" className="flex justify-start items-center">
                <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans hover:text-[#37322F] transition-colors">
                  Admin
                </div>
              </Link>
              <Link href="/leads/search" className="flex justify-start items-center">
                <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans hover:text-[#37322F] transition-colors">
                  Search
                </div>
              </Link>
              <Link href="/admin/settings" className="flex justify-start items-center">
                <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans hover:text-[#37322F] transition-colors">
                  Settings
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Right side - Auth buttons */}
        <div className="h-6 sm:h-7 md:h-8 flex justify-start items-start gap-2 sm:gap-3">
          {!user ? (
            <div className="px-2 sm:px-3 md:px-[14px] py-1 sm:py-[6px] bg-white shadow-[0px_1px_2px_rgba(55,50,47,0.12)] overflow-hidden rounded-full flex justify-center items-center">
              <SignIn />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="hidden md:block text-xs text-[rgba(49,45,43,0.80)] font-medium">
                {user.name || user.email}
              </span>
              <div className="px-2 sm:px-3 md:px-[14px] py-1 sm:py-[6px] bg-white shadow-[0px_1px_2px_rgba(55,50,47,0.12)] overflow-hidden rounded-full flex justify-center items-center">
                <SignOut />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
