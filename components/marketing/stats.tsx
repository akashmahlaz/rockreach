import { Card } from "@/components/ui/card";

const stats = [
  { value: "50M+", label: "Verified Profiles" },
  { value: "99.9%", label: "Email Accuracy" },
  { value: "10x", label: "Faster Than Manual" },
  { value: "24/7", label: "AI Assistant" },
];

export function Stats() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 font-sans tracking-tight">
            Trusted by growth teams worldwide
          </h2>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto font-sans">
            Join thousands of companies accelerating their sales pipeline
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-5xl font-bold text-primary-foreground mb-3 font-sans tracking-tight">
                {stat.value}
              </div>
              <div className="text-primary-foreground/80 text-base font-sans">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
