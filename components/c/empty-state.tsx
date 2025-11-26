"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Mail, Users, ArrowRight, Sparkles } from "lucide-react";

interface EmptyStateProps {
  onExampleClick: (text: string) => void;
}

export function EmptyState({ onExampleClick }: EmptyStateProps) {
  // const starters = [
  //   {
  //     title: "Find Leads",
  //     description: "Search for CTOs in San Francisco",
  //     icon: Search,
  //     prompt: "Find CTOs at SaaS companies in San Francisco with verified emails",
  //   },
  //   {
  //     title: "Email Campaign",
  //     description: "Draft an outreach sequence",
  //     icon: Mail,
  //     prompt: "Draft a 3-step email sequence for selling SEO services to marketing directors",
  //   },
  //   {
  //     title: "Enrich Data",
  //     description: "Find contact info for a list",
  //     icon: Users,
  //     prompt: "I have a list of companies. Help me find the decision makers.",
  //   },
  //   {
  //     title: "Market Research",
  //     description: "Analyze industry trends",
  //     icon: Sparkles,
  //     prompt: "Analyze the current trends in the AI automation market for 2025",
  //   },
  // ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="text-center space-y-6 max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-serif font-medium text-foreground tracking-tight">
          Let&apos;s Find your<span className="italic font-serif px-1">Next</span> Customer
        </h1>
        {/* <p className="text-lg text-muted-foreground font-sans max-w-lg mx-auto">
          I can help you find leads, write emails, and analyze market data.
        </p> */}
      </div>

      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
        {starters.map((starter, index) => (
          <button
            key={index}
            onClick={() => onExampleClick(starter.prompt)}
            className="group flex items-start gap-4 p-4 text-left rounded-xl border border-border/50 bg-card hover:bg-muted/50 hover:border-primary/20 transition-all duration-200"
          >
            <div className="shrink-0 p-2 rounded-lg bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors">
              <starter.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                {starter.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                {starter.description}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 mt-1" />
          </button>
        ))}
      </div> */}
    </div>
  );
}
