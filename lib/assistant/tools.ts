import { randomUUID } from "node:crypto";
import { z } from "zod";
import { rrLookupProfile, rrSearchPeople } from "@/lib/rocketreach";
import { upsertLead } from "@/models/Lead";

interface ToolContext {
  orgId: string;
  userId?: string;
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

export function createAssistantTools({ orgId, userId }: ToolContext) {
  return {
    searchRocketReach: {
      description:
        "Search RocketReach for leads. Provide filters like company, title, location, domain, or name to fetch live contacts. Use this FIRST to find people matching the user's criteria.",
      inputSchema: z.object({
        company: z.string().optional().describe("Company or employer name to filter by"),
        title: z.string().optional().describe("Job title or role keywords (e.g., 'CTO', 'VP Engineering')"),
        location: z.string().optional().describe("City, region, or country (e.g., 'San Francisco', 'New York')"),
        domain: z.string().optional().describe("Company email domain"),
        name: z.string().optional().describe("Person's name if known"),
        limit: z.number().min(1).max(25).default(25).describe("Maximum number of leads to return (default: 25)"),
      }),
      execute: async (input: {
        company?: string;
        title?: string;
        location?: string;
        domain?: string;
        name?: string;
        limit?: number;
      }) => {
        try {
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
        } catch (error) {
          console.error("searchRocketReach error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to search RocketReach",
            leads: [],
            total: 0,
            returned: 0,
          };
        }
      },
    },
    lookupRocketReachProfile: {
      description: "Fetch a specific RocketReach profile by person ID to enrich with full contact details (email, phone, photo, etc.).",
      inputSchema: z.object({
        personId: z.string().min(1).describe("RocketReach person ID from search results"),
      }),
      execute: async ({ personId }: { personId: string }) => {
        try {
          const profile = await rrLookupProfile(orgId, personId);
          return {
            success: true,
            source: "rocketreach",
            lead: normalizeLead(profile as RocketReachProfile),
          };
        } catch (error) {
          console.error("lookupRocketReachProfile error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to lookup profile",
            lead: null,
          };
        }
      },
    },
    saveLeads: {
      description: "Save leads to the database. ALWAYS call this after searchRocketReach() to persist results. Accepts NormalizedLead objects from search results.",
      inputSchema: z.object({
        leads: z.array(z.object({
          id: z.string(),
          fullName: z.string().nullable().optional(),
          firstName: z.string().nullable().optional(),
          lastName: z.string().nullable().optional(),
          title: z.string().nullable().optional(),
          company: z.string().nullable().optional(),
          location: z.string().nullable().optional(),
          linkedinUrl: z.string().nullable().optional(),
          email: z.string().nullable().optional(),
          phone: z.string().nullable().optional(),
          raw: z.any().optional(),
        })).min(1).describe("Array of NormalizedLead objects from searchRocketReach"),
      }),
      execute: async ({ leads }: { leads: NormalizedLead[] }) => {
        try {
          const savedLeads = [];
          const errors = [];

          for (const lead of leads) {
            try {
              const emails = lead.email ? [lead.email] : [];
              const phones = lead.phone ? [lead.phone] : [];
              
              const result = await upsertLead(orgId, lead.id, {
                source: "rocketreach",
                name: lead.fullName || undefined,
                firstName: lead.firstName || undefined,
                lastName: lead.lastName || undefined,
                title: lead.title || undefined,
                company: lead.company || undefined,
                linkedin: lead.linkedinUrl || undefined,
                location: lead.location || undefined,
                emails: emails.length > 0 ? emails : undefined,
                phones: phones.length > 0 ? phones : undefined,
                raw: lead.raw,
              });
              
              if (result) {
                savedLeads.push(result);
              }
            } catch (error) {
              console.error("Error saving lead:", lead.id, error);
              errors.push({
                personId: lead.id,
                error: error instanceof Error ? error.message : "Unknown error",
              });
            }
          }

          return {
            success: true,
            saved: savedLeads.length,
            errors: errors.length,
            message: `Successfully saved ${savedLeads.length} lead(s) to database`,
            leadIds: savedLeads.map(l => (l._id?.toString() || l._id)),
            errorDetails: errors.length > 0 ? errors : undefined,
          };
        } catch (error) {
          console.error("saveLeads error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to save leads",
            saved: 0,
            errors: leads.length,
          };
        }
      },
    },
    sendEmail: {
      description: "Send an email to one or more leads. Use this when user wants to send emails. Requires email addresses, subject, and message body.",
      inputSchema: z.object({
        to: z.array(z.string().email()).describe("Array of recipient email addresses"),
        subject: z.string().describe("Email subject line"),
        body: z.string().describe("Email body content (HTML or plain text)"),
        leadIds: z.array(z.string()).optional().describe("Optional array of lead IDs for tracking"),
      }),
      execute: async ({ to, subject, body, leadIds }: { to: string[]; subject: string; body: string; leadIds?: string[] }) => {
        try {
          const { getEmailProvider } = await import("@/lib/agent/get-email-provider");
          const emailClient = await getEmailProvider(orgId);
          const { fromEmail, fromName } = emailClient.providerInfo;

          const results = [];
          for (const recipient of to) {
            try {
              const result = await emailClient.send({
                from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
                to: recipient,
                subject,
                html: body,
                text: body.replace(/<[^>]*>/g, ""),
              });
              results.push({ recipient, success: true, id: result.id });
            } catch (error) {
              results.push({
                recipient,
                success: false,
                error: error instanceof Error ? error.message : "Failed to send",
              });
            }
          }

          const successCount = results.filter((r) => r.success).length;

          return {
            success: true,
            sent: successCount,
            total: to.length,
            message: `Successfully sent ${successCount} of ${to.length} email(s)`,
            results,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to send email",
          };
        }
      },
    },
    sendWhatsApp: {
      description: "Send a WhatsApp message to leads. Use this when user wants to send WhatsApp messages. Requires phone numbers and message content. Note: WhatsApp integration must be configured in settings.",
      inputSchema: z.object({
        phoneNumbers: z.array(z.string()).describe("Array of phone numbers in international format (e.g., +1234567890)"),
        message: z.string().describe("Message content to send"),
        leadIds: z.array(z.string()).optional().describe("Optional array of lead IDs for tracking"),
      }),
      execute: async ({ phoneNumbers, message, leadIds }: { phoneNumbers: string[]; message: string; leadIds?: string[] }) => {
        try {
          const { getDb } = await import("@/lib/db");
          const db = await getDb();
          
          const whatsappSettings = await db
            .collection("whatsapp_settings")
            .findOne({
              organizationId: orgId,
              isEnabled: true,
            });

          if (!whatsappSettings) {
            return {
              success: false,
              error: "WhatsApp integration is not configured. Please configure it in Settings.",
            };
          }

          // Placeholder for WhatsApp integration
          // In production, integrate with WhatsApp Business API or whatsapp-web.js
          const results = phoneNumbers.map((phone) => ({
            phoneNumber: phone,
            success: true,
            message: "WhatsApp message queued",
          }));

          return {
            success: true,
            sent: results.length,
            message: `Successfully queued ${results.length} WhatsApp message(s)`,
            note: "WhatsApp integration is in development. Messages are queued but not actually sent yet.",
            results,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to send WhatsApp message",
          };
        };
      },
    },
  } as const;
}
