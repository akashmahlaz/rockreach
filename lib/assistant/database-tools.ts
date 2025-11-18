import { z } from "zod";
import { ObjectId } from "mongodb";

interface ToolContext {
  orgId: string;
  userId?: string;
}

/**
 * FULL DATABASE ACCESS TOOLS
 * 
 * These tools give the AI complete access to query ANY collection in the database.
 * The AI can now answer questions about:
 * - Users and their activities
 * - Conversations and chat history
 * - Leads and their details
 * - Organizations and settings
 * - API usage and analytics
 * - Everything in the database!
 */
export function createDatabaseTools({ orgId, userId }: ToolContext) {
  return {
    queryDatabase: {
      description: `Query ANY collection in the database with full MongoDB operations. 
      
Use this powerful tool to:
- Find users: db.users.find({email: "..."})
- Search conversations: db.conversations.find({userId: "..."})
- Get leads: db.leads.find({company: "Google"})
- Check settings: db.settings.findOne({orgId: "..."})
- Analytics: db.api_usage.aggregate([...])
- ANY MongoDB query you need!

Available operations:
- find: Search for multiple documents
- findOne: Get a single document
- count: Count documents
- aggregate: Complex aggregations
- distinct: Get unique values

Security: Automatically filters by orgId for data isolation (except system collections like users, settings).`,
      inputSchema: z.object({
        collection: z.string().describe("Collection name (e.g., 'users', 'conversations', 'leads', 'api_usage')"),
        operation: z.enum(["find", "findOne", "count", "aggregate", "distinct"]).describe("MongoDB operation to perform"),
        query: z.record(z.string(), z.any()).optional().describe("Query filter (MongoDB query syntax). Leave empty for all documents."),
        projection: z.record(z.string(), z.any()).optional().describe("Fields to include/exclude in results"),
        sort: z.record(z.string(), z.number()).optional().describe("Sort order (e.g., {createdAt: -1} for newest first)"),
        limit: z.number().optional().default(50).describe("Maximum documents to return (default: 50, max: 200)"),
        skip: z.number().optional().describe("Number of documents to skip (for pagination)"),
        pipeline: z.array(z.record(z.string(), z.any())).optional().describe("Aggregation pipeline stages (for aggregate operation)"),
        field: z.string().optional().describe("Field name (for distinct operation)"),
      }),
      execute: async (input: {
        collection: string;
        operation: "find" | "findOne" | "count" | "aggregate" | "distinct";
        query?: Record<string, unknown>;
        projection?: Record<string, unknown>;
        sort?: Record<string, number>;
        limit?: number;
        skip?: number;
        pipeline?: Record<string, unknown>[];
        field?: string;
      }) => {
        try {
          const { getDb } = await import("@/lib/db");
          const db = await getDb();
          
          const limit = Math.min(input.limit || 50, 200); // Cap at 200 for performance
          let query = input.query || {};
          
          // Auto-inject orgId filter for data isolation (except for system collections)
          const systemCollections = [
            'users', 'organizations', 'settings', 'ai_providers', 
            'provider_settings', 'rocketreach_settings', 'email_providers',
            'whatsapp_settings', 'system_logs', 'temp_files'
          ];
          
          const isSystemCollection = systemCollections.includes(input.collection);
          
          // For non-system collections, always filter by orgId
          if (!isSystemCollection && orgId) {
            query = { ...query, orgId };
          }
          
          // For user-specific collections, also filter by userId if available
          const userCollections = ['conversations', 'api_usage', 'audit_logs'];
          if (userCollections.includes(input.collection) && userId) {
            query = { ...query, userId };
          }
          
          const collection = db.collection(input.collection);
          let result: unknown;
          
          switch (input.operation) {
            case "find":
              result = await collection
                .find(query, { projection: input.projection })
                .sort((input.sort as any) || {})
                .skip(input.skip || 0)
                .limit(limit)
                .toArray();
              break;
              
            case "findOne":
              result = await collection.findOne(query, { projection: input.projection });
              break;
              
            case "count":
              result = await collection.countDocuments(query);
              break;
              
            case "aggregate":
              if (!input.pipeline) {
                return {
                  success: false,
                  error: "Pipeline required for aggregate operation",
                };
              }
              // Inject orgId filter at start of pipeline if needed
              const pipeline = isSystemCollection
                ? input.pipeline
                : [{ $match: { orgId } }, ...input.pipeline];
              
              result = await collection.aggregate(pipeline).limit(limit).toArray();
              break;
              
            case "distinct":
              if (!input.field) {
                return {
                  success: false,
                  error: "Field required for distinct operation",
                };
              }
              result = await collection.distinct(input.field, query);
              break;
              
            default:
              return {
                success: false,
                error: `Unknown operation: ${input.operation}`,
              };
          }
          
          return {
            success: true,
            collection: input.collection,
            operation: input.operation,
            resultCount: Array.isArray(result) ? result.length : typeof result === 'number' ? result : result ? 1 : 0,
            data: result,
            message: `Successfully queried ${input.collection} collection`,
          };
        } catch (error) {
          console.error("queryDatabase error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Database query failed",
            message: "Failed to query database. Check your query syntax and try again.",
          };
        }
      },
    },
    
    getLeadStatistics: {
      description: `Get comprehensive statistics and analytics about leads in the database.
      
Provides insights like:
- Total lead count
- Email/phone coverage percentages
- Leads by company, location, title
- Data quality metrics
- Recent lead additions
- Top sources of leads

Use this when user asks about lead analytics, statistics, or data quality.`,
      inputSchema: z.object({
        groupBy: z.enum(["company", "location", "title", "source", "createdDate"]).optional()
          .describe("Group leads by this field for detailed breakdown"),
        dateRange: z.object({
          from: z.string().optional().describe("Start date (ISO format)"),
          to: z.string().optional().describe("End date (ISO format)"),
        }).optional().describe("Filter leads by date range"),
        companyFilter: z.string().optional().describe("Filter by specific company name"),
      }),
      execute: async (input: {
        groupBy?: "company" | "location" | "title" | "source" | "createdDate";
        dateRange?: { from?: string; to?: string };
        companyFilter?: string;
      }) => {
        try {
          const { getDb } = await import("@/lib/db");
          const db = await getDb();
          
          const collection = db.collection('leads');
          const matchStage: Record<string, unknown> = { orgId };
          
          // Apply filters
          if (input.dateRange) {
            const dateFilter: Record<string, unknown> = {};
            if (input.dateRange.from) {
              dateFilter.$gte = new Date(input.dateRange.from);
            }
            if (input.dateRange.to) {
              dateFilter.$lte = new Date(input.dateRange.to);
            }
            if (Object.keys(dateFilter).length > 0) {
              matchStage.createdAt = dateFilter;
            }
          }
          
          if (input.companyFilter) {
            matchStage.company = { $regex: input.companyFilter, $options: 'i' };
          }
          
          // Get overall statistics
          const stats = await collection.aggregate([
            { $match: matchStage },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                withEmail: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ["$emails", []] } }, 0] }, 1, 0] } },
                withPhone: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ["$phones", []] } }, 0] }, 1, 0] } },
                withLinkedIn: { $sum: { $cond: [{ $ne: ["$linkedin", null] }, 1, 0] } },
                avgScore: { $avg: "$score" },
              },
            },
          ]).toArray();
          
          const basicStats = stats[0] || {
            total: 0,
            withEmail: 0,
            withPhone: 0,
            withLinkedIn: 0,
            avgScore: 0,
          };
          
          // Get grouped data if requested
          let groupedData = null;
          if (input.groupBy) {
            const groupField = input.groupBy === 'createdDate' 
              ? { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
              : `$${input.groupBy}`;
            
            groupedData = await collection.aggregate([
              { $match: matchStage },
              {
                $group: {
                  _id: groupField,
                  count: { $sum: 1 },
                  withEmail: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ["$emails", []] } }, 0] }, 1, 0] } },
                  withPhone: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ["$phones", []] } }, 0] }, 1, 0] } },
                },
              },
              { $sort: { count: -1 } },
              { $limit: 20 },
            ]).toArray();
          }
          
          return {
            success: true,
            statistics: {
              total: basicStats.total,
              emailCoverage: basicStats.total > 0 
                ? Math.round((basicStats.withEmail / basicStats.total) * 100) 
                : 0,
              phoneCoverage: basicStats.total > 0
                ? Math.round((basicStats.withPhone / basicStats.total) * 100)
                : 0,
              linkedInCoverage: basicStats.total > 0
                ? Math.round((basicStats.withLinkedIn / basicStats.total) * 100)
                : 0,
              averageScore: basicStats.avgScore ? Math.round(basicStats.avgScore * 100) / 100 : null,
            },
            groupedData: groupedData || undefined,
            message: `Lead statistics calculated successfully (${basicStats.total} total leads)`,
          };
        } catch (error) {
          console.error("getLeadStatistics error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get statistics",
          };
        }
      },
    },
    
    searchConversations: {
      description: `Search through conversation history to find past discussions, questions, or searches.
      
Use this when user asks:
- "What did we discuss about X?"
- "Show my previous searches"
- "What questions did I ask earlier?"
- "Find conversations about [topic]"

This searches through message content, titles, and metadata.`,
      inputSchema: z.object({
        searchText: z.string().describe("Text to search for in conversations"),
        limit: z.number().optional().default(10).describe("Maximum conversations to return"),
        includeMessages: z.boolean().optional().default(false).describe("Include message content in results"),
      }),
      execute: async (input: {
        searchText: string;
        limit?: number;
        includeMessages?: boolean;
      }) => {
        try {
          const { getDb } = await import("@/lib/db");
          const db = await getDb();
          
          const collection = db.collection('conversations');
          const limit = Math.min(input.limit || 10, 50);
          
          // Search in title and messages
          const conversations = await collection.find({
            userId,
            $or: [
              { title: { $regex: input.searchText, $options: 'i' } },
              { 'messages.content': { $regex: input.searchText, $options: 'i' } },
            ],
          })
          .sort({ updatedAt: -1 })
          .limit(limit)
          .toArray();
          
          // Format results
          const results = conversations.map(conv => {
            const matchingMessages = input.includeMessages
              ? (conv.messages || []).filter((msg: { content?: string }) => 
                  msg.content && msg.content.toLowerCase().includes(input.searchText.toLowerCase())
                ).map((msg: { role?: string; content?: string; createdAt?: Date }) => ({
                  role: msg.role,
                  content: msg.content?.substring(0, 200) + (msg.content && msg.content.length > 200 ? '...' : ''),
                  createdAt: msg.createdAt,
                }))
              : undefined;
            
            return {
              id: conv._id?.toString(),
              title: conv.title,
              createdAt: conv.createdAt,
              updatedAt: conv.updatedAt,
              messageCount: (conv.messages || []).length,
              matchingMessages,
            };
          });
          
          return {
            success: true,
            found: results.length,
            conversations: results,
            message: `Found ${results.length} conversation(s) matching "${input.searchText}"`,
          };
        } catch (error) {
          console.error("searchConversations error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Search failed",
          };
        }
      },
    },
    
    getRecentActivity: {
      description: `Get recent activity and changes across the platform.
      
Shows:
- Recently added leads
- Recent searches performed
- Recent emails sent
- Recent API calls
- Recent conversation activity
- System events

Use this when user asks: "What's been happening?", "Show recent activity", "What did I do today?"`,
      inputSchema: z.object({
        hours: z.number().optional().default(24).describe("How many hours back to look (default: 24)"),
        activityTypes: z.array(z.enum(["leads", "conversations", "api_usage", "emails", "searches"]))
          .optional()
          .describe("Specific activity types to include (defaults to all)"),
      }),
      execute: async (input: {
        hours?: number;
        activityTypes?: ("leads" | "conversations" | "api_usage" | "emails" | "searches")[];
      }) => {
        try {
          const { getDb } = await import("@/lib/db");
          const db = await getDb();
          
          const hours = Math.min(input.hours || 24, 168); // Max 7 days
          const since = new Date(Date.now() - hours * 60 * 60 * 1000);
          
          const activities: Record<string, unknown> = {};
          const types = input.activityTypes || ["leads", "conversations", "api_usage"];
          
          // Get recent leads
          if (types.includes("leads")) {
            const recentLeads = await db.collection('leads')
              .find({ orgId, createdAt: { $gte: since } })
              .sort({ createdAt: -1 })
              .limit(20)
              .toArray();
            
            activities.leads = {
              count: recentLeads.length,
              recent: recentLeads.slice(0, 5).map(lead => ({
                name: lead.name,
                company: lead.company,
                title: lead.title,
                createdAt: lead.createdAt,
              })),
            };
          }
          
          // Get recent conversations
          if (types.includes("conversations")) {
            const recentConvs = await db.collection('conversations')
              .find({ userId, updatedAt: { $gte: since } })
              .sort({ updatedAt: -1 })
              .limit(10)
              .toArray();
            
            activities.conversations = {
              count: recentConvs.length,
              recent: recentConvs.slice(0, 5).map(conv => ({
                id: conv._id?.toString(),
                title: conv.title,
                messageCount: (conv.messages || []).length,
                updatedAt: conv.updatedAt,
              })),
            };
          }
          
          // Get API usage
          if (types.includes("api_usage")) {
            const apiCalls = await db.collection('api_usage')
              .find({ orgId, createdAt: { $gte: since } })
              .sort({ createdAt: -1 })
              .limit(100)
              .toArray();
            
            const successCount = apiCalls.filter(call => call.status === 'success').length;
            const totalUnits = apiCalls.reduce((sum, call) => sum + (call.units || 0), 0);
            
            activities.api_usage = {
              totalCalls: apiCalls.length,
              successRate: apiCalls.length > 0 
                ? Math.round((successCount / apiCalls.length) * 100) 
                : 0,
              totalUnits,
              recentEndpoints: apiCalls.slice(0, 10).map(call => ({
                endpoint: call.endpoint,
                status: call.status,
                createdAt: call.createdAt,
              })),
            };
          }
          
          return {
            success: true,
            period: `Last ${hours} hours`,
            since: since.toISOString(),
            activities,
            message: `Retrieved activity for the last ${hours} hour(s)`,
          };
        } catch (error) {
          console.error("getRecentActivity error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get activity",
          };
        }
      },
    },
    
    advancedLeadSearch: {
      description: `Perform advanced lead searches with complex filters and criteria.
      
Supports:
- Multiple companies OR locations OR titles
- Email domain filtering
- Date range filters
- Tag/list membership
- Score/quality filters
- LinkedIn presence
- Contact availability (email/phone)

Use this for complex queries like:
- "Find all CTOs OR VPs at Google OR Microsoft in SF OR NYC"
- "Show leads with gmail.com emails added this week"
- "Find high-quality leads (score > 80) without phone numbers"`,
      inputSchema: z.object({
        companies: z.array(z.string()).optional().describe("List of companies to search (OR condition)"),
        titles: z.array(z.string()).optional().describe("List of titles to search (OR condition)"),
        locations: z.array(z.string()).optional().describe("List of locations to search (OR condition)"),
        emailDomains: z.array(z.string()).optional().describe("Filter by email domains (e.g., ['gmail.com', 'yahoo.com'])"),
        hasEmail: z.boolean().optional().describe("Filter by email presence"),
        hasPhone: z.boolean().optional().describe("Filter by phone presence"),
        hasLinkedIn: z.boolean().optional().describe("Filter by LinkedIn presence"),
        minScore: z.number().optional().describe("Minimum lead quality score (0-100)"),
        dateRange: z.object({
          from: z.string().optional(),
          to: z.string().optional(),
        }).optional().describe("Filter by creation date"),
        tags: z.array(z.string()).optional().describe("Filter by tags"),
        limit: z.number().optional().default(50).describe("Maximum results to return"),
      }),
      execute: async (input: {
        companies?: string[];
        titles?: string[];
        locations?: string[];
        emailDomains?: string[];
        hasEmail?: boolean;
        hasPhone?: boolean;
        hasLinkedIn?: boolean;
        minScore?: number;
        dateRange?: { from?: string; to?: string };
        tags?: string[];
        limit?: number;
      }) => {
        try {
          const { getDb } = await import("@/lib/db");
          const db = await getDb();
          
          const query: Record<string, unknown> = { orgId };
          const orConditions: Record<string, unknown>[] = [];
          
          // Build OR conditions for companies, titles, locations
          if (input.companies && input.companies.length > 0) {
            orConditions.push({
              company: { $in: input.companies.map(c => new RegExp(c, 'i')) },
            });
          }
          
          if (input.titles && input.titles.length > 0) {
            orConditions.push({
              title: { $in: input.titles.map(t => new RegExp(t, 'i')) },
            });
          }
          
          if (input.locations && input.locations.length > 0) {
            orConditions.push({
              location: { $in: input.locations.map(l => new RegExp(l, 'i')) },
            });
          }
          
          if (orConditions.length > 0) {
            query.$or = orConditions;
          }
          
          // Email domain filter
          if (input.emailDomains && input.emailDomains.length > 0) {
            query['emails.0'] = {
              $regex: `@(${input.emailDomains.join('|')})$`,
              $options: 'i',
            };
          }
          
          // Presence filters
          if (input.hasEmail === true) {
            query.emails = { $exists: true, $ne: [], $not: { $size: 0 } };
          } else if (input.hasEmail === false) {
            query.$or = [
              { emails: { $exists: false } },
              { emails: [] },
            ];
          }
          
          if (input.hasPhone === true) {
            query.phones = { $exists: true, $ne: [], $not: { $size: 0 } };
          } else if (input.hasPhone === false) {
            query.$or = [
              { phones: { $exists: false } },
              { phones: [] },
            ];
          }
          
          if (input.hasLinkedIn === true) {
            query.linkedin = { $exists: true, $ne: null };
          } else if (input.hasLinkedIn === false) {
            query.$or = [
              { linkedin: { $exists: false } },
              { linkedin: null },
            ];
          }
          
          // Score filter
          if (input.minScore !== undefined) {
            query.score = { $gte: input.minScore };
          }
          
          // Date range
          if (input.dateRange) {
            const dateFilter: Record<string, unknown> = {};
            if (input.dateRange.from) {
              dateFilter.$gte = new Date(input.dateRange.from);
            }
            if (input.dateRange.to) {
              dateFilter.$lte = new Date(input.dateRange.to);
            }
            if (Object.keys(dateFilter).length > 0) {
              query.createdAt = dateFilter;
            }
          }
          
          // Tags filter
          if (input.tags && input.tags.length > 0) {
            query.tags = { $in: input.tags };
          }
          
          const limit = Math.min(input.limit || 50, 200);
          
          const leads = await db.collection('leads')
            .find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .toArray();
          
          // Format results
          const results = leads.map(lead => ({
            id: lead._id?.toString(),
            name: lead.name,
            firstName: lead.firstName,
            lastName: lead.lastName,
            title: lead.title,
            company: lead.company,
            location: lead.location,
            email: lead.emails?.[0],
            phone: lead.phones?.[0],
            linkedin: lead.linkedin,
            score: lead.score,
            tags: lead.tags,
            createdAt: lead.createdAt,
          }));
          
          return {
            success: true,
            found: results.length,
            total: await db.collection('leads').countDocuments(query),
            leads: results,
            query: {
              description: "Advanced search executed",
              filters: {
                companies: input.companies,
                titles: input.titles,
                locations: input.locations,
                emailDomains: input.emailDomains,
                hasEmail: input.hasEmail,
                hasPhone: input.hasPhone,
                hasLinkedIn: input.hasLinkedIn,
                minScore: input.minScore,
              },
            },
            message: `Found ${results.length} lead(s) matching advanced criteria`,
          };
        } catch (error) {
          console.error("advancedLeadSearch error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Advanced search failed",
          };
        }
      },
    },
  } as const;
}
