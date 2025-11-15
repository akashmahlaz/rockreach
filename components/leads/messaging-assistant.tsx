"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Mail, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = ["professional", "casual", "sales", "follow-up"] as const;
const DEPTHS = ["Light", "Medium", "Deep"] as const;

type Tone = (typeof TONES)[number];
type Depth = (typeof DEPTHS)[number];

interface MessagingAssistantProps {
  profileName: string;
  onGenerate: (tone: Tone, depth: Depth) => Promise<string>;
  onSend: (message: string) => Promise<void>;
}

export function MessagingAssistant({ profileName, onGenerate, onSend }: MessagingAssistantProps) {
  const [tone, setTone] = useState<Tone>("professional");
  const [depth, setDepth] = useState<Depth>("Medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const [editedMessage, setEditedMessage] = useState("");

  const handleGenerate = async () => {
    if (!profileName) return;
    try {
      setIsGenerating(true);
      const draft = await onGenerate(tone, depth);
      setMessageDraft(draft);
      setEditedMessage(draft);
      setIsEditing(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = () => {
    setEditedMessage(messageDraft);
    setIsEditing(true);
  };

  const handleSave = () => {
    setMessageDraft(editedMessage);
    setIsEditing(false);
  };

  const handleSend = async () => {
    if (!messageDraft) return;
    try {
      setIsSending(true);
      await onSend(messageDraft);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="rounded-2xl sm:rounded-3xl border-2 border-slate-200 bg-gradient-to-br from-white via-white to-amber-50/30 backdrop-blur-sm shadow-2xl">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          <p className="text-sm font-bold uppercase tracking-wide text-indigo-700 font-serif">
            AI Messaging Assistant
          </p>
        </div>
        <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 font-serif">
          Personalize outreach in seconds
        </CardTitle>
        <p className="text-sm sm:text-base text-slate-600 mt-2">
          Select tone + personalization depth and let AI draft a unique email.
        </p>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6">
        {/* Tone Selection */}
        <div>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-wide text-slate-600 mb-2 sm:mb-3">
            Tone
          </p>
          <div className="grid grid-cols-2 gap-2">
            {TONES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTone(option)}
                className={cn(
                  "rounded-xl sm:rounded-2xl border-2 px-3 sm:px-4 py-2 sm:py-3 text-sm font-semibold capitalize transition-all",
                  tone === option
                    ? "border-indigo-400 bg-indigo-50 text-indigo-700 shadow-md shadow-indigo-100"
                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/50"
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Personalization Depth */}
        <div>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-wide text-slate-600 mb-2 sm:mb-3">
            Personalization Depth
          </p>
          <div className="grid grid-cols-3 gap-2">
            {DEPTHS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDepth(option)}
                className={cn(
                  "rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-all",
                  depth === option
                    ? "border-purple-400 bg-purple-50 text-purple-700 shadow-md shadow-purple-100"
                    : "border-slate-200 bg-white text-slate-600 hover:border-purple-200 hover:bg-purple-50/50"
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !profileName}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 py-6 text-base font-semibold rounded-xl sm:rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-5 w-5" />
              Generate {tone} email
            </>
          )}
        </Button>

        {/* Message Draft Preview */}
        {messageDraft && !isEditing && (
          <div className="rounded-xl sm:rounded-2xl border-2 border-slate-200 bg-white p-4 sm:p-5 shadow-inner">
            <pre className="whitespace-pre-wrap text-left font-sans text-sm leading-relaxed text-slate-700">
              {messageDraft}
            </pre>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={handleEdit}
                className="flex-1 border-2 border-slate-200 rounded-xl hover:bg-slate-50"
              >
                Edit
              </Button>
              <Button
                onClick={handleSend}
                disabled={isSending}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/30 rounded-xl disabled:opacity-60"
              >
                {isSending ? "Sending..." : "Send via Resend"}
              </Button>
            </div>
          </div>
        )}

        {/* Edit Mode */}
        {isEditing && (
          <div className="rounded-xl sm:rounded-2xl border-2 border-indigo-200 bg-indigo-50/50 p-4 sm:p-5">
            <textarea
              value={editedMessage}
              onChange={(e) => setEditedMessage(e.target.value)}
              className="w-full h-40 rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-sm font-sans leading-relaxed text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="flex-1 border-2 border-slate-200 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
