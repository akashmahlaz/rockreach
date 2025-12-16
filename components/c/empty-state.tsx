"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Mail, Users, ArrowRight, Sparkles, Building2, Phone, MapPin, Briefcase, Target, Zap } from "lucide-react";

interface EmptyStateProps {
  onExampleClick: (text: string) => void;
}

export function EmptyState({ onExampleClick }: EmptyStateProps) {
  const starters = [
    {
      title: "🏠 Real Estate Leads",
      description: "Find property investors, agents, and developers in any location",
      icon: Building2,
      prompt: "Find 25 real estate investors and property developers in New York with their emails and phone numbers",
      gradient: "from-blue-500/10 to-cyan-500/10",
      iconColor: "text-blue-500",
    },
    {
      title: "💼 Sales Prospects",
      description: "CTOs, VPs, and C-level decision makers at top companies",
      icon: Users,
      prompt: "Get me 30 CTOs and VPs of Engineering at tech startups in San Francisco with contact info",
      gradient: "from-purple-500/10 to-pink-500/10",
      iconColor: "text-purple-500",
    },
    {
      title: "📧 Email Campaign",
      description: "Find leads and automatically create personalized outreach",
      icon: Mail,
      prompt: "Find 20 marketing directors at e-commerce companies and create an email campaign introducing our services",
      gradient: "from-green-500/10 to-emerald-500/10",
      iconColor: "text-green-500",
    },
    {
      title: "📱 Phone Outreach",
      description: "Get verified direct phone numbers for cold calling",
      icon: Phone,
      prompt: "Find 15 CEOs of construction companies in Texas with their direct phone numbers",
      gradient: "from-orange-500/10 to-amber-500/10",
      iconColor: "text-orange-500",
    },
  ];

  const quickActions = [
    { icon: Target, text: "Find recruiters at Fortune 500", prompt: "Find 20 recruiters and HR directors at Fortune 500 companies with emails" },
    { icon: Briefcase, text: "Insurance agents in Florida", prompt: "Get me 25 insurance agents in Florida with phone numbers and emails" },
    { icon: Zap, text: "Startup founders in Austin", prompt: "Find 30 startup founders and CEOs in Austin, TX with contact information" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary mb-4 shadow-xl shadow-primary/20 border border-primary/10">
          <Sparkles className="w-10 h-10" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-serif font-medium text-foreground tracking-tight">
          Find Leads <span className="italic font-serif text-primary">Instantly</span>
        </h1>
        <p className="text-lg text-muted-foreground font-sans max-w-lg mx-auto leading-relaxed">
          Just tell me who you're looking for. I'll find their <strong className="text-foreground">emails</strong>, <strong className="text-foreground">phone numbers</strong>, and <strong className="text-foreground">LinkedIn profiles</strong> in seconds.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-medium">AI Ready</span>
          </div>
          <span className="text-muted-foreground/50">•</span>
          <span>400M+ Contacts</span>
          <span className="text-muted-foreground/50">•</span>
          <span>95% Email Accuracy</span>
        </div>
      </div>

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl mb-8">
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
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {starter.description}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 mt-1" />
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="w-full max-w-3xl">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 text-center">
          Quick searches
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => onExampleClick(action.prompt)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-full border border-border/50 bg-background/50 hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all duration-200"
            >
              <action.icon className="w-3.5 h-3.5" />
              {action.text}
            </button>
          ))}
        </div>
      </div>
      
      {/* Bottom Tip */}
      <div className="mt-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 border border-border/50">
          <MapPin className="w-4 h-4 text-primary" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Pro tip:</span> Be specific with location and job titles for best results
          </p>
        </div>
      </div>
    </div>
  );
}
