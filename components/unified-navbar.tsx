"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Moon, Sun, User, Settings, LogOut, ChevronDown, Home, Building2, Users, BarChart3, Mail, FileText, Search as SearchIcon } from "lucide-react"
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
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import SignIn from "@/components/auth/sign-in"
import SignOut from "@/components/auth/sign-out"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface UnifiedNavbarProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  } | null
}

export function UnifiedNavbar({ user }: UnifiedNavbarProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isAdmin = user?.role === "admin"
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
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6 lg:px-8 max-w-full mx-auto">
        {/* Logo */}
        <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            RR
          </div>
          <span className="font-semibold text-lg hidden sm:inline-block">RocketReach</span>
        </Link>

        {/* Desktop Navigation with dropdowns */}
        <div className="hidden md:flex items-center">
          <NavigationMenu>
            <NavigationMenuList>
              {/* Guest Navigation */}
              {!isAuthenticated && (
                <>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger>Home</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                        <li className="row-span-3">
                          <NavigationMenuLink asChild>
                            <a
                              className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                              href="/"
                            >
                              <div className="mb-2 mt-4 text-lg font-medium">
                                RocketReach Lead Gen
                              </div>
                              <p className="text-sm leading-tight text-muted-foreground">
                                Find and connect with prospects effortlessly using RocketReach API.
                              </p>
                            </a>
                          </NavigationMenuLink>
                        </li>
                        <ListItem href="#features" title="Features">
                          Discover powerful lead generation capabilities
                        </ListItem>
                        <ListItem href="#pricing" title="Pricing">
                          Simple, transparent pricing for every team
                        </ListItem>
                        <ListItem href="#faq" title="FAQ">
                          Frequently asked questions and answers
                        </ListItem>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link href="#features" legacyBehavior passHref>
                      <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                        Features
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link href="#pricing" legacyBehavior passHref>
                      <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                        Pricing
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                </>
              )}

              {/* User Navigation */}
              {isAuthenticated && !isAdmin && (
                <>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger>Leads</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-2">
                        <ListItem href="/leads/search" title="Search Leads" icon={<SearchIcon className="h-4 w-4" />}>
                          Find new prospects with RocketReach
                        </ListItem>
                        <ListItem href="/leads" title="My Leads" icon={<Users className="h-4 w-4" />}>
                          View and manage your saved leads
                        </ListItem>
                        <ListItem href="/leads/lists" title="Lead Lists" icon={<FileText className="h-4 w-4" />}>
                          Organize leads into custom lists
                        </ListItem>
                        <ListItem href="/dashboard" title="Dashboard" icon={<BarChart3 className="h-4 w-4" />}>
                          Overview and analytics
                        </ListItem>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link href="/dashboard" legacyBehavior passHref>
                      <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                        Dashboard
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                </>
              )}

              {/* Admin Navigation */}
              {isAdmin && (
                <>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger>Admin</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid gap-3 p-4 md:w-[500px] lg:w-[600px] lg:grid-cols-2">
                        <ListItem href="/admin" title="Admin Dashboard" icon={<Home className="h-4 w-4" />}>
                          System overview and analytics
                        </ListItem>
                        <ListItem href="/admin/users" title="User Management" icon={<Users className="h-4 w-4" />}>
                          Manage users and permissions
                        </ListItem>
                        <ListItem href="/admin/organizations" title="Organizations" icon={<Building2 className="h-4 w-4" />}>
                          Manage organizations and settings
                        </ListItem>
                        <ListItem href="/admin/settings" title="Settings" icon={<Settings className="h-4 w-4" />}>
                          System configuration and API keys
                        </ListItem>
                        <ListItem href="/admin/api-usage" title="API Usage" icon={<BarChart3 className="h-4 w-4" />}>
                          Monitor API consumption and limits
                        </ListItem>
                        <ListItem href="/admin/audit-logs" title="Audit Logs" icon={<FileText className="h-4 w-4" />}>
                          View system activity logs
                        </ListItem>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger>Leads</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-2">
                        <ListItem href="/leads/search" title="Search Leads" icon={<SearchIcon className="h-4 w-4" />}>
                          Find new prospects with RocketReach
                        </ListItem>
                        <ListItem href="/leads" title="My Leads" icon={<Users className="h-4 w-4" />}>
                          View and manage your saved leads
                        </ListItem>
                        <ListItem href="/leads/lists" title="Lead Lists" icon={<FileText className="h-4 w-4" />}>
                          Organize leads into custom lists
                        </ListItem>
                        <ListItem href="/dashboard" title="Dashboard" icon={<BarChart3 className="h-4 w-4" />}>
                          Overview and analytics
                        </ListItem>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle with Switch */}
          {mounted && (
            <div className="hidden sm:flex items-center space-x-2">
              <Sun className="h-4 w-4" />
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
              <Moon className="h-4 w-4" />
            </div>
          )}

          {/* User Menu or Sign In */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:inline-block max-w-[120px] truncate">
                    {user.name || user.email}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <SignOut />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" size="sm">
              <SignIn />
            </Button>
          )}

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col space-y-4 mt-6">
                {/* Theme toggle in mobile */}
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <Label htmlFor="mobile-theme" className="flex items-center space-x-2">
                    <Sun className="h-4 w-4" />
                    <span className="text-sm font-medium">Dark Mode</span>
                  </Label>
                  <Switch
                    id="mobile-theme"
                    checked={theme === "dark"}
                    onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                  />
                </div>

                <div className="border-t pt-4">
                  <div className="flex flex-col space-y-2">
                    {/* Guest Mobile Links */}
                    {!isAuthenticated && (
                      <>
                        <MobileNavLink href="/" onClick={() => setMobileOpen(false)}>
                          Home
                        </MobileNavLink>
                        <MobileNavLink href="#features" onClick={() => setMobileOpen(false)}>
                          Features
                        </MobileNavLink>
                        <MobileNavLink href="#pricing" onClick={() => setMobileOpen(false)}>
                          Pricing
                        </MobileNavLink>
                        <MobileNavLink href="#faq" onClick={() => setMobileOpen(false)}>
                          FAQ
                        </MobileNavLink>
                      </>
                    )}

                    {/* User Mobile Links */}
                    {isAuthenticated && !isAdmin && (
                      <>
                        <MobileNavLink href="/dashboard" onClick={() => setMobileOpen(false)}>
                          Dashboard
                        </MobileNavLink>
                        <MobileNavLink href="/leads/search" onClick={() => setMobileOpen(false)}>
                          Search Leads
                        </MobileNavLink>
                        <MobileNavLink href="/leads" onClick={() => setMobileOpen(false)}>
                          My Leads
                        </MobileNavLink>
                        <MobileNavLink href="/leads/lists" onClick={() => setMobileOpen(false)}>
                          Lead Lists
                        </MobileNavLink>
                      </>
                    )}

                    {/* Admin Mobile Links */}
                    {isAdmin && (
                      <>
                        <MobileNavLink href="/admin" onClick={() => setMobileOpen(false)}>
                          Admin Dashboard
                        </MobileNavLink>
                        <MobileNavLink href="/admin/users" onClick={() => setMobileOpen(false)}>
                          Users
                        </MobileNavLink>
                        <MobileNavLink href="/admin/organizations" onClick={() => setMobileOpen(false)}>
                          Organizations
                        </MobileNavLink>
                        <MobileNavLink href="/leads/search" onClick={() => setMobileOpen(false)}>
                          Search Leads
                        </MobileNavLink>
                        <MobileNavLink href="/admin/settings" onClick={() => setMobileOpen(false)}>
                          Settings
                        </MobileNavLink>
                      </>
                    )}
                  </div>
                </div>

                {isAuthenticated && (
                  <div className="border-t pt-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      <LogOut className="mr-2 h-4 w-4" />
                      <SignOut />
                    </Button>
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

interface ListItemProps extends React.ComponentPropsWithoutRef<"a"> {
  title: string
  children: React.ReactNode
  href: string
  icon?: React.ReactNode
}

const ListItem = React.forwardRef<HTMLAnchorElement, ListItemProps>(
  ({ className, title, children, href, icon, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            href={href}
            className={cn(
              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              className
            )}
            {...props}
          >
            <div className="flex items-center gap-2">
              {icon}
              <div className="text-sm font-medium leading-none">{title}</div>
            </div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              {children}
            </p>
          </a>
        </NavigationMenuLink>
      </li>
    )
  }
)
ListItem.displayName = "ListItem"

function MobileNavLink({ 
  href, 
  children, 
  onClick 
}: { 
  href: string
  children: React.ReactNode
  onClick: () => void 
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:bg-accent/50 hover:text-foreground"
    >
      {children}
    </Link>
  )
}
