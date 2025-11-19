"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    question: "What is LogiGrow and who is it for?",
    answer:
      "LogiGrow is an AI-powered lead generation platform designed for sales teams, marketers, and businesses looking to streamline their prospecting process. It's perfect for B2B companies, agencies, and growth teams that need to find and connect with qualified prospects efficiently.",
  },
  {
    question: "How does the AI-powered search work?",
    answer:
      "Our AI understands natural language queries. Simply describe the type of prospects you're looking for (e.g., 'Find CTOs at SaaS companies in San Francisco'), and our AI will search our database, verify contact information, and return qualified leads with verified emails and phone numbers.",
  },
  {
    question: "Can I integrate LogiGrow with my existing tools?",
    answer:
      "Yes! LogiGrow integrates seamlessly with popular CRM systems, email platforms, and marketing automation tools. We support APIs and webhooks for custom integrations with your existing workflow.",
  },
  {
    question: "What kind of support do you provide?",
    answer:
      "We offer 24/7 customer support via email, dedicated account managers for enterprise clients, comprehensive documentation, and onboarding assistance to help you get started quickly.",
  },
  {
    question: "Is my data secure with LogiGrow?",
    answer:
      "Absolutely. We use enterprise-grade security measures including end-to-end encryption, SOC 2 compliance, and regular security audits. Your data is stored in secure, redundant data centers.",
  },
  {
    question: "How do I get started with LogiGrow?",
    answer:
      "Getting started is simple! Sign up for our free trial, connect your existing systems, and our onboarding team will help you set up your first lead search within 24 hours.",
  },
]

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 font-sans">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground font-sans">
            Everything you need to know about LogiGrow
          </p>
        </div>

        <div className="space-y-2">
          {faqData.map((item, index) => {
            const isOpen = openItems.includes(index)

            return (
              <div key={index} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-6 py-4 flex justify-between items-center gap-4 text-left hover:bg-secondary transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="font-medium text-foreground font-sans">{item.question}</span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 text-muted-foreground shrink-0 transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>

                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300",
                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="px-6 pb-4 text-muted-foreground font-sans leading-relaxed">
                    {item.answer}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
