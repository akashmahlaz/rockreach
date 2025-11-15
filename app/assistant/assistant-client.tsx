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
  Edit3,
  Loader2,
  MoreVertical,
  Plus,
  Send,
  Sparkles,
  Trash2,
  User,
  Users,
  Settings,
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

const THINKING_STEPS = [
  "Understanding your query",
  "Searching RocketReach database",
  "Enriching contact data",
  "Validating results",
  "Preparing response",
];

export function AssistantClient({ user }: AssistantClientProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);

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
      // Update conversation title if it's the first message
      if (messages.length === 1 && activeConvId) {
        const firstUserMessage = messages.find((m) => m.role === "user");
        if (firstUserMessage) {
          const textContent = firstUserMessage.parts
            .filter((p) => p.type === "text")
            .map((p) => p.text)
            .join(" ");
          const title = textContent.slice(0, 30) + (textContent.length > 30 ? "..." : "");
          setConversations((prev) =>
            prev.map((c) => (c.id === activeConvId ? { ...c, title, messages: [...messages] } : c))
          );
        }
      } else if (activeConvId) {
        // Update conversation with latest messages
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConvId ? { ...c, messages: [...messages] } : c))
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
        partCount: lastMsg.parts.length,
        partTypes: lastMsg.parts.map(p => p.type),
        parts: lastMsg.parts
      });
    }
  }, [status, messages, isLoading]);

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

  // Show thinking steps when loading
  useEffect(() => {
    if (isLoading) {
      setThinkingSteps(
        THINKING_STEPS.map((label, idx) => ({
          label,
          status: idx === 0 ? "active" : "pending",
        }))
      );
      let stepIdx = 0;
      const stepInterval = setInterval(() => {
        stepIdx++;
        if (stepIdx < THINKING_STEPS.length) {
          setThinkingSteps((steps) =>
            steps.map((step, idx) => ({
              ...step,
              status: idx < stepIdx ? "complete" : idx === stepIdx ? "active" : "pending",
            }))
          );
        } else {
          clearInterval(stepInterval);
        }
      }, 500);
      return () => clearInterval(stepInterval);
    } else {
      setThinkingSteps([]);
    }
  }, [isLoading]);

  // Load conversations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("assistant-conversations");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConversations(parsed);
        if (parsed.length > 0 && !activeConvId) {
          setActiveConvId(parsed[0].id);
        }
      } catch {
        // Ignore parse errors
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
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      setActiveConvId(remaining[0]?.id || null);
    }
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
      {/* Sidebar - ChatGPT style with hover expand */}
      <div
        ref={sidebarRef}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={cn(
          "group flex flex-col border-r border-slate-200 bg-white/95 backdrop-blur-sm transition-all duration-300 ease-in-out shadow-sm",
          isSidebarHovered ? "w-64" : "w-16"
        )}
      >
        <div className="flex h-full flex-col">
          {/* New Chat Button */}
          <div className="p-3 border-b border-slate-200">
            <Button
              onClick={createNewConversation}
              size="sm"
              className={cn(
                "w-full justify-start gap-3 bg-white hover:bg-amber-50 text-slate-700 border border-slate-200 hover:border-amber-300 transition-all",
                !isSidebarHovered && "justify-center px-0"
              )}
            >
              <Plus className="h-4 w-4 shrink-0" />
              {isSidebarHovered && <span className="text-sm">New chat</span>}
            </Button>
          </div>

          {/* Navigation Items */}
          <div className="px-2 py-2 border-b border-slate-200 space-y-1">
            <button
              onClick={() => router.push("/leads")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                "hover:bg-amber-50 text-slate-700 hover:text-amber-900",
                !isSidebarHovered && "justify-center px-0"
              )}
            >
              <Users className="h-4 w-4 shrink-0" />
              {isSidebarHovered && <span>Leads</span>}
            </button>
            <button
              onClick={() => router.push("/settings")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                "hover:bg-amber-50 text-slate-700 hover:text-amber-900",
                !isSidebarHovered && "justify-center px-0"
              )}
            >
              <Settings className="h-4 w-4 shrink-0" />
              {isSidebarHovered && <span>Settings</span>}
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "group/item relative rounded-lg transition-all min-h-[3.5rem]",
                  activeConvId === conv.id
                    ? "bg-amber-50 border border-amber-200 shadow-sm"
                    : "hover:bg-slate-50 border border-transparent"
                )}
              >
                <button
                  onClick={() => setActiveConvId(conv.id)}
                  className={cn(
                    "w-full h-full flex items-center gap-3 px-3 py-3 text-left text-sm transition-colors min-w-0",
                    activeConvId === conv.id ? "text-amber-900 font-medium" : "text-slate-700"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <span className="block truncate line-clamp-2 leading-snug">{conv.title}</span>
                    {isSidebarHovered && (
                      <span className="text-xs text-slate-500 mt-0.5 block">
                        {new Date(conv.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </button>
                {isSidebarHovered && (
                  <div className="absolute top-1 right-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-500 hover:text-slate-900 bg-white/80 backdrop-blur-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.id);
                          }}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            ))}
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
                {isSidebarHovered && (
                  <span className="text-sm text-slate-700 truncate">{user.name}</span>
                )}
              </div>
            </div>
          )}
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
                  
                  {/* Show loading indicator when streaming or submitted */}
                  {isLoading && (
                    <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <Avatar className="h-8 w-8 shrink-0 ring-2 ring-slate-100">
                        <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-sm">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>
                            {status === "submitted" 
                              ? "Processing your request..." 
                              : "AI is thinking..."}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Thinking Steps */}
              {thinkingSteps.length > 0 && (
                <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                    <span className="text-sm font-medium text-amber-900">Thinking...</span>
                  </div>
                  <div className="space-y-2">
                    {thinkingSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center gap-2 text-sm transition-all",
                          step.status === "complete" && "text-green-700",
                          step.status === "active" && "font-medium text-amber-700",
                          step.status === "pending" && "text-slate-400"
                        )}
                      >
                        {step.status === "complete" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        {step.status === "active" && <Loader2 className="h-4 w-4 animate-spin text-amber-500" />}
                        {step.status === "pending" && <div className="h-4 w-4 rounded-full border border-slate-300" />}
                        <span>{step.label}</span>
                      </div>
                    ))}
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
      <div className="flex gap-4">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-slate-700 text-white">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            value={editContent}
            onChange={(e) => onEditChange(e.target.value)}
            className="mb-2 w-full rounded-lg border border-slate-300 focus:border-amber-400"
            rows={3}
          />
          <div className="flex gap-2">
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
    <div className="group flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Avatar className="h-8 w-8 shrink-0 ring-2 ring-slate-100">
        {isUser ? (
          <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white shadow-sm">
            <User className="h-4 w-4" />
          </AvatarFallback>
        ) : (
          <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-sm">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        )}
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="whitespace-pre-wrap break-words text-base leading-relaxed text-slate-900 prose prose-slate max-w-none">
          {message.parts.length === 0 ? (
            <div className="text-slate-400 italic">No content</div>
          ) : (
            message.parts.map((part, index) => {
              console.log('[MessageBubble] Rendering part:', { type: part.type, part });
              
              if (part.type === "text") {
                return <div key={index}>{part.text}</div>;
              }
              
              // Handle tool calls - AI SDK uses specific part types
              if (part.type.startsWith("tool-")) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const toolPart = part as any;
                return (
                  <div key={index} className="mt-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-sm">
                    <div className="font-medium text-amber-900 mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Tool Call: {toolPart.toolName || 'Unknown'}
                    </div>
                    {toolPart.input && (
                      <div className="mb-2">
                        <div className="text-xs font-semibold text-amber-800 mb-1">Input:</div>
                        <pre className="text-xs text-slate-600 overflow-x-auto bg-white p-2 rounded">
                          {JSON.stringify(toolPart.input, null, 2)}
                        </pre>
                      </div>
                    )}
                    {toolPart.output && (
                      <div>
                        <div className="text-xs font-semibold text-amber-800 mb-1">Output:</div>
                        <pre className="text-xs text-slate-600 overflow-x-auto bg-white p-2 rounded max-h-60">
                          {JSON.stringify(toolPart.output, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              }
              
              // Fallback for unknown part types
              return (
                <div key={index} className="text-xs text-slate-400 italic">
                  Unknown part type: {part.type}
                </div>
              );
            })
          )}
        </div>

        {/* Action Buttons - ChatGPT style */}
        <div className="mt-2 flex gap-1 opacity-0 transition-all duration-200 group-hover:opacity-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(message)}
            className="h-7 px-2 text-xs text-slate-600 hover:bg-amber-50 hover:text-amber-700 transition-colors"
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy
          </Button>
          {isUser && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-7 px-2 text-xs text-slate-600 hover:bg-amber-50 hover:text-amber-700 transition-colors"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Edit
            </Button>
          )}
        </div>
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
