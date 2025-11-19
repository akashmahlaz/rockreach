"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

export default function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annually">("annually")

  const pricing = {
    starter: {
      monthly: 0,
      annually: 0,
    },
    professional: {
      monthly: 20,
      annually: 16,
    },
    enterprise: {
      monthly: 200,
      annually: 160,
    },
  }

  const plans = [
    {
      name: "Starter",
      description: "Perfect for individuals and small teams getting started.",
      features: [
        "Up to 100 leads per month",
        "Basic search functionality",
        "Email verification",
        "Community support",
        "Basic analytics",
      ],
      featured: false,
    },
    {
      name: "Professional",
      description: "Advanced features for growing teams and businesses.",
      features: [
        "Unlimited leads",
        "Advanced search & filters",
        "AI-powered enrichment",
        "Priority support",
        "Advanced analytics",
        "Email campaigns",
        "API access",
        "Custom integrations",
      ],
      featured: true,
    },
    {
      name: "Enterprise",
      description: "Complete solution for large organizations and enterprises.",
      features: [
        "Everything in Professional",
        "Dedicated account manager",
        "24/7 phone support",
        "Custom onboarding",
        "Advanced security features",
        "SSO integration",
        "Custom contracts",
        "White-label options",
      ],
      featured: false,
    },
  ]

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full border bg-secondary">
            <span className="text-sm font-medium text-foreground font-sans">Plans & Pricing</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 font-sans">
            Choose the perfect plan for your business
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-sans">
            Scale your operations with flexible pricing that grows with your team.
            Start free, upgrade when you&apos;re ready.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-2 p-1 bg-secondary rounded-lg border">
            <button
              onClick={() => setBillingPeriod("annually")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors font-sans ${
                billingPeriod === "annually"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annually
            </button>
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors font-sans ${
                billingPeriod === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const planKey = plan.name.toLowerCase() as keyof typeof pricing
            const price = pricing[planKey][billingPeriod]
            
            return (
              <Card
                key={plan.name}
                className={`relative ${plan.featured ? "border-primary border-2" : ""}`}
              >
                {plan.featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium font-sans">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl font-sans">{plan.name}</CardTitle>
                  <CardDescription className="font-sans">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-foreground font-sans">${price}</span>
                      <span className="text-muted-foreground font-sans">
                        /{billingPeriod === "monthly" ? "month" : "year"}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    className={`w-full ${plan.featured ? "" : "variant-outline"}`}
                    variant={plan.featured ? "default" : "outline"}
                  >
                    {price === 0 ? "Start for free" : plan.name === "Enterprise" ? "Contact sales" : "Get started"}
                  </Button>
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground font-sans">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
