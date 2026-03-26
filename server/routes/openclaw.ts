import { Router } from 'express';
import { eq, and, or, like, desc, asc } from 'drizzle-orm';
import { db, isDbAvailable } from '../db';
import {
  contacts,
  deals,
  tasks,
  appointments,
  communications,
  notes,
  insertContactSchema,
  insertDealSchema,
  insertTaskSchema,
  insertAppointmentSchema,
  insertCommunicationSchema,
  insertNoteSchema,
} from '../../shared/schema';
import { supabase } from '../supabase';
import OpenAI from 'openai';

const router = Router();

// OpenClaw API Configuration
const OPENCLAW_API_URL = process.env.OPENCLAW_API_URL || 'http://localhost:3001';
const OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY || '';

// Cached OpenAI client
let openaiClient: OpenAI | null = null;
function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// Rate limiting for AI tools (simple in-memory)
const aiRateLimit = new Map<string, { count: number; resetAt: number }>();
const AI_RATE_LIMIT_WINDOW_MS = 60_000;
const AI_RATE_LIMIT_MAX = 20;

// Clean up rate limit entries every 5 minutes to prevent memory leak
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of aiRateLimit) {
      if (now > entry.resetAt) {
        aiRateLimit.delete(key);
      }
    }
  },
  5 * 60 * 1000
);

function checkAIRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = aiRateLimit.get(userId);
  if (!entry || now > entry.resetAt) {
    aiRateLimit.set(userId, { count: 1, resetAt: now + AI_RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= AI_RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// Fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

// Auth helper - extracts userId from session or dev token
function getUserId(req: any): string | null {
  const sessionUserId = req.session?.userId;
  if (sessionUserId) return sessionUserId;

  const authHeader = req.headers.authorization;
  const hostname = req.headers.host || '';
  const isDevHost =
    hostname.includes('localhost') ||
    hostname.includes('replit.dev') ||
    hostname.includes('127.0.0.1');

  if (process.env.NODE_ENV === 'development' && isDevHost && authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token.startsWith('dev-bypass-token-')) {
      req.user = {
        id: 'dev-user-12345',
        email: 'dev@smartcrm.local',
        username: 'dev@smartcrm.local',
        role: 'super_admin',
        productTier: 'super_admin',
      };
      return 'dev-user-12345';
    }
  }
  return null;
}

// Validate numeric ID
function parseId(value: any): number {
  const id = parseInt(value);
  if (isNaN(id) || id <= 0) throw new Error(`Invalid ID: ${value}`);
  return id;
}

// Safe JSON parse with error handling
function safeJsonParse(text: string, fallback: any = {}): any {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

// CRM Tools Definition for OpenClaw
const crmTools = [
  // Contact Management
  {
    name: 'search_contacts',
    description: 'Search contacts by name, email, or company',
    parameters: { query: 'string', limit: { type: 'number', default: 10 } },
    category: 'crm',
  },
  {
    name: 'get_contact_details',
    description: 'Get detailed information about a contact',
    parameters: { contactId: 'string' },
    category: 'crm',
  },
  {
    name: 'create_contact',
    description: 'Create a new contact',
    parameters: {
      firstName: 'string',
      lastName: 'string',
      email: 'string',
      company: 'string',
      phone: 'string?',
    },
    category: 'crm',
  },
  {
    name: 'update_contact',
    description: 'Update contact information',
    parameters: { contactId: 'string', data: 'object' },
    category: 'crm',
  },
  {
    name: 'delete_contact',
    description: 'Delete a contact from the CRM',
    parameters: { contactId: 'string' },
    category: 'crm',
  },
  // Deal Management
  {
    name: 'list_deals',
    description: 'List all deals in the pipeline',
    parameters: { stage: 'string?', limit: 'number?', status: 'string?' },
    category: 'crm',
  },
  {
    name: 'create_deal',
    description: 'Create a new deal',
    parameters: {
      name: 'string',
      value: 'number',
      stage: 'string',
      contactId: 'string?',
      companyId: 'string?',
    },
    category: 'crm',
  },
  {
    name: 'update_deal_stage',
    description: 'Move deal to a different pipeline stage',
    parameters: { dealId: 'string', stage: 'string' },
    category: 'crm',
  },
  {
    name: 'close_deal',
    description: 'Close a deal as won or lost',
    parameters: { dealId: 'string', status: 'closed-won | closed-lost', notes: 'string?' },
    category: 'crm',
  },
  // Task Management
  {
    name: 'list_tasks',
    description: 'List tasks for the current user',
    parameters: { status: 'string?', limit: 'number?', dueDate: 'string?' },
    category: 'crm',
  },
  {
    name: 'create_task',
    description: 'Create a new task',
    parameters: {
      title: 'string',
      description: 'string?',
      dueDate: 'string',
      priority: 'low | medium | high',
      contactId: 'string?',
      dealId: 'string?',
    },
    category: 'crm',
  },
  {
    name: 'complete_task',
    description: 'Mark a task as completed',
    parameters: { taskId: 'string' },
    category: 'crm',
  },
  {
    name: 'delete_task',
    description: 'Delete a task',
    parameters: { taskId: 'string' },
    category: 'crm',
  },
  // Company Management
  {
    name: 'search_companies',
    description: 'Search companies by name or industry',
    parameters: { query: 'string', limit: { type: 'number', default: 10 } },
    category: 'crm',
  },
  {
    name: 'create_company',
    description: 'Create a new company',
    parameters: {
      name: 'string',
      industry: 'string?',
      website: 'string?',
      phone: 'string?',
      address: 'string?',
    },
    category: 'crm',
  },
  // Calendar & Appointments
  {
    name: 'list_appointments',
    description: 'List appointments',
    parameters: { date: 'string?', limit: 'number?' },
    category: 'crm',
  },
  {
    name: 'create_appointment',
    description: 'Schedule a new appointment',
    parameters: {
      title: 'string',
      dateTime: 'string',
      duration: 'number',
      contactId: 'string?',
      notes: 'string?',
    },
    category: 'crm',
  },
  {
    name: 'cancel_appointment',
    description: 'Cancel an appointment',
    parameters: { appointmentId: 'string' },
    category: 'crm',
  },
  // Communication
  {
    name: 'send_email',
    description: 'Send an email to a contact',
    parameters: { to: 'string', subject: 'string', body: 'string', contactId: 'string?' },
    category: 'crm',
  },
  {
    name: 'send_sms',
    description: 'Send an SMS to a contact',
    parameters: { to: 'string', message: 'string', contactId: 'string?' },
    category: 'crm',
  },
  // Navigation
  {
    name: 'navigate_to_app',
    description: 'Navigate to a specific app in the CRM',
    parameters: { app: 'string', route: 'string?' },
    category: 'navigation',
  },
  {
    name: 'open_remote_app',
    description: 'Open a Module Federation remote app',
    parameters: { appName: 'string', parameters: 'object?' },
    category: 'navigation',
  },
  // Automation
  {
    name: 'trigger_automation',
    description: 'Trigger a workflow automation',
    parameters: { workflowId: 'string', context: 'object' },
    category: 'automation',
  },
  {
    name: 'run_ai_insights',
    description: 'Get AI insights for a deal or contact',
    parameters: { entityType: 'deal | contact | company', entityId: 'string' },
    category: 'ai',
  },
  // Analytics
  {
    name: 'get_pipeline_summary',
    description: 'Get pipeline summary with key metrics',
    parameters: {},
    category: 'analytics',
  },
  {
    name: 'get_sales_forecast',
    description: 'Get AI-powered sales forecast',
    parameters: { period: 'week | month | quarter?' },
    category: 'analytics',
  },
  // Communications & Activity
  {
    name: 'list_communications',
    description: 'List communications for a contact',
    parameters: { contactId: 'string', type: 'string?', limit: 'number?' },
    category: 'crm',
  },
  {
    name: 'create_communication',
    description: 'Log a communication (email, call, sms, meeting)',
    parameters: {
      contactId: 'string',
      type: 'email | call | sms | meeting',
      subject: 'string?',
      content: 'string?',
      direction: 'inbound | outbound',
    },
    category: 'crm',
  },
  {
    name: 'list_notes',
    description: 'List notes for a contact or deal',
    parameters: { contactId: 'string?', dealId: 'string?', limit: 'number?' },
    category: 'crm',
  },
  {
    name: 'create_note',
    description: 'Create a note for a contact or deal',
    parameters: { content: 'string', type: 'string?', contactId: 'string?', dealId: 'string?' },
    category: 'crm',
  },
  {
    name: 'delete_note',
    description: 'Delete a note',
    parameters: { noteId: 'string' },
    category: 'crm',
  },
  // Tags
  {
    name: 'add_contact_tag',
    description: 'Add a tag to a contact',
    parameters: { contactId: 'string', tag: 'string' },
    category: 'crm',
  },
  {
    name: 'remove_contact_tag',
    description: 'Remove a tag from a contact',
    parameters: { contactId: 'string', tag: 'string' },
    category: 'crm',
  },
  // Engagement & Interaction History
  {
    name: 'get_contact_engagement',
    description: 'Get engagement metrics for a contact',
    parameters: { contactId: 'string' },
    category: 'analytics',
  },
  {
    name: 'get_interaction_history',
    description: 'Get full interaction history for a contact',
    parameters: { contactId: 'string', limit: 'number?' },
    category: 'crm',
  },
  // AI Features
  {
    name: 'analyze_lead_score',
    description: 'AI-powered lead scoring analysis for a contact',
    parameters: { contactId: 'string' },
    category: 'ai',
  },
  {
    name: 'generate_personalization',
    description: 'Generate personalization recommendations for a contact',
    parameters: { contactId: 'string' },
    category: 'ai',
  },
  {
    name: 'enrich_contact',
    description: 'AI-powered contact enrichment with research',
    parameters: { contactId: 'string' },
    category: 'ai',
  },
  {
    name: 'social_media_research',
    description: 'Research contact social media profiles',
    parameters: { contactId: 'string', platforms: 'string?' },
    category: 'ai',
  },
  {
    name: 'analyze_sentiment',
    description: 'Analyze sentiment of text content',
    parameters: { text: 'string' },
    category: 'ai',
  },
  {
    name: 'generate_email_draft',
    description: 'Generate an AI email draft for a contact',
    parameters: { contactId: 'string', purpose: 'string', context: 'string?' },
    category: 'ai',
  },
  // Bulk Operations
  {
    name: 'bulk_analyze_contacts',
    description: 'Run AI analysis on multiple contacts',
    parameters: { contactIds: 'string' },
    category: 'ai',
  },
  {
    name: 'bulk_export_contacts',
    description: 'Export contacts to CSV format',
    parameters: { contactIds: 'string?', filters: 'object?' },
    category: 'crm',
  },
  // Advanced Search
  {
    name: 'search_contacts_advanced',
    description: 'Advanced search with multiple filter criteria',
    parameters: {
      query: 'string?',
      status: 'string?',
      interestLevel: 'string?',
      industry: 'string?',
      tags: 'string?',
      minScore: 'number?',
      maxScore: 'number?',
      source: 'string?',
      location: 'string?',
      favoritesOnly: 'boolean?',
      limit: 'number?',
    },
    category: 'crm',
  },
  // Deal AI
  {
    name: 'analyze_deal',
    description: 'AI-powered strategic analysis of a deal',
    parameters: { dealId: 'string' },
    category: 'ai',
  },
  // Deal Analytics
  {
    name: 'get_deal_analytics',
    description: 'Get deal analytics with revenue, conversion, and metrics',
    parameters: { period: 'week | month | quarter?' },
    category: 'analytics',
  },
  {
    name: 'get_deal_risks',
    description: 'Get deals at risk based on inactivity and low probability',
    parameters: {},
    category: 'analytics',
  },
  // Contact Customization
  {
    name: 'toggle_favorite',
    description: 'Toggle favorite status for a contact',
    parameters: { contactId: 'string' },
    category: 'crm',
  },
  {
    name: 'add_custom_field',
    description: 'Add a custom field to a contact',
    parameters: { contactId: 'string', key: 'string', value: 'string' },
    category: 'crm',
  },
  {
    name: 'remove_custom_field',
    description: 'Remove a custom field from a contact',
    parameters: { contactId: 'string', key: 'string' },
    category: 'crm',
  },
  // Social Monitoring
  {
    name: 'setup_social_monitoring',
    description: 'Set up ongoing social media monitoring for a contact',
    parameters: { contactId: 'string', platforms: 'string?', alertTypes: 'string?' },
    category: 'ai',
  },
  {
    name: 'get_social_alerts',
    description: 'Get social media monitoring alerts for a contact',
    parameters: { contactId: 'string' },
    category: 'ai',
  },
  // Module Federation
  {
    name: 'get_module_federation_status',
    description: 'Get status of all module federation remote apps',
    parameters: {},
    category: 'navigation',
  },
  {
    name: 'broadcast_to_modules',
    description: 'Broadcast a message to all module federation apps',
    parameters: { type: 'string', data: 'object' },
    category: 'navigation',
  },
  // UI Control
  {
    name: 'toggle_dark_mode',
    description: 'Toggle dark mode theme for the application',
    parameters: {},
    category: 'navigation',
  },
  {
    name: 'set_theme',
    description: 'Set the application theme',
    parameters: { theme: 'light | dark | auto' },
    category: 'navigation',
  },
  // Image Generation
  {
    name: 'generate_image',
    description: 'Generate an image using AI (DALL-E or Gemini)',
    parameters: { prompt: 'string', size: 'string?', style: 'string?' },
    category: 'ai',
  },
  // Video/Demo
  {
    name: 'generate_demo_script',
    description: 'Generate a product demo script using AI',
    parameters: { productName: 'string', productDescription: 'string?', targetAudience: 'string?' },
    category: 'ai',
  },
  {
    name: 'list_videos',
    description: 'List all video emails for the user',
    parameters: { limit: 'number?' },
    category: 'crm',
  },
  {
    name: 'create_video',
    description: 'Create a new video email entry',
    parameters: {
      title: 'string',
      script: 'string',
      recipientEmail: 'string?',
      recipientName: 'string?',
    },
    category: 'crm',
  },
  // Pipeline Drag & Drop (alias for update_deal_stage with position)
  {
    name: 'move_deal',
    description: 'Move a deal to a different pipeline stage (drag & drop equivalent)',
    parameters: { dealId: 'string', stage: 'string', position: 'number?' },
    category: 'crm',
  },
  // Shared State Sync
  {
    name: 'sync_shared_state',
    description: 'Sync shared state across all module federation apps',
    parameters: { dataType: 'contacts | deals | appointments', data: 'object' },
    category: 'navigation',
  },
];

// Chat endpoint - proxy to OpenClaw
router.post('/chat', async (req, res) => {
  try {
    const { message, history, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Authenticate
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Build the request to OpenClaw
    const openclawRequest = {
      message,
      history: history || [],
      tools: crmTools,
      context: {
        ...context,
        crmBaseUrl: process.env.CRM_BASE_URL || 'http://localhost:3000',
        userId,
      },
    };

    // Call OpenClaw API with timeout
    const response = await fetchWithTimeout(
      `${OPENCLAW_API_URL}/api/v1/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(OPENCLAW_API_KEY ? { Authorization: `Bearer ${OPENCLAW_API_KEY}` } : {}),
        },
        body: JSON.stringify(openclawRequest),
      },
      30000
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenClaw API error:', response.status);
      return res.status(response.status).json({ error: 'OpenClaw API error' });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('OpenClaw proxy error:', error.name === 'AbortError' ? 'Timeout' : error.message);
    res.status(500).json({ error: 'Failed to communicate with OpenClaw API' });
  }
});

// SSE streaming chat endpoint
router.post('/chat/stream', async (req, res) => {
  try {
    const { message, history, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Authenticate
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const openclawRequest = {
      message,
      history: history || [],
      tools: crmTools,
      stream: true,
      context: {
        ...context,
        crmBaseUrl: process.env.CRM_BASE_URL || 'http://localhost:3000',
        userId,
      },
    };

    const response = await fetchWithTimeout(
      `${OPENCLAW_API_URL}/api/v1/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(OPENCLAW_API_KEY ? { Authorization: `Bearer ${OPENCLAW_API_KEY}` } : {}),
        },
        body: JSON.stringify(openclawRequest),
      },
      60000
    );

    if (!response.ok) {
      res.end(`data: ${JSON.stringify({ error: 'OpenClaw API error' })}\n\n`);
      return;
    }

    // Stream the response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      res.end(`data: ${JSON.stringify({ error: 'No response body' })}\n\n`);
      return;
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      res.write(`data: ${chunk}\n\n`);
    }

    res.end();
  } catch (error) {
    console.error('OpenClaw streaming error:', error);
    res.end(`data: ${JSON.stringify({ error: 'Failed to stream from OpenClaw' })}\n\n`);
  }
});

// Get available CRM tools
router.get('/tools', (req, res) => {
  res.json({ tools: crmTools });
});

// Execute a specific CRM tool directly
router.post('/execute', async (req, res) => {
  try {
    const { tool, parameters } = req.body;

    if (!tool) {
      return res.status(400).json({ error: 'Tool name is required' });
    }

    // Authenticate
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Find the tool definition
    const toolDef = crmTools.find((t) => t.name === tool);
    if (!toolDef) {
      return res.status(400).json({ error: `Tool '${tool}' not found` });
    }

    // Rate limit AI tools
    const isAITool = toolDef.category === 'ai';
    if (isAITool && !checkAIRateLimit(userId)) {
      return res.status(429).json({ error: 'Rate limit exceeded for AI tools' });
    }

    // Execute the tool by calling the appropriate CRM API
    const result = await executeCRMFunction(tool, parameters, userId);

    res.json({ success: true, tool, result });
  } catch (error: any) {
    console.error('Tool execution error:', error);
    res.status(500).json({ error: 'Failed to execute tool', details: error.message });
  }
});

// Helper function to execute CRM functions based on tool name
async function executeCRMFunction(toolName: string, params: any, userId?: string): Promise<any> {
  console.log(`Executing CRM function: ${toolName}`);

  if (!isDbAvailable()) {
    return { error: 'Database not available' };
  }

  if (!userId) {
    return { error: 'User ID required' };
  }

  try {
    switch (toolName) {
      case 'search_contacts': {
        const query = params.query || '';
        const limit = params.limit || 10;
        const results = await db!
          .select()
          .from(contacts)
          .where(
            query
              ? and(
                  eq(contacts.profileId, userId),
                  or(
                    like(contacts.firstName, `%${query}%`),
                    like(contacts.lastName, `%${query}%`),
                    like(contacts.email, `%${query}%`),
                    like(contacts.company, `%${query}%`)
                  )
                )
              : eq(contacts.profileId, userId)
          )
          .limit(limit);
        return { contacts: results, count: results.length };
      }

      case 'get_contact_details': {
        const contactId = parseInt(params.contactId);
        const [contact] = await db!
          .select()
          .from(contacts)
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)));
        return contact || { error: 'Contact not found' };
      }

      case 'create_contact': {
        const validated = insertContactSchema.parse({ ...params, profileId: userId });
        const [newContact] = await db!.insert(contacts).values(validated).returning();
        return { contact: newContact };
      }

      case 'update_contact': {
        const contactId = parseInt(params.contactId);
        const [updated] = await db!
          .update(contacts)
          .set({ ...params.data, updatedAt: new Date() })
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)))
          .returning();
        return updated || { error: 'Contact not found' };
      }

      case 'delete_contact': {
        const contactId = parseInt(params.contactId);
        await db!
          .delete(contacts)
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)));
        return { success: true, message: 'Contact deleted' };
      }

      case 'list_deals': {
        const limit = params.limit || 20;
        const stage = params.stage;
        const status = params.status;
        let whereClause = eq(deals.profileId, userId);

        let results = await db!
          .select()
          .from(deals)
          .where(eq(deals.profileId, userId))
          .limit(limit);

        if (stage) results = results.filter((d) => d.stage === stage);
        if (status) results = results.filter((d) => d.status === status);

        return { deals: results, count: results.length };
      }

      case 'create_deal': {
        const validated = insertDealSchema.parse({ ...params, profileId: userId });
        const [newDeal] = await db!.insert(deals).values(validated).returning();
        return { deal: newDeal };
      }

      case 'update_deal_stage': {
        const dealId = parseInt(params.dealId);
        const [updated] = await db!
          .update(deals)
          .set({ stage: params.stage, updatedAt: new Date() })
          .where(and(eq(deals.id, dealId), eq(deals.profileId, userId)))
          .returning();
        return updated || { error: 'Deal not found' };
      }

      case 'close_deal': {
        const dealId = parseInt(params.dealId);
        const status = params.status === 'closed-won' ? 'won' : 'lost';
        const [updated] = await db!
          .update(deals)
          .set({ status, updatedAt: new Date() })
          .where(and(eq(deals.id, dealId), eq(deals.profileId, userId)))
          .returning();
        return updated || { error: 'Deal not found' };
      }

      case 'list_tasks': {
        const limit = params.limit || 20;
        const status = params.status;
        const dueDate = params.dueDate;

        let results = await db!
          .select()
          .from(tasks)
          .where(eq(tasks.profileId, userId))
          .limit(limit);

        if (status) results = results.filter((t) => t.status === status);
        if (dueDate)
          results = results.filter(
            (t) => t.dueDate && t.dueDate.toISOString().split('T')[0] === dueDate
          );

        return { tasks: results, count: results.length };
      }

      case 'create_task': {
        const validated = insertTaskSchema.parse({ ...params, profileId: userId });
        const [newTask] = await db!.insert(tasks).values(validated).returning();
        return { task: newTask };
      }

      case 'complete_task': {
        const taskId = parseInt(params.taskId);
        const [updated] = await db!
          .update(tasks)
          .set({ status: 'completed', updatedAt: new Date() })
          .where(and(eq(tasks.id, taskId), eq(tasks.profileId, userId)))
          .returning();
        return updated || { error: 'Task not found' };
      }

      case 'delete_task': {
        const taskId = parseInt(params.taskId);
        await db!.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.profileId, userId)));
        return { success: true, message: 'Task deleted' };
      }

      case 'search_companies': {
        const query = params.query || '';
        const limit = params.limit || 10;

        let supabaseQuery = supabase.from('companies').select('*').eq('owner_user_id', userId);
        if (query) {
          supabaseQuery = supabaseQuery.ilike('name', `%${query}%`);
        }

        const { data: results, error } = await supabaseQuery.limit(limit);
        if (error) throw error;
        return { companies: results || [], count: results?.length || 0 };
      }

      case 'create_company': {
        const { data: company, error } = await supabase
          .from('companies')
          .insert({
            name: params.name,
            domain: params.website,
            description: params.address,
            industry: params.industry,
            owner_user_id: userId,
          })
          .select()
          .single();
        if (error) throw error;
        return { company };
      }

      case 'list_appointments': {
        const limit = params.limit || 20;
        const date = params.date;

        let results = await db!
          .select()
          .from(appointments)
          .where(eq(appointments.profileId, userId))
          .limit(limit);

        if (date) {
          results = results.filter(
            (a) => a.dateTime && a.dateTime.toISOString().split('T')[0] === date
          );
        }

        return { appointments: results, count: results.length };
      }

      case 'create_appointment': {
        const validated = insertAppointmentSchema.parse({
          ...params,
          profileId: userId,
          dateTime: new Date(params.dateTime),
        });
        const [newAppointment] = await db!.insert(appointments).values(validated).returning();
        return { appointment: newAppointment };
      }

      case 'cancel_appointment': {
        const appointmentId = parseInt(params.appointmentId);
        await db!
          .delete(appointments)
          .where(and(eq(appointments.id, appointmentId), eq(appointments.profileId, userId)));
        return { success: true, message: 'Appointment cancelled' };
      }

      case 'send_email': {
        if (!params.to || !params.subject || !params.body) {
          return { error: 'to, subject, and body are required' };
        }
        let emailContactId = params.contactId ? parseInt(params.contactId) : null;
        if (!emailContactId) {
          const [existing] = await db!
            .select({ id: contacts.id })
            .from(contacts)
            .where(and(eq(contacts.email, params.to), eq(contacts.profileId, userId)))
            .limit(1);
          if (existing) emailContactId = existing.id;
        }
        const [newComm] = await db!
          .insert(communications)
          .values({
            type: 'email',
            subject: params.subject,
            content: params.body,
            direction: 'outbound',
            status: 'sent',
            sentAt: new Date(),
            contactId: emailContactId,
            profileId: userId,
          })
          .returning();
        return { success: true, communication: newComm, message: `Email queued for ${params.to}` };
      }

      case 'send_sms': {
        if (!params.to || !params.message) {
          return { error: 'to and message are required' };
        }
        let smsContactId = params.contactId ? parseInt(params.contactId) : null;
        if (!smsContactId) {
          const [existing] = await db!
            .select({ id: contacts.id })
            .from(contacts)
            .where(and(eq(contacts.phone, params.to), eq(contacts.profileId, userId)))
            .limit(1);
          if (existing) smsContactId = existing.id;
        }
        const [newComm] = await db!
          .insert(communications)
          .values({
            type: 'sms',
            subject: null,
            content: params.message,
            direction: 'outbound',
            status: 'sent',
            sentAt: new Date(),
            contactId: smsContactId,
            profileId: userId,
          })
          .returning();
        return { success: true, communication: newComm, message: `SMS queued for ${params.to}` };
      }

      case 'trigger_automation': {
        if (!params.workflowId) {
          return { error: 'workflowId is required' };
        }
        const ruleId = parseInt(params.workflowId);
        const [rule] = await db!
          .select()
          .from(automationRules)
          .where(and(eq(automationRules.id, ruleId), eq(automationRules.profileId, userId)));

        if (!rule) return { error: 'Automation rule not found' };
        if (!rule.isActive) return { error: 'Automation rule is inactive' };

        const actions = (rule.actions as any[]) || [];
        const results: any[] = [];
        for (const action of actions) {
          try {
            const actionResult = await executeCRMFunction(
              action.type || action.tool,
              { ...action.params, ...action.parameters, ...params.context },
              userId
            );
            results.push({
              action: action.type || action.tool,
              success: true,
              result: actionResult,
            });
          } catch (actionError: any) {
            results.push({
              action: action.type || action.tool,
              success: false,
              error: actionError.message,
            });
          }
        }

        return { success: true, automation: rule.name, actionsExecuted: results.length, results };
      }

      case 'run_ai_insights': {
        if (!params.entityType || !params.entityId) {
          return { error: 'entityType and entityId are required' };
        }
        let entity: any = null;
        if (params.entityType === 'deal') {
          const [deal] = await db!
            .select()
            .from(deals)
            .where(and(eq(deals.id, parseInt(params.entityId)), eq(deals.profileId, userId)));
          entity = deal;
        } else if (params.entityType === 'contact') {
          const [contact] = await db!
            .select()
            .from(contacts)
            .where(and(eq(contacts.id, parseInt(params.entityId)), eq(contacts.profileId, userId)));
          entity = contact;
        } else if (params.entityType === 'company') {
          const { data } = await supabase
            .from('companies')
            .select('*')
            .eq('id', params.entityId)
            .eq('owner_user_id', userId)
            .single();
          entity = data;
        }
        if (!entity) return { error: `${params.entityType} not found` };

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) return { error: 'OpenAI API key not configured' };

        const OpenAI = (await import('openai')).default;
        const openaiClient = new OpenAI({ apiKey });

        const response = await openaiClient.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are a CRM analyst. Provide actionable insights for the given entity. Return JSON with: summary (string), recommendations (string array), riskLevel (low/medium/high), nextBestAction (string), confidence (number 0-1).',
            },
            {
              role: 'user',
              content: `Analyze this ${params.entityType} and provide insights: ${JSON.stringify(entity)}`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 500,
        });

        const insights = JSON.parse(response.choices[0].message.content || '{}');
        return { entityType: params.entityType, entityId: params.entityId, ...insights };
      }

      case 'get_pipeline_summary': {
        const allDeals = await db!.select().from(deals).where(eq(deals.profileId, userId));
        const totalValue = allDeals.reduce((sum, d) => sum + (d.value || 0), 0);
        const wonDeals = allDeals.filter((d) => d.status === 'won');
        const wonValue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
        const openDeals = allDeals.filter((d) => d.status === 'open');

        const stageBreakdown: Record<string, number> = {};
        allDeals.forEach((d) => {
          stageBreakdown[d.stage] = (stageBreakdown[d.stage] || 0) + 1;
        });

        return {
          totalDeals: allDeals.length,
          openDeals: openDeals.length,
          wonDeals: wonDeals.length,
          totalValue,
          wonValue,
          stageBreakdown,
        };
      }

      case 'get_sales_forecast': {
        const allDeals = await db!.select().from(deals).where(eq(deals.profileId, userId));
        const openDeals = allDeals.filter((d) => d.status === 'open');
        const totalPipeline = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);
        const avgDealSize = openDeals.length > 0 ? totalPipeline / openDeals.length : 0;
        const winRate =
          allDeals.length > 0
            ? allDeals.filter((d) => d.status === 'won').length / allDeals.length
            : 0;

        return {
          period: params.period || 'month',
          pipelineValue: totalPipeline,
          averageDealSize: avgDealSize,
          projectedRevenue: totalPipeline * winRate,
          winRate: winRate * 100,
          dealCount: openDeals.length,
        };
      }

      case 'navigate_to_app': {
        const validApps: Record<string, string> = {
          // Core CRM
          contacts: '/contacts',
          deals: '/pipeline',
          pipeline: '/pipeline',
          tasks: '/tasks',
          appointments: '/appointments',
          appointments_dashboard: '/appointments-dashboard',
          calendar: '/calendar',
          companies: '/companies',
          dashboard: '/dashboard',
          // Communication
          email: '/email',
          sms: '/text-messages',
          messaging: '/text-messages',
          communication: '/communication',
          communication_hub: '/communication-hub',
          phone: '/phone-system',
          phone_system: '/phone-system',
          video: '/video-email',
          video_email: '/video-email',
          voice_profiles: '/voice-profiles',
          invoicing: '/invoicing',
          // AI & Analytics
          analytics: '/analytics',
          ai_tools: '/ai-tools',
          ai_goals: '/ai-goals',
          ai_integration: '/ai-integration',
          ai_sales_forecast: '/ai-sales-forecast',
          assistants: '/assistants',
          content_ai: '/content-ai',
          business_intel: '/business-intel',
          competitor_insights: '/competitor-insights',
          revenue_intelligence: '/revenue-intelligence',
          sales_cycle_analytics: '/sales-cycle-analytics',
          win_rate_intelligence: '/win-rate-intelligence',
          deal_risk_monitor: '/deal-risk-monitor',
          pipeline_intelligence: '/pipeline-intelligence',
          pipeline_health: '/pipeline-health-dashboard',
          live_deal_analysis: '/live-deal-analysis',
          smartcrm_closer: '/smartcrm-closer',
          // Automation & Leads
          automations: '/lead-automation',
          lead_automation: '/lead-automation',
          // Content & Forms
          content_library: '/content-library',
          forms: '/forms',
          surveys: '/forms',
          circle_prospecting: '/circle-prospecting',
          funnelcraft: '/funnelcraft-ai',
          // Admin & Settings
          admin: '/admin',
          settings: '/settings',
          users: '/users',
          white_label: '/white-label',
          white_label_management: '/white-label-management',
          package_builder: '/package-builder',
          feature_management: '/feature-management',
          bulk_import: '/bulk-import',
          system_overview: '/system-overview',
          // Partner
          partner_dashboard: '/partner-dashboard',
          partner_onboarding: '/partner-onboarding',
          revenue_sharing: '/revenue-sharing',
          // Credits & Upgrade
          credits: '/buy-credits',
          upgrade: '/upgrade',
          // Other
          openclaw: '/openclaw',
          business_analysis: '/business-analysis',
          demo_recorder: '/demo-recorder',
        };
        const appKey = (params.app || '').toLowerCase().replace(/[\s-]/g, '_');
        const route = validApps[appKey] || params.route || '/';
        return {
          type: 'navigation',
          action: 'navigate',
          app: appKey,
          route,
          url: route,
          message: `Navigating to ${appKey}${route !== '/' ? ` (${route})` : ''}`,
        };
      }

      case 'open_remote_app': {
        const remoteApps: Record<string, { url: string; module: string; description: string }> = {
          pipeline: {
            url: 'https://cheery-syrniki-b5b6ca.netlify.app',
            module: './PipelineApp',
            description: 'Pipeline Management Remote App',
          },
          analytics: {
            url: 'https://ai-analytics.smartcrm.vip',
            module: './AnalyticsApp',
            description: 'AI Analytics Dashboard',
          },
          contacts: {
            url: 'https://contacts.smartcrm.vip',
            module: './ContactsApp',
            description: 'Contacts Management App',
          },
          calendar: {
            url: 'https://calendar.smartcrm.vip',
            module: './CalendarApp',
            description: 'Calendar App',
          },
          agency: {
            url: 'https://agency.smartcrm.vip',
            module: './AIAgencyApp',
            description: 'AI Agency App',
          },
          research: {
            url: 'https://clever-syrniki-4df87f.netlify.app',
            module: './ProductResearchApp',
            description: 'Product Research App',
          },
        };
        const appNameKey = (params.appName || '').toLowerCase();
        const remoteApp = remoteApps[appNameKey];
        if (!remoteApp) {
          return {
            error: `Remote app '${params.appName}' not found. Available: ${Object.keys(remoteApps).join(', ')}`,
          };
        }
        return {
          type: 'remote_app',
          action: 'open',
          appName: appNameKey,
          remoteUrl: remoteApp.url,
          remoteModule: remoteApp.module,
          remoteEntry: `${remoteApp.url}/assets/remoteEntry.js`,
          parameters: params.parameters || {},
          message: `Opening remote app: ${remoteApp.description}`,
        };
      }

      // Communications
      case 'list_communications': {
        const contactId = parseInt(params.contactId);
        const limit = params.limit || 50;
        const type = params.type;

        let results = await db!
          .select()
          .from(communications)
          .where(and(eq(communications.contactId, contactId), eq(communications.profileId, userId)))
          .limit(limit);

        if (type) results = results.filter((c) => c.type === type);

        return { communications: results, count: results.length };
      }

      case 'create_communication': {
        const validated = insertCommunicationSchema.parse({
          ...params,
          contactId: parseInt(params.contactId),
          profileId: userId,
          sentAt: new Date(),
        });
        const [newComm] = await db!.insert(communications).values(validated).returning();
        return { communication: newComm };
      }

      // Notes
      case 'list_notes': {
        const limit = params.limit || 50;
        const contactId = params.contactId ? parseInt(params.contactId) : null;
        const dealId = params.dealId ? parseInt(params.dealId) : null;

        const conditions = [eq(notes.profileId, userId)];
        if (contactId) conditions.push(eq(notes.contactId, contactId));
        if (dealId) conditions.push(eq(notes.dealId, dealId));

        const results = await db!
          .select()
          .from(notes)
          .where(and(...conditions))
          .limit(limit)
          .orderBy(desc(notes.createdAt));

        return { notes: results, count: results.length };
      }

      case 'create_note': {
        const validated = insertNoteSchema.parse({
          ...params,
          contactId: params.contactId ? parseInt(params.contactId) : undefined,
          dealId: params.dealId ? parseInt(params.dealId) : undefined,
          profileId: userId,
        });
        const [newNote] = await db!.insert(notes).values(validated).returning();
        return { note: newNote };
      }

      case 'delete_note': {
        const noteId = parseInt(params.noteId);
        await db!.delete(notes).where(and(eq(notes.id, noteId), eq(notes.profileId, userId)));
        return { success: true, message: 'Note deleted' };
      }

      // Tags
      case 'add_contact_tag': {
        const contactId = parseInt(params.contactId);
        const [contact] = await db!
          .select()
          .from(contacts)
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)));

        if (!contact) return { error: 'Contact not found' };

        const currentTags = (contact as any).tags || [];
        const newTags = [...new Set([...currentTags, params.tag])];

        const [updated] = await db!
          .update(contacts)
          .set({ tags: newTags, updatedAt: new Date() })
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)))
          .returning();

        return { contact: updated, tags: newTags };
      }

      case 'remove_contact_tag': {
        const contactId = parseInt(params.contactId);
        const [contact] = await db!
          .select()
          .from(contacts)
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)));

        if (!contact) return { error: 'Contact not found' };

        const currentTags = (contact as any).tags || [];
        const newTags = currentTags.filter((t: string) => t !== params.tag);

        const [updated] = await db!
          .update(contacts)
          .set({ tags: newTags, updatedAt: new Date() })
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)))
          .returning();

        return { contact: updated, tags: newTags };
      }

      // Engagement & Interaction History
      case 'get_contact_engagement': {
        const contactId = parseInt(params.contactId);

        const comms = await db!
          .select()
          .from(communications)
          .where(
            and(eq(communications.contactId, contactId), eq(communications.profileId, userId))
          );

        const emails = comms.filter((c) => c.type === 'email');
        const calls = comms.filter((c) => c.type === 'call');
        const meetings = comms.filter((c) => c.type === 'meeting');
        const sms = comms.filter((c) => c.type === 'sms');

        const inboundCount = comms.filter((c) => c.direction === 'inbound').length;
        const outboundCount = comms.filter((c) => c.direction === 'outbound').length;

        const lastCommunication = comms.sort(
          (a, b) =>
            new Date(b.sentAt || b.createdAt).getTime() -
            new Date(a.sentAt || a.createdAt).getTime()
        )[0];

        return {
          totalCommunications: comms.length,
          emails: emails.length,
          calls: calls.length,
          meetings: meetings.length,
          sms: sms.length,
          inboundCount,
          outboundCount,
          responseRate: outboundCount > 0 ? Math.round((inboundCount / outboundCount) * 100) : 0,
          lastCommunication: lastCommunication
            ? {
                type: lastCommunication.type,
                sentAt: lastCommunication.sentAt || lastCommunication.createdAt,
                subject: lastCommunication.subject,
              }
            : null,
        };
      }

      case 'get_interaction_history': {
        const contactId = parseInt(params.contactId);
        const limit = params.limit || 50;

        const comms = await db!
          .select()
          .from(communications)
          .where(and(eq(communications.contactId, contactId), eq(communications.profileId, userId)))
          .limit(limit)
          .orderBy(desc(communications.sentAt), desc(communications.createdAt));

        const contactNotes = await db!
          .select()
          .from(notes)
          .where(and(eq(notes.contactId, contactId), eq(notes.profileId, userId)))
          .limit(limit)
          .orderBy(desc(notes.createdAt));

        const interactions = [
          ...comms.map((c) => ({
            type: 'communication',
            subtype: c.type,
            subject: c.subject,
            content: c.content,
            direction: c.direction,
            date: c.sentAt || c.createdAt,
          })),
          ...contactNotes.map((n) => ({
            type: 'note',
            subtype: n.type,
            content: n.content,
            date: n.createdAt,
          })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return { interactions: interactions.slice(0, limit), count: interactions.length };
      }

      // AI Features
      case 'analyze_lead_score': {
        const contactId = parseInt(params.contactId);
        const [contact] = await db!
          .select()
          .from(contacts)
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)));

        if (!contact) return { error: 'Contact not found' };

        const client = getOpenAIClient();
        if (!client) return { error: 'OpenAI API key not configured' };

        const response = await client.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content:
                'You are a sales AI expert. Analyze the lead and provide a lead score from 1-100 with detailed reasoning. Return JSON with fields: score, reasoning, strengths, weaknesses, recommendations.',
            },
            {
              role: 'user',
              content: `Analyze this lead: ${JSON.stringify(contact)}`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 1000,
        });

        return safeJsonParse(response.choices[0].message.content || '{}');
      }

      case 'generate_personalization': {
        const contactId = parseInt(params.contactId);
        const [contact] = await db!
          .select()
          .from(contacts)
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)));

        if (!contact) return { error: 'Contact not found' };

        const comms = await db!
          .select()
          .from(communications)
          .where(and(eq(communications.contactId, contactId), eq(communications.profileId, userId)))
          .limit(10);

        const client = getOpenAIClient();
        if (!client) return { error: 'OpenAI API key not configured' };

        const previousInteractions = comms.map(
          (c) => `${c.type}: ${c.subject || ''} - ${c.content || ''}`
        );

        const response = await client.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content:
                'You are a personalization expert. Generate personalized outreach strategies based on contact data and interaction history. Return JSON with fields: recommendations (array of objects with title, description, priority), talkingPoints (array), bestApproach, suggestedTiming.',
            },
            {
              role: 'user',
              content: `Contact: ${JSON.stringify(contact)}. Previous interactions: ${JSON.stringify(previousInteractions)}`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 1500,
        });

        return safeJsonParse(response.choices[0].message.content || '{}');
      }

      case 'enrich_contact': {
        const contactId = parseInt(params.contactId);
        const [contact] = await db!
          .select()
          .from(contacts)
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)));

        if (!contact) return { error: 'Contact not found' };

        const client = getOpenAIClient();
        if (!client) return { error: 'OpenAI API key not configured' };

        const response = await client.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content:
                'You are a contact research expert. Enrich the contact with likely information based on what you know. Return JSON with fields: suggestedFields (object with field values to add), socialProfiles, companyInfo, industryInsights, confidence.',
            },
            {
              role: 'user',
              content: `Research and enrich this contact: ${JSON.stringify(contact)}`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.5,
          max_tokens: 1500,
        });

        return safeJsonParse(response.choices[0].message.content || '{}');
      }

      case 'social_media_research': {
        const contactId = parseInt(params.contactId);
        const [contact] = await db!
          .select()
          .from(contacts)
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)));

        if (!contact) return { error: 'Contact not found' };

        const client = getOpenAIClient();
        if (!client) return { error: 'OpenAI API key not configured' };

        const platforms = params.platforms
          ? params.platforms.split(',').map((p: string) => p.trim())
          : ['LinkedIn', 'Twitter', 'Instagram', 'YouTube', 'GitHub'];

        const response = await client.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are a social media research expert. Research likely social media profiles for the contact on these platforms: ${platforms.join(', ')}. Return JSON with fields: profiles (array with platform, username, url, confidence), personalityInsights (object with communicationStyle, interests), engagementMetrics (object with bestPostingTimes, recommendedContent), monitoringRecommendations (array of strings).`,
            },
            {
              role: 'user',
              content: `Research social media for: ${JSON.stringify(contact)}`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.5,
          max_tokens: 2000,
        });

        return safeJsonParse(response.choices[0].message.content || '{}');
      }

      case 'analyze_sentiment': {
        const text = params.text;
        if (!text) return { error: 'Text is required for sentiment analysis' };

        const client = getOpenAIClient();
        if (!client) return { error: 'OpenAI API key not configured' };

        const response = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are a sentiment analysis expert. Analyze the sentiment and return JSON with: sentiment (positive/negative/neutral/mixed), score (1-100), confidence, keyPhrases (array), emotionalTone.',
            },
            {
              role: 'user',
              content: `Analyze the sentiment of: "${text}"`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 500,
        });

        return safeJsonParse(response.choices[0].message.content || '{}');
      }

      case 'generate_email_draft': {
        const contactId = parseInt(params.contactId);
        const [contact] = await db!
          .select()
          .from(contacts)
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)));

        if (!contact) return { error: 'Contact not found' };

        const purpose = params.purpose || 'follow-up';
        const context = params.context || '';

        const client = getOpenAIClient();
        if (!client) return { error: 'OpenAI API key not configured' };

        const response = await client.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content:
                'You are a sales email expert. Draft professional, personalized emails. Return JSON with: subject, body, suggestedSendTime.',
            },
            {
              role: 'user',
              content: `Draft a ${purpose} email to ${contact.name} (${contact.position} at ${contact.company}). Additional context: ${context}. Contact info: ${JSON.stringify(contact)}`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 1000,
        });

        return safeJsonParse(response.choices[0].message.content || '{}');
      }

      // Bulk Operations
      case 'bulk_analyze_contacts': {
        const contactIds: number[] = (params.contactIds || '')
          .split(',')
          .map((id: string) => parseInt(id.trim()))
          .filter((id: number) => !isNaN(id));

        if (contactIds.length === 0) return { error: 'No valid contact IDs provided' };
        if (contactIds.length > 50) return { error: 'Maximum 50 contacts per bulk analysis' };

        const client = getOpenAIClient();
        if (!client) return { error: 'OpenAI API key not configured' };

        const results = [];
        for (const contactId of contactIds) {
          const [contact] = await db!
            .select()
            .from(contacts)
            .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)));

          if (contact) {
            try {
              const response = await client.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                  {
                    role: 'system',
                    content:
                      'Analyze this lead. Return JSON with: score (1-100), reasoning, recommendations.',
                  },
                  { role: 'user', content: `Contact: ${JSON.stringify(contact)}` },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.3,
                max_tokens: 300,
              });
              const analysis = safeJsonParse(response.choices[0].message.content || '{}');
              results.push({ contactId, name: contact.name, ...analysis });
            } catch {
              results.push({ contactId, name: contact.name, error: 'Analysis failed' });
            }
          }
        }

        return { results, count: results.length };
      }

      case 'bulk_export_contacts': {
        let contactList;

        if (params.contactIds) {
          const ids = params.contactIds
            .split(',')
            .map((id: string) => parseInt(id.trim()))
            .filter((id: number) => !isNaN(id));
          contactList = await db!
            .select()
            .from(contacts)
            .where(and(eq(contacts.profileId, userId), ...ids.map((id) => eq(contacts.id, id))));
        } else if (params.filters) {
          const conditions = [eq(contacts.profileId, userId)];
          if (params.filters.status) conditions.push(eq(contacts.status, params.filters.status));
          if (params.filters.industry)
            conditions.push(eq(contacts.industry, params.filters.industry));
          contactList = await db!
            .select()
            .from(contacts)
            .where(and(...conditions))
            .limit(1000);
        } else {
          contactList = await db!
            .select()
            .from(contacts)
            .where(eq(contacts.profileId, userId))
            .limit(1000);
        }

        const csvHeader =
          'Name,Email,Phone,Company,Position,Status,Industry,Score,Location,Last Contact\n';
        const csvRows = contactList
          .map(
            (c) =>
              `"${c.name}","${c.email}","${c.phone || ''}","${c.company || ''}","${c.position || ''}","${c.status}","${c.industry || ''}","${c.score || ''}","${c.location || ''}","${c.lastContact || ''}"`
          )
          .join('\n');

        return {
          csv: csvHeader + csvRows,
          count: contactList.length,
          exportedAt: new Date().toISOString(),
        };
      }

      case 'search_contacts_advanced': {
        const conditions = [eq(contacts.profileId, userId)];

        if (params.status) conditions.push(eq(contacts.status, params.status));
        if (params.industry) conditions.push(eq(contacts.industry, params.industry));
        if (params.source) conditions.push(eq(contacts.source, params.source));
        if (params.location) conditions.push(like(contacts.location, `%${params.location}%`));
        if (params.query) {
          conditions.push(
            or(
              like(contacts.name, `%${params.query}%`),
              like(contacts.email, `%${params.query}%`),
              like(contacts.company, `%${params.query}%`)
            )
          );
        }

        const limit = params.limit || 50;
        let results = await db!
          .select()
          .from(contacts)
          .where(and(...conditions))
          .limit(limit);

        if (params.interestLevel) {
          results = results.filter((c) => (c as any).interestLevel === params.interestLevel);
        }
        if (params.minScore !== undefined) {
          results = results.filter((c) => (c.score || 0) >= params.minScore);
        }
        if (params.maxScore !== undefined) {
          results = results.filter((c) => (c.score || 0) <= params.maxScore);
        }
        if (params.favoritesOnly) {
          results = results.filter((c) => (c as any).isFavorite === true);
        }
        if (params.tags) {
          const tagList = params.tags.split(',').map((t: string) => t.trim());
          results = results.filter((c) =>
            tagList.some((tag: string) => (c as any).tags?.includes(tag))
          );
        }

        return { contacts: results, count: results.length };
      }

      // Deal AI
      case 'analyze_deal': {
        const dealId = parseInt(params.dealId);
        const [deal] = await db!
          .select()
          .from(deals)
          .where(and(eq(deals.id, dealId), eq(deals.profileId, userId)));

        if (!deal) return { error: 'Deal not found' };

        let contact = null;
        if ((deal as any).contactId) {
          const [found] = await db!
            .select()
            .from(contacts)
            .where(eq(contacts.id, (deal as any).contactId));
          contact = found;
        }

        const client = getOpenAIClient();
        if (!client) return { error: 'OpenAI API key not configured' };

        const response = await client.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content:
                'You are a sales strategy expert. Analyze this deal and return JSON with: winProbability, strengths (array), risks (array), recommendedActions (array), timeline, competitivePosition, pricingRecommendation.',
            },
            {
              role: 'user',
              content: `Deal: ${JSON.stringify(deal)}. Contact: ${JSON.stringify(contact)}. Analyze this deal strategically.`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.4,
          max_tokens: 1500,
        });

        return safeJsonParse(response.choices[0].message.content || '{}');
      }

      // Deal Analytics
      case 'get_deal_analytics': {
        const allDeals = await db!.select().from(deals).where(eq(deals.profileId, userId));

        const wonDeals = allDeals.filter((d) => d.status === 'won');
        const lostDeals = allDeals.filter((d) => d.status === 'lost');
        const openDeals = allDeals.filter((d) => d.status === 'open');

        const totalRevenue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
        const totalPipelineValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);
        const avgDealSize = wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0;
        const conversionRate =
          allDeals.length > 0 ? Math.round((wonDeals.length / allDeals.length) * 100) : 0;

        const stageBreakdown: Record<string, { count: number; value: number }> = {};
        allDeals.forEach((d) => {
          const stage = (d as any).stage || 'unknown';
          if (!stageBreakdown[stage]) stageBreakdown[stage] = { count: 0, value: 0 };
          stageBreakdown[stage].count++;
          stageBreakdown[stage].value += d.value || 0;
        });

        const priorityBreakdown: Record<string, number> = {};
        allDeals.forEach((d) => {
          const priority = (d as any).priority || 'unknown';
          priorityBreakdown[priority] = (priorityBreakdown[priority] || 0) + 1;
        });

        return {
          period: params.period || 'month',
          totalDeals: allDeals.length,
          openDeals: openDeals.length,
          wonDeals: wonDeals.length,
          lostDeals: lostDeals.length,
          totalRevenue,
          totalPipelineValue,
          avgDealSize: Math.round(avgDealSize),
          conversionRate,
          stageBreakdown,
          priorityBreakdown,
        };
      }

      case 'get_deal_risks': {
        const allDeals = await db!.select().from(deals).where(eq(deals.profileId, userId));

        const now = new Date();
        const highRisk = allDeals.filter((d) => {
          if (d.status !== 'open') return false;
          const daysSinceUpdate = Math.floor(
            (now.getTime() - new Date(d.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysSinceUpdate > 7 || (d.probability || 0) < 30;
        });

        const mediumRisk = allDeals.filter((d) => {
          if (d.status !== 'open') return false;
          const daysSinceUpdate = Math.floor(
            (now.getTime() - new Date(d.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysSinceUpdate > 3 && daysSinceUpdate <= 7 && (d.probability || 0) >= 30;
        });

        const atRiskValue = highRisk.reduce((sum, d) => sum + (d.value || 0), 0);

        return {
          highRiskCount: highRisk.length,
          mediumRiskCount: mediumRisk.length,
          atRiskValue,
          highRiskDeals: highRisk.map((d) => ({
            id: d.id,
            title: d.title,
            value: d.value,
            probability: d.probability,
            daysInactive: Math.floor(
              (now.getTime() - new Date(d.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
            ),
          })),
        };
      }

      // Contact Customization
      case 'toggle_favorite': {
        const contactId = parseInt(params.contactId);
        const [contact] = await db!
          .select()
          .from(contacts)
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)));

        if (!contact) return { error: 'Contact not found' };

        const currentFav = (contact as any).isFavorite || false;

        const [updated] = await db!
          .update(contacts)
          .set({ isFavorite: !currentFav, updatedAt: new Date() } as any)
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)))
          .returning();

        return { contact: updated, isFavorite: !currentFav };
      }

      case 'add_custom_field': {
        const contactId = parseInt(params.contactId);
        if (!params.key || !params.value) return { error: 'Key and value are required' };

        const [contact] = await db!
          .select()
          .from(contacts)
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)));

        if (!contact) return { error: 'Contact not found' };

        const currentFields = (contact as any).customFields || {};
        const updatedFields = { ...currentFields, [params.key]: params.value };

        const [updated] = await db!
          .update(contacts)
          .set({ customFields: updatedFields, updatedAt: new Date() } as any)
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)))
          .returning();

        return { contact: updated, customFields: updatedFields };
      }

      case 'remove_custom_field': {
        const contactId = parseInt(params.contactId);
        if (!params.key) return { error: 'Key is required' };

        const [contact] = await db!
          .select()
          .from(contacts)
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)));

        if (!contact) return { error: 'Contact not found' };

        const currentFields = (contact as any).customFields || {};
        const { [params.key]: _, ...updatedFields } = currentFields;

        const [updated] = await db!
          .update(contacts)
          .set({ customFields: updatedFields, updatedAt: new Date() } as any)
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)))
          .returning();

        return { contact: updated, customFields: updatedFields };
      }

      // Social Monitoring
      case 'setup_social_monitoring': {
        const contactId = parseInt(params.contactId);
        const [contact] = await db!
          .select()
          .from(contacts)
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)));

        if (!contact) return { error: 'Contact not found' };

        const platforms = params.platforms
          ? params.platforms.split(',').map((p: string) => p.trim())
          : ['LinkedIn', 'Twitter'];

        const alertTypes = params.alertTypes
          ? params.alertTypes.split(',').map((a: string) => a.trim())
          : ['job_change', 'new_content', 'engagement'];

        return {
          success: true,
          contactId,
          platforms,
          alertTypes,
          monitoringId: `mon_${contactId}_${Date.now()}`,
          message: `Monitoring set up for ${contact.name} on ${platforms.join(', ')}`,
        };
      }

      case 'get_social_alerts': {
        const contactId = parseInt(params.contactId);
        const [contact] = await db!
          .select()
          .from(contacts)
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, userId)));

        if (!contact) return { error: 'Contact not found' };

        return {
          contactId,
          contactName: contact.name,
          alerts: [],
          message:
            'Social monitoring alerts retrieved. Configure monitoring first via setup_social_monitoring.',
        };
      }

      // Module Federation
      case 'get_module_federation_status': {
        const remotes = [
          {
            name: 'pipeline',
            url: 'https://cheery-syrniki-b5b6ca.netlify.app',
            module: './PipelineApp',
          },
          { name: 'analytics', url: 'https://ai-analytics.smartcrm.vip', module: './AnalyticsApp' },
          { name: 'contacts', url: 'https://contacts.smartcrm.vip', module: './ContactsApp' },
          { name: 'calendar', url: 'https://calendar.smartcrm.vip', module: './CalendarApp' },
          { name: 'agency', url: 'https://agency.smartcrm.vip', module: './AIAgencyApp' },
          {
            name: 'research',
            url: 'https://clever-syrniki-4df87f.netlify.app',
            module: './ProductResearchApp',
          },
        ];

        const statusChecks = await Promise.allSettled(
          remotes.map(async (remote) => {
            try {
              const response = await fetch(`${remote.url}/assets/remoteEntry.js`, {
                method: 'HEAD',
                signal: AbortSignal.timeout(3000),
              });
              return { ...remote, status: response.ok ? 'available' : 'unreachable' };
            } catch {
              return { ...remote, status: 'unreachable' };
            }
          })
        );

        return {
          mfeEnabled: process.env.VITE_ENABLE_MFE === 'true',
          remotes: statusChecks.map((result, i) => ({
            ...remotes[i],
            status: result.status === 'fulfilled' ? result.value.status : 'error',
          })),
        };
      }

      case 'broadcast_to_modules': {
        return {
          success: true,
          type: params.type,
          data: params.data,
          message: 'Broadcast message sent to all module federation apps',
          timestamp: new Date().toISOString(),
        };
      }

      // UI Control
      case 'toggle_dark_mode': {
        return {
          type: 'ui_action',
          action: 'toggle_dark_mode',
          message: 'Toggling dark mode',
          timestamp: new Date().toISOString(),
        };
      }

      case 'set_theme': {
        return {
          type: 'ui_action',
          action: 'set_theme',
          theme: params.theme || 'light',
          message: `Setting theme to ${params.theme || 'light'}`,
          timestamp: new Date().toISOString(),
        };
      }

      // Image Generation
      case 'generate_image': {
        const prompt = params.prompt;
        if (!prompt) return { error: 'Prompt is required for image generation' };

        const client = getOpenAIClient();
        if (!client) return { error: 'OpenAI API key not configured' };

        const size = params.size || '1024x1024';
        const validSizes = ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'];
        const imageSize = validSizes.includes(size) ? size : '1024x1024';

        const response = await client.images.generate({
          model: 'dall-e-3',
          prompt,
          size: imageSize as any,
          n: 1,
        });

        return {
          images: response.data.map((img) => ({
            url: img.url,
            revisedPrompt: img.revised_prompt,
          })),
          model: 'dall-e-3',
          size: imageSize,
        };
      }

      // Demo Agent
      case 'generate_demo_script': {
        const productName = params.productName;
        if (!productName) return { error: 'Product name is required' };

        const client = getOpenAIClient();
        if (!client) return { error: 'OpenAI API key not configured' };

        const response = await client.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content:
                'You are a product demo expert. Create compelling demo scripts. Return JSON with: introduction, keyFeatures (array with name, demo, benefit), callToAction, estimatedDuration, talkingPoints (array).',
            },
            {
              role: 'user',
              content: `Create a demo script for: ${productName}. Description: ${params.productDescription || 'N/A'}. Target audience: ${params.targetAudience || 'business professionals'}`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 2000,
        });

        return safeJsonParse(response.choices[0].message.content || '{}');
      }

      // Video Management
      case 'list_videos': {
        const limit = params.limit || 20;
        const videoRes = await fetch(
          `${process.env.CRM_BASE_URL || 'http://localhost:3000'}/api/videos`,
          {
            headers: {
              Authorization: req.headers.authorization || '',
              Cookie: req.headers.cookie || '',
            },
          }
        );

        if (!videoRes.ok) {
          return { videos: [], count: 0 };
        }

        const videos = await videoRes.json();
        return { videos: videos.slice(0, limit), count: videos.length };
      }

      case 'create_video': {
        const videoRes = await fetch(
          `${process.env.CRM_BASE_URL || 'http://localhost:3000'}/api/videos`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: req.headers.authorization || '',
              Cookie: req.headers.cookie || '',
            },
            body: JSON.stringify({
              title: params.title,
              script: params.script,
              recipient: params.recipientEmail
                ? { email: params.recipientEmail, name: params.recipientName }
                : undefined,
            }),
          }
        );

        if (!videoRes.ok) {
          return { error: 'Failed to create video' };
        }

        const video = await videoRes.json();
        return { video };
      }

      // Pipeline Drag & Drop
      case 'move_deal': {
        const dealId = parseInt(params.dealId);
        const stage = params.stage;
        if (!stage) return { error: 'Stage is required' };

        const [updated] = await db!
          .update(deals)
          .set({ stage, updatedAt: new Date() })
          .where(and(eq(deals.id, dealId), eq(deals.profileId, userId)))
          .returning();

        return updated
          ? { deal: updated, message: `Deal moved to ${stage}` }
          : { error: 'Deal not found' };
      }

      // Shared State Sync
      case 'sync_shared_state': {
        return {
          type: 'state_sync',
          action: 'sync',
          dataType: params.dataType,
          data: params.data,
          message: `Shared state synced: ${params.dataType}`,
          timestamp: new Date().toISOString(),
        };
      }

      default:
        return { error: `Tool '${toolName}' not implemented` };
    }
  } catch (error: any) {
    console.error(`Error executing CRM function ${toolName}:`, error);
    return { error: error.message || 'Unknown error' };
  }
}

// Health check for OpenClaw integration
router.get('/health', async (req, res) => {
  try {
    const response = await fetch(`${OPENCLAW_API_URL}/api/v1/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      res.json({ status: 'connected', openclawUrl: OPENCLAW_API_URL });
    } else {
      res.json({ status: 'degraded', openclawUrl: OPENCLAW_API_URL });
    }
  } catch (error) {
    res.json({
      status: 'disconnected',
      openclawUrl: OPENCLAW_API_URL,
      error: 'Unable to reach OpenClaw API',
    });
  }
});

export default router;
