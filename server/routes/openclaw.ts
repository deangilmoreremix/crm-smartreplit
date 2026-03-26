import { Router } from 'express';
import { eq, and, or, like, desc, asc } from 'drizzle-orm';
import { db, isDbAvailable } from '../db';
import {
  contacts,
  deals,
  tasks,
  appointments,
  insertContactSchema,
  insertDealSchema,
  insertTaskSchema,
  insertAppointmentSchema,
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
