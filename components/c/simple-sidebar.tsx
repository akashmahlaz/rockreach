"use client";

import * as React from "react";
import { Plus, MoreVertical, Search, Users, Mail, Settings, LogOut, Menu, X, Sparkles, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { UIMessage } from "ai";

interface Conversation {
  id: string;
  title: string;
  messages: UIMessage[];
  createdAt: number;
}

interface SimpleSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  conversations: Conversation[];
  activeConvId: string | null;
  isLoadingConversations: boolean;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
}

export function SimpleSidebar({
  user,
  conversations,
  activeConvId,
  isLoadingConversations,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
}: SimpleSidebarProps) {
  const router = useRouter();
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const startRename = (conv: Conversation) => {
    setRenamingId(conv.id);
    setRenameValue(conv.title);
  };

  const saveRename = () => {
    if (renamingId && renameValue.trim()) {
      onRenameConversation(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue("");
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue("");
  };

  const handleConversationClick = (convId: string) => {
    router.push(`/c/${convId}`);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-40 md:hidden bg-background/80 backdrop-blur-sm shadow-md hover:bg-primary/10 hover:shadow-lg transition-all duration-200"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "flex h-full w-72 flex-col bg-background/95 backdrop-blur-md border-r border-border/50 transition-all duration-300 ease-in-out z-50 shadow-xl md:shadow-none",
        "fixed md:relative inset-y-0 left-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Mobile Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-3 right-3 md:hidden z-10 hover:bg-primary/10"
        >
          <X className="h-5 w-5" />
        </Button>
        
      {/* Header - Logo & New Chat */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">RockReach</span>
        </div>
        <Button
          onClick={onNewConversation}
          className="w-full justify-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          <span className="font-medium">New Chat</span>
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 border-b border-border/50">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent transition-all duration-200 group"
        >
          <div className="h-8 w-8 rounded-lg bg-muted/50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
            <Home className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <span className="group-hover:text-primary transition-colors">Dashboard</span>
        </Link>
        <Link
          href="/leads/search"
          className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent transition-all duration-200 group"
        >
          <div className="h-8 w-8 rounded-lg bg-muted/50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
            <Search className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <span className="group-hover:text-primary transition-colors">Search Leads</span>
        </Link>
        <Link
          href="/leads"
          className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent transition-all duration-200 group"
        >
          <div className="h-8 w-8 rounded-lg bg-muted/50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
            <Users className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <span className="group-hover:text-primary transition-colors">My Leads</span>
        </Link>
        <Link
          href="/email/campaigns"
          className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent transition-all duration-200 group"
        >
          <div className="h-8 w-8 rounded-lg bg-muted/50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
            <Mail className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <span className="group-hover:text-primary transition-colors">Campaigns</span>
        </Link>
      </div>

      {/* Recent Chats - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3 flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-primary"></span>
          Recent Chats
        </div>
        <div className="space-y-1">
          {isLoadingConversations ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-11 rounded-lg bg-gradient-to-r from-muted/50 to-muted/30 animate-pulse"
              />
            ))
          ) : conversations.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">Start a new chat to begin</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "group relative flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200",
                  activeConvId === conv.id
                    ? "bg-gradient-to-r from-primary/15 to-primary/5 text-foreground shadow-sm border border-primary/20"
                    : "hover:bg-gradient-to-r hover:from-muted/50 hover:to-transparent"
                )}
              >
                {renamingId === conv.id ? (
                  <div className="flex items-center gap-2 w-full">
                    <input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename();
                        if (e.key === "Escape") cancelRename();
                      }}
                      className="flex-1 h-8 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      autoFocus
                    />
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleConversationClick(conv.id)}
                      className="flex-1 text-left text-sm truncate"
                    >
                      {conv.title}
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/10"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 shadow-lg border-border/50">
                        <DropdownMenuItem onClick={() => startRename(conv)} className="cursor-pointer hover:bg-primary/10 transition-colors">
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteConversation(conv.id)}
                          className="text-destructive focus:text-destructive cursor-pointer hover:bg-destructive/10 transition-colors"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer - User Profile */}
      <div className="p-4 border-t border-border/50 bg-gradient-to-t from-muted/30 to-transparent">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto py-2.5 px-3 hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent rounded-lg transition-all duration-200"
            >
              <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                <AvatarImage src={user.image || ""} alt={user.name || ""} />
                <AvatarFallback className="text-sm bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold">
                  {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-semibold truncate">
                  {user.name || "User"}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {user.email || ""}
                </div>
              </div>
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56 shadow-lg border-border/50">
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer flex items-center gap-2 py-2.5 hover:bg-primary/10 transition-colors rounded-md">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/help" className="cursor-pointer flex items-center gap-2 py-2.5 hover:bg-primary/10 transition-colors rounded-md">
                 Help & Support
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => (window.location.href = "/api/auth/signout")}
              className="text-destructive focus:text-destructive cursor-pointer flex items-center gap-2 py-2.5 hover:bg-destructive/10 transition-colors rounded-md"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    </>
  );
}
