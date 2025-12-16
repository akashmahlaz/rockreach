
"use client"

import { signIn } from "next-auth/react"
import { Button } from "../ui/button"
 
export default function SignIn() {
  return (
    <Button 
      onClick={() => signIn("google")}
      variant="default"
      size="sm"
      className="font-medium bg-white rounded-4xl text-3xl"
    >
      Log in
    </Button>
  )
}
