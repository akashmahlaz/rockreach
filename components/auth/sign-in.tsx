
"use client"

import { signIn } from "next-auth/react"
 
export default function SignIn() {
  return (
    <button 
      onClick={() => signIn("google")}
      className="flex flex-col justify-center text-[#37322F] text-xs md:text-[13px] font-medium leading-5 font-sans hover:text-[#37322F]/80 transition-colors"
    >
      Log in
    </button>
  )
}
