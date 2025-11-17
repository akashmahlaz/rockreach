"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Paperclip, X, FileIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useChat } from "@ai-sdk/react";
import { UIMessage } from "ai";
import { MessageBubble } from "@/components/c/message-bubble";
import { LoadingOverlay } from "@/components/c/loading-overlay";
import { fetchWithRetry } from "@/lib/fetch-with-retry";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SimpleChatClientProps {
  conversationId: string | null;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
}

interface ThinkingStep {
  label: string;
  status: "pending" | "active" | "complete";
}

interface SystemCheck {
  email: boolean;
  whatsapp: boolean;
  rocketreach: boolean;
}

export function SimpleChatClient({ conversationId, user }: SimpleChatClientProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [localInput, setLocalInput] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [systemChecks, setSystemChecks] = useState<SystemCheck | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  
  // Store activeConvId in cookie
  useEffect(() => {
    if (conversationId) {
      document.cookie = `active-conversation-id=${conversationId}; path=/; max-age=3600; SameSite=Lax`;
    }
  }, [conversationId]);

  // Use useChat hook
  const {
    messages,
    sendMessage,
    status,
    stop,
    error,
    setMessages,
  } = useChat({
    id: conversationId || undefined,
    onFinish: async ({ messages: allMessages }) => {
      if (conversationId) {
        const formattedMessages = allMessages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.parts?.find(p => 'text' in p)?.text || '',
          parts: msg.parts || [],
          createdAt: new Date(),
        }));
        
        try {
          await fetch('/api/assistant/conversations', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: conversationId,
              messages: formattedMessages,
            }),
          });
        } catch (error) {
          console.error('Failed to save conversation:', error);
        }
      }
      setThinkingSteps([]);
    },
    onError: (error) => {
      console.error("Chat error:", error);
      toast.error(error?.message || "An error occurred");
      setThinkingSteps([]);
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Check system configuration on mount
  useEffect(() => {
    checkSystemConfiguration();
  }, []);

  const checkSystemConfiguration = async () => {
    try {
      const res = await fetch('/api/assistant/system-check');
      if (res.ok) {
        const checks = await res.json();
        setSystemChecks(checks);
        
        // Show setup guide if any service is not configured
        if (!checks.email || !checks.whatsapp || !checks.rocketreach) {
          setShowSetupGuide(true);
        }
      }
    } catch (error) {
      console.error('System check failed:', error);
    }
  };

  // Load messages when conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      if (conversationId) {
        try {
          const res = await fetchWithRetry(`/api/assistant/conversations?id=${conversationId}`);
          if (res.ok) {
            const conversation = await res.json();
            const formattedMessages = (conversation.messages || []).map((msg: UIMessage) => ({
              ...msg,
              parts: msg.parts && msg.parts.length > 0 ? msg.parts : [{ type: 'text', text: '' }],
            }));
            setMessages(formattedMessages);
          }
        } catch (error) {
          console.error('Error loading messages:', error);
        }
      } else {
        setMessages([]);
      }
    };
    loadMessages();
  }, [conversationId, setMessages]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [messages, thinkingSteps, status]);

  // Auto-resize textarea
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
      }
    }, 10);
    return () => clearTimeout(timeoutId);
  }, [localInput]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/msword',
        'application/vnd.ms-excel',
        'text/csv',
        'text/plain',
      ];
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB limit
    });
    
    if (validFiles.length !== files.length) {
      toast.error("Some files were skipped. Only PDF, Word, Excel, and CSV files under 10MB are allowed.");
    }
    
    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!localInput.trim() && uploadedFiles.length === 0) || isLoading) return;

    let finalInput = localInput.trim();
    
    // Process uploaded files
    if (uploadedFiles.length > 0) {
      const fileDescriptions = uploadedFiles.map(f => `📎 ${f.name} (${(f.size / 1024).toFixed(1)}KB)`).join('\n');
      finalInput = `${finalInput}\n\nAttached files:\n${fileDescriptions}`;
      
      // TODO: Upload files to server and get URLs
      // For now, we'll just mention them in the message
    }

    setLocalInput("");
    setUploadedFiles([]);
    
    if (!conversationId) {
      window.location.href = '/api/assistant/new-conversation';
      return;
    }

    sendMessage({ text: finalInput });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-b from-slate-50 to-white flex-col">
      {/* Setup Guide Alert */}
      {showSetupGuide && systemChecks && (!systemChecks.email || !systemChecks.whatsapp || !systemChecks.rocketreach) && (
        <div className="mx-auto max-w-4xl px-4 pt-4">
          <Alert variant="default" className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle>Complete Your Setup</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-2">
                {!systemChecks.rocketreach && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">🔍 RocketReach API - Required for lead search</span>
                    <Button size="sm" variant="outline" onClick={() => router.push('/settings')}>
                      Configure
                    </Button>
                  </div>
                )}
                {!systemChecks.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">📧 Email Integration - For sending emails</span>
                    <Button size="sm" variant="outline" onClick={() => router.push('/email/settings')}>
                      Configure
                    </Button>
                  </div>
                )}
                {!systemChecks.whatsapp && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">💬 WhatsApp - For WhatsApp messaging</span>
                    <Button size="sm" variant="outline" onClick={() => router.push('/settings')}>
                      Configure
                    </Button>
                  </div>
                )}
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                className="mt-2 text-xs"
                onClick={() => setShowSetupGuide(false)}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <div ref={scrollRef} className="h-full overflow-y-auto">
          <div className="mx-auto max-w-4xl px-4 py-8">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-2xl">
                  <span className="text-4xl font-bold text-white">AI</span>
                </div>

                <h1 className="mb-4 text-4xl font-bold text-slate-900">
                  AI Lead Research Assistant
                </h1>

                <p className="mb-8 max-w-2xl text-lg text-slate-600">
                  Tell me exactly what you need:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl mb-8">
                  <div className="p-6 bg-white rounded-2xl border-2 border-slate-100 hover:border-amber-300 transition-all shadow-sm">
                    <div className="text-5xl mb-3">📊</div>
                    <div className="text-sm font-medium text-slate-900 mb-2">
                      How many leads?
                    </div>
                    <div className="text-xs text-slate-500">
                      "I need 50 leads" or "Find 100 contacts"
                    </div>
                  </div>

                  <div className="p-6 bg-white rounded-2xl border-2 border-slate-100 hover:border-amber-300 transition-all shadow-sm">
                    <div className="text-5xl mb-3">🎯</div>
                    <div className="text-sm font-medium text-slate-900 mb-2">
                      Which job titles?
                    </div>
                    <div className="text-xs text-slate-500">
                      "CTOs" or "Marketing Managers" or "CFOs"
                    </div>
                  </div>

                  <div className="p-6 bg-white rounded-2xl border-2 border-slate-100 hover:border-amber-300 transition-all shadow-sm">
                    <div className="text-5xl mb-3">🏢</div>
                    <div className="text-sm font-medium text-slate-900 mb-2">
                      Which industry?
                    </div>
                    <div className="text-xs text-slate-500">
                      "Fintech" or "SaaS" or "Healthcare"
                    </div>
                  </div>

                  <div className="p-6 bg-white rounded-2xl border-2 border-slate-100 hover:border-amber-300 transition-all shadow-sm">
                    <div className="text-5xl mb-3">📍</div>
                    <div className="text-sm font-medium text-slate-900 mb-2">
                      Which location?
                    </div>
                    <div className="text-xs text-slate-500">
                      "San Francisco" or "New York" or "USA"
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-2 text-sm text-slate-700 mb-4">
                  <span className="px-4 py-2 bg-green-50 border border-green-200 rounded-full">✓ Emails & Phones</span>
                  <span className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">✓ LinkedIn Profiles</span>
                  <span className="px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">✓ Company Info</span>
                  <span className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-full">✓ CSV Export</span>
                </div>

                <div className="text-xs text-slate-400 italic">
                  💡 Example: "Find 50 CTOs at fintech companies in San Francisco"
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => {
                  if (!message || !message.id) return null;
                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isEditing={false}
                      editContent=""
                      onEditChange={() => {}}
                      onSaveEdit={() => {}}
                      onCancelEdit={() => {}}
                      onCopy={() => {
                        const textContent = message.parts
                          .filter((p) => p.type === "text")
                          .map((p) => ("text" in p ? p.text : "") || "")
                          .join("");
                        if (textContent) {
                          navigator.clipboard.writeText(textContent);
                          toast.success("Copied to clipboard");
                        }
                      }}
                      onEdit={() => {}}
                    />
                  );
                })}
              </div>
            )}

            <LoadingOverlay isLoading={isLoading} thinkingSteps={thinkingSteps} onStop={stop} />

            {error && !error.message?.includes("/responses") && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-900">An error occurred. Please try again.</span>
                  <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input Area - Fixed at Bottom */}
      <div className="border-t border-slate-200 bg-white shadow-lg">
        <div className="mx-auto max-w-4xl px-4 py-4">
          {/* File Upload Preview */}
          {uploadedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <FileIcon className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-700">{file.name}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-end rounded-2xl border-2 border-slate-200 bg-white shadow-sm transition-all duration-200 focus-within:border-amber-400 focus-within:shadow-lg focus-within:ring-4 focus-within:ring-amber-100">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="shrink-0 p-3 text-slate-500 hover:text-amber-600 transition-colors disabled:opacity-50"
                title="Attach files (PDF, Word, Excel, CSV)"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <Textarea
                ref={textareaRef}
                rows={1}
                value={localInput}
                onChange={(e) => setLocalInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="How many leads do you need? Which job titles? Which city?"
                disabled={isLoading}
                className="min-h-[52px] max-h-[200px] w-full resize-none border-0 bg-transparent py-3 px-2 text-base focus-visible:ring-0 focus-visible:outline-none disabled:opacity-50"
              />
              <Button
                type="submit"
                disabled={(!localInput.trim() && uploadedFiles.length === 0) || isLoading}
                size="icon"
                className="shrink-0 m-2 h-10 w-10 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:opacity-50 text-white"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </form>
          <p className="mt-3 text-center text-xs text-slate-500">
            {isLoading ? (
              <button onClick={stop} className="font-medium hover:underline text-amber-600">
                Stop generating
              </button>
            ) : (
              <>
                💡 Be specific: "50 CTOs at AI companies in NYC" · Attach CSV/Excel for bulk enrichment
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
