
"use client"

import { signOut } from "next-auth/react"
 
export default function SignOut() {
  return (
    <button 
      onClick={() => signOut()}
      className="flex items-center text-sm font-medium hover:opacity-80 transition-opacity"
    >
      Sign out
    </button>
  )
}
