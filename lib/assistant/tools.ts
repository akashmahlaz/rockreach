import { randomUUID } from "node:crypto";
import { z } from "zod";
import { rrLookupProfile, rrSearchPeople } from "@/lib/rocketreach";

interface ToolContext {
  orgId: string;
}

type RocketReachEmail = {
  email?: string | null;
  confidence?: string | number | null;
};

type RocketReachPhone = {
  number?: string | null;
  type?: string | null;
};

interface RocketReachProfile {
  id?: string | number;
  profile_id?: string | number;
  rocketreach_id?: string | number;
  linkedin_url?: string;
  public_profile_url?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  firstname?: string;
  lastname?: string;
  current_title?: string;
  title?: string;
  current_employer?: string;
  company?: string;
  location?: string;
  geo?: string;
  city_state?: string;
  linkedin_city?: string;
  emails?: RocketReachEmail[];
  email?: string;
  phones?: RocketReachPhone[];
  phone?: string;
  [key: string]: unknown;
}

interface RocketReachSearchResponse {
  profiles?: RocketReachProfile[];
  pagination?: {
    total?: number;
  };
}

type NormalizedLead = {
  id: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  title: string | null;
  company: string | null;
  location: string | null;
  linkedinUrl: string | null;
  email: string | null;
  phone: string | null;
  confidence: string | null;
  summary: string;
  raw: RocketReachProfile;
};

function normalizeLead(profile: RocketReachProfile): NormalizedLead {
  const emailEntry = Array.isArray(profile.emails)
    ? profile.emails.find((entry): entry is RocketReachEmail => typeof entry?.email === "string")
    : undefined;
  const phoneEntry = Array.isArray(profile.phones)
    ? profile.phones.find((entry): entry is RocketReachPhone => typeof entry?.number === "string")
    : undefined;
  const firstEmail = emailEntry?.email ?? profile.email ?? null;
  const firstPhone = phoneEntry?.number ?? profile.phone ?? null;
  const firstName = profile.first_name ?? profile.firstname ?? null;
  const lastName = profile.last_name ?? profile.lastname ?? null;
  const fallbackName = [firstName, lastName].filter(Boolean).join(" ");
  const name = profile.name ?? (fallbackName.length ? fallbackName : null);
  const title = profile.current_title ?? profile.title ?? null;
  const company = profile.current_employer ?? profile.company ?? null;
  const location =
    profile.location ?? profile.geo ?? profile.city_state ?? profile.linkedin_city ?? null;

  const summaryParts = [title && `${title} @ ${company ?? "Unknown org"}`, location].filter(Boolean);

  return {
    id: String(
      profile.id ||
        profile.profile_id ||
        profile.rocketreach_id ||
        profile.linkedin_url ||
        profile.public_profile_url ||
        name ||
        randomUUID()
    ),
    fullName: name,
    firstName,
    lastName,
    title,
    company,
    location,
    linkedinUrl: profile.linkedin_url ?? profile.public_profile_url ?? null,
    email: firstEmail,
    phone: firstPhone,
    confidence: Array.isArray(profile.emails) && profile.emails[0]?.confidence
      ? String(profile.emails[0]?.confidence)
      : null,
    summary: summaryParts.join(" · ") || "Lead details fetched from RocketReach",
    raw: profile,
  };
}

export function createAssistantTools({ orgId }: ToolContext) {
  return {
    searchRocketReach: {
      description:
        "Search RocketReach for leads. Provide filters like company, title, location, domain, or name to fetch live contacts.",
      inputSchema: z.object({
        company: z.string().optional().describe("Company or employer name to filter by"),
        title: z.string().optional().describe("Job title or role keywords"),
        location: z.string().optional().describe("City, region, or country"),
        domain: z.string().optional().describe("Company email domain"),
        name: z.string().optional().describe("Person's name if known"),
        limit: z.number().min(1).max(25).default(10).describe("Maximum number of leads to return"),
      }),
      execute: async (input: {
        company?: string;
        title?: string;
        location?: string;
        domain?: string;
        name?: string;
        limit?: number;
      }) => {
        const limit = input.limit ?? 10;
        const response = (await rrSearchPeople(orgId, {
          company: input.company,
          title: input.title,
          location: input.location,
          domain: input.domain,
          name: input.name,
          page_size: limit,
        })) as RocketReachSearchResponse;

        const profiles = Array.isArray(response?.profiles)
          ? response.profiles
          : [];

        const leads = profiles.slice(0, limit).map((profile: RocketReachProfile) => normalizeLead(profile));

        return {
          success: true,
          source: "rocketreach",
          total: response?.pagination?.total ?? leads.length,
          returned: leads.length,
          leads,
        };
      },
    },
    lookupRocketReachProfile: {
      description: "Fetch a specific RocketReach profile by person ID for richer contact info.",
      inputSchema: z.object({
        personId: z.string().min(1).describe("RocketReach person ID"),
      }),
      execute: async ({ personId }: { personId: string }) => {
        const profile = await rrLookupProfile(orgId, personId);
        return {
          success: true,
          source: "rocketreach",
          lead: normalizeLead(profile as RocketReachProfile),
        };
      },
    },
  } as const;
}
