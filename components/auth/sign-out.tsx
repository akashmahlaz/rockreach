
"use client"

import { signOut } from "next-auth/react"
 
export default function SignOut() {
  return (
    <button 
      onClick={() => signOut()}
      className="flex flex-col justify-center text-[#37322F] text-xs md:text-[13px] font-medium leading-5 font-sans hover:text-[#37322F]/80 transition-colors"
    >
      Sign out
    </button>
  )
}
