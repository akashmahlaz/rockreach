"use client";

import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface EmptyStateProps {
  onExampleClick: (text: string) => void;
}

export function EmptyState({ onExampleClick }: EmptyStateProps) {
  const examples = [
    {
      label: "🎯 Find 50 CFOs at fintech companies in New York",
      description: "Get names, emails, and phone numbers instantly"
    },
    {
      label: "📊 Search for VPs of Sales at Series B startups",
      description: "Filter by funding stage and location"
    },
    {
      label: "💼 Find CTOs at AI/ML companies in San Francisco",
      description: "Export results as CSV with LinkedIn profiles"
    },
    {
      label: "🔍 Get contact info for marketing@acme.com",
      description: "Enrich existing leads with verified data"
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl">
        <Sparkles className="h-10 w-10 text-white" />
      </div>

      <h2 className="mb-3 text-4xl font-bold text-slate-900">AI Lead Generation Assistant</h2>

      <div className="mb-8 max-w-2xl">
        <p className="text-lg text-slate-600 mb-4">
          Tell me what you're looking for, and I'll instantly provide:
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-sm text-slate-700">
          <span className="px-4 py-2 bg-green-50 border border-green-200 rounded-full">✓ Full Names & Titles</span>
          <span className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">✓ Email Addresses</span>
          <span className="px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">✓ Phone Numbers</span>
          <span className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-full">✓ Downloadable CSV</span>
        </div>
      </div>

      <div className="w-full max-w-3xl space-y-3">
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">Try These Examples:</p>
        {examples.map((example, idx) => (
          <button
            key={idx}
            onClick={() => onExampleClick(example.label.replace(/^[🎯📊💼🔍]\s*/, ''))}
            className="w-full rounded-xl border-2 border-slate-200 bg-white px-6 py-4 text-left shadow-sm hover:border-amber-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="text-base font-medium text-slate-900 group-hover:text-amber-600 transition-colors">
                  {example.label}
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  {example.description}
                </div>
              </div>
              <div className="text-slate-400 group-hover:text-amber-500 transition-colors">
                →
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 text-xs text-slate-400">
        💡 Tip: Be specific with numbers, industries, locations, and job titles for best results
      </div>
    </div>
  );
}
