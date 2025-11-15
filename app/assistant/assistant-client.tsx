"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bot,
  CheckCircle2,
  Copy,
  DollarSign,
  Edit3,
  Loader2,
  MoreVertical,
  Plus,
  Send,
  Sparkles,
  TrendingUp,
  Trash2,
  User,
  Users,
  Settings,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";

interface AssistantClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
}

interface Conversation {
  id: string;
  title: string;
  messages: UIMessage[];
  createdAt: number;
}

interface ThinkingStep {
  label: string;
  status: "pending" | "active" | "complete";
}

interface UsageStats {
  period: string;
  totalTokens: number;
  totalCalls: number;
  successCalls: number;
  errorCalls: number;
  avgDurationMs: number;
  estimatedCost: string;
  costPerCall: string;
}

// Dynamic thinking steps that update based on backend activity
const getThinkingSteps = (lastMessage?: UIMessage) => {
  if (!lastMessage) {
    return [
      { label: "Understanding your request", icon: "brain" },
      { label: "Processing query", icon: "cog" },
      { label: "Preparing response", icon: "check" },
    ];
  }

  // Check what tools are being called
  const toolParts = lastMessage.parts.filter((p) => p.type.startsWith("tool-"));
  const hasSearch = toolParts.some((p) => p.type.includes("searchRocketReach") || p.type.includes("search"));
  const hasLookup = toolParts.some((p) => p.type.includes("lookupRocketReach") || p.type.includes("lookup"));
  const hasEmail = toolParts.some((p) => p.type.includes("sendEmail") || p.type.includes("email"));
  const hasWhatsApp = toolParts.some((p) => p.type.includes("sendWhatsApp") || p.type.includes("whatsapp"));

  const steps = [{ label: "Understanding your request", icon: "brain" }];

  if (hasSearch) {
    steps.push({ label: "Searching for leads", icon: "search" });
  }
  if (hasLookup) {
    steps.push({ label: "Finding contact details", icon: "user" });
  }
  if (hasEmail || hasWhatsApp) {
    steps.push({ label: "Preparing outreach", icon: "send" });
  }
  steps.push({ label: "Finalizing response", icon: "check" });

  return steps;
};

