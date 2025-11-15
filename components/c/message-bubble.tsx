"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { UIMessage } from "ai";

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

export function MessageBubble({
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
                const cleanText = part.text
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
                              i % 2 === 1 ? <strong key={i} className="font-medium">{p}</strong> : <span key={i}>{p}</span>
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
                      <div className="text-sm font-normal text-slate-700 mb-2">
                        Found {toolPart.output.leads.length} lead(s):
                      </div>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {toolPart.output.leads.slice(0, 5).map((lead: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-white hover:shadow-sm transition-shadow">
                          <div className="flex items-start gap-3">
                            <div className="shrink-0 w-10 h-10 rounded-full bg-linear-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white font-medium">
                              {lead.fullName?.charAt(0) || lead.firstName?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-slate-900">{lead.fullName || 'Unknown'}</h4>
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
                      <div className="text-sm font-normal text-green-900 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Contact details found
                      </div>
                      <div className="space-y-2 text-sm">
                        {lead.email && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Email:</span>
                            <span className="font-normal text-slate-900">{lead.email}</span>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Phone:</span>
                            <span className="font-normal text-slate-900">{lead.phone}</span>
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
        {message.parts.some(part => part.type === "text" && part.text.trim().length > 0) && (
          <div className="mt-2 flex gap-1">
            {!isUser && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onCopy(message)}
                className="h-7 w-7 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            )}
            {isUser && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-7 px-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                Edit
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
