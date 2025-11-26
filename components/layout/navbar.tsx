"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import SignIn from "@/components/auth/sign-in"
import SignOut from "@/components/auth/sign-out"
import { useTheme } from "next-themes"

interface NavbarProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  } | null
}

export function Navbar({ user }: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isAuthenticated = !!user

  const getInitials = (name?: string | null) => {
    if (!name) return "?"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="container flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8 gap-2">
        {/* Logo */}
        <Link
          href={isAuthenticated ? "/dashboard" : "/"}
          className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity flex-shrink-0 min-w-0"
        >
          <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg bg-primary text-primary-foreground font-bold text-xs sm:text-sm md:text-base shadow-sm flex-shrink-0">
            L
          </div>
          <span className="hidden xs:inline-block font-semibold text-sm sm:text-base md:text-lg font-sans tracking-tight text-foreground truncate">LogiGrow</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1 lg:gap-2">
          {!isAuthenticated ? (
            <>
              <Link href="/features" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
                Features
              </Link>
              <Link href="/pricing" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
                Pricing
              </Link>
              <Link href="/docs/guide" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
                Docs
              </Link>
            </>
          ) : (
            <>
              <Link href="/dashboard" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
                Dashboard
              </Link>
              {/* <Link href="/leads" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
                Clients
              </Link> */}
              <Link href="/c" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
                Connect
              </Link>
              <Link href="/docs/guide" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
                Docs
              </Link>
            </>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Theme Toggle - Hidden on mobile, shown on desktop */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hidden sm:flex h-8 w-8 sm:h-9 sm:w-9"
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}

          {/* User Menu or Sign In - Hidden on mobile */}
          {isAuthenticated && (
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 h-8 sm:h-9 px-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
                      <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <SignOut />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Sign In - Hidden on mobile */}
          {!isAuthenticated && (
            <div className="hidden md:block">
              <SignIn />
            </div>
          )}

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px] bg-background">
              <SheetHeader>
                <SheetTitle className="text-foreground">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-3 sm:gap-4 mt-6">
                {/* Theme toggle in mobile */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <span className="text-sm font-medium text-foreground">Theme</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="bg-background"
                  >
                    {theme === "dark" ? "Light" : "Dark"}
                  </Button>
                </div>

                <Separator className="bg-border" />

                <div className="flex flex-col gap-1">
                  {/* Home */}
                  <Button
                    variant="ghost"
                    asChild
                    className="justify-start text-foreground hover:bg-accent"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Link href="/">Home</Link>
                  </Button>

                  {!isAuthenticated ? (
                    <>
                      <Button
                        variant="ghost"
                        asChild
                        className="justify-start text-foreground hover:bg-accent"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Link href="/#features">Features</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        asChild
                        className="justify-start text-foreground hover:bg-accent"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Link href="/#pricing">Pricing</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        asChild
                        className="justify-start text-foreground hover:bg-accent"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Link href="/docs/guide">Docs</Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        asChild
                        className="justify-start text-foreground hover:bg-accent"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Link href="/dashboard">Dashboard</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        asChild
                        className="justify-start text-foreground hover:bg-accent"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Link href="/leads">Leads</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        asChild
                        className="justify-start text-foreground hover:bg-accent"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Link href="/leads/search">Search</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        asChild
                        className="justify-start text-foreground hover:bg-accent"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Link href="/c">AI Chat</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        asChild
                        className="justify-start text-foreground hover:bg-accent"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Link href="/email/campaigns">Campaigns</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        asChild
                        className="justify-start text-foreground hover:bg-accent"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Link href="/docs/guide">Docs</Link>
                      </Button>
                    </>
                  )}
                </div>

                {isAuthenticated && (
                  <>
                    <Separator className="bg-border" />
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
                        <AvatarFallback className="bg-primary text-primary-foreground">{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-medium text-foreground truncate">{user.name}</span>
                        <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      asChild
                      className="justify-start text-foreground hover:bg-accent"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Link href="/settings">Settings</Link>
                    </Button>
                    {user.role === "admin" && (
                      <Button
                        variant="ghost"
                        asChild
                        className="justify-start text-foreground hover:bg-accent"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Link href="/admin">Admin Panel</Link>
                      </Button>
                    )}
                    <Separator className="bg-border" />
                    <Button
                      variant="ghost"
                      className="justify-start text-foreground hover:bg-accent"
                      onClick={() => setMobileOpen(false)}
                    >
                      <SignOut />
                    </Button>
                  </>
                )}

                {!isAuthenticated && (
                  <div className="pt-4">
                    <SignIn />
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
