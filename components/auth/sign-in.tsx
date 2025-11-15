
"use client"

import { signIn } from "next-auth/react"
import { Button } from "../ui/button"
 
export default function SignIn() {
  return (
    <Button 
      onClick={() => signIn("google")}
      className="bg-gradient-to-t from-amber-300 to-gray-100 font-sans font-bold text-gray-800 hover:border transition-all px-4 py-2"
    >
      Log in
    </Button>
  )
}
