"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Edit3,
  Loader2,
  MoreVertical,
  Plus,
  Send,
  Settings,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@ai-sdk/react";
import { UIMessage } from "ai";
import Link from "next/link";
import { MessageBubble } from "@/components/c/message-bubble";
import { EmptyState } from "@/components/c/empty-state";
import { LoadingOverlay } from "@/components/c/loading-overlay";
import { fetchWithRetry } from "@/lib/fetch-with-retry";

interface ChatClientProps {
  conversationId: string | null;
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
  metadata?: {
    totalTokens?: number;
    totalCost?: number;
    toolsUsed?: string[];
  };
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
  const hasSearch = toolParts.some(
    (p) => p.type.includes("searchRocketReach") || p.type.includes("search"),
  );
  const hasLookup = toolParts.some(
    (p) => p.type.includes("lookupRocketReach") || p.type.includes("lookup"),
  );
  const hasEmail = toolParts.some(
    (p) => p.type.includes("sendEmail") || p.type.includes("email"),
  );
  const hasWhatsApp = toolParts.some(
    (p) => p.type.includes("sendWhatsApp") || p.type.includes("whatsapp"),
  );

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

export function ChatClient({ conversationId, user }: ChatClientProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(
    conversationId,
  );
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [renamingConvId, setRenamingConvId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [usagePeriod, setUsagePeriod] = useState<"24h" | "7d" | "30d">("30d");
  const [loadingStats, setLoadingStats] = useState(false);
  // Track conversation switching for loading overlay
  const [isSwitchingConversation, setIsSwitchingConversation] = useState(false);
  const [isConversationsLoading, setIsConversationsLoading] = useState(true);

  // Local input state for the textarea
  const [localInput, setLocalInput] = useState("");

  // Store activeConvId in cookie so API route can access it
  useEffect(() => {
    if (activeConvId) {
      document.cookie = `active-conversation-id=${activeConvId}; path=/; max-age=3600; SameSite=Lax`;
    } else {
      document.cookie = `active-conversation-id=; path=/; max-age=0; SameSite=Lax`;
    }
  }, [activeConvId]);

  // Use useChat hook - automatically POSTs to /api/chat with messages array
  const { messages, sendMessage, status, stop, error, setMessages } = useChat({
    id: activeConvId || undefined,
    onFinish: async ({ messages: allMessages }) => {
      console.log("[onFinish] AI response complete:", {
        messageCount: allMessages.length,
        lastMessageRole: allMessages[allMessages.length - 1]?.role,
        conversationId: activeConvId,
      });

      if (activeConvId) {
        // Format messages with proper structure for MongoDB
        const formattedMessages = allMessages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.parts?.find((p) => "text" in p)?.text || "",
          parts: msg.parts || [],
          createdAt: new Date(),
        }));

        console.log("[onFinish] Saving complete conversation to MongoDB:", {
          convId: activeConvId,
          messageCount: formattedMessages.length,
          messages: formattedMessages.map((m) => ({
            role: m.role,
            contentLength: m.content.length,
          })),
        });

        // Save complete conversation to MongoDB
        try {
          const response = await fetch("/api/assistant/conversations", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: activeConvId,
              messages: formattedMessages,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to save: ${response.status}`);
          }

          console.log("[onFinish] ✓ Saved to MongoDB successfully");

          // Reload conversations to update sidebar with latest data (title, message count)
          await fetchConversations();

          // Update local state to reflect what's in DB
          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeConvId ? { ...c, messages: formattedMessages } : c,
            ),
          );
        } catch (error) {
          console.error("[onFinish] ✗ Failed to save:", error);
        }
      }
      setThinkingSteps([]);
    },
    onError: (error) => {
      console.error("Chat error:", error);
      const errorMessage =
        error?.message || "An error occurred while processing your request";

      // Show user-friendly error messages
      if (
        errorMessage.includes("Failed to parse URL") ||
        errorMessage.includes("/responses")
      ) {
        // Soft warning: the AI response likely still completed and was saved,
        // so avoid scaring the user with a hard error.
        toast.info(
          "The response was generated, but there was a minor connection issue.",
        );
      } else if (
        errorMessage.includes("Unauthorized") ||
        errorMessage.includes("401")
      ) {
        toast.error("Session expired. Please sign in again.");
        setTimeout(() => (window.location.href = "/api/auth/signin"), 2000);
      } else if (
        errorMessage.includes("rate limit") ||
        errorMessage.includes("429")
      ) {
        toast.error("Too many requests. Please wait a moment and try again.");
      } else {
        toast.error(errorMessage);
      }

      setThinkingSteps([]);
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Debug logging
  useEffect(() => {
    console.log(
      "[useChat] Status:",
      status,
      "Messages:",
      messages.length,
      "Loading:",
      isLoading,
    );
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      console.log("[useChat] Last message:", {
        id: lastMsg.id,
        role: lastMsg.role,
        partCount: lastMsg.parts?.length || 0,
        partTypes: lastMsg.parts?.map((p) => p.type) || [],
      });
    }
    // Only log on status change, not every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  // Load messages when switching conversations - fetch from MongoDB
  useEffect(() => {
    const loadConversationMessages = async () => {
      if (activeConvId) {
        console.log("[Conversation Switch] Fetching messages from MongoDB:", {
          convId: activeConvId,
        });

        setIsSwitchingConversation(true);

        try {
          // Fetch full conversation data from MongoDB with all messages
          const res = await fetchWithRetry(
            `/api/assistant/conversations?id=${activeConvId}`,
            {
              maxRetries: 2,
              baseDelay: 500,
            },
          );
          if (res.ok) {
            const fullConversation = await res.json();
            console.log("[Conversation Switch] Loaded from DB:", {
              messageCount: fullConversation.messages?.length || 0,
              title: fullConversation.title,
              messages: fullConversation.messages,
            });

            // Ensure messages have the correct structure for AI SDK
            const formattedMessages = (fullConversation.messages || []).map(
              (msg: UIMessage) => ({
                ...msg,
                // Ensure parts array exists - UI SDK needs parts not content
                parts:
                  msg.parts && msg.parts.length > 0
                    ? msg.parts
                    : [{ type: "text", text: "" }],
              }),
            );

            setMessages(formattedMessages);

            // Update conversations list if this conversation isn't in it yet
            setConversations((prev) => {
              const exists = prev.find((c) => c.id === activeConvId);
              if (!exists) {
                return [
                  { ...fullConversation, messages: formattedMessages },
                  ...prev,
                ];
              }
              return prev.map((c) =>
                c.id === activeConvId
                  ? { ...fullConversation, messages: formattedMessages }
                  : c,
              );
            });
          } else {
            // Fallback to cached data if API fails
            console.warn("[Conversation Switch] API failed");
            if (activeConv) {
              setMessages(activeConv.messages || []);
            }
          }
        } catch (error) {
          console.error("[Conversation Switch] Error loading messages:", error);
          // Fallback to cached data
          if (activeConv) {
            setMessages(activeConv.messages || []);
          }
        } finally {
          setIsSwitchingConversation(false);
        }
      } else {
        // No active conversation - clear messages
        setMessages([]);
        setIsSwitchingConversation(false);
      }
    };

    loadConversationMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId]);

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

  // Auto-resize textarea with debounce to prevent layout thrashing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
      }
    }, 10);
    return () => clearTimeout(timeoutId);
  }, [localInput]);

  // Sync conversationId prop with activeConvId state when URL changes
  useEffect(() => {
    console.log(
      "[URL Change] conversationId prop changed:",
      conversationId,
      "activeConvId:",
      activeConvId,
    );

    if (conversationId !== activeConvId) {
      setActiveConvId(conversationId);
      // Clear messages to show loading state when switching conversations
      if (conversationId) {
        setMessages([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Show dynamic thinking steps when loading
  useEffect(() => {
    if (isLoading) {
      const lastMsg =
        messages.length > 0 ? messages[messages.length - 1] : undefined;
      const dynamicSteps = getThinkingSteps(lastMsg);

      setThinkingSteps(
        dynamicSteps.map((step, idx) => ({
          label: step.label,
          status: idx === 0 ? "active" : "pending",
        })),
      );

      let stepIdx = 0;
      const stepInterval = setInterval(() => {
        stepIdx++;
        if (stepIdx < dynamicSteps.length) {
          setThinkingSteps((steps) =>
            steps.map((step, idx) => ({
              ...step,
              status:
                idx < stepIdx
                  ? "complete"
                  : idx === stepIdx
                    ? "active"
                    : "pending",
            })),
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

  // Load conversations from MongoDB on mount
  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Conversations are now auto-saved to MongoDB via API calls

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

  // Fetch conversations from MongoDB
  const fetchConversations = async () => {
    setIsConversationsLoading(true);
    try {
      const res = await fetch("/api/assistant/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        if (data.length > 0 && !activeConvId) {
          setActiveConvId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsConversationsLoading(false);
    }
  };

  // Save conversation to MongoDB
  // Load usage stats on mount and when period changes
  useEffect(() => {
    fetchUsageStats(usagePeriod);
  }, [usagePeriod]);

  const createNewConversation = () => {
    // Redirect to API route that creates conversation in MongoDB first
    window.location.href = "/api/assistant/new-conversation";
  };

  const deleteConversation = async (id: string) => {
    toast.info("Delete conversation?", {
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            const res = await fetch(`/api/assistant/conversations?id=${id}`, {
              method: "DELETE",
            });

            if (res.ok) {
              const nextList = conversations.filter((c) => c.id !== id);
              setConversations(nextList);
              if (activeConvId === id) {
                // Navigate to first remaining conversation or new chat
                if (nextList.length > 0) {
                  router.push(`/c/${nextList[0].id}`);
                } else {
                  router.push("/c/new");
                }
              }
              toast.success("Conversation deleted");
            } else {
              toast.error("Failed to delete conversation");
            }
          } catch (error) {
            console.error("Error deleting conversation:", error);
            toast.error("Failed to delete conversation");
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  const startRenameConversation = (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      setRenamingConvId(id);
      setRenameValue(conv.title);
    }
  };

  const saveRenameConversation = async () => {
    if (!renamingConvId || !renameValue.trim()) {
      setRenamingConvId(null);
      return;
    }

    try {
      await fetch("/api/assistant/conversations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: renamingConvId,
          title: renameValue.trim(),
        }),
      });

      setConversations((prev) =>
        prev.map((c) =>
          c.id === renamingConvId ? { ...c, title: renameValue.trim() } : c,
        ),
      );
      setRenamingConvId(null);
    } catch (error) {
      console.error("Error renaming conversation:", error);
      toast.error("Failed to rename conversation");
    }
    setRenameValue("");
    toast.success("Conversation renamed");
  };

  const cancelRenameConversation = () => {
    setRenamingConvId(null);
    setRenameValue("");
  };

  // Helper function to generate smart title based on input
  const generateSmartTitle = (input: string): string => {
    const lowerInput = input.toLowerCase();

    // Remove common prefixes to make titles cleaner
    let cleanInput = input
      .replace(
        /^(find|search|get|show|list|give me|can you|please|i need|i want)/i,
        "",
      )
      .trim();

    if (!cleanInput) cleanInput = input; // Fallback if nothing left

    // Add emoji based on context
    if (
      lowerInput.includes("find") ||
      lowerInput.includes("search") ||
      lowerInput.includes("leads")
    ) {
      return (
        "🔍 " + cleanInput.slice(0, 40) + (cleanInput.length > 40 ? "..." : "")
      );
    } else if (
      lowerInput.includes("email") ||
      lowerInput.includes("send") ||
      lowerInput.includes("campaign")
    ) {
      return (
        "✉️ " + cleanInput.slice(0, 40) + (cleanInput.length > 40 ? "..." : "")
      );
    } else if (
      lowerInput.includes("cto") ||
      lowerInput.includes("ceo") ||
      lowerInput.includes("founder") ||
      lowerInput.includes("vp")
    ) {
      return (
        "👤 " + cleanInput.slice(0, 40) + (cleanInput.length > 40 ? "..." : "")
      );
    } else if (
      lowerInput.includes("export") ||
      lowerInput.includes("csv") ||
      lowerInput.includes("download")
    ) {
      return (
        "📊 " + cleanInput.slice(0, 40) + (cleanInput.length > 40 ? "..." : "")
      );
    } else {
      return cleanInput.slice(0, 45) + (cleanInput.length > 45 ? "..." : "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!localInput.trim() || isLoading) return;

    const input = localInput.trim();

    // Clear input immediately (optimistic UI)
    setLocalInput("");

    // If no active conversation, shouldn't happen as navbar creates one upfront
    // But redirect to new conversation as fallback
    if (!activeConvId) {
      window.location.href = "/api/assistant/new-conversation";
      return;
    }

    // Update title on first message if it's still "New chat"
    const activeConv = conversations.find((c) => c.id === activeConvId);
    if (
      activeConv &&
      activeConv.title === "New chat" &&
      messages.length === 0
    ) {
      const newTitle = generateSmartTitle(input);

      // Update UI immediately (optimistic)
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId ? { ...c, title: newTitle } : c,
        ),
      );

      // Update in MongoDB in background
      fetch("/api/assistant/conversations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeConvId,
          title: newTitle,
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to update title");
          console.log("[Title Updated in DB]", {
            conversationId: activeConvId,
            newTitle,
          });
        })
        .catch((error) => {
          console.error("Error updating title in DB:", error);
          // Non-critical - keep optimistic update
        });
    }

    // Send the message to AI - onFinish will save both user and assistant messages
    sendMessage({ text: input });
  };

  const copyMessage = (message: UIMessage) => {
    const textContent = message.parts
      .filter((p) => p.type === "text")
      .map((p) => ("text" in p ? p.text : "") || "")
      .join("");
    if (textContent) {
      navigator.clipboard.writeText(textContent);
      toast.success("Copied to clipboard");
    } else {
      toast.error("No text to copy");
    }
  };

  const startEdit = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (message) {
      const textContent = message.parts
        .filter((p) => p.type === "text")
        .map((p) => ("text" in p ? p.text : "") || "")
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
    <div className="flex h-screen bg-slate-700 dark:bg-slate-700">
      {/* Sidebar - Clean minimal design */}
      <div
        className={cn(
          "flex flex-col border-r border-slate-600 bg-slate-700 transition-all duration-300 ease-in-out",
          isSidebarExpanded ? "w-64" : "w-16",
        )}
      >
        <div className="flex h-full flex-col">
          {/* New Chat Button */}
          <div className="p-3 border-b border-slate-200">
            <Button
              onClick={createNewConversation}
              size="sm"
              className={cn(
                "w-full gap-2 bg-slate-500 hover:bg-slate-600 text-white transition-all",
                isSidebarExpanded
                  ? "justify-start px-3"
                  : "justify-center px-2",
              )}
            >
              <Plus className="h-4 w-4 shrink-0" />
              {isSidebarExpanded && (
                <span className="text-sm font-medium">New Chat</span>
              )}
            </Button>
          </div>

          {/* Conversations List - Always visible, no collapsible */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full px-3 py-2">
              <div className="space-y-1.5 pb-2">
                {isConversationsLoading ? (
                  <div className="space-y-1.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <div
                        key={`skeleton-${idx}`}
                        className="h-[60px] animate-pulse rounded-lg bg-slate-100"
                      />
                    ))}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center text-sm text-slate-500 py-6">
                    No conversations yet.
                  </div>
                ) : (
                  <>
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={cn(
                          "group/item relative rounded-lg transition-all",
                          activeConvId === conv.id
                            ? "bg-slate-50 border border-slate-200 shadow-sm"
                            : "hover:bg-slate-50 border border-transparent",
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
                                if (e.key === "Escape")
                                  cancelRenameConversation();
                              }}
                              className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-slate-400"
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
                                className="h-6 px-2 text-xs bg-slate-500 hover:bg-slate-600"
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
                              onClick={() => router.push(`/c/${conv.id}`)}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors min-w-0",
                                activeConvId === conv.id
                                  ? "text-slate-900 font-normal"
                                  : "text-slate-700",
                              )}
                            >
                              {!isSidebarExpanded ? (
                                <div className="w-full flex justify-center">
                                  <div className="h-2 w-2 rounded-full bg-slate-500" />
                                </div>
                              ) : (
                                <div className="flex-1 min-w-0">
                                  <span className="block truncate leading-snug">
                                    {conv.title}
                                  </span>
                                  <span className="text-xs text-slate-500 mt-0.5 block">
                                    {new Date(
                                      conv.createdAt,
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                </div>
                              )}
                            </button>
                            {isSidebarExpanded && (
                              <div className="absolute top-1 right-1 opacity-30 group-hover/item:opacity-100 transition-opacity">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                      }}
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-40"
                                  >
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
                  </>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* AI Usage Stats - Minimal compact version */}
          {/*{isSidebarExpanded && usageStats && (
            <div className="border-t border-slate-200 p-3">
              <div className="bg-linear-to-br from-slate-50 to-orange-50 rounded-lg p-2.5 border border-slate-200/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-slate-600" />
                    <span className="text-xs font-medium text-slate-700">
                      AI Usage
                    </span>
                  </div>
                  <select
                    value={usagePeriod}
                    onChange={(e) =>
                      setUsagePeriod(e.target.value as "24h" | "7d" | "30d")
                    }
                    className="text-xs border border-slate-200 rounded px-1.5 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="24h">24h</option>
                    <option value="7d">7d</option>
                    <option value="30d">30d</option>
                  </select>
                </div>
                {loadingStats ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-slate-900">
                      ${usageStats.estimatedCost}
                    </span>
                    <span className="text-xs text-slate-600">
                      {usageStats.totalCalls} calls
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}*/}

          {/* Bottom Section - User and Expand Button */}
          <div className="border-t border-slate-200">
            {/* User Info */}
            {user.name && (
              <div className="p-3 flex items-center justify-between gap-2">
                {isSidebarExpanded ? (
                  <>
                    <div className="flex  items-center gap-2 min-w-0 flex-1">
                      <Avatar className="h-8 w-8 shrink-0">
                        {user.image && (
                          <AvatarImage src={user.image} alt={user.name || ""} />
                        )}
                        <AvatarFallback className="bg-slate-700 dark:bg-slate-700 text-slate-700 text-sm">
                          {user.name?.charAt(0).toUpperCase() ||
                            user.email?.charAt(0).toUpperCase() ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-normal text-slate-700 truncate">
                          {user.name}
                        </p>
                      </div>
                      <Link
                        href="/settings"
                        className="shrink-0 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Settings className="h-4 w-4 text-slate-500" />
                      </Link>
                    </div>
                  </>
                ) : (
                  <Avatar className="h-8 w-8 mx-auto">
                    {user.image && (
                      <AvatarImage src={user.image} alt={user.name || ""} />
                    )}
                    <AvatarFallback className="bg-slate-100 text-slate-700 text-sm">
                      {user.name?.charAt(0).toUpperCase() ||
                        user.email?.charAt(0).toUpperCase() ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            )}

            {/* Expand/Collapse Button at Bottom */}
            <div className="border-t border-slate-200 p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                className="w-full hover:bg-slate-100 text-slate-600"
              >
                {isSidebarExpanded ? (
                  <>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    <span className="text-xs">Collapse</span>
                  </>
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0 relative bg-[#212121]">
        {/* Conversation Switching Overlay */}
        {isSwitchingConversation && (
          <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
              <span className="text-sm text-neutral-400">
                Loading conversation...
              </span>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <div ref={scrollRef} className="h-full overflow-y-auto">
            <div className="mx-auto max-w-3xl px-4 py-8">
              {messages.length === 0 ? (
                <EmptyState
                  onExampleClick={(text) => {
                    setLocalInput(text);
                    setTimeout(() => {
                      sendMessage({ text });
                      setLocalInput("");
                    }, 100);
                  }}
                />
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    // Add safety check for message structure
                    if (!message || !message.id) {
                      console.warn(
                        "[Message Render] Invalid message:",
                        message,
                      );
                      return null;
                    }

                    return (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isEditing={editingMessageId === message.id}
                        editContent={editContent}
                        onEditChange={setEditContent}
                        onSaveEdit={saveEdit}
                        onCancelEdit={() => setEditingMessageId(null)}
                        onCopy={() => copyMessage(message)}
                      />
                    );
                  })}
                </div>
              )}

              <LoadingOverlay
                isLoading={isLoading}
                thinkingSteps={thinkingSteps}
                onStop={stop}
              />

              {/* Error State - only show for real failures, not SDK /responses quirks */}
              {error &&
                !error.message?.includes("/responses") &&
                !error.message?.includes("Failed to parse URL") && (
                  <div className="mt-6 rounded-lg border border-red-200 bg-red-50/50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-red-900">
                        An error occurred. Please try again.
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const lastUserMessage = messages
                            .filter((m) => m.role === "user")
                            .pop();
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

        {/* Input Area - ChatGPT Style */}
        <div className="bg-[#212121] pb-6">
          <div className="mx-auto max-w-3xl px-4">
            <form onSubmit={handleSubmit} className="relative">
              <div className="flex items-center gap-2 bg-[#2f2f2f] rounded-full px-4 py-3 border border-neutral-700 focus-within:border-neutral-600 transition-colors">
                <button
                  type="button"
                  className="text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                </button>
                <Textarea
                  ref={textareaRef}
                  rows={1}
                  value={localInput}
                  onChange={(e) => setLocalInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything"
                  disabled={isLoading}
                  className="flex-1 bg-transparent border-0 text-white placeholder:text-neutral-400 resize-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none text-[15px] leading-relaxed min-h-6 max-h-[200px]"
                />
                <Button
                  type="submit"
                  disabled={!localInput.trim() || isLoading}
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full shrink-0 text-neutral-400 hover:text-white hover:bg-neutral-700"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </form>
            {isLoading && (
              <p className="mt-2 text-center text-xs text-neutral-500">
                <button onClick={stop} className="hover:underline">
                  Stop generating
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