export function AssistantClient({ user }: AssistantClientProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [renamingConvId, setRenamingConvId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [usagePeriod, setUsagePeriod] = useState<"24h" | "7d" | "30d">("30d");
  const [loadingStats, setLoadingStats] = useState(false);

  // Local input state for the textarea
  const [localInput, setLocalInput] = useState("");

  // Use the latest useChat hook
  const {
    messages,
    sendMessage,
    status,
    stop,
    error,
    setMessages,
  } = useChat({
    id: activeConvId || undefined,
    transport: new DefaultChatTransport({
      api: "/api/assistant/stream",
      body: () => ({
        userMetadata: {
          name: user.name,
          email: user.email,
          role: user.role,
        },
      }),
    }),
    onFinish: ({ message }) => {
      console.log('[useChat] onFinish:', { message, messageCount: messages.length });
      
      if (activeConvId) {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === activeConvId) {
              // Generate better title from first user message
              let title = c.title;
              if (c.title === "New chat") {
                const currentMessages = [...messages, message];
                const firstUserMsg = currentMessages.find((m) => m.role === "user");
                if (firstUserMsg && firstUserMsg.parts && firstUserMsg.parts.length > 0) {
                  const textContent = firstUserMsg.parts
                    .filter((p) => p.type === "text")
                    .map((p) => p.text)
                    .join(" ")
                    .trim();
                  // Create smart title
                  if (textContent.toLowerCase().includes("find") || textContent.toLowerCase().includes("search")) {
                    title = "🔍 " + textContent.slice(0, 35) + (textContent.length > 35 ? "..." : "");
                  } else if (textContent.toLowerCase().includes("email") || textContent.toLowerCase().includes("send")) {
                    title = "✉️ " + textContent.slice(0, 35) + (textContent.length > 35 ? "..." : "");
                  } else {
                    title = textContent.slice(0, 40) + (textContent.length > 40 ? "..." : "");
                  }
                }
              }
              return { ...c, title, messages: [...messages, message] };
            }
            return c;
          })
        );
      }
      setThinkingSteps([]);
    },
    onError: (error) => {
      console.error("Chat error:", error);
      toast.error(error?.message || "An error occurred while processing your request");
      setThinkingSteps([]);
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Debug logging
  useEffect(() => {
    console.log('[useChat] Status:', status, 'Messages:', messages.length, 'Loading:', isLoading);
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      console.log('[useChat] Last message:', {
        id: lastMsg.id,
        role: lastMsg.role,
        partCount: lastMsg.parts?.length || 0,
        partTypes: lastMsg.parts?.map(p => p.type) || [],
      });
    }
    // Only log on status change, not every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  // Load messages when switching conversations
  useEffect(() => {
    if (activeConvId && activeConv) {
      setMessages(activeConv.messages);
    } else if (!activeConvId) {
      setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId, activeConv?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [messages, thinkingSteps, status]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [localInput]);

  // Show dynamic thinking steps when loading
  useEffect(() => {
    if (isLoading) {
      const lastMsg = messages.length > 0 ? messages[messages.length - 1] : undefined;
      const dynamicSteps = getThinkingSteps(lastMsg);
      
      setThinkingSteps(
        dynamicSteps.map((step, idx) => ({
          label: step.label,
          status: idx === 0 ? "active" : "pending",
        }))
      );
      
      let stepIdx = 0;
      const stepInterval = setInterval(() => {
        stepIdx++;
        if (stepIdx < dynamicSteps.length) {
          setThinkingSteps((steps) =>
            steps.map((step, idx) => ({
              ...step,
              status: idx < stepIdx ? "complete" : idx === stepIdx ? "active" : "pending",
            }))
          );
        } else {
          clearInterval(stepInterval);
        }
      }, 800); // Slower progression for better UX
      return () => clearInterval(stepInterval);
    } else {
      setThinkingSteps([]);
    }
    // Only depend on isLoading, not messages to prevent infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // Load conversations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("assistant-conversations");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migrate old message format to new UIMessage format
        const migrated = parsed.map((conv: Conversation) => ({
          ...conv,
          messages: conv.messages.map((msg: UIMessage) => ({
            ...msg,
            parts: msg.parts || [], // Ensure parts array exists
          })),
        }));
        setConversations(migrated);
        if (migrated.length > 0 && !activeConvId) {
          setActiveConvId(migrated[0].id);
        }
      } catch (error) {
        console.error("Error loading conversations:", error);
        // Clear corrupted data
        localStorage.removeItem("assistant-conversations");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save conversations to localStorage
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem("assistant-conversations", JSON.stringify(conversations));
    }
  }, [conversations]);

  // Fetch usage stats
  const fetchUsageStats = async (period: string) => {
    setLoadingStats(true);
    try {
      const res = await fetch(`/api/assistant/usage?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setUsageStats(data);
      }
    } catch (error) {
      console.error("Error fetching usage stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Load usage stats on mount and when period changes
  useEffect(() => {
    fetchUsageStats(usagePeriod);
  }, [usagePeriod]);

  const createNewConversation = () => {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: "New chat",
      messages: [],
      createdAt: Date.now(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newConv.id);
    setLocalInput("");
    setMessages([]);
  };

  const deleteConversation = (id: string) => {
    if (!confirm("Are you sure you want to delete this conversation?")) {
      return;
    }
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      setActiveConvId(remaining[0]?.id || null);
      setMessages([]);
    }
    toast.success("Conversation deleted");
  };

  const startRenameConversation = (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      setRenamingConvId(id);
      setRenameValue(conv.title);
    }
  };

  const saveRenameConversation = () => {
    if (!renamingConvId || !renameValue.trim()) {
      setRenamingConvId(null);
      return;
    }
    setConversations((prev) =>
      prev.map((c) => (c.id === renamingConvId ? { ...c, title: renameValue.trim() } : c))
    );
    setRenamingConvId(null);
    setRenameValue("");
    toast.success("Conversation renamed");
  };

  const cancelRenameConversation = () => {
    setRenamingConvId(null);
    setRenameValue("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!localInput.trim() || isLoading) return;

    // Create conversation if none exists
    if (!activeConvId) {
      const newConv: Conversation = {
        id: `conv-${Date.now()}`,
        title: localInput.slice(0, 30) + (localInput.length > 30 ? "..." : ""),
        messages: [],
        createdAt: Date.now(),
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
    }

    sendMessage({ text: localInput });
    setLocalInput("");
  };

  const copyMessage = (message: UIMessage) => {
    const textContent = message.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("");
    navigator.clipboard.writeText(textContent);
    toast.success("Copied to clipboard");
  };

  const startEdit = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (message) {
      const textContent = message.parts
        .filter((p) => p.type === "text")
        .map((p) => p.text)
        .join(" ");
      setEditingMessageId(messageId);
      setEditContent(textContent);
    }
  };

  const saveEdit = () => {
    if (!editingMessageId) return;
    // Note: Editing messages requires custom implementation
    // For now, we'll just clear the edit state
    setEditingMessageId(null);
    setEditContent("");
    toast.success("Message editing will be available soon");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar - ChatGPT style with toggle button */}
      <div
        className={cn(
          "flex flex-col border-r border-slate-200 bg-white shadow-sm transition-all duration-300 ease-in-out",
          isSidebarExpanded ? "w-72" : "w-20"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header with toggle button */}
          <div className="flex items-center justify-between p-3 border-b border-slate-200">
            {isSidebarExpanded ? (
              <h2 className="text-sm font-semibold text-slate-700">Conversations</h2>
            ) : (
              <div className="w-full" />
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className="h-8 w-8 shrink-0 hover:bg-amber-50"
            >
              {isSidebarExpanded ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              )}
            </Button>
          </div>
          {/* New Chat Button */}
          <div className="p-3 border-b border-slate-200">
            <Button
              onClick={createNewConversation}
              size="sm"
              className={cn(
                "w-full gap-3 bg-white hover:bg-amber-50 text-slate-700 border border-slate-200 hover:border-amber-300 transition-all",
                isSidebarExpanded ? "justify-start" : "justify-center px-0"
              )}
            >
              <Plus className="h-4 w-4 shrink-0" />
              {isSidebarExpanded && <span className="text-sm">New chat</span>}
            </Button>
          </div>

          {/* Navigation Items */}
          <div className="px-3 py-2 border-b border-slate-200 space-y-1">
            <button
              onClick={() => router.push("/leads")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                "hover:bg-amber-50 text-slate-700 hover:text-amber-900",
                !isSidebarExpanded && "justify-center px-0"
              )}
            >
              <Users className="h-4 w-4 shrink-0" />
              {isSidebarExpanded && <span>All Leads</span>}
            </button>
            <button
              onClick={() => router.push("/leads/lists")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                "hover:bg-amber-50 text-slate-700 hover:text-amber-900",
                !isSidebarExpanded && "justify-center px-0"
              )}
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {isSidebarExpanded && <span>Lead Lists</span>}
            </button>
            <button
              onClick={() => router.push("/email/campaigns")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                "hover:bg-amber-50 text-slate-700 hover:text-amber-900",
                !isSidebarExpanded && "justify-center px-0"
              )}
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {isSidebarExpanded && <span>Email Campaigns</span>}
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "group/item relative rounded-lg transition-all",
                  activeConvId === conv.id
                    ? "bg-amber-50 border border-amber-200 shadow-sm"
                    : "hover:bg-slate-50 border border-transparent"
                )}
              >
                {renamingConvId === conv.id ? (
                  <div className="px-3 py-2.5">
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRenameConversation();
                        if (e.key === "Escape") cancelRenameConversation();
                      }}
                      className="w-full px-2 py-1 text-sm border border-amber-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex gap-1 mt-1">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          saveRenameConversation();
                        }}
                        className="h-6 px-2 text-xs bg-amber-500 hover:bg-amber-600"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelRenameConversation();
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setActiveConvId(conv.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors min-w-0",
                        activeConvId === conv.id ? "text-amber-900 font-medium" : "text-slate-700"
                      )}
                    >
                      {!isSidebarExpanded ? (
                        <div className="w-full flex justify-center">
                          <div className="h-2 w-2 rounded-full bg-amber-500" />
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0">
                          <span className="block truncate leading-snug">{conv.title}</span>
                          <span className="text-xs text-slate-500 mt-0.5 block">
                            {new Date(conv.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                    </button>
                    {isSidebarExpanded && (
                      <div className="absolute top-1 right-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-slate-500 hover:text-slate-900 bg-white/80 backdrop-blur-sm hover:bg-white"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                startRenameConversation(conv.id);
                              }}
                            >
                              <Edit3 className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                deleteConversation(conv.id);
                              }}
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* AI Usage Stats Section */}
          {isSidebarExpanded && usageStats && (
            <div className="border-t border-slate-200 px-3 py-3">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-200/50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-amber-900 flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    AI Usage
                  </h3>
                  <select
                    value={usagePeriod}
                    onChange={(e) => setUsagePeriod(e.target.value as "24h" | "7d" | "30d")}
                    className="text-xs border border-amber-200 rounded px-1.5 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                  >
                    <option value="24h">24h</option>
                    <option value="7d">7d</option>
                    <option value="30d">30d</option>
                  </select>
                </div>
                
                {loadingStats ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-amber-900">
                        ${usageStats.estimatedCost}
                      </span>
                      <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        Est. cost
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/60 rounded p-2">
                        <div className="flex items-center gap-1 text-slate-600 mb-1">
                          <Zap className="h-3 w-3" />
                          <span>Tokens</span>
                        </div>
                        <div className="font-semibold text-slate-900">
                          {usageStats.totalTokens.toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="bg-white/60 rounded p-2">
                        <div className="flex items-center gap-1 text-slate-600 mb-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>Calls</span>
                        </div>
                        <div className="font-semibold text-slate-900">
                          {usageStats.totalCalls}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-amber-700 pt-1 border-t border-amber-200">
                      <div className="flex justify-between">
                        <span>Avg/call:</span>
                        <span className="font-medium">${usageStats.costPerCall}</span>
                      </div>
                      <div className="flex justify-between mt-0.5">
                        <span>Success rate:</span>
                        <span className="font-medium">
                          {usageStats.totalCalls > 0
                            ? Math.round((usageStats.successCalls / usageStats.totalCalls) * 100)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom Section - Settings and User */}
          <div className="border-t border-slate-200">
            <div className="px-3 py-2 space-y-1">
              <button
                onClick={() => router.push("/dashboard")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  "hover:bg-amber-50 text-slate-700 hover:text-amber-900",
                  !isSidebarExpanded && "justify-center px-0"
                )}
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                {isSidebarExpanded && <span>Dashboard</span>}
              </button>
              <button
                onClick={() => router.push("/settings")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  "hover:bg-amber-50 text-slate-700 hover:text-amber-900",
                  !isSidebarExpanded && "justify-center px-0"
                )}
              >
                <Settings className="h-4 w-4 shrink-0" />
                {isSidebarExpanded && <span>Settings</span>}
              </button>
            </div>
            
            {/* User Info */}
            {user.name && (
              <div className="border-t border-slate-200 p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    {user.image && <AvatarImage src={user.image} alt={user.name || ""} />}
                    <AvatarFallback className="bg-amber-100 text-amber-700">
                      {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {isSidebarExpanded && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <div ref={scrollRef} className="h-full overflow-y-auto">
            <div className="mx-auto max-w-3xl px-4 py-8">
              {messages.length === 0 ? (
                <EmptyState onExampleClick={(text) => {
                  setLocalInput(text);
                  setTimeout(() => {
                    sendMessage({ text });
                    setLocalInput("");
                  }, 100);
                }} />
              ) : (
                <div className="space-y-6">
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isEditing={editingMessageId === message.id}
                      editContent={editContent}
                      onEditChange={setEditContent}
                      onSaveEdit={saveEdit}
                      onCancelEdit={() => setEditingMessageId(null)}
                      onCopy={() => copyMessage(message)}
                      onEdit={() => startEdit(message.id)}
                    />
                  ))}
                </div>
              )}

              {/* Big Transparent Loading Overlay - Only show when loading */}
              {isLoading && (
                <div className="fixed inset-0 bg-black/5 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 max-w-md mx-4 border border-amber-200/50">
                    <div className="flex flex-col items-center gap-6">
                      {/* Animated spinner */}
                      <div className="relative w-20 h-20">
                        <div className="absolute inset-0 border-4 border-amber-200 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="h-8 w-8 text-amber-500 animate-pulse" />
                        </div>
                      </div>
                      
                      {/* Thinking steps */}
                      <div className="w-full space-y-3">
                        {thinkingSteps.map((step, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-sm">
                            <div className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300",
                              step.status === "complete" && "bg-green-500",
                              step.status === "active" && "bg-amber-500 animate-pulse",
                              step.status === "pending" && "bg-slate-200"
                            )}>
                              {step.status === "complete" && (
                                <CheckCircle2 className="h-3 w-3 text-white" />
                              )}
                              {step.status === "active" && (
                                <Loader2 className="h-3 w-3 text-white animate-spin" />
                              )}
                            </div>
                            <span className={cn(
                              "font-medium transition-colors",
                              step.status === "complete" && "text-green-700",
                              step.status === "active" && "text-amber-900",
                              step.status === "pending" && "text-slate-400"
                            )}>
                              {step.label}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Stop button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={stop}
                        className="mt-2 border-amber-300 hover:bg-amber-50"
                      >
                        Stop generating
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="mt-6 rounded-lg border border-red-200 bg-red-50/50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-red-900">An error occurred. Please try again.</span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        const lastUserMessage = messages.filter(m => m.role === "user").pop();
                        if (lastUserMessage) {
                          const textContent = lastUserMessage.parts
                            .filter((p) => p.type === "text")
                            .map((p) => p.text)
                            .join("");
                          sendMessage({ text: textContent });
                        }
                      }} 
                      className="border-red-300 text-red-700 hover:bg-red-100"
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Input Area - ChatGPT style */}
        <div className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-3xl px-4 py-4">
            <form onSubmit={handleSubmit} className="relative">
              <div className="relative flex items-end rounded-2xl border border-slate-300 bg-white shadow-sm transition-all duration-200 focus-within:border-amber-400 focus-within:shadow-lg focus-within:ring-2 focus-within:ring-amber-100">
                <Textarea
                  ref={textareaRef}
                  rows={1}
                  value={localInput}
                  onChange={(e) => setLocalInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message AI Assistant..."
                  disabled={isLoading}
                  className="min-h-[52px] max-h-[200px] w-full resize-none border-0 bg-transparent py-3 pl-4 pr-12 text-base focus-visible:ring-0 focus-visible:outline-none"
                />
                <Button
                  type="submit"
                  disabled={!localInput.trim() || isLoading}
                  size="icon"
                  className="absolute bottom-2 right-2 h-8 w-8 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:opacity-50 text-white shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
            <p className="mt-2 text-center text-xs text-slate-500">
              {isLoading ? (
                <button onClick={stop} className="font-medium hover:underline text-amber-600">
                  Stop generating
                </button>
              ) : (
                "AI can make mistakes. Check important info."
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: UIMessage;
  isEditing: boolean;
  editContent: string;
  onEditChange: (val: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onCopy: (message: UIMessage) => void;
  onEdit: () => void;
}

function MessageBubble({
  message,
  isEditing,
  editContent,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onCopy,
  onEdit,
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (isEditing && isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%]">
          <Textarea
            value={editContent}
            onChange={(e) => onEditChange(e.target.value)}
            className="mb-2 w-full rounded-lg border border-slate-300 focus:border-amber-400"
            rows={3}
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" onClick={onSaveEdit} className="bg-amber-500 hover:bg-amber-600 text-white">
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={onCancelEdit} className="border-slate-300">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
        isUser 
          ? "bg-amber-500 text-white ml-auto" 
          : "bg-white border border-slate-200 text-slate-900"
      )}>
        <div className={cn(
          "text-sm leading-relaxed",
          isUser ? "text-white" : "text-slate-900"
        )}>
          {!message.parts || message.parts.length === 0 ? (
            <div className="text-slate-400 italic">No content</div>
          ) : (
            message.parts.map((part, index) => {
              
              if (part.type === "text") {
                // Clean up the text to remove RocketReach mentions and format nicely
                let cleanText = part.text
                  .replace(/RocketReach/gi, "our database")
                  .replace(/rocket reach/gi, "our database");
                
                // Parse markdown-style formatting
                const lines = cleanText.split('\n');
                return (
                  <div key={index} className="space-y-2">
                    {lines.map((line, lineIdx) => {
                      // Bold text
                      if (line.includes('**')) {
                        const parts = line.split('**');
                        return (
                          <p key={lineIdx}>
                            {parts.map((p, i) => 
                              i % 2 === 1 ? <strong key={i} className="font-semibold text-slate-900">{p}</strong> : <span key={i}>{p}</span>
                            )}
                          </p>
                        );
                      }
                      // List items
                      if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
                        return (
                          <li key={lineIdx} className="ml-4">
                            {line.replace(/^[-•]\s*/, '')}
                          </li>
                        );
                      }
                      // Regular text
                      return line.trim() ? <p key={lineIdx}>{line}</p> : <br key={lineIdx} />;
                    })}
                  </div>
                );
              }
              
              // Handle tool calls - show beautiful results
              if (part.type.startsWith("tool-")) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const toolPart = part as any;
                
                // For search results, show beautiful lead cards
                if (toolPart.toolName === "searchRocketReach" && toolPart.output?.leads) {
                  return (
                    <div key={index} className="mt-3 space-y-2">
                      <div className="text-sm font-medium text-slate-700 mb-2">
                        Found {toolPart.output.leads.length} lead(s):
                      </div>
                      {toolPart.output.leads.slice(0, 5).map((lead: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-white hover:shadow-sm transition-shadow">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white font-semibold">
                              {lead.fullName?.charAt(0) || lead.firstName?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-slate-900">{lead.fullName || 'Unknown'}</h4>
                              <p className="text-sm text-slate-600">{lead.title || 'No title'}</p>
                              {lead.company && <p className="text-sm text-slate-500">{lead.company}</p>}
                              <div className="flex items-center gap-2 mt-1">
                                {lead.location && (
                                  <span className="text-xs text-slate-400">📍 {lead.location}</span>
                                )}
                                {lead.linkedinUrl && (
                                  <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                    LinkedIn →
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {toolPart.output.leads.length > 5 && (
                        <p className="text-xs text-slate-500 italic">
                          ...and {toolPart.output.leads.length - 5} more
                        </p>
                      )}
                    </div>
                  );
                }
                
                // For enriched data, show contact details
                if (toolPart.toolName === "lookupRocketReachProfile" && toolPart.output?.lead) {
                  const lead = toolPart.output.lead;
                  return (
                    <div key={index} className="mt-3 p-4 rounded-lg border border-green-200 bg-green-50/50">
                      <div className="text-sm font-medium text-green-900 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Contact details found
                      </div>
                      <div className="space-y-2 text-sm">
                        {lead.email && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Email:</span>
                            <span className="font-medium text-slate-900">{lead.email}</span>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Phone:</span>
                            <span className="font-medium text-slate-900">{lead.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                
                // For saveLeads, show success message
                if (toolPart.toolName === "saveLeads" && toolPart.output?.saved) {
                  return (
                    <div key={index} className="mt-3 p-3 rounded-lg border border-blue-200 bg-blue-50/50 text-sm">
                      <div className="flex items-center gap-2 text-blue-900">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Saved {toolPart.output.saved} lead(s) to your database</span>
                      </div>
                    </div>
                  );
                }
                
                // Default tool display
                return null;
              }
              
              return null;
            })
          )}
        </div>
        
        {/* Action Buttons */}
        {!isUser && (
          <div className="mt-2 flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopy(message)}
              className="h-7 px-2 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onExampleClick }: { onExampleClick: (text: string) => void }) {
  const examples = [
    "Find 10 CTOs at Series B SaaS companies in San Francisco",
    "Lookup the contact details for john@acme.com",
    "Search for VPs of Marketing in fintech startups",
    "Draft a cold email to a Head of Sales",
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg">
        <Sparkles className="h-8 w-8 text-white" />
      </div>

      <h2 className="mb-2 text-3xl font-semibold text-slate-900">How can I help you today?</h2>

      <p className="mb-8 max-w-md text-slate-600">
        Ask me anything about finding leads, looking up contacts, or drafting outreach.
      </p>

      <div className="w-full max-w-2xl space-y-2">
        {examples.map((example, idx) => (
          <button
            key={idx}
            onClick={() => onExampleClick(example)}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 shadow-sm hover:border-amber-300 hover:bg-amber-50/50 transition-colors"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
