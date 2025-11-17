/**
 * Advanced Database Query Tools for AI Assistant
 * Gives AI full access to query and analyze the entire database
 */

import { z } from "zod";
import { getDb } from "@/lib/db";

interface ToolContext {
  orgId: string;
  userId?: string;
}

export function createDatabaseTools({ orgId, userId }: ToolContext) {
  return {
    queryDatabase: {
      description: `Query ANY collection in the database with MongoDB syntax. Use this to answer questions about:
- Total leads count: db.leads.count()
- Recent conversations: db.conversations.find().sort({createdAt: -1})
- Email campaigns: db.email_campaigns.find()
- Search history: db.lead_searches.find()
- API usage statistics: db.api_usage.aggregate()
- Organization settings: db.organizations.findOne()
- User activity: db.audit_logs.find()

You have FULL database access. Query anything the user asks about.`,
      inputSchema: z.object({
        collection: z.string().describe("Collection name (e.g., 'leads', 'conversations', 'email_campaigns')"),
        operation: z.enum(['find', 'findOne', 'count', 'aggregate', 'distinct']).describe("MongoDB operation"),
        filter: z.record(z.any()).optional().describe("MongoDB filter/query object (e.g., {company: 'Acme'})"),
        projection: z.record(z.any()).optional().describe("Fields to return (e.g., {name: 1, email: 1})"),
        sort: z.record(z.number()).optional().describe("Sort order (e.g., {createdAt: -1})"),
        limit: z.number().optional().default(100).describe("Maximum results to return"),
        pipeline: z.array(z.any()).optional().describe("Aggregation pipeline for complex queries"),
      }),
      execute: async (input: {
        collection: string;
        operation: 'find' | 'findOne' | 'count' | 'aggregate' | 'distinct';
        filter?: Record<string, any>;
        projection?: Record<string, any>;
        sort?: Record<string, number>;
        limit?: number;
        pipeline?: any[];
      }) => {
        try {
          const db = await getDb();
          const coll = db.collection(input.collection);

          // Add orgId filter for security (except for system collections)
          const systemCollections = ['organizations', 'users', 'ai_providers', 'email_providers'];
          const secureFilter = systemCollections.includes(input.collection)
            ? input.filter || {}
            : { ...input.filter, orgId };

          let result;

          switch (input.operation) {
            case 'find':
              result = await coll
                .find(secureFilter, { projection: input.projection })
                .sort(input.sort || {})
                .limit(input.limit || 100)
                .toArray();
              break;

            case 'findOne':
              result = await coll.findOne(secureFilter, { projection: input.projection });
              break;

            case 'count':
              result = await coll.countDocuments(secureFilter);
              break;

            case 'aggregate':
              if (!input.pipeline) {
                throw new Error("Pipeline required for aggregate operation");
              }
              // Inject orgId filter at start of pipeline for security
              const securePipeline = systemCollections.includes(input.collection)
                ? input.pipeline
                : [{ $match: { orgId } }, ...input.pipeline];
              result = await coll.aggregate(securePipeline).toArray();
              break;

            case 'distinct':
              const field = input.projection ? Object.keys(input.projection)[0] : '_id';
              result = await coll.distinct(field, secureFilter);
              break;

            default:
              throw new Error(`Unsupported operation: ${input.operation}`);
          }

          return {
            success: true,
            collection: input.collection,
            operation: input.operation,
            resultCount: Array.isArray(result) ? result.length : 1,
            data: result,
            message: `Found ${Array.isArray(result) ? result.length : typeof result === 'number' ? result : 1} result(s) from ${input.collection}`,
          };
        } catch (error) {
          console.error("queryDatabase error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Database query failed",
            message: `Failed to query ${input.collection}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      },
    },

    getLeadStatistics: {
      description: "Get comprehensive statistics about leads: total count, by company, by location, by title, email/phone coverage, recent additions, etc.",
      inputSchema: z.object({
        groupBy: z.enum(['company', 'location', 'title', 'source', 'createdDate']).optional().describe("Group statistics by field"),
        dateRange: z.object({
          start: z.string().optional(),
          end: z.string().optional(),
        }).optional().describe("Filter by date range"),
      }),
      execute: async (input: { groupBy?: string; dateRange?: { start?: string; end?: string } }) => {
        try {
          const db = await getDb();
          const leads = db.collection('leads');

          const dateFilter: any = { orgId };
          if (input.dateRange?.start || input.dateRange?.end) {
            dateFilter.createdAt = {};
            if (input.dateRange.start) dateFilter.createdAt.$gte = new Date(input.dateRange.start);
            if (input.dateRange.end) dateFilter.createdAt.$lte = new Date(input.dateRange.end);
          }

          const [total, withEmail, withPhone, bySource] = await Promise.all([
            leads.countDocuments(dateFilter),
            leads.countDocuments({ ...dateFilter, emails: { $exists: true, $ne: [] } }),
            leads.countDocuments({ ...dateFilter, phones: { $exists: true, $ne: [] } }),
            leads.aggregate([
              { $match: dateFilter },
              { $group: { _id: '$source', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
            ]).toArray(),
          ]);

          let groupedData = null;
          if (input.groupBy) {
            groupedData = await leads.aggregate([
              { $match: dateFilter },
              { $group: { _id: `$${input.groupBy}`, count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 20 },
            ]).toArray();
          }

          return {
            success: true,
            statistics: {
              total,
              withEmail,
              withPhone,
              emailCoverage: total > 0 ? Math.round((withEmail / total) * 100) : 0,
              phoneCoverage: total > 0 ? Math.round((withPhone / total) * 100) : 0,
              bySource,
              grouped: groupedData,
            },
            message: `📊 Lead Statistics:\n- **Total Leads**: ${total}\n- **With Email**: ${withEmail} (${total > 0 ? Math.round((withEmail / total) * 100) : 0}%)\n- **With Phone**: ${withPhone} (${total > 0 ? Math.round((withPhone / total) * 100) : 0}%)`,
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
      description: "Search through conversation history. Find past searches, messages, or topics discussed.",
      inputSchema: z.object({
        query: z.string().optional().describe("Text to search for in messages"),
        limit: z.number().optional().default(10).describe("Number of conversations to return"),
        sortBy: z.enum(['recent', 'oldest']).optional().default('recent'),
      }),
      execute: async (input: { query?: string; limit?: number; sortBy?: 'recent' | 'oldest' }) => {
        try {
          const db = await getDb();
          const conversations = db.collection('conversations');

          const filter: any = { userId };
          if (input.query) {
            filter.$or = [
              { title: { $regex: input.query, $options: 'i' } },
              { 'messages.content': { $regex: input.query, $options: 'i' } },
            ];
          }

          const results = await conversations
            .find(filter)
            .sort({ createdAt: input.sortBy === 'recent' ? -1 : 1 })
            .limit(input.limit || 10)
            .toArray();

          return {
            success: true,
            conversations: results.map(c => ({
              id: c._id,
              title: c.title,
              messageCount: c.messages?.length || 0,
              createdAt: c.createdAt,
              lastMessage: c.messages?.[c.messages.length - 1]?.content?.substring(0, 100),
            })),
            total: results.length,
            message: `Found ${results.length} conversation(s)${input.query ? ` matching "${input.query}"` : ''}`,
          };
        } catch (error) {
          console.error("searchConversations error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to search conversations",
          };
        }
      },
    },

    getRecentActivity: {
      description: "Get recent activity across the platform: new leads, searches, emails sent, API calls, etc.",
      inputSchema: z.object({
        hours: z.number().optional().default(24).describe("Look back this many hours"),
        activityTypes: z.array(z.enum(['leads', 'searches', 'emails', 'api_calls', 'conversations'])).optional(),
      }),
      execute: async (input: { hours?: number; activityTypes?: string[] }) => {
        try {
          const db = await getDb();
          const since = new Date(Date.now() - (input.hours || 24) * 60 * 60 * 1000);

          const activities: any = {};

          if (!input.activityTypes || input.activityTypes.includes('leads')) {
            activities.newLeads = await db.collection('leads').countDocuments({
              orgId,
              createdAt: { $gte: since },
            });
          }

          if (!input.activityTypes || input.activityTypes.includes('searches')) {
            activities.searches = await db.collection('lead_searches').countDocuments({
              orgId,
              createdAt: { $gte: since },
            });
          }

          if (!input.activityTypes || input.activityTypes.includes('conversations')) {
            activities.conversations = await db.collection('conversations').countDocuments({
              userId,
              createdAt: { $gte: since },
            });
          }

          if (!input.activityTypes || input.activityTypes.includes('api_calls')) {
            const apiStats = await db.collection('api_usage').aggregate([
              { $match: { orgId, timestamp: { $gte: since } } },
              {
                $group: {
                  _id: '$status',
                  count: { $sum: 1 },
                  totalCost: { $sum: '$cost' },
                },
              },
            ]).toArray();
            activities.apiCalls = apiStats;
          }

          return {
            success: true,
            timeRange: `Last ${input.hours || 24} hours`,
            activities,
            message: `📈 Recent Activity (${input.hours || 24}h):\n${Object.entries(activities).map(([key, val]) => `- ${key}: ${typeof val === 'number' ? val : JSON.stringify(val)}`).join('\n')}`,
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
      description: "Advanced lead search with complex filters: multiple companies, titles, locations, date ranges, email domains, etc.",
      inputSchema: z.object({
        companies: z.array(z.string()).optional().describe("Array of company names"),
        titles: z.array(z.string()).optional().describe("Array of job titles (partial match)"),
        locations: z.array(z.string()).optional().describe("Array of locations"),
        emailDomains: z.array(z.string()).optional().describe("Array of email domains (e.g., ['gmail.com', 'acme.com'])"),
        hasEmail: z.boolean().optional().describe("Filter leads with/without email"),
        hasPhone: z.boolean().optional().describe("Filter leads with/without phone"),
        tags: z.array(z.string()).optional().describe("Filter by tags"),
        dateAdded: z.object({
          start: z.string().optional(),
          end: z.string().optional(),
        }).optional(),
        limit: z.number().optional().default(50),
      }),
      execute: async (input: any) => {
        try {
          const db = await getDb();
          const leads = db.collection('leads');

          const filter: any = { orgId };

          if (input.companies?.length) {
            filter.company = { $in: input.companies.map((c: string) => new RegExp(c, 'i')) };
          }

          if (input.titles?.length) {
            filter.title = { $in: input.titles.map((t: string) => new RegExp(t, 'i')) };
          }

          if (input.locations?.length) {
            filter.location = { $in: input.locations.map((l: string) => new RegExp(l, 'i')) };
          }

          if (input.emailDomains?.length) {
            filter['emails.email'] = {
              $regex: `@(${input.emailDomains.join('|')})$`,
              $options: 'i',
            };
          }

          if (input.hasEmail === true) {
            filter.emails = { $exists: true, $ne: [] };
          } else if (input.hasEmail === false) {
            filter.$or = [
              { emails: { $exists: false } },
              { emails: [] },
            ];
          }

          if (input.hasPhone === true) {
            filter.phones = { $exists: true, $ne: [] };
          } else if (input.hasPhone === false) {
            filter.$or = [
              { phones: { $exists: false } },
              { phones: [] },
            ];
          }

          if (input.tags?.length) {
            filter.tags = { $in: input.tags };
          }

          if (input.dateAdded) {
            filter.createdAt = {};
            if (input.dateAdded.start) filter.createdAt.$gte = new Date(input.dateAdded.start);
            if (input.dateAdded.end) filter.createdAt.$lte = new Date(input.dateAdded.end);
          }

          const results = await leads
            .find(filter)
            .limit(input.limit || 50)
            .toArray();

          return {
            success: true,
            leads: results,
            count: results.length,
            filters: input,
            message: `Found ${results.length} lead(s) matching your advanced search criteria`,
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
