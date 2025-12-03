"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { UIMessage } from "ai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';

interface MessageBubbleProps {
  message: UIMessage;
  isEditing: boolean;
  editContent: string;
  onEditChange: (val: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onCopy: (message: UIMessage) => void;
}

export function MessageBubble({
  message,
  isEditing,
  editContent,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onCopy,
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (isEditing && isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%]">
          <Textarea
            value={editContent}
            onChange={(e) => onEditChange(e.target.value)}
            className="mb-2 w-full rounded-lg border border-input focus:border-primary"
            rows={3}
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" onClick={onSaveEdit} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={onCancelEdit} className="border-input hover:bg-accent hover:text-accent-foreground">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex animate-in fade-in slide-in-from-bottom-2 duration-300",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "text-[15px] leading-relaxed font-sans",
        isUser ? "text-foreground/80" : "text-foreground"
      )}>
          {!message.parts || message.parts.length === 0 ? (
            <div className="text-muted-foreground italic">No content</div>
          ) : (
            message.parts.map((part, index) => {
              
              if (part.type === "text") {
                // Clean up the text to remove RocketReach mentions
                const cleanText = part.text
                  .replace(/RocketReach/gi, "our database")
                  .replace(/rocket reach/gi, "our database");
                
                return (
                  <div key={index} className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex, rehypeHighlight]}
                      components={{
                        // Tables - Modern card-style with gradient header
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        table: ({ node, ...props }) => (
                          <div className="my-6 w-full rounded-xl border border-border/50 bg-card shadow-lg overflow-hidden">
                            <table className="w-full text-sm" {...props} />
                          </div>
                        ),
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        thead: ({ node, ...props }) => (
                          <thead className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/50" {...props} />
                        ),
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        th: ({ node, ...props }) => (
                          <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider" {...props} />
                        ),
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        td: ({ node, ...props }) => (
                          <td className="px-4 py-3 text-sm text-foreground" {...props} />
                        ),
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        tr: ({ node, ...props }) => (
                          <tr className="border-b border-border/30 last:border-0 hover:bg-primary/5 transition-all duration-200" {...props} />
                        ),
                        // Code blocks with syntax highlighting
                        code: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) => {
                          const match = /language-(\w+)/.exec(className || '');
                          // Detect if inline code based on presence of language class
                          const isBlockCode = match !== null;
                          return isBlockCode ? (
                            <div className="relative group my-4">
                              <div className="flex items-center justify-between bg-muted text-muted-foreground px-4 py-2 rounded-t-lg text-xs font-mono">
                                <span>{match ? match[1].toUpperCase() : 'CODE'}</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(String(children));
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-muted-foreground/20 hover:bg-muted-foreground/30 rounded text-xs"
                                >
                                  Copy
                                </button>
                              </div>
                              <code className={cn(className, "block bg-muted text-foreground p-4 rounded-b-lg overflow-x-auto")} {...props}>
                                {children}
                              </code>
                            </div>
                          ) : (
                            <code className="bg-secondary text-foreground px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                              {children}
                            </code>
                          );
                        },
                        // Pre tag for code blocks
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        pre: ({ node, ...props }) => (
                          <pre className="my-0" {...props} />
                        ),
                        // Links
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        a: ({ node, ...props }) => (
                          <a className="text-primary hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />
                        ),
                        // Paragraphs
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        p: ({ node, ...props }) => (
                          <p className="mb-3 leading-relaxed" {...props} />
                        ),
                        // Lists
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        ul: ({ node, ...props }) => (
                          <ul className="list-disc ml-6 mb-3 space-y-1" {...props} />
                        ),
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        ol: ({ node, ...props }) => (
                          <ol className="list-decimal ml-6 mb-3 space-y-1" {...props} />
                        ),
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        li: ({ node, ...props }) => (
                          <li className="leading-relaxed" {...props} />
                        ),
                        // Blockquotes
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        blockquote: ({ node, ...props }) => (
                          <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground" {...props} />
                        ),
                        // Headings
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        h1: ({ node, ...props }) => (
                          <h1 className="text-2xl font-bold mt-6 mb-3 text-foreground" {...props} />
                        ),
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        h2: ({ node, ...props }) => (
                          <h2 className="text-xl font-bold mt-5 mb-2 text-foreground" {...props} />
                        ),
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        h3: ({ node, ...props }) => (
                          <h3 className="text-lg font-semibold mt-4 mb-2 text-foreground" {...props} />
                        ),
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        h4: ({ node, ...props }) => (
                          <h4 className="text-base font-semibold mt-3 mb-2 text-foreground" {...props} />
                        ),
                        // Horizontal rule
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        hr: ({ node, ...props }) => (
                          <hr className="my-6 border-border" {...props} />
                        ),
                        // Strong/Bold
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        strong: ({ node, ...props }) => (
                          <strong className="font-semibold text-foreground" {...props} />
                        ),
                        // Emphasis/Italic
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        em: ({ node, ...props }) => (
                          <em className="italic" {...props} />
                        ),
                        // Images
                        img: ({ alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => {
                          // eslint-disable-next-line @next/next/no-img-element
                          return <img className="rounded-lg my-4 max-w-full h-auto" {...props} alt={alt || ''} />;
                        },
                      }}
                    >
                      {cleanText}
                    </ReactMarkdown>
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
                      <div className="text-sm font-normal text-foreground mb-2">
                        Found {toolPart.output.leads.length} lead(s):
                      </div>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {toolPart.output.leads.slice(0, 5).map((lead: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                          <div className="flex items-start gap-3">
                            <div className="shrink-0 w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground font-medium">
                              {lead.fullName?.charAt(0) || lead.firstName?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground">{lead.fullName || 'Unknown'}</h4>
                              <p className="text-sm text-muted-foreground">{lead.title || 'No title'}</p>
                              {lead.company && <p className="text-sm text-muted-foreground">{lead.company}</p>}
                              <div className="flex items-center gap-2 mt-1">
                                {lead.location && (
                                  <span className="text-xs text-muted-foreground">📍 {lead.location}</span>
                                )}
                                {lead.linkedinUrl && (
                                  <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                                    LinkedIn →
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {toolPart.output.leads.length > 5 && (
                        <p className="text-xs text-muted-foreground italic">
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
                    <div key={index} className="mt-3 p-4 rounded-lg border border-primary/20 bg-primary/5">
                      <div className="text-sm font-normal text-foreground mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Contact details found
                      </div>
                      <div className="space-y-2 text-sm">
                        {lead.email && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Email:</span>
                            <span className="font-normal text-foreground">{lead.email}</span>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Phone:</span>
                            <span className="font-normal text-foreground">{lead.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                
                // For saveLeads, show success message
                if (toolPart.toolName === "saveLeads" && toolPart.output?.saved) {
                  return (
                    <div key={index} className="mt-3 p-3 rounded-lg border border-primary/20 bg-primary/5 text-sm">
                      <div className="flex items-center gap-2 text-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
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
        
        {/* Action Buttons */}
        {message.parts.some(part => part.type === "text" && part.text.trim().length > 0) && (
          <div className="mt-2 flex gap-1">
            {!isUser && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onCopy(message)}
                className="h-7 w-7 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
