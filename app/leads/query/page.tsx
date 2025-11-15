"use client";

import { useEffect, useMemo, useState } from "react";
import { QueryHero } from "@/components/leads/query-hero";
import { AIThinkingStepper } from "@/components/leads/ai-thinking-stepper";
import { FilterBadges } from "@/components/leads/filter-badges";
import { ProfileList, type Profile } from "@/components/leads/profile-list";
import { ProfileCard } from "@/components/leads/profile-card";
import { MessagingAssistant } from "@/components/leads/messaging-assistant";
import { toast } from "sonner";

const AI_STEPS = [
  "Understanding your query",
  "Collecting profiles from RocketReach",
  "Enriching with AI",
  "Validating emails",
  "Preparing results",
];

const MOCK_PROFILES: Profile[] = [
  {
    id: "1",
    name: "Elise Walker",
    title: "CEO & Co-founder",
    company: "Orbit Affiliate Group",
    email: "elise@orbitaffiliates.com",
    phone: "+1 (415) 555-0186",
    location: "San Francisco, CA",
    tags: ["CEO", "Affiliate", "Decision Maker"],
    linkedinUrl: "https://linkedin.com/in/elise",
  },
  {
    id: "2",
    name: "Marcus Chen",
    title: "Chief Growth Officer",
    company: "AdSonic Labs",
    email: "marcus@adsoniclabs.com",
    phone: "+1 (917) 555-4826",
    location: "New York, NY",
    tags: ["Growth", "Affiliate", "US"],
    linkedinUrl: "https://linkedin.com/in/marcus",
  },
  {
    id: "3",
    name: "Priya Khatri",
    title: "VP Partnerships",
    company: "BoostMedia",
    email: "priya@boostmedia.co",
    phone: "+44 20 7946 0655",
    location: "London, UK",
    tags: ["Partnerships", "EMEA"],
    linkedinUrl: "https://linkedin.com/in/priya",
  },
];

export default function LeadQueryPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "thinking" | "results">("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [parsedFilters, setParsedFilters] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>(MOCK_PROFILES);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(MOCK_PROFILES[0]?.id ?? "");

  const selectedProfile = useMemo(
    () => profiles.find(({ id }) => id === selectedProfileId) ?? profiles[0],
    [profiles, selectedProfileId]
  );

  // Simulate AI thinking steps
  useEffect(() => {
    if (status !== "thinking") return;

    const timers: NodeJS.Timeout[] = [];

    AI_STEPS.forEach((_, idx) => {
      timers.push(
        setTimeout(() => {
          setCurrentStep(idx + 1);
          if (idx === AI_STEPS.length - 1) {
            setStatus("results");
            setParsedFilters([
              "Role: CEO / CGO",
              "Industry: Affiliate Marketing",
              "Regions: US & UK",
            ]);
          }
        }, 800 * (idx + 1))
      );
    });

    return () => timers.forEach(clearTimeout);
  }, [status]);

  // Handle query submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setStatus("thinking");
    setCurrentStep(0);
    setParsedFilters([]);

    try {
      const response = await fetch("/api/leads/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (response.ok) {
        const data = await response.json();
        setParsedFilters(data?.parsedFilters ?? []);
        setProfiles(data?.previewResults ?? MOCK_PROFILES);
        setSelectedProfileId((data?.previewResults?.[0]?.id as string | undefined) ?? MOCK_PROFILES[0]?.id ?? "");
        toast.success("Profiles loaded successfully!");
      }
    } catch (error) {
      console.error("Failed to parse query", error);
      toast.error("Failed to search. Showing mock data.");
      // Keep mock data on error
    }
  }

  // Handle message generation
  async function handleGenerateMessage(tone: "professional" | "casual" | "sales" | "follow-up", depth: "Light" | "Medium" | "Deep"): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const firstName = selectedProfile?.name.split(" ")[0] || "there";
        const company = selectedProfile?.company || "your company";
        const personalizationLevel = depth === "Deep" ? "highly personalized" : depth === "Medium" ? "moderately personalized" : "lightly personalized";
        resolve(
          `Hi ${firstName},\n\nI noticed the work you and ${company} have been doing. We built an AI prospector that feeds teams verified partner intros in minutes.\n\nWould it be helpful if I sent over a quick walkthrough?\n\nBest,\nLogician AI\n\n[${tone} tone, ${personalizationLevel}]`
        );
      }, 900);
    });
  }

  // Handle message sending
  async function handleSendMessage(message: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log("Sending message:", message.substring(0, 50) + "...");
        toast.success(`Email sent to ${selectedProfile?.email}!`);
        resolve();
      }, 600);
    });
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50/30">
      {/* Hero Section */}
      <QueryHero
        query={query}
        onQueryChange={setQuery}
        onSubmit={handleSubmit}
        isLoading={status === "thinking"}
      />

      {/* AI Progress Section */}
      {status !== "idle" && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-6">
          <AIThinkingStepper
            status={status}
            currentStep={currentStep}
          />
        </section>
      )}

      {/* Parsed Filters */}
      {parsedFilters.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-6">
          <FilterBadges filters={parsedFilters} />
        </section>
      )}

      {/* Results Section - 3 Panel Layout */}
      {status === "results" && profiles.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {/* Profile List - Left Panel */}
            <div className="lg:col-span-3">
              <ProfileList
                profiles={profiles}
                selectedProfileId={selectedProfileId}
                onSelectProfile={setSelectedProfileId}
              />
            </div>

            {/* Profile Detail - Middle Panel */}
            <div className="lg:col-span-5">
              {selectedProfile && <ProfileCard profile={selectedProfile} />}
            </div>

            {/* Messaging Assistant - Right Panel */}
            <div className="lg:col-span-4">
              {selectedProfile && (
                <MessagingAssistant
                  profileName={selectedProfile.name}
                  onGenerate={handleGenerateMessage}
                  onSend={handleSendMessage}
                />
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
