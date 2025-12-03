"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Mail, Users, ArrowRight, Sparkles, Building2, Phone, MapPin } from "lucide-react";

interface EmptyStateProps {
  onExampleClick: (text: string) => void;
}

export function EmptyState({ onExampleClick }: EmptyStateProps) {
  const starters = [
    {
      title: "🏠 Real Estate Leads",
      description: "Find property investors in your area",
      icon: Building2,
      prompt: "Find 25 real estate investors and property developers in New York with their emails and phone numbers",
      gradient: "from-blue-500/10 to-cyan-500/10",
      iconColor: "text-blue-500",
    },
    {
      title: "💼 Sales Prospects",
      description: "CTOs, VPs, and decision makers",
      icon: Users,
      prompt: "Get me 30 CTOs and VPs of Engineering at tech startups in San Francisco with contact info",
      gradient: "from-purple-500/10 to-pink-500/10",
      iconColor: "text-purple-500",
    },
    {
      title: "📧 Email Campaign",
      description: "Find leads and send emails",
      icon: Mail,
      prompt: "Find 20 marketing directors at e-commerce companies and create an email campaign introducing our services",
      gradient: "from-green-500/10 to-emerald-500/10",
      iconColor: "text-green-500",
    },
    {
      title: "📱 Phone Outreach",
      description: "Get direct phone numbers",
      icon: Phone,
      prompt: "Find 15 CEOs of construction companies in Texas with their direct phone numbers",
      gradient: "from-orange-500/10 to-amber-500/10",
      iconColor: "text-orange-500",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="text-center space-y-4 max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary mb-4 shadow-lg shadow-primary/20">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-serif font-medium text-foreground tracking-tight">
          Find Leads <span className="italic font-serif text-primary">Instantly</span>
        </h1>
        <p className="text-lg text-muted-foreground font-sans max-w-lg mx-auto">
          Just tell me who you need - I'll find their <strong>emails</strong> and <strong>phone numbers</strong> in seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
        {starters.map((starter, index) => (
          <button
            key={index}
            onClick={() => onExampleClick(starter.prompt)}
            className={`group relative flex items-start gap-4 p-5 text-left rounded-2xl border border-border/50 bg-gradient-to-br ${starter.gradient} hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1`}
          >
            <div className={`shrink-0 p-3 rounded-xl bg-background/80 ${starter.iconColor} shadow-sm group-hover:scale-110 transition-transform`}>
              <starter.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {starter.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {starter.description}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 mt-1" />
          </button>
        ))}
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Try: "Find restaurant owners in Miami" or "Get me insurance agents in Chicago"
          </span>
        </p>
      </div>
    </div>
  );
}
