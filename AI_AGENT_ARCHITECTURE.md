# AI Agent System Architecture for Logician

## Overview
Build an autonomous AI agent that can browse websites, find leads, send personalized emails, track responses, and take follow-up actions - all without human intervention.

## Conversation Assistant (ChatGPT-style experience)

### Goals
- Deliver a dedicated `/assistant` surface that mimics ChatGPT’s layout while inheriting the hero section palette (`bg-linear-to-t from-amber-200 to-white`, slate typography, pill CTAs).
- Stream DeepSeek (default) or other configured LLM responses via SSE with a v0.dev-inspired “thinking ribbon” that animates above the composer.
- Orchestrate RocketReach-powered lead lookups in real time—no mock data, every suggestion ties back to actual `rrSearchPeople` results stored in MongoDB.
- Persist every turn (prompt, retrieved leads, tool calls, tokens) for auditability and agent learning.

### Frontend Surface
| Layer | Implementation Notes |
| --- | --- |
| Route | `app/assistant/page.tsx` (server) loads session + org + default AI provider, then renders `AssistantClient`. |
| Client | `app/assistant/assistant-client.tsx` uses `useChat` from `ai/react` for streaming, but overrides render props to inject hero-themed bubbles: warm cream background panels, slate copy, amber accent borders. |
| Layout | Section wrapper mirrors hero: `bg-linear-to-t from-amber-200/60 via-white to-white`, glassmorphic chat window (`bg-white/80 border border-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.12)] rounded-4xl`). Composer floats with pill controls; send CTA reuses hero button styles. |
| Loader | v0.dev-style “breathing” bar: `before` pseudo-element sweeps amber gradient across a thin pill placed above the input whenever `isThinking`. |
| Message Cards | User messages align right with slate/white pill, assistant replies align left with subtle amber glow, optional inline lead cards rendered via `components/leads/profile-card` but recolored to hero palette for consistency. |
| Context Drawer | Collapsible rail on the right that surfaces RocketReach hits, API usage, and step-by-step reasoning; matches hero badge styling (`bg-white/85 border-slate-50 rounded-full`). |

### Server Pipeline
1. **Entry point** – `app/api/assistant/stream/route.ts` (POST) authenticates via `auth()`, resolves `orgId`, and creates/updates a conversation record in `assistant_conversations`.
2. **Provider selection** – uses `getAIProvider(orgId, providerId?)` (default flagged provider or explicit DeepSeek). Converts to `ai` SDK model factory (`deepseek('deepseek-chat')` etc.).
3. **Context assembly** – loads latest leads, saved searches, and prior assistant turns for the conversation. Adds hero-specific style instructions (tone, formatting) plus org guardrails (PII, compliance) to the system prompt.
4. **Tool wiring** – exposes `searchLeadsRealTime`, `fetchLeadDetails`, `summarizeLeadList`, and `logStep`. Each tool internally calls RocketReach helpers (`rrSearchPeople`, `rrLookupProfile`) and persists structured results to `assistant_messages` subdocuments.
5. **Streaming** – uses `streamText` from `ai` to push SSE chunks (text + tool status) back to the client. Simultaneously logs token usage to `ApiUsage` and updates `assistant_conversations` with incremental deltas for resume-on-refresh.
6. **Completion hook** – once finish reason is reached, final chunk includes `leadReferences[]` so client can render cards. Store the assistant response, tool outputs, tokens, provider metadata, and hero color context for analytics.

### Data Model Additions
- `Collections.ASSISTANT_CONVERSATIONS`
  - `_id`, `organizationId`, `userId`, `title`, `createdAt`, `updatedAt`, `lastMessageAt`, `activeProviderId`, `context` (saved filters, ICP notes), `colorTheme` (frozen hero snapshot for deterministic styling).
- `Collections.ASSISTANT_MESSAGES`
  - `conversationId`, `role` (`user|assistant|tool`), `content`, `toolCalls[]`, `leadRefs[]` (ObjectId of leads), `rocketReachPayload` (raw response for audit), `tokenUsage`, `createdAt`.

### RocketReach Integration Flow (no mocks)
1. User asks for leads ➝ assistant requests `searchLeadsRealTime` tool.
2. Tool grabs auth context (orgId), calls `rrSearchPeople` with filters extracted from the LLM (title, company, location, etc.).
3. Responses are normalized into `Lead` documents via existing `models/Lead.ts` helpers; duplicates are merged, and references stored in `assistant_messages.leadRefs`.
4. Summaries in the chat cite actual leads (`“Found Priya (CTO @ NimbusHR)”`) with `leadId` so clicking a chip opens the real profile drawer.
5. Errors (rate limits, bad params) bubble back as structured tool outputs so the assistant can explain what happened.

