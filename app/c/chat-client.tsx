"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { useChat } from "@ai-sdk/react";
import { UIMessage } from "ai";
import { MessageBubble } from "@/components/c/message-bubble";
import { EmptyState } from "@/components/c/empty-state";
import { ChatSkeleton, ResponseLoadingSkeleton } from "@/components/c/chat-skeleton";
import { fetchWithRetry } from "@/lib/fetch-with-retry";
import { AppSidebarV2 } from "@/components/c/app-sidebar-v2";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

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



export function ChatClient({ conversationId, user }: ChatClientProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(
    conversationId,
  );
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  // Track conversation switching for loading overlay
  const [isSwitchingConversation, setIsSwitchingConversation] = useState(false);
  const [isConversationsLoading, setIsConversationsLoading] = useState(true);
  const [shouldRefreshConversations, setShouldRefreshConversations] = useState(false);

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

          // Optimistic update: Update local state immediately
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === activeConvId) {
                // Update title if it's first message
                const shouldUpdateTitle = formattedMessages.length === 2 && c.title === "New chat";
                const newTitle = shouldUpdateTitle
                  ? formattedMessages[0].parts.find(p => p.type === 'text')?.text?.slice(0, 50) || "New chat"
                  : c.title;

                return {
                  ...c,
                  title: newTitle,
                  messages: formattedMessages,
                  createdAt: c.createdAt || Date.now()
                };
              }
              return c;
            }),
          );

          // Schedule a debounced refresh to sync with server (will use Redis cache)
          setShouldRefreshConversations(true);
        } catch (error) {
          console.error("[onFinish] ✗ Failed to save:", error);
        }
      }
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
  }, [messages, status]);

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

  // Fetch conversations from MongoDB/Redis (uses cache)
  const fetchConversations = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsConversationsLoading(true);
    }
    try {
      const res = await fetch("/api/assistant/conversations", {
        // Use cache-first strategy
        headers: {
          'Cache-Control': 'max-age=60',
        },
      });
      if (res.ok) {
        const data = await res.json();

        // Only update if data actually changed (prevent unnecessary re-renders)
        setConversations((prev) => {
          const hasChanged = JSON.stringify(prev.map(c => ({ id: c.id, title: c.title }))) !==
            JSON.stringify(data.map((c: Conversation) => ({ id: c.id, title: c.title })));
          return hasChanged ? data : prev;
        });

        if (data.length > 0 && !activeConvId) {
          setActiveConvId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      if (showLoading) {
        setIsConversationsLoading(false);
      }
    }
  }, [activeConvId]);

  // Load conversations from MongoDB on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Debounced refresh after AI response completes (uses Redis cache)
  useEffect(() => {
    if (shouldRefreshConversations) {
      const timer = setTimeout(() => {
        console.log('[Debounced Refresh] Syncing conversations from cache');
        fetchConversations(false); // Don't show loading spinner for background refresh
        setShouldRefreshConversations(false);
      }, 1500); // Wait 1.5s to batch multiple updates

      return () => clearTimeout(timer);
    }
  }, [shouldRefreshConversations, fetchConversations]);

  // Conversations are now auto-saved to MongoDB via API calls

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
        onClick: () => { },
      },
    });
  };

  const renameConversation = async (id: string, title: string) => {
    try {
      await fetch("/api/assistant/conversations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          title,
        }),
      });

      setConversations((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, title } : c,
        ),
      );
      toast.success("Conversation renamed");
    } catch (error) {
      console.error("Error renaming conversation:", error);
      toast.error("Failed to rename conversation");
    }
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
    <SidebarProvider>
      <AppSidebarV2
        user={user}
        conversations={conversations}
        activeConvId={activeConvId}
        isLoadingConversations={isConversationsLoading}
        onNewConversation={createNewConversation}
        onDeleteConversation={deleteConversation}
        onRenameConversation={renameConversation}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {activeConv?.title || "New Chat"}
            </span>
          </div>
        </header>
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 flex-col gap-4 p-2 sm:p-4 h-full overflow-hidden relative">
            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <div ref={scrollRef} className="h-full overflow-y-auto">
                <div className="mx-auto max-w-3xl px-2 sm:px-4 py-4 sm:py-8">
                  {isSwitchingConversation ? (
                    <ChatSkeleton />
                  ) : messages.length === 0 && !isLoading ? (
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
                    <div className="space-y-6">
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
                  )
                  }

                  {isLoading && messages.length > 0 && (
                    <ResponseLoadingSkeleton />
                  )}

                  {/* Error State - only show for real failures, not SDK /responses quirks */}
                  {error &&
                    !error.message?.includes("/responses") &&
                    !error.message?.includes("Failed to parse URL") && (
                      <div className="mt-6 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-destructive">
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
                            className="border-destructive/30 text-destructive hover:bg-destructive/10"
                          >
                            Retry
                          </Button>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Input Area - Modern Glass Style */}
            <div className="bg-gradient-to-t from-background via-background to-transparent pb-4 sm:pb-6 pt-4 px-3 sm:px-0">
              <div className="mx-auto max-w-3xl sm:px-4">
                <form onSubmit={handleSubmit} className="relative">
                  <div className="flex items-end gap-3 bg-gradient-to-r from-muted/80 to-muted/60 dark:from-slate-800/90 dark:to-slate-800/70 rounded-2xl px-4 sm:px-6 py-4 border border-border/50 shadow-lg shadow-black/5 backdrop-blur-sm transition-all hover:border-primary/30 focus-within:border-primary/50 focus-within:shadow-primary/10">
                    <Textarea
                      ref={textareaRef}
                      rows={1}
                      value={localInput}
                      onChange={(e) => setLocalInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Find me 25 real estate agents in Miami with emails and phone numbers..."
                      disabled={isLoading}
                      className="flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground/70 resize-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none text-sm sm:text-[15px] leading-relaxed min-h-6 max-h-[200px] py-1"
                    />
                    <Button
                      type="submit"
                      disabled={!localInput.trim() || isLoading}
                      size="icon"
                      className={cn(
                        "h-10 w-10 rounded-xl shrink-0 transition-all duration-300",
                        localInput.trim()
                          ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
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
                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={stop}
                      className="h-9 px-4 text-sm gap-2 rounded-xl hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all duration-200"
                    >
                      <div className="w-2 h-2 bg-current rounded-sm animate-pulse" />
                      Stop generating
                    </Button>
                  </div>
                )}
                <div className="mt-3 text-center">
                  <p className="text-xs text-muted-foreground/50">
                    Press Enter to send • Shift+Enter for new line
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
