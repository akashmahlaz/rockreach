
"use client"

import { signIn } from "next-auth/react"
import { Button } from "../ui/button"
 
export default function SignIn() {
  return (
    <Button 
      onClick={() => signIn("google")}
      variant="default"
      size="sm"
      className="font-medium bg-white rounded-4xl text-4xl text-black p-6 m-2"
    >
      Log in
    </Button>
  )
}
