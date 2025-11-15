"use client";

import { useEffect, useMemo, useRef } from "react";
import { useChat } from "ai/react";
import { heroTheme } from "@/lib/theme/hero";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThinkingRibbon } from "@/components/assistant/thinking-ribbon";
import { Bot, MessageCircle, Send, Sparkles, User } from "lucide-react";

interface AssistantClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
}

export function AssistantClient({ user }: AssistantClientProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, input, isLoading, stop, handleInputChange, handleSubmit } = useChat({
    api: "/api/assistant/stream",
    body: {
      userMetadata: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const emptyState = useMemo(() => messages.length === 0, [messages]);

  return (
    <section className={cn("min-h-screen w-full pb-20 pt-24", heroTheme.background.gradient)}>
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-0">
        <header className="text-center">
          <div className={heroTheme.badge.base}>
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Hero-styled Lead Assistant</span>
          </div>
          <h1 className={cn("mt-6 text-4xl font-bold tracking-tight sm:text-5xl", heroTheme.text.primary)}>
            Chat like it&apos;s <span className="bg-linear-to-r from-slate-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">the hero</span>
          </h1>
          <p className={cn("mt-4 text-lg leading-relaxed", heroTheme.text.secondary)}>
            Ask for fresh leads, refine outreach ideas, and get RocketReach-backed answers in a familiar ChatGPT layout.
          </p>
        </header>

        <div className="mt-12 rounded-4xl border border-slate-100/80 bg-white/80 p-1 shadow-[0_25px_80px_rgba(15,23,42,0.15)] backdrop-blur-xl">
          <div className="rounded-[2rem] border border-white/60 bg-white/90 p-6">
            <div className="flex flex-col gap-6">
              <div ref={scrollRef} className="max-h-[60vh] overflow-y-auto pr-2">
                {emptyState ? <EmptyStateCard /> : messages.map((message) => <MessageBubble key={message.id} role={message.role} content={message.content} />)}
              </div>

              <div className="space-y-4">
                <ThinkingRibbon active={isLoading} label="Synthesizing live leads" />
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Textarea
                    rows={4}
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Example: Find 5 heads of data engineering at Y Combinator-backed fintech startups and summarize their latest roles."
                    className="w-full resize-none rounded-3xl border-slate-200 bg-white/90 px-6 py-5 text-base shadow-inner focus-visible:ring-amber-400"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className={cn("text-sm", heroTheme.text.secondary)}>
                      {isLoading ? "Streaming response…" : "Powered by your DeepSeek + RocketReach stack"}
                    </span>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={stop}
                        disabled={!isLoading}
                        className="text-sm text-slate-500 hover:text-slate-900"
                      >
                        Stop
                      </Button>
                      <Button type="submit" disabled={!input.trim() || isLoading} className={cn(heroTheme.button.primary, "flex items-center gap-2 px-6 py-5 text-base")}>Send<Send className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface MessageBubbleProps {
  role: string;
  content: string;
}

function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === "user";
  const Icon = isUser ? User : Bot;
  const alignment = isUser ? "items-end" : "items-start";
  const bubbleClasses = isUser
    ? "bg-slate-900 text-white"
    : "bg-white/90 border border-amber-100 text-slate-800 shadow-[0_10px_30px_rgba(251,191,36,0.25)]";

  return (
    <div className={cn("mb-4 flex w-full flex-col gap-2", alignment)}>
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Icon className="h-4 w-4" />
        <span>{isUser ? "You" : "Lead Assistant"}</span>
      </div>
      <div className={cn("max-w-[90%] rounded-3xl px-5 py-4 text-base leading-relaxed", bubbleClasses)}>
        {content}
      </div>
    </div>
  );
}

function EmptyStateCard() {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white/70 px-6 py-12 text-center shadow-inner">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-500">
        <MessageCircle className="h-6 w-6" />
      </div>
      <h3 className="mt-6 text-2xl font-semibold text-slate-900">Start a conversation</h3>
      <p className="mt-3 text-base text-slate-600">
        Ask for new leads, request RocketReach lookups, or draft outreach ideas. The assistant mirrors the hero palette so it feels native across the app.
      </p>
      <ul className="mt-6 space-y-2 text-sm text-slate-500">
        <li>• &ldquo;Show me 10 VPs of Sales at Series B HR platforms in London&rdquo;</li>
        <li>• &ldquo;Draft a warm intro referencing their latest funding&rdquo;</li>
        <li>• &ldquo;Summarize the RocketReach profiles you just found&rdquo;</li>
      </ul>
    </div>
  );
}
