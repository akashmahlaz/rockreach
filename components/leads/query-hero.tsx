"use client";

import { ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const exampleQueries = [
  "CEOs in affiliate marketing",
  "AdOps managers in US agencies",
  "Digital marketing agency decision makers",
  "HR leaders at SaaS companies",
  "CTOs in fintech startups",
];

interface QueryHeroProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
}

export function QueryHero({ query, onQueryChange, onSubmit, isLoading }: QueryHeroProps) {
  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-8 sm:pb-12">
      {/* Badge */}
      <div className="flex justify-center mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-50 bg-white/80 shadow-sm backdrop-blur px-4 sm:px-5 py-2 sm:py-2.5">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span className="text-xs sm:text-sm font-medium text-slate-700">
            Powered by RocketReach + AI
          </span>
        </div>
      </div>

      {/* Heading */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-center text-slate-900 mb-4 sm:mb-6 tracking-tight">
        Tell the AI who you need.
        <br />
        <span className="bg-gradient-to-r font-bold font-sans from-slate-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
          We&apos;ll find them.
        </span>
      </h1>

      {/* Subheading */}
      <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-center text-slate-600 mb-8 sm:mb-10 max-w-3xl mx-auto font-medium leading-relaxed">
        Ask in plain English—role, company, location, specialty. AI interprets it, fetches real profiles, and gets them ready for outreach.
      </p>

      {/* Search Form */}
      <form onSubmit={onSubmit} className="w-full space-y-4 sm:space-y-6">
        <div className="rounded-2xl sm:rounded-3xl border-2 border-slate-200/80 bg-white/95 backdrop-blur-sm p-4 sm:p-6 md:p-8 shadow-2xl shadow-slate-900/10">
          <label htmlFor="lead-query" className="block text-sm font-bold uppercase tracking-wide text-slate-600 mb-3 font-serif">
            What type of professionals are you looking for?
          </label>
          <textarea
            id="lead-query"
            className="w-full resize-none rounded-xl sm:rounded-2xl border-2 border-slate-200 bg-slate-50/80 px-4 sm:px-5 py-3 sm:py-4 text-base sm:text-lg md:text-xl font-medium text-slate-900 outline-none transition-all duration-200 focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100/50 focus:shadow-lg"
            rows={3}
            placeholder="e.g., CEOs inside affiliate marketing agencies across the US & UK"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />

          {/* Example Queries */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-sm font-bold text-slate-500 font-serif">Try:</span>
            {exampleQueries.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => onQueryChange(example)}
                className="rounded-full border-2 border-slate-200 bg-white px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-600 transition-all duration-200 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 hover:shadow-md"
              >
                {example}
              </button>
            ))}
          </div>

          {/* Info + Submit Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-200">
            <p className="text-xs sm:text-sm text-slate-600 flex items-start gap-2 font-medium">
              <Sparkles className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              <span>AI will uncover profiles with verified email + phone and auto-save to your vault.</span>
            </p>
            <Button
              type="submit"
              disabled={isLoading || !query.trim()}
              size="lg"
              className="w-full sm:w-auto rounded-4xl font-stretch-expanded font-bold font-sans bg-slate-50 text-gray-800 hover:bg-amber-500 hover:text-white hover:border-2 border-amber-500 transition-all px-6 sm:px-8 py-6 text-base sm:text-lg md:text-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                "Searching..."
              ) : (
                <>
                  Search Professionals
                  <ChevronRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
