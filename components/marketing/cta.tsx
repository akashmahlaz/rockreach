"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 font-sans">
          Ready to transform your business?
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto font-sans">
          Join thousands of businesses streamlining their operations,
          managing schedules, and growing with data-driven insights.
        </p>
        <Button asChild size="lg" className="px-8 py-6 text-lg font-sans">
          <Link href="/api/auth/signin">Start for free</Link>
        </Button>
      </div>
    </section>
  )
}
