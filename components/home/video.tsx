import { Sparkles } from "lucide-react";

export async function FeaturedVideo() {
  return (
    <section className="w-full py-12 bg-background flex justify-center">
      <div className="container max-w-6xl px-4">
        <div className="relative rounded-xl border border-border bg-card shadow-2xl overflow-hidden aspect-video">
          {/* Browser Chrome */}
          <div className="absolute top-0 left-0 right-0 h-10 bg-muted/50 border-b border-border flex items-center px-4 gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
              <div className="w-3 h-3 rounded-full bg-green-400/80" />
            </div>
            <div className="ml-4 flex-1 max-w-md h-6 bg-background rounded-md border border-border/50 text-[10px] text-muted-foreground flex items-center px-2 font-mono">
              rockreach.com/dashboard
            </div>
          </div>

          {/* Content Placeholder */}
          <div className="absolute inset-0 top-10 bg-background flex items-center justify-center flex-col gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground font-sans">Interactive Product Demo Coming Soon</p>
          </div>
        </div>
      </div>
    </section>
  );
}