### DeepSeek & Multi-Provider Strategy
- Add DeepSeek credentials through the existing AI Provider admin UI (provider=`deepseek`).
- `app/api/assistant/stream` always tries `providerId` from the request; if missing, fall back to the default provider flagged in `AI_PROVIDERS`.
- Provider metadata (model name, temperature, baseUrl) is injected into the `streamText` call. `response.usage` updates both `assistant_messages.tokenUsage` and `ApiUsage` for cost tracking.
- Future-ready: because we rely on `getAIProvider`, swapping to GPT/Gemini just requires toggling the default provider—no code changes in the assistant stack.

### Hero Palette Guardrails
- Define a shared token file (e.g., `lib/theme/hero.ts`) exporting the exact utility strings and custom CSS variables (`--hero-cream`, `--hero-amber`, `--hero-slate`).
- Assistant components import these tokens to keep gradients, borders, and typography synchronized with `components/marketing/hero.tsx`.
- Snapshot the palette and store it on each conversation so historic threads remember the styling hints if the hero ever changes.

### Streaming Reliability & UX polish
- Composer disables send while a request is in flight; pressing `Esc` cancels by hitting `/api/assistant/stream/cancel` which looks up the in-progress controller and aborts the `streamText` request.
- Skeleton state (v0-style loader) triggers immediately on submit and ends on `done` chunk to avoid flicker.
- Auto-scroll is offset-aware, ensuring the hero gradient background remains visible at the top for branding continuity.

### Next Steps Breakdown
1. Scaffold `/app/assistant` route + client shell with hero-themed styling + loader.
2. Implement `assistant_conversations` + `assistant_messages` models and wire them into `Collections` constants.
3. Ship `/api/assistant/stream` with DeepSeek default + RocketReach tool wiring.
4. Add QA hooks (unit tests for tool schema parsing, integration tests hitting a mocked RocketReach server, visual regression on hero-aligned components).

---


## 🤖 Agent Capabilities

### 1. **Lead Discovery Agent**
**Goal**: Autonomously find and qualify leads

**Tools the Agent Uses**:
- `searchGoogle`: Find companies matching criteria
- `visitWebsite`: Browse company websites and extract info
- `searchLeadsWithRocketReach`: **USES YOUR ROCKETREACH API** - Find leads by name, title, company
- `lookupLinkedInProfile`: **USES YOUR ROCKETREACH API** - Get contact info from LinkedIn URL
- `extractContactInfo`: Get email addresses and phone numbers from RocketReach data
- `qualifyLead`: Score lead based on ICP (Ideal Customer Profile)
- `saveLead`: Store qualified leads in database

**Example Flow**:
```typescript
const result = await generateText({
  model: openai('gpt-4o'),
  stopWhen: stepCountIs(20),
  tools: leadDiscoveryTools,
  prompt: `
    Find 50 SaaS companies in the HR tech space with:
    - 50-200 employees
    - Series A-C funding
    - Located in USA
    
    For each company:
    1. Visit their website
    2. Extract tech stack information
    3. Use RocketReach API to find the CTO or VP of Engineering
    4. Get their contact information via RocketReach
    5. Qualify based on our ICP
    6. Save to database if score > 70
  `
});
```

### 2. **Email Outreach Agent**
**Goal**: Autonomously send personalized emails and manage follow-ups

**Tools the Agent Uses**:
- `researchLead`: Deep dive into lead's background
- `findCommonConnections`: Look for mutual connections
- `generatePersonalizedEmail`: Create custom email based on research
- `validateEmail`: Check email deliverability
- `sendEmail`: Send via SMTP
- `scheduleFollowUp`: Set reminder for follow-up
- `trackEngagement`: Monitor opens/clicks

**Example Flow**:
```typescript
const result = await streamText({
  model: openai('gpt-4o'),
  stopWhen: stepCountIs(15),
  tools: emailOutreachTools,
  prompt: `
    For each lead in the "Q4_Outreach" list:
    1. Research their recent LinkedIn activity
    2. Check if we have mutual connections
    3. Generate a personalized email referencing their recent posts
    4. Validate their email address
    5. Send the email
    6. Schedule follow-up for 3 days if no response
    
    Stop after processing 25 leads today.
  `
});
```

