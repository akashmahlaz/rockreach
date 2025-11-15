"use client";

import { heroTheme } from "@/lib/theme/hero";
import { cn } from "@/lib/utils";

interface ThinkingRibbonProps {
  active: boolean;
  label?: string;
}

export function ThinkingRibbon({ active, label = "Assistant is thinking" }: ThinkingRibbonProps) {
  if (!active) return null;

  return (
    <div className="space-y-2">
      <p className={cn("text-xs font-medium uppercase tracking-[0.3em]", heroTheme.text.secondary, "text-center")}>{label}</p>
      <div
        className={cn(
          "relative h-2 overflow-hidden rounded-full",
          heroTheme.border.subtle,
          heroTheme.surface.glass,
          "shadow-inner"
        )}
      >
        <div className="absolute inset-0 rounded-full" style={{ animation: "assistantShimmer 1.8s linear infinite" }}>
          <div className="h-full w-full bg-gradient-to-r from-amber-200 via-amber-500/70 to-amber-200 opacity-80" />
        </div>
      </div>
      <style jsx>{`
        @keyframes assistantShimmer {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
