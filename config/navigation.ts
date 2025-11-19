import { Home, FileText, BookOpen, Search, Mail, Sparkles, type LucideIcon } from "lucide-react"

export interface NavItem {
  title: string
  href: string
  description?: string
  icon?: LucideIcon
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

// Minimal public navigation (not authenticated)
export const publicNav: NavItem[] = [
  {
    title: "Home",
    href: "/",
  },
  {
    title: "Features",
    href: "/#features",
  },
]

// Minimal authenticated user navigation - only essential links
export const authenticatedNav: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
]

// Features dropdown (for public users)
export const featuresNav: NavGroup = {
  title: "Features",
  items: [
    {
      title: "Features",
      href: "/#features",
      description: "Discover what LogiGrow can do",
      icon: Sparkles,
    },
    {
      title: "Pricing",
      href: "/#pricing",
      description: "Simple, transparent pricing",
    },
  ],
}

// Docs dropdown - Always visible
export const docsNav: NavGroup = {
  title: "Docs",
  items: [
    {
      title: "Getting Started",
      href: "/docs/guide",
      description: "Learn the basics of LogiGrow",
      icon: BookOpen,
    },
    {
      title: "API Reference",
      href: "/docs/api",
      description: "Integrate LogiGrow API",
      icon: FileText,
    },
  ],
}

// Tools dropdown (for authenticated users only)
export const toolsNav: NavGroup = {
  title: "Tools",
  items: [
    {
      title: "Search Leads",
      href: "/leads/search",
      description: "Find prospects by criteria",
      icon: Search,
    },
    {
      title: "My Leads",
      href: "/leads",
      description: "View and manage saved leads",
    },
    {
      title: "Email Campaigns",
      href: "/email/campaigns",
      description: "Create outreach campaigns",
      icon: Mail,
    },
  ],
}