### 3. **Response Management Agent**
**Goal**: Monitor inbox, qualify responses, and take appropriate actions

**Tools the Agent Uses**:
- `checkInbox`: Poll for new email responses
- `classifyResponse`: Categorize (interested/not-interested/question/out-of-office)
- `extractIntent`: Understand what the lead wants
- `updateLeadStatus`: Update CRM status
- `scheduleCall`: Book a meeting if interested
- `generateReply`: Craft appropriate response
- `sendReply`: Send follow-up email
- `notifyHuman`: Alert sales team for hot leads

**Example Flow**:
```typescript
const result = await generateText({
  model: openai('gpt-4o'),
  stopWhen: stepCountIs(30),
  tools: responseManagementTools,
  prompt: `
    Check inbox for responses to our outreach campaigns.
    
    For each response:
    1. Classify the sentiment and intent
    2. If positive interest:
       - Update lead status to "qualified"
       - Try to schedule a call using Calendly
       - Notify sales team via Slack
    3. If question asked:
       - Generate helpful response
       - Send reply
       - Schedule follow-up
    4. If not interested:
       - Update status to "not interested"
       - Remove from active campaigns
    5. If out of office:
       - Schedule retry in 1 week
  `
});
```

## 🛠️ Implementation Plan

### Phase 1: Foundation (Week 1-2)

#### 1.1 Create Agent Tools Infrastructure

