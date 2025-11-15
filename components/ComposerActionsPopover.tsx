"use client"
import { useState, type ReactNode, type ReactElement } from "react"
import { Paperclip, Bot, Search, Palette, BookOpen, MoreHorizontal, Globe, ChevronRight, type LucideIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { cn } from "@/lib/utils"

type IconRenderer = (props: { className?: string }) => ReactElement

interface ActionItem {
  icon: IconRenderer
  label: string
  action: () => void
  badge?: string
}

interface ComposerActionsPopoverProps {
  children: ReactNode
}

const wrapLucideIcon = (IconComponent: LucideIcon): IconRenderer => (props) => (
  <IconComponent {...props} />
);

function GradientIcon({ className, gradientClass }: { className?: string; gradientClass: string }) {
  return (
    <div className={cn("h-4 w-4 rounded flex items-center justify-center", gradientClass, className)}>
      <div className="h-2 w-2 bg-white rounded-full" />
    </div>
  );
}

const googleDriveIcon: IconRenderer = (props) => (
  <GradientIcon gradientClass="bg-linear-to-br from-blue-500 to-green-500" {...props} />
);

const oneDriveIcon: IconRenderer = (props) => (
  <GradientIcon gradientClass="bg-linear-to-br from-blue-600 to-blue-400" {...props} />
);

const sharepointIcon: IconRenderer = (props) => (
  <GradientIcon gradientClass="bg-linear-to-br from-teal-500 to-teal-400" {...props} />
);

export default function ComposerActionsPopover({ children }: ComposerActionsPopoverProps) {
  const [open, setOpen] = useState(false)
  const [showMore, setShowMore] = useState(false)

  const mainActions: ActionItem[] = [
    {
      icon: wrapLucideIcon(Paperclip),
      label: "Add photos & files",
      action: () => console.log("Add photos & files"),
    },
    {
      icon: wrapLucideIcon(Bot),
      label: "Agent mode",
      badge: "NEW",
      action: () => console.log("Agent mode"),
    },
    {
      icon: wrapLucideIcon(Search),
      label: "Deep research",
      action: () => console.log("Deep research"),
    },
    {
      icon: wrapLucideIcon(Palette),
      label: "Create image",
      action: () => console.log("Create image"),
    },
    {
      icon: wrapLucideIcon(BookOpen),
      label: "Study and learn",
      action: () => console.log("Study and learn"),
    },
  ]

  const moreActions: ActionItem[] = [
    {
      icon: wrapLucideIcon(Globe),
      label: "Web search",
      action: () => console.log("Web search"),
    },
    {
      icon: wrapLucideIcon(Palette),
      label: "Canvas",
      action: () => console.log("Canvas"),
    },
    {
      icon: googleDriveIcon,
      label: "Connect Google Drive",
      action: () => console.log("Connect Google Drive"),
    },
    {
      icon: oneDriveIcon,
      label: "Connect OneDrive",
      action: () => console.log("Connect OneDrive"),
    },
    {
      icon: sharepointIcon,
      label: "Connect Sharepoint",
      action: () => console.log("Connect Sharepoint"),
    },
  ]

  const handleAction = (action: ActionItem["action"]) => {
    action()
    setOpen(false)
    setShowMore(false)
  }

  const handleMoreClick = () => {
    setShowMore(true)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setShowMore(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start" side="top">
        {!showMore ? (
          // Main actions view
          <div className="p-3">
            <div className="space-y-1">
              {mainActions.map((action, index) => {
                const IconComponent = action.icon
                return (
                  <button
                    key={index}
                    onClick={() => handleAction(action.action)}
                    className="flex items-center gap-3 w-full p-2 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{action.label}</span>
                    {action.badge && (
                      <span className="ml-auto px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                        {action.badge}
                      </span>
                    )}
                  </button>
                )
              })}
              <button
                onClick={handleMoreClick}
                className="flex items-center gap-3 w-full p-2 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span>More</span>
                <ChevronRight className="h-4 w-4 ml-auto" />
              </button>
            </div>
          </div>
        ) : (
          // More options view with two columns
          <div className="flex">
            <div className="flex-1 p-3 border-r border-zinc-200 dark:border-zinc-800">
              <div className="space-y-1">
                {mainActions.map((action, index) => {
                  const IconComponent = action.icon
                  return (
                    <button
                      key={index}
                      onClick={() => handleAction(action.action)}
                      className="flex items-center gap-3 w-full p-2 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                    >
                      <IconComponent className="h-4 w-4" />
                      <span>{action.label}</span>
                      {action.badge && (
                        <span className="ml-auto px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                          {action.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
                <button
                  onClick={handleMoreClick}
                  className="flex items-center gap-3 w-full p-2 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span>More</span>
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </button>
              </div>
            </div>
            <div className="flex-1 p-3">
              <div className="space-y-1">
                {moreActions.map((action, index) => {
                  const IconComponent = action.icon
                  return (
                    <button
                      key={index}
                      onClick={() => handleAction(action.action)}
                      className="flex items-center gap-3 w-full p-2 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                    >
                      <IconComponent className="h-4 w-4" />
                      <span>{action.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
