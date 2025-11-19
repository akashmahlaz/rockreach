import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Head of Sales",
    company: "TechFlow Inc",
    avatar: "/leads.png",
    content:
      "Logician cut our lead research time by 80%. We went from manual LinkedIn searches to finding hundreds of qualified prospects in minutes.",
    rating: 5,
  },
  {
    name: "Michael Rodriguez",
    role: "Founder",
    company: "GrowthLabs",
    avatar: "/leads.png",
    content:
      "The AI-powered email generation is incredible. Each message feels personal and relevant. Our response rates doubled within the first month.",
    rating: 5,
  },
  {
    name: "Emily Watson",
    role: "Growth Manager",
    company: "SaaS Ventures",
    avatar: "/leads.png",
    content:
      "Best investment for our sales team. The natural language search is intuitive, and the data quality is unmatched. Highly recommend!",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 font-sans">
            Loved by sales teams
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-sans">
            Don&apos;t just take our word for it—here&apos;s what our customers have to say
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border">
              <CardContent className="pt-6">
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-foreground leading-relaxed mb-6 font-sans">
                  &quot;{testimonial.content}&quot;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {testimonial.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-foreground font-sans">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground font-sans">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