```typescript
// File: lib/agent-tools/index.ts

import { tool } from 'ai';
import { z } from 'zod';

// Web browsing tool
export const visitWebsiteTool = tool({
  description: 'Visit a website and extract information',
  inputSchema: z.object({
    url: z.string().url(),
    extractionGoal: z.string().describe('What information to extract'),
  }),
  execute: async ({ url, extractionGoal }) => {
    // Use Puppeteer or Playwright to browse
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    
    // Extract content
    const content = await page.evaluate(() => document.body.innerText);
    await browser.close();
    
    // Use AI to extract relevant info
    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema: z.object({
        companyName: z.string(),
        industry: z.string(),
        employeeCount: z.string().optional(),
        techStack: z.array(z.string()).optional(),
        summary: z.string(),
      }),
      prompt: `Extract information from this website content: ${content}\n\nGoal: ${extractionGoal}`,
    });
    
    return object;
  },
});

// RocketReach search tool - USES YOUR EXISTING API
export const searchLeadsWithRocketReachTool = tool({
  description: 'Search for leads using RocketReach API - finds contact info including emails and phone numbers',
  inputSchema: z.object({
    name: z.string().optional(),
    title: z.string().optional(),
    company: z.string().optional(),
    location: z.string().optional(),
    keyword: z.string().optional(),
  }),
  execute: async (params) => {
    // Uses your existing lib/rocketreach.ts
    const { rrSearchPeople } = await import('@/lib/rocketreach');
    
    const results = await rrSearchPeople(
      session.user.organizationId, // From context
      params
    );
    
    return results.map(person => ({
      id: person.id,
      name: person.name,
      title: person.current_title,
      company: person.current_employer,
      email: person.emails?.[0],
      phone: person.phones?.[0],
      linkedInUrl: person.linkedin_url,
      location: person.location,
      raw: person, // Full RocketReach data
    }));
  },
});

// RocketReach profile lookup tool - USES YOUR EXISTING API
export const lookupLinkedInProfileTool = tool({
  description: 'Lookup a LinkedIn profile using RocketReach to get contact info',
  inputSchema: z.object({
    linkedInUrl: z.string().url(),
  }),
  execute: async ({ linkedInUrl }) => {
    // Uses your existing API endpoint
    const response = await fetch('/api/leads/lookup-linkedin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: linkedInUrl }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to lookup LinkedIn profile');
    }
    
    const { lead } = await response.json();
    
    return {
      name: lead.name,
      title: lead.title,
      company: lead.company,
      emails: lead.emails,
      phones: lead.phones,
      linkedInUrl: lead.linkedInUrl,
      location: lead.location,
      rawData: lead,
    };
  },
});

// Email generation tool
export const generatePersonalizedEmailTool = tool({
  description: 'Generate a personalized email for a lead',
  inputSchema: z.object({
    leadName: z.string(),
    leadTitle: z.string(),
    companyName: z.string(),
    companyInfo: z.string(),
    recentActivity: z.string().optional(),
    tone: z.enum(['casual', 'professional', 'friendly']),
  }),
  execute: async (input) => {
    const { text } = await generateText({
      model: openai('gpt-4o'),
      prompt: `
        Generate a personalized cold email for:
        - Name: ${input.leadName}
        - Title: ${input.leadTitle}
        - Company: ${input.companyName}
        - Company Info: ${input.companyInfo}
        ${input.recentActivity ? `- Recent Activity: ${input.recentActivity}` : ''}
        
        Tone: ${input.tone}
        
        Requirements:
        - Keep it under 150 words
        - Include a clear CTA
        - Reference something specific about their company
        - No generic templates
        - Sound human, not salesy
      `,
    });
    
    return {
      subject: extractSubjectLine(text),
      body: text,
    };
  },
});

// Email sending tool
export const sendEmailTool = tool({
  description: 'Send an email via SMTP',
  inputSchema: z.object({
    to: z.string().email(),
    subject: z.string(),
    body: z.string(),
    fromEmailId: z.string(),
    campaignId: z.string().optional(),
    leadId: z.string(),
  }),
  execute: async (input) => {
    // Get SMTP settings
    const smtpSettings = await getSMTPSettings(input.fromEmailId);
    
    // Send email
    const messageId = await sendEmail({
      to: input.to,
      subject: input.subject,
      body: input.body,
      smtp: smtpSettings,
    });
    
    // Track in database
    await trackEmailSent({
      messageId,
      campaignId: input.campaignId,
      leadId: input.leadId,
      subject: input.subject,
      sentAt: new Date(),
    });
    
    return {
      success: true,
      messageId,
      sentAt: new Date().toISOString(),
    };
  },
});

// Response checking tool
export const checkEmailResponsesTool = tool({
  description: 'Check for email responses',
  inputSchema: z.object({
    campaignId: z.string().optional(),
    sinceDate: z.string().optional(),
  }),
  execute: async ({ campaignId, sinceDate }) => {
    // Query email tracking database
    const responses = await db.collection('email_tracking').find({
      campaignId,
      repliedAt: { $gte: new Date(sinceDate || Date.now() - 86400000) },
    }).toArray();
    
    return responses.map(r => ({
      leadId: r.leadId,
      replyText: r.replyText,
      replyFrom: r.replyFrom,
      repliedAt: r.repliedAt,
    }));
  },
});

// Lead qualification tool
export const qualifyLeadTool = tool({
  description: 'Score and qualify a lead based on ICP',
  inputSchema: z.object({
    leadData: z.object({
      company: z.string(),
      title: z.string(),
      employeeCount: z.number().optional(),
      industry: z.string().optional(),
      funding: z.string().optional(),
      techStack: z.array(z.string()).optional(),
    }),
    icpCriteria: z.object({
      targetIndustries: z.array(z.string()),
      targetTitles: z.array(z.string()),
      minEmployees: z.number(),
      maxEmployees: z.number(),
      requiredTech: z.array(z.string()).optional(),
    }),
  }),
  execute: async ({ leadData, icpCriteria }) => {
    let score = 0;
    const reasons = [];
    
    // Industry match
    if (icpCriteria.targetIndustries.some(ind => 
      leadData.industry?.toLowerCase().includes(ind.toLowerCase())
    )) {
      score += 30;
      reasons.push('Industry match');
    }
    
    // Title match
    if (icpCriteria.targetTitles.some(title => 
      leadData.title.toLowerCase().includes(title.toLowerCase())
    )) {
      score += 25;
      reasons.push('Title match');
    }
    
    // Company size
    if (leadData.employeeCount && 
        leadData.employeeCount >= icpCriteria.minEmployees && 
        leadData.employeeCount <= icpCriteria.maxEmployees) {
      score += 20;
      reasons.push('Company size match');
    }
    
    // Tech stack match
    if (leadData.techStack && icpCriteria.requiredTech) {
      const techMatches = leadData.techStack.filter(tech =>
        icpCriteria.requiredTech!.some(req => 
          tech.toLowerCase().includes(req.toLowerCase())
        )
      ).length;
      
      if (techMatches > 0) {
        score += techMatches * 5;
        reasons.push(`${techMatches} tech stack matches`);
      }
    }
    
    return {
      score,
      qualified: score >= 70,
      reasons,
      recommendation: score >= 90 ? 'hot-lead' : score >= 70 ? 'warm-lead' : 'nurture',
    };
  },
});
```

#### 1.2 Create Agent Controller

