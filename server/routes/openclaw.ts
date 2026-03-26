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

const router = Router();

// OpenClaw API Configuration
const OPENCLAW_API_URL = process.env.OPENCLAW_API_URL || 'http://localhost:3001';
const OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY || '';

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
];

// Chat endpoint - proxy to OpenClaw
router.post('/chat', async (req, res) => {
  try {
    const { message, history, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build the request to OpenClaw
    const openclawRequest = {
      message,
      history: history || [],
      tools: crmTools,
      context: {
        ...context,
        crmBaseUrl: process.env.CRM_BASE_URL || 'http://localhost:3000',
      },
    };

    // Call OpenClaw API
    const response = await fetch(`${OPENCLAW_API_URL}/api/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(OPENCLAW_API_KEY ? { Authorization: `Bearer ${OPENCLAW_API_KEY}` } : {}),
      },
      body: JSON.stringify(openclawRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenClaw API error:', errorText);
      return res.status(response.status).json({ error: 'OpenClaw API error', details: errorText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('OpenClaw proxy error:', error);
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
      },
    };

    const response = await fetch(`${OPENCLAW_API_URL}/api/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(OPENCLAW_API_KEY ? { Authorization: `Bearer ${OPENCLAW_API_KEY}` } : {}),
      },
      body: JSON.stringify(openclawRequest),
    });

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

    // Find the tool definition
    const toolDef = crmTools.find((t) => t.name === tool);
    if (!toolDef) {
      return res.status(400).json({ error: `Tool '${tool}' not found` });
    }

    // Execute the tool by calling the appropriate CRM API
    const result = await executeCRMFunction(tool, parameters);

    res.json({ success: true, tool, result });
  } catch (error) {
    console.error('Tool execution error:', error);
    res.status(500).json({ error: 'Failed to execute tool', details: error.message });
  }
});

