"use client"

import { usePathname } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"

interface ConditionalNavbarProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  } | null
}

export function ConditionalNavbar({ user }: ConditionalNavbarProps) {
  const pathname = usePathname()
  
  // Hide navbar on AI chat pages
  const hideNavbar = pathname?.startsWith('/c/') || 
                     pathname?.startsWith('/agent/') || 
                     pathname?.startsWith('/assistant/')
  
  if (hideNavbar) {
    return null
  }
  
  return <Navbar user={user} />
}