```typescript
// File: lib/agent/controller.ts

import { generateText, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import * as agentTools from '@/lib/agent-tools';

export interface AgentTask {
  id: string;
  userId: string;
  organizationId: string;
  type: 'lead-discovery' | 'email-outreach' | 'response-management';
  prompt: string;
  tools: string[]; // Tool names to make available
  maxSteps: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results: any[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export class AgentController {
  private task: AgentTask;
  
  constructor(task: AgentTask) {
    this.task = task;
  }
  
  async run() {
    try {
      this.task.status = 'running';
      this.task.startedAt = new Date();
      await this.saveTask();
      
      // Select tools based on task type
      const tools = this.getToolsForTask();
      
      // Run the agent
      const result = await generateText({
        model: openai('gpt-4o'),
        stopWhen: stepCountIs(this.task.maxSteps),
        tools,
        prompt: this.task.prompt,
        onStepFinish: async ({ toolCalls, toolResults, text }) => {
          // Save progress after each step
          this.task.results.push({
            step: this.task.results.length + 1,
            toolCalls,
            toolResults,
            text,
            timestamp: new Date(),
          });
          await this.saveTask();
        },
      });
      
      this.task.status = 'completed';
      this.task.completedAt = new Date();
      await this.saveTask();
      
      return result;
      
    } catch (error) {
      this.task.status = 'failed';
      this.task.completedAt = new Date();
      await this.saveTask();
      throw error;
    }
  }
  
  private getToolsForTask() {
    const toolMap = {
      'lead-discovery': {
        searchGoogle: agentTools.searchGoogleTool,
        visitWebsite: agentTools.visitWebsiteTool,
        searchLinkedIn: agentTools.searchLinkedInTool,
        extractContactInfo: agentTools.extractContactInfoTool,
        qualifyLead: agentTools.qualifyLeadTool,
        saveLead: agentTools.saveLeadTool,
      },
      'email-outreach': {
        researchLead: agentTools.researchLeadTool,
        generateEmail: agentTools.generatePersonalizedEmailTool,
        validateEmail: agentTools.validateEmailTool,
        sendEmail: agentTools.sendEmailTool,
        scheduleFollowUp: agentTools.scheduleFollowUpTool,
      },
      'response-management': {
        checkInbox: agentTools.checkEmailResponsesTool,
        classifyResponse: agentTools.classifyResponseTool,
        extractIntent: agentTools.extractIntentTool,
        updateLeadStatus: agentTools.updateLeadStatusTool,
        generateReply: agentTools.generateReplyTool,
        sendReply: agentTools.sendEmailTool,
        notifyHuman: agentTools.notifyHumanTool,
      },
    };
    
    return toolMap[this.task.type] || {};
  }
  
  private async saveTask() {
    await db.collection('agent_tasks').updateOne(
      { _id: this.task.id },
      { $set: this.task },
      { upsert: true }
    );
  }
}
```

#### 1.3 Create Agent API Endpoints

```typescript
// File: app/api/agent/tasks/route.ts

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { AgentController } from '@/lib/agent/controller';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await req.json();
  const { type, prompt, maxSteps = 20 } = body;
  
  // Create agent task
  const task = {
    id: crypto.randomUUID(),
    userId: session.user.id,
    organizationId: session.user.organizationId,
    type,
    prompt,
    maxSteps,
    status: 'pending',
    results: [],
    createdAt: new Date(),
  };
  
  // Run agent in background
  const controller = new AgentController(task);
  controller.run().catch(console.error);
  
  return Response.json({ taskId: task.id });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const taskId = req.nextUrl.searchParams.get('taskId');
  
  if (taskId) {
    // Get specific task
    const task = await db.collection('agent_tasks').findOne({ 
      _id: taskId,
      userId: session.user.id,
    });
    return Response.json({ task });
  } else {
    // Get all tasks for user
    const tasks = await db.collection('agent_tasks')
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    return Response.json({ tasks });
  }
}
```

### Phase 2: Agent UI (Week 3)

#### 2.1 Create Agent Dashboard

