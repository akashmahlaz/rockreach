/**
 * Ultra Pro Tools - Advanced AI Capabilities
 * File uploads, image analysis, bulk operations, AI-powered insights
 */

import { z } from "zod";
import { getDb } from "@/lib/db";
import { randomUUID } from "crypto";

interface ToolContext {
  orgId: string;
  userId?: string;
}

export function createProTools({ orgId, userId }: ToolContext) {
  return {
    analyzeLeadData: {
      description: "AI-powered analysis of lead data: identify patterns, suggest best prospects, find data quality issues, recommend actions",
      inputSchema: z.object({
        analysisType: z.enum([
          'best_prospects',
          'data_quality',
          'company_clusters',
          'title_patterns',
          'location_insights',
          'engagement_potential',
        ]).describe("Type of analysis to perform"),
        limit: z.number().optional().default(100).describe("Number of leads to analyze"),
      }),
      execute: async (input: { analysisType: string; limit?: number }) => {
        try {
          const db = await getDb();
          const leads = await db.collection('leads')
            .find({ orgId })
            .limit(input.limit || 100)
            .toArray();

          let analysis: any = {};

          switch (input.analysisType) {
            case 'best_prospects':
              // Score leads based on data completeness
              const scored = leads.map(lead => ({
                ...lead,
                score: (
                  (lead.emails?.length ? 25 : 0) +
                  (lead.phones?.length ? 25 : 0) +
                  (lead.linkedin ? 20 : 0) +
                  (lead.title ? 15 : 0) +
                  (lead.company ? 15 : 0)
                ),
              })).sort((a, b) => b.score - a.score);

              analysis = {
                topProspects: scored.slice(0, 10).map(l => ({
                  name: l.name,
                  title: l.title,
                  company: l.company,
                  score: l.score,
                  hasEmail: !!l.emails?.length,
                  hasPhone: !!l.phones?.length,
                })),
                averageScore: scored.reduce((sum, l) => sum + l.score, 0) / scored.length,
              };
              break;

            case 'data_quality':
              const total = leads.length;
              const withEmail = leads.filter(l => l.emails?.length).length;
              const withPhone = leads.filter(l => l.phones?.length).length;
              const withLinkedIn = leads.filter(l => l.linkedin).length;
              const complete = leads.filter(l => 
                l.emails?.length && l.phones?.length && l.linkedin && l.title && l.company
              ).length;

              analysis = {
                totalLeads: total,
                dataCompleteness: {
                  email: `${withEmail}/${total} (${Math.round(withEmail/total*100)}%)`,
                  phone: `${withPhone}/${total} (${Math.round(withPhone/total*100)}%)`,
                  linkedin: `${withLinkedIn}/${total} (${Math.round(withLinkedIn/total*100)}%)`,
                  fullyComplete: `${complete}/${total} (${Math.round(complete/total*100)}%)`,
                },
                recommendations: [
                  withEmail < total * 0.8 ? "🔴 Low email coverage - consider enriching leads" : "✅ Good email coverage",
                  withPhone < total * 0.5 ? "🔴 Low phone coverage - run phone enrichment" : "✅ Decent phone coverage",
                  complete < total * 0.3 ? "🔴 Many incomplete profiles - prioritize data enrichment" : "✅ Good data quality",
                ],
              };
              break;

            case 'company_clusters':
              const companyCounts = leads.reduce((acc: any, lead) => {
                const company = lead.company || 'Unknown';
                acc[company] = (acc[company] || 0) + 1;
                return acc;
              }, {});

              analysis = {
                topCompanies: Object.entries(companyCounts)
                  .sort(([,a]: any, [,b]: any) => b - a)
                  .slice(0, 15)
                  .map(([company, count]) => ({ company, leadCount: count })),
                totalCompanies: Object.keys(companyCounts).length,
              };
              break;

            case 'title_patterns':
              const titleCounts = leads.reduce((acc: any, lead) => {
                const title = lead.title || 'Unknown';
                // Group similar titles
                const normalized = title.toLowerCase()
                  .replace(/\b(ceo|chief executive officer)\b/g, 'CEO')
                  .replace(/\b(cto|chief technology officer)\b/g, 'CTO')
                  .replace(/\b(cfo|chief financial officer)\b/g, 'CFO')
                  .replace(/\b(cmo|chief marketing officer)\b/g, 'CMO');
                acc[normalized] = (acc[normalized] || 0) + 1;
                return acc;
              }, {});

              analysis = {
                topTitles: Object.entries(titleCounts)
                  .sort(([,a]: any, [,b]: any) => b - a)
                  .slice(0, 15)
                  .map(([title, count]) => ({ title, count })),
                uniqueTitles: Object.keys(titleCounts).length,
              };
              break;

            case 'location_insights':
              const locationCounts = leads.reduce((acc: any, lead) => {
                const location = lead.location || lead.city || 'Unknown';
                acc[location] = (acc[location] || 0) + 1;
                return acc;
              }, {});

              analysis = {
                topLocations: Object.entries(locationCounts)
                  .sort(([,a]: any, [,b]: any) => b - a)
                  .slice(0, 15)
                  .map(([location, count]) => ({ location, leadCount: count })),
                totalLocations: Object.keys(locationCounts).length,
              };
              break;

            case 'engagement_potential':
              // Analyze recent activity and suggest engagement strategies
              const recentLeads = leads.filter(l => {
                const created = new Date(l.createdAt);
                const daysSince = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
                return daysSince <= 30;
              });

              analysis = {
                recentlyAdded: recentLeads.length,
                readyForOutreach: leads.filter(l => l.emails?.length && l.phones?.length).length,
                needsEnrichment: leads.filter(l => !l.emails?.length || !l.phones?.length).length,
                suggestions: [
                  recentLeads.length > 20 ? `✉️ ${recentLeads.length} new leads ready for outreach campaigns` : "📊 Build more leads for effective campaigns",
                  "📞 Consider multi-channel approach: email + phone + LinkedIn",
                  "🎯 Segment by company/industry for personalized messaging",
                ],
              };
              break;
          }

          return {
            success: true,
            analysisType: input.analysisType,
            analysis,
            message: `🔍 Analysis complete: ${input.analysisType.replace(/_/g, ' ')}`,
          };
        } catch (error) {
          console.error("analyzeLeadData error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Analysis failed",
          };
        }
      },
    },

    bulkEnrichLeads: {
      description: "Bulk enrich multiple leads at once. Get emails and phones for up to 25 leads simultaneously.",
      inputSchema: z.object({
        leadIds: z.array(z.string()).describe("Array of lead/person IDs to enrich"),
        fields: z.array(z.enum(['email', 'phone', 'linkedin', 'all'])).optional().default(['all']),
      }),
      execute: async (input: { leadIds: string[]; fields?: string[] }) => {
        try {
          const db = await getDb();
          const { rrLookupProfile } = await import("@/lib/rocketreach");
          
          const enrichedLeads = [];
          const errors = [];

          for (const personId of input.leadIds.slice(0, 25)) { // Max 25 at a time
            try {
              const profile = await rrLookupProfile(orgId, personId);
              enrichedLeads.push(profile);
              
              // Save to database
              const { upsertLead } = await import("@/models/Lead");
              await upsertLead(orgId, personId, {
                source: "rocketreach",
                emails: profile.emails?.map((e: any) => e.email || e).filter(Boolean),
                phones: profile.phones?.map((p: any) => p.number || p).filter(Boolean),
                linkedin: profile.linkedin_url,
                raw: profile,
              });
            } catch (error) {
              errors.push({
                personId,
                error: error instanceof Error ? error.message : "Enrichment failed",
              });
            }
          }

          return {
            success: true,
            enriched: enrichedLeads.length,
            failed: errors.length,
            total: input.leadIds.length,
            errors: errors.length > 0 ? errors : undefined,
            message: `✓ Enriched ${enrichedLeads.length} of ${input.leadIds.length} lead(s)${errors.length > 0 ? ` (${errors.length} failed)` : ''}`,
          };
        } catch (error) {
          console.error("bulkEnrichLeads error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Bulk enrichment failed",
          };
        }
      },
    },

    createEmailCampaign: {
      description: "Create and schedule an email campaign to multiple leads. Supports personalization and scheduling.",
      inputSchema: z.object({
        name: z.string().describe("Campaign name"),
        subject: z.string().describe("Email subject line (use {name}, {company} for personalization)"),
        body: z.string().describe("Email body HTML (use {name}, {title}, {company} for personalization)"),
        leadIds: z.array(z.string()).optional().describe("Specific lead IDs (if not provided, use filter)"),
        filter: z.object({
          company: z.string().optional(),
          title: z.string().optional(),
          location: z.string().optional(),
        }).optional().describe("Filter leads by criteria"),
        schedule: z.string().optional().describe("ISO date string to schedule (leave empty for immediate)"),
      }),
      execute: async (input: any) => {
        try {
          const db = await getDb();
          const campaignId = randomUUID();

          // Get target leads
          let targetLeads;
          if (input.leadIds) {
            targetLeads = await db.collection('leads')
              .find({ orgId, _id: { $in: input.leadIds } })
              .toArray();
          } else if (input.filter) {
            const filter: any = { orgId, emails: { $exists: true, $ne: [] } };
            if (input.filter.company) filter.company = new RegExp(input.filter.company, 'i');
            if (input.filter.title) filter.title = new RegExp(input.filter.title, 'i');
            if (input.filter.location) filter.location = new RegExp(input.filter.location, 'i');
            targetLeads = await db.collection('leads').find(filter).toArray();
          } else {
            return {
              success: false,
              error: "Must provide either leadIds or filter",
            };
          }

          // Create campaign
          await db.collection('email_campaigns').insertOne({
            campaignId,
            orgId,
            userId,
            name: input.name,
            subject: input.subject,
            body: input.body,
            targetLeads: targetLeads.map(l => l._id),
            status: input.schedule ? 'scheduled' : 'draft',
            scheduledFor: input.schedule ? new Date(input.schedule) : null,
            createdAt: new Date(),
          });

          return {
            success: true,
            campaignId,
            targetCount: targetLeads.length,
            status: input.schedule ? 'scheduled' : 'draft',
            message: `✓ Campaign "${input.name}" created with ${targetLeads.length} recipients${input.schedule ? ` (scheduled for ${new Date(input.schedule).toLocaleString()})` : ''}`,
          };
        } catch (error) {
          console.error("createEmailCampaign error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Campaign creation failed",
          };
        }
      },
    },

    getAIInsights: {
      description: "Get AI-powered insights and recommendations based on platform usage, lead data, and activity patterns",
      inputSchema: z.object({
        insightType: z.enum(['performance', 'opportunities', 'warnings', 'recommendations', 'all']),
      }),
      execute: async (input: { insightType: string }) => {
        try {
          const db = await getDb();

          const [leadCount, apiUsage, recentSearches] = await Promise.all([
            db.collection('leads').countDocuments({ orgId }),
            db.collection('api_usage').find({ orgId }).sort({ timestamp: -1 }).limit(100).toArray(),
            db.collection('lead_searches').find({ orgId }).sort({ createdAt: -1 }).limit(20).toArray(),
          ]);

          const insights: any = {};

          if (input.insightType === 'all' || input.insightType === 'performance') {
            const totalCalls = apiUsage.length;
            const successRate = totalCalls > 0 
              ? (apiUsage.filter(u => u.status === 'success').length / totalCalls * 100).toFixed(1)
              : 0;

            insights.performance = {
              totalLeads: leadCount,
              apiCallsLast24h: totalCalls,
              successRate: `${successRate}%`,
              status: successRate > 95 ? '🟢 Excellent' : successRate > 85 ? '🟡 Good' : '🔴 Needs attention',
            };
          }

          if (input.insightType === 'all' || input.insightType === 'opportunities') {
            const leadsWithEmail = await db.collection('leads').countDocuments({
              orgId,
              emails: { $exists: true, $ne: [] },
            });

            insights.opportunities = [
              leadCount > 100 ? `📧 You have ${leadCount} leads - time to launch email campaigns!` : "📊 Build more leads for effective outreach",
              leadsWithEmail > 50 ? `✉️ ${leadsWithEmail} leads ready for email outreach` : "🔍 Enrich more leads with email addresses",
              "🎯 Use advanced filters to segment high-value prospects",
              "📊 Export data to CSV for CRM integration",
            ];
          }

          if (input.insightType === 'all' || input.insightType === 'warnings') {
            const warnings = [];
            
            const errorRate = apiUsage.length > 0
              ? apiUsage.filter(u => u.status === 'error').length / apiUsage.length
              : 0;

            if (errorRate > 0.1) warnings.push("⚠️ High API error rate - check RocketReach credits");
            if (leadCount === 0) warnings.push("⚠️ No leads in database - start searching!");
            if (recentSearches.length === 0) warnings.push("💡 No recent searches - platform underutilized");

            insights.warnings = warnings.length > 0 ? warnings : ["✅ All systems running smoothly"];
          }

          if (input.insightType === 'all' || input.insightType === 'recommendations') {
            insights.recommendations = [
              "🚀 Pro tip: Use bulk enrichment to get contact details for multiple leads at once",
              "📊 Try advanced lead analysis to identify best prospects",
              "🎯 Create targeted email campaigns using lead filters",
              "💾 Regularly export your data for backup and CRM sync",
              "📈 Monitor API usage to optimize your RocketReach credits",
            ];
          }

          return {
            success: true,
            insights,
            message: "🤖 AI Insights generated based on your platform activity",
          };
        } catch (error) {
          console.error("getAIInsights error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to generate insights",
          };
        }
      },
    },
  } as const;
}
