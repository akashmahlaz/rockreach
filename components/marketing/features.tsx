import { Search, Sparkles, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Search,
    title: "Natural Language Search",
    description:
      "Just describe who you're looking for in plain English. Our AI understands context and finds the perfect prospects.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Enrichment",
    description:
      "Automatically verify emails, find phone numbers, and enrich profiles with social links and job history.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Mail,
    title: "Personalized Outreach",
    description:
      "Generate personalized emails for each prospect using AI. Send campaigns at scale with tracking and analytics.",
    gradient: "from-orange-500 to-red-500",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 font-sans tracking-tight">
            Everything you need to scale outreach
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-sans">
            From discovery to conversion, we&apos;ve built the tools you need to find and connect with your ideal customers.
          </p>
        </div>

        {/* Feature Cards - Clean, Minimal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="border hover:border-primary hover:shadow-md transition-all duration-200 bg-card"
              >
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-semibold font-sans">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed text-muted-foreground font-sans">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
