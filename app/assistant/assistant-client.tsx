"use client";

import { useEffect, useRef, useState } from "react";
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
import { DefaultChatTransport, UIMessage } from "ai";
import Link from "next/link";
import { MessageBubble } from "@/components/c/message-bubble";
import { EmptyState } from "@/components/c/empty-state";
import { LoadingOverlay } from "@/components/c/loading-overlay";

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

  // Use the latest useChat hook with proper absolute URL for production
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
      api: typeof window !== 'undefined' && window.location.origin 
        ? `${window.location.origin}/api/assistant/stream`
        : "/api/assistant/stream",
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
        // Get the current conversation
        const currentConv = conversations.find((c) => c.id === activeConvId);
        
        if (currentConv) {
          // Include the new assistant message in the updated messages
          const updatedMessages = [...messages, message];
          
          const updatedConv = { 
            ...currentConv, 
            messages: updatedMessages,
            metadata: {
              ...currentConv.metadata,
              lastUpdated: new Date().toISOString(),
            }
          };
          
          console.log('[onFinish] Saving to MongoDB:', {
            convId: activeConvId,
            messageCount: updatedMessages.length,
          });
          
          // Save to MongoDB immediately
          saveConversation(updatedConv);
          
          // Update local state
          setConversations((prev) =>
            prev.map((c) => (c.id === activeConvId ? updatedConv : c))
          );
        }
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

  // Load messages when switching conversations - fetch from MongoDB
  useEffect(() => {
    const loadConversationMessages = async () => {
      if (activeConvId && activeConv) {
        console.log('[Conversation Switch] Fetching messages from MongoDB:', {
          convId: activeConv.id,
        });
        
        try {
          // Fetch full conversation data from MongoDB with all messages
          const res = await fetch(`/api/assistant/conversations?id=${activeConvId}`);
          if (res.ok) {
            const fullConversation = await res.json();
            console.log('[Conversation Switch] Loaded from DB:', {
              messageCount: fullConversation.messages?.length || 0,
            });
            setMessages(fullConversation.messages || []);
          } else {
            // Fallback to cached data if API fails
            console.warn('[Conversation Switch] API failed, using cached data');
            setMessages(activeConv.messages || []);
          }
        } catch (error) {
          console.error('[Conversation Switch] Error loading messages:', error);
          // Fallback to cached data
          setMessages(activeConv.messages || []);
        }
      } else if (!activeConvId) {
        setMessages([]);
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
    try {
      const res = await fetch('/api/assistant/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        if (data.length > 0 && !activeConvId) {
          setActiveConvId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  // Save conversation to MongoDB
  const saveConversation = async (conversation: Conversation) => {
    try {
      await fetch('/api/assistant/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: conversation.id,
          title: conversation.title,
          messages: conversation.messages,
          metadata: conversation.metadata,
        }),
      });
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  // Load usage stats on mount and when period changes
  useEffect(() => {
    fetchUsageStats(usagePeriod);
  }, [usagePeriod]);

  const createNewConversation = async () => {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: "New chat",
      messages: [],
      createdAt: Date.now(),
    };
    
    // Save to MongoDB
    try {
      await fetch('/api/assistant/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConv),
      });
      
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      setLocalInput("");
      setMessages([]);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to create new chat');
    }
  };

  const deleteConversation = async (id: string) => {
    toast.info('Delete conversation?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            const res = await fetch(`/api/assistant/conversations?id=${id}`, {
              method: 'DELETE',
            });
            
            if (res.ok) {
              setConversations((prev) => prev.filter((c) => c.id !== id));
              if (activeConvId === id) {
                const remaining = conversations.filter((c) => c.id !== id);
                setActiveConvId(remaining[0]?.id || null);
                setMessages([]);
              }
              toast.success("Conversation deleted");
            } else {
              toast.error('Failed to delete conversation');
            }
          } catch (error) {
            console.error('Error deleting conversation:', error);
            toast.error('Failed to delete conversation');
          }
        },
      },
      cancel: {
        label: 'Cancel',
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
      await fetch('/api/assistant/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: renamingConvId,
          title: renameValue.trim(),
        }),
      });
      
      setConversations((prev) =>
        prev.map((c) => (c.id === renamingConvId ? { ...c, title: renameValue.trim() } : c))
      );
      setRenamingConvId(null);
    } catch (error) {
      console.error('Error renaming conversation:', error);
      toast.error('Failed to rename conversation');
    }
    setRenameValue("");
    toast.success("Conversation renamed");
  };

  const cancelRenameConversation = () => {
    setRenamingConvId(null);
    setRenameValue("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!localInput.trim() || isLoading) return;

    const input = localInput.trim();

    // Create conversation if none exists
    if (!activeConvId) {
      const lowerInput = input.toLowerCase();
      
      // Generate smart title based on keywords
      let title = "";
      if (lowerInput.includes("find") || lowerInput.includes("search") || lowerInput.includes("get")) {
        title = "🔍 " + input.slice(0, 30) + (input.length > 30 ? "..." : "");
      } else if (lowerInput.includes("email") || lowerInput.includes("send") || lowerInput.includes("message")) {
        title = "✉️ " + input.slice(0, 30) + (input.length > 30 ? "..." : "");
      } else if (lowerInput.includes("ceo") || lowerInput.includes("founder") || lowerInput.includes("executive")) {
        title = "👤 " + input.slice(0, 30) + (input.length > 30 ? "..." : "");
      } else {
        title = input.slice(0, 35) + (input.length > 35 ? "..." : "");
      }
      
      const newConv: Conversation = {
        id: `conv-${Date.now()}`,
        title,
        messages: [],
        createdAt: Date.now(),
      };
      
      // Save to MongoDB
      try {
        await fetch('/api/assistant/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newConv),
        });
        
        setConversations((prev) => [newConv, ...prev]);
        setActiveConvId(newConv.id);
      } catch (error) {
        console.error('Error creating conversation:', error);
        toast.error('Failed to create conversation');
        return;
      }
    } else {
      // Update title if this is the first message in a "New chat"
      const activeConv = conversations.find((c) => c.id === activeConvId);
      if (activeConv && activeConv.title === "New chat" && messages.length === 0) {
        const lowerInput = input.toLowerCase();
        let newTitle = "";
        
        if (lowerInput.includes("find") || lowerInput.includes("search") || lowerInput.includes("get")) {
          newTitle = "🔍 " + input.slice(0, 30) + (input.length > 30 ? "..." : "");
        } else if (lowerInput.includes("email") || lowerInput.includes("send") || lowerInput.includes("message")) {
          newTitle = "✉️ " + input.slice(0, 30) + (input.length > 30 ? "..." : "");
        } else if (lowerInput.includes("ceo") || lowerInput.includes("founder") || lowerInput.includes("executive")) {
          newTitle = "👤 " + input.slice(0, 30) + (input.length > 30 ? "..." : "");
        } else {
          newTitle = input.slice(0, 35) + (input.length > 35 ? "..." : "");
        }
        
        // Save to MongoDB immediately
        try {
          await fetch('/api/assistant/conversations', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: activeConvId,
              title: newTitle,
            }),
          });
          
          setConversations((prev) => {
            const updated = prev.map((c) => 
              c.id === activeConvId ? { ...c, title: newTitle } : c
            );
            return updated;
          });
          
          console.log('[Title Updated]', { conversationId: activeConvId, newTitle });
        } catch (error) {
          console.error('Error updating title:', error);
        }
      }
    }

    // Send the message
    sendMessage({ text: localInput });
    setLocalInput("");
    
    // Save user message to MongoDB after a short delay (to ensure it's in messages state)
    setTimeout(() => {
      if (activeConvId) {
        const currentConv = conversations.find((c) => c.id === activeConvId);
        if (currentConv) {
          console.log('[User Message] Saving to MongoDB:', {
            convId: activeConvId,
            messageCount: messages.length,
          });
          saveConversation({
            ...currentConv,
            messages: messages,
          });
        }
      }
    }, 500);
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
      {/* Sidebar - Clean minimal design */}
      <div
        className={cn(
          "flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out",
          isSidebarExpanded ? "w-64" : "w-16"
        )}
      >
        <div className="flex h-full flex-col">
          {/* New Chat Button */}
          <div className="p-3 border-b border-slate-200">
            <Button
              onClick={createNewConversation}
              size="sm"
              className={cn(
                "w-1/2 gap-2 bg-slate-500 hover:bg-slate-600 text-white transition-all",
                isSidebarExpanded ? "justify-start px-3" : "justify-center px-2"
              )}
            >
              <Plus className="h-4 w-4 shrink-0" />
              {isSidebarExpanded && <span className="text-sm font-medium">New Chat</span>}
            </Button>
          </div>

          {/* Conversations List - Always visible, no collapsible */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full px-3 py-2">
                <div className="space-y-1.5 pb-2">
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
                      <div className="absolute top-1 right-1 opacity-50 hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
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
            </ScrollArea>
          </div>

          {/* AI Usage Stats - Minimal compact version */}
          {isSidebarExpanded && usageStats && (
            <div className="border-t border-slate-200 p-3">
              <div className="bg-linear-to-br from-amber-50 to-orange-50 rounded-lg p-2.5 border border-amber-200/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-amber-600" />
                    <span className="text-xs font-medium text-slate-700">AI Usage</span>
                  </div>
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
                    <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-amber-900">
                      ${usageStats.estimatedCost}
                    </span>
                    <span className="text-xs text-slate-600">
                      {usageStats.totalCalls} calls
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom Section - User and Expand Button */}
          <div className="border-t border-slate-200">
            {/* User Info */}
            {user.name && (
              <div className="p-3 flex items-center justify-between gap-2">
                {isSidebarExpanded ? (
                  <>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Avatar className="h-8 w-8 shrink-0">
                        {user.image && <AvatarImage src={user.image} alt={user.name || ""} />}
                        <AvatarFallback className="bg-amber-100 text-amber-700 text-sm">
                          {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-700 truncate">{user.name}</p>
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
                    {user.image && <AvatarImage src={user.image} alt={user.name || ""} />}
                    <AvatarFallback className="bg-amber-100 text-amber-700 text-sm">
                      {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
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
      <div className="flex flex-1 flex-col min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <div ref={scrollRef} className="h-full overflow-y-auto">
            <div className="mx-auto max-w-4xl px-6 py-6">
              {messages.length === 0 ? (
                <EmptyState onExampleClick={(text) => {
                  setLocalInput(text);
                  setTimeout(() => {
                    sendMessage({ text });
                    setLocalInput("");
                  }, 100);
                }} />
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    // Add safety check for message structure
                    if (!message || !message.id) {
                      console.warn('[Message Render] Invalid message:', message);
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

              <LoadingOverlay isLoading={isLoading} thinkingSteps={thinkingSteps} onStop={stop} />

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

        {/* Input Area - Classic Clean */}
                  <div className="mx-auto rounded-full max-w-4xl px-6 py-4">
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                rows={1}
                value={localInput}
                onChange={(e) => setLocalInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Find 10 CTO of Tech Startups in San Francisco..."
                disabled={isLoading}
                
                
              />
              <Button
                type="submit"
                disabled={!localInput.trim() || isLoading}
                size="icon"
                className="h-11 w-11 shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
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
  );
}