```typescript
// File: app/agent/page.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';

export default function AgentPage() {
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState<'lead-discovery' | 'email-outreach' | 'response-management'>('lead-discovery');
  const [tasks, setTasks] = useState([]);
  
  const runAgent = async () => {
    const res = await fetch('/api/agent/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, prompt, maxSteps: 20 }),
    });
    
    const { taskId } = await res.json();
    
    // Poll for updates
    pollTask(taskId);
  };
  
  const pollTask = async (taskId: string) => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/agent/tasks?taskId=${taskId}`);
      const { task } = await res.json();
      
      if (task.status === 'completed' || task.status === 'failed') {
        clearInterval(interval);
      }
      
      // Update UI
      setTasks(prev => {
        const index = prev.findIndex(t => t.id === taskId);
        if (index >= 0) {
          const newTasks = [...prev];
          newTasks[index] = task;
          return newTasks;
        }
        return [...prev, task];
      });
    }, 2000);
  };
  
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">AI Agent Control Center</h1>
      
      <div className="space-y-4 mb-8">
        <Select value={type} onValueChange={setType}>
          <option value="lead-discovery">Lead Discovery</option>
          <option value="email-outreach">Email Outreach</option>
          <option value="response-management">Response Management</option>
        </Select>
        
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Tell the agent what to do... e.g. 'Find 50 SaaS CTOs and send them personalized emails'"
          rows={6}
        />
        
        <Button onClick={runAgent}>Run Agent</Button>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Active Tasks</h2>
        {tasks.map(task => (
          <AgentTaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
```

### Phase 3: Advanced Features (Week 4-5)

#### 3.1 Scheduled Agent Runs

Create cron jobs for autonomous operations:

```typescript
// File: app/api/cron/agent-runner/route.ts

// Runs every hour
export async function GET() {
  // Get all scheduled agent tasks
  const scheduledTasks = await db.collection('agent_schedules').find({
    nextRun: { $lte: new Date() },
    enabled: true,
  }).toArray();
  
  for (const schedule of scheduledTasks) {
    const controller = new AgentController({
      ...schedule.taskTemplate,
      id: crypto.randomUUID(),
    });
    
    controller.run().catch(console.error);
    
    // Update next run time
    await db.collection('agent_schedules').updateOne(
      { _id: schedule._id },
      { $set: { nextRun: calculateNextRun(schedule.frequency) } }
    );
  }
  
  return Response.json({ success: true });
}
```

#### 3.2 Agent Learning System

Store successful patterns:

```typescript
interface AgentLearning {
  pattern: string; // e.g. "cold_email_saas_cto"
  successRate: number;
  totalAttempts: number;
  avgResponseTime: number;
  bestPractices: string[];
  examplePrompts: string[];
}

// The agent can query this to improve over time
```

## 🎯 Key Advantages

### 1. **Fully Autonomous**
- Agent runs 24/7 without human intervention
- Makes decisions based on data and patterns
- Self-corrects when encountering errors

### 2. **Multi-Step Reasoning**
- Can execute complex workflows (20+ steps)
- Chains together multiple tools intelligently
- Adapts strategy based on intermediate results

### 3. **Learns Over Time**
- Tracks what works and what doesn't
- Refines email templates based on response rates
- Optimizes send times and follow-up intervals

### 4. **Full Transparency**
- Every step is logged and visible
- Human can intervene at any time
- Complete audit trail of agent actions

## 🚀 Quick Start Implementation Order

1. **Week 1**: Build core agent tools (website browsing, LinkedIn search, email generation)
2. **Week 2**: Implement agent controller and basic UI
3. **Week 3**: Add response tracking and auto-reply
4. **Week 4**: Create scheduled runs and learning system
5. **Week 5**: Polish UI and add analytics

## 💡 Example Agent Prompts

### Lead Discovery
```
"Find 100 B2B SaaS companies using React and TypeScript. 
For each company, find the CTO and save their contact info if they have 
50-200 employees and raised Series A-C funding."
```

### Email Campaign
```
"Send personalized cold emails to all 'warm-lead' contacts in the 
Q4_Outreach list. Research each person's recent LinkedIn activity and 
mention something specific in the email. Send max 50 per day."
```

### Response Management
```
"Check inbox every 30 minutes. For positive responses, schedule a 
call and notify sales team. For questions, generate helpful replies. 
For objections, send case study relevant to their industry."
```

## ⚠️ Important Considerations

1. **Rate Limiting**: Respect API limits (LinkedIn, email providers)
2. **GDPR Compliance**: Ensure data handling follows regulations
3. **Email Deliverability**: Warm up domains, use SPF/DKIM
4. **Cost Management**: OpenAI API calls can add up (use GPT-4o-mini for simple tasks)
5. **Human Oversight**: Always have a kill switch and review mechanism

---

**Would you like me to start building the AI Agent system? I can begin with:**

1. Create the agent tools infrastructure
2. Build the agent controller
3. Create the agent dashboard UI
4. Implement web browsing capability
5. Add response tracking automation

Just let me know, and I'll start coding! 🚀