// Helper function to execute CRM functions based on tool name
async function executeCRMFunction(toolName: string, params: any, userId?: string): Promise<any> {
  console.log(`Executing CRM function: ${toolName}`, params);

  if (!isDbAvailable()) {
    return { error: 'Database not available' };
  }

  const targetUserId = userId || 'dev-user-12345';

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
                  eq(contacts.profileId, targetUserId),
                  or(
                    like(contacts.firstName, `%${query}%`),
                    like(contacts.lastName, `%${query}%`),
                    like(contacts.email, `%${query}%`),
                    like(contacts.company, `%${query}%`)
                  )
                )
              : eq(contacts.profileId, targetUserId)
          )
          .limit(limit);
        return { contacts: results, count: results.length };
      }

      case 'get_contact_details': {
        const contactId = parseInt(params.contactId);
        const [contact] = await db!
          .select()
          .from(contacts)
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, targetUserId)));
        return contact || { error: 'Contact not found' };
      }

      case 'create_contact': {
        const validated = insertContactSchema.parse({ ...params, profileId: targetUserId });
        const [newContact] = await db!.insert(contacts).values(validated).returning();
        return { contact: newContact };
      }

      case 'update_contact': {
        const contactId = parseInt(params.contactId);
        const [updated] = await db!
          .update(contacts)
          .set({ ...params.data, updatedAt: new Date() })
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, targetUserId)))
          .returning();
        return updated || { error: 'Contact not found' };
      }

      case 'delete_contact': {
        const contactId = parseInt(params.contactId);
        await db!
          .delete(contacts)
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, targetUserId)));
        return { success: true, message: 'Contact deleted' };
      }

      case 'list_deals': {
        const limit = params.limit || 20;
        const stage = params.stage;
        const status = params.status;
        let whereClause = eq(deals.profileId, targetUserId);

        let results = await db!
          .select()
          .from(deals)
          .where(eq(deals.profileId, targetUserId))
          .limit(limit);

        if (stage) results = results.filter((d) => d.stage === stage);
        if (status) results = results.filter((d) => d.status === status);

        return { deals: results, count: results.length };
      }

      case 'create_deal': {
        const validated = insertDealSchema.parse({ ...params, profileId: targetUserId });
        const [newDeal] = await db!.insert(deals).values(validated).returning();
        return { deal: newDeal };
      }

      case 'update_deal_stage': {
        const dealId = parseInt(params.dealId);
        const [updated] = await db!
          .update(deals)
          .set({ stage: params.stage, updatedAt: new Date() })
          .where(and(eq(deals.id, dealId), eq(deals.profileId, targetUserId)))
          .returning();
        return updated || { error: 'Deal not found' };
      }

      case 'close_deal': {
        const dealId = parseInt(params.dealId);
        const status = params.status === 'closed-won' ? 'won' : 'lost';
        const [updated] = await db!
          .update(deals)
          .set({ status, updatedAt: new Date() })
          .where(and(eq(deals.id, dealId), eq(deals.profileId, targetUserId)))
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
          .where(eq(tasks.profileId, targetUserId))
          .limit(limit);

        if (status) results = results.filter((t) => t.status === status);
        if (dueDate)
          results = results.filter(
            (t) => t.dueDate && t.dueDate.toISOString().split('T')[0] === dueDate
          );

        return { tasks: results, count: results.length };
      }

      case 'create_task': {
        const validated = insertTaskSchema.parse({ ...params, profileId: targetUserId });
        const [newTask] = await db!.insert(tasks).values(validated).returning();
        return { task: newTask };
      }

      case 'complete_task': {
        const taskId = parseInt(params.taskId);
        const [updated] = await db!
          .update(tasks)
          .set({ status: 'completed', updatedAt: new Date() })
          .where(and(eq(tasks.id, taskId), eq(tasks.profileId, targetUserId)))
          .returning();
        return updated || { error: 'Task not found' };
      }

      case 'delete_task': {
        const taskId = parseInt(params.taskId);
        await db!.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.profileId, targetUserId)));
        return { success: true, message: 'Task deleted' };
      }

      case 'search_companies': {
        const query = params.query || '';
        const limit = params.limit || 10;

        let supabaseQuery = supabase
          .from('companies')
          .select('*')
          .eq('owner_user_id', targetUserId);
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
            owner_user_id: targetUserId,
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
          .where(eq(appointments.profileId, targetUserId))
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
          profileId: targetUserId,
          dateTime: new Date(params.dateTime),
        });
        const [newAppointment] = await db!.insert(appointments).values(validated).returning();
        return { appointment: newAppointment };
      }

      case 'cancel_appointment': {
        const appointmentId = parseInt(params.appointmentId);
        await db!
          .delete(appointments)
          .where(and(eq(appointments.id, appointmentId), eq(appointments.profileId, targetUserId)));
        return { success: true, message: 'Appointment cancelled' };
      }

      case 'get_pipeline_summary': {
        const allDeals = await db!.select().from(deals).where(eq(deals.profileId, targetUserId));
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
        const allDeals = await db!.select().from(deals).where(eq(deals.profileId, targetUserId));
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
          contacts: '/contacts',
          deals: '/pipeline',
          pipeline: '/pipeline',
          tasks: '/tasks',
          appointments: '/appointments',
          calendar: '/calendar',
          analytics: '/analytics',
          email: '/email',
          sms: '/messaging',
          companies: '/companies',
          phone: '/phone',
          video: '/videos',
        };
        const appKey = (params.app || '').toLowerCase();
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
          .where(
            and(eq(communications.contactId, contactId), eq(communications.profileId, targetUserId))
          )
          .limit(limit);

        if (type) results = results.filter((c) => c.type === type);

        return { communications: results, count: results.length };
      }

      case 'create_communication': {
        const validated = insertCommunicationSchema.parse({
          ...params,
          contactId: parseInt(params.contactId),
          profileId: targetUserId,
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

        const conditions = [eq(notes.profileId, targetUserId)];
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
          profileId: targetUserId,
        });
        const [newNote] = await db!.insert(notes).values(validated).returning();
        return { note: newNote };
      }

      case 'delete_note': {
        const noteId = parseInt(params.noteId);
        await db!.delete(notes).where(and(eq(notes.id, noteId), eq(notes.profileId, targetUserId)));
        return { success: true, message: 'Note deleted' };
      }

      // Tags
      case 'add_contact_tag': {
        const contactId = parseInt(params.contactId);
        const [contact] = await db!
          .select()
          .from(contacts)
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, targetUserId)));

        if (!contact) return { error: 'Contact not found' };

        const currentTags = (contact as any).tags || [];
        const newTags = [...new Set([...currentTags, params.tag])];

        const [updated] = await db!
          .update(contacts)
          .set({ tags: newTags, updatedAt: new Date() })
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, targetUserId)))
          .returning();

        return { contact: updated, tags: newTags };
      }

      case 'remove_contact_tag': {
        const contactId = parseInt(params.contactId);
        const [contact] = await db!
          .select()
          .from(contacts)
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, targetUserId)));

        if (!contact) return { error: 'Contact not found' };

        const currentTags = (contact as any).tags || [];
        const newTags = currentTags.filter((t: string) => t !== params.tag);

        const [updated] = await db!
          .update(contacts)
          .set({ tags: newTags, updatedAt: new Date() })
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, targetUserId)))
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
            and(eq(communications.contactId, contactId), eq(communications.profileId, targetUserId))
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
          .where(
            and(eq(communications.contactId, contactId), eq(communications.profileId, targetUserId))
          )
          .limit(limit)
          .orderBy(desc(communications.sentAt), desc(communications.createdAt));

        const contactNotes = await db!
          .select()
          .from(notes)
          .where(and(eq(notes.contactId, contactId), eq(notes.profileId, targetUserId)))
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
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, targetUserId)));

        if (!contact) return { error: 'Contact not found' };

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) return { error: 'OpenAI API key not configured' };

        const OpenAI = (await import('openai')).default;
        const openaiClient = new OpenAI({ apiKey });

        const response = await openaiClient.chat.completions.create({
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
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');
        return result;
      }

      case 'generate_personalization': {
        const contactId = parseInt(params.contactId);
        const [contact] = await db!
          .select()
          .from(contacts)
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, targetUserId)));

        if (!contact) return { error: 'Contact not found' };

        const comms = await db!
          .select()
          .from(communications)
          .where(
            and(eq(communications.contactId, contactId), eq(communications.profileId, targetUserId))
          )
          .limit(10);

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) return { error: 'OpenAI API key not configured' };

        const OpenAI = (await import('openai')).default;
        const openaiClient = new OpenAI({ apiKey });

        const previousInteractions = comms.map(
          (c) => `${c.type}: ${c.subject || ''} - ${c.content || ''}`
        );

        const response = await openaiClient.chat.completions.create({
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
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');
        return result;
      }

      case 'enrich_contact': {
        const contactId = parseInt(params.contactId);
        const [contact] = await db!
          .select()
          .from(contacts)
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, targetUserId)));

        if (!contact) return { error: 'Contact not found' };

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) return { error: 'OpenAI API key not configured' };

        const OpenAI = (await import('openai')).default;
        const openaiClient = new OpenAI({ apiKey });

        const response = await openaiClient.chat.completions.create({
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
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');
        return result;
      }

      case 'social_media_research': {
        const contactId = parseInt(params.contactId);
        const [contact] = await db!
          .select()
          .from(contacts)
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, targetUserId)));

        if (!contact) return { error: 'Contact not found' };

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) return { error: 'OpenAI API key not configured' };

        const platforms = params.platforms
          ? params.platforms.split(',').map((p: string) => p.trim())
          : ['LinkedIn', 'Twitter', 'Instagram', 'YouTube', 'GitHub'];

        const OpenAI = (await import('openai')).default;
        const openaiClient = new OpenAI({ apiKey });

        const response = await openaiClient.chat.completions.create({
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
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');
        return result;
      }

      case 'analyze_sentiment': {
        const text = params.text;
        if (!text) return { error: 'Text is required for sentiment analysis' };

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
                'You are a sentiment analysis expert. Analyze the sentiment and return JSON with: sentiment (positive/negative/neutral/mixed), score (1-100), confidence, keyPhrases (array), emotionalTone.',
            },
            {
              role: 'user',
              content: `Analyze the sentiment of: "${text}"`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');
        return result;
      }

      case 'generate_email_draft': {
        const contactId = parseInt(params.contactId);
        const [contact] = await db!
          .select()
          .from(contacts)
          .where(and(eq(contacts.id, contactId), eq(contacts.profileId, targetUserId)));

        if (!contact) return { error: 'Contact not found' };

        const purpose = params.purpose || 'follow-up';
        const context = params.context || '';

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) return { error: 'OpenAI API key not configured' };

        const OpenAI = (await import('openai')).default;
        const openaiClient = new OpenAI({ apiKey });

        const response = await openaiClient.chat.completions.create({
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
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');
        return result;
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
