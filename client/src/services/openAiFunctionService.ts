import { useState, useCallback } from 'react';

// Real CRM data is loaded from the server APIs (the same /api/contacts, /api/deals and
// /api/tasks endpoints the rest of the client uses).
interface CrmContact {
  id: string;
  name: string;
  email: string;
  company: string;
}

interface CrmDeal {
  id: string;
  title: string;
  status: string;
  value: number;
  contact: string;
  contactId?: string;
}

interface CrmTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  contact: string;
  contactId?: string;
}

async function getJson(url: string, init?: RequestInit): Promise<any> {
  const response = await fetch(url, { credentials: 'include', ...init });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request to ${url} failed (${response.status})`);
  }
  return response.json();
}

const contactName = (c: any) =>
  [c.firstName, c.lastName].filter(Boolean).join(' ') || c.name || c.email || '';

async function loadContacts(): Promise<CrmContact[]> {
  const rows = await getJson('/api/contacts');
  return (Array.isArray(rows) ? rows : []).map((c: any) => ({
    id: String(c.id),
    name: contactName(c),
    email: c.email || '',
    company: c.company || '',
  }));
}

async function loadDeals(contacts: CrmContact[]): Promise<CrmDeal[]> {
  const rows = await getJson('/api/deals');
  return (Array.isArray(rows) ? rows : []).map((d: any) => ({
    id: String(d.id),
    title: d.title || '',
    status: d.stage || d.status || '',
    value: Number(d.value) || 0,
    contactId: d.contactId != null ? String(d.contactId) : undefined,
    contact: contacts.find((c) => c.id === String(d.contactId))?.name || '',
  }));
}

async function loadTasks(contacts: CrmContact[]): Promise<CrmTask[]> {
  const rows = await getJson('/api/tasks');
  return (Array.isArray(rows) ? rows : []).map((t: any) => ({
    id: String(t.id),
    title: t.title || '',
    status: t.status || 'pending',
    priority: t.priority || 'medium',
    contactId: t.contactId != null ? String(t.contactId) : undefined,
    contact: contacts.find((c) => c.id === String(t.contactId))?.name || '',
  }));
}

interface FunctionCall {
  name: string;
  arguments: any;
}

interface Message {
  role: 'user' | 'assistant' | 'function';
  content: string;
  functionCall?: FunctionCall;
  name?: string;
}

// Available functions for the AI assistant
const availableFunctions = {
  searchContacts: async (params: { query: string; limit?: number }) => {
    const { query, limit = 10 } = params;
    const q = query.toLowerCase();
    const filtered = (await loadContacts())
      .filter(
        (contact) =>
          contact.name.toLowerCase().includes(q) ||
          contact.company.toLowerCase().includes(q) ||
          contact.email.toLowerCase().includes(q)
      )
      .slice(0, limit);

    return {
      contacts: filtered,
      count: filtered.length,
      query,
    };
  },

  searchDeals: async (params: {
    query?: string;
    status?: string;
    minValue?: number;
    limit?: number;
  }) => {
    const { query, status, minValue, limit = 10 } = params;
    const contacts = await loadContacts();
    let filtered = await loadDeals(contacts);

    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (deal) => deal.title.toLowerCase().includes(q) || deal.contact.toLowerCase().includes(q)
      );
    }

    if (status) {
      filtered = filtered.filter((deal) => deal.status === status);
    }

    if (minValue) {
      filtered = filtered.filter((deal) => deal.value >= minValue);
    }

    return {
      deals: filtered.slice(0, limit),
      count: filtered.length,
      totalValue: filtered.reduce((sum, deal) => sum + deal.value, 0),
    };
  },

  getContactInfo: async (params: { contactId: string }) => {
    const contacts = await loadContacts();
    const contact = contacts.find((c) => c.id === String(params.contactId));
    if (!contact) {
      return { error: 'Contact not found' };
    }

    const [deals, tasks] = await Promise.all([loadDeals(contacts), loadTasks(contacts)]);
    const relatedDeals = deals.filter((d) => d.contactId === contact.id);
    const relatedTasks = tasks.filter((t) => t.contactId === contact.id);

    return {
      contact,
      deals: relatedDeals,
      tasks: relatedTasks,
      totalDealValue: relatedDeals.reduce((sum, deal) => sum + deal.value, 0),
    };
  },

  getDealInfo: async (params: { dealId: string }) => {
    const contacts = await loadContacts();
    const deals = await loadDeals(contacts);
    const deal = deals.find((d) => d.id === String(params.dealId));
    if (!deal) {
      return { error: 'Deal not found' };
    }

    const contact = contacts.find((c) => c.id === deal.contactId);
    const tasks = await loadTasks(contacts);
    const relatedTasks = tasks.filter((t) => t.contactId === deal.contactId);

    return {
      deal,
      contact,
      tasks: relatedTasks,
    };
  },

  createTask: async (params: {
    title: string;
    contact?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
  }) => {
    const contacts = params.contact ? await loadContacts() : [];
    const match = params.contact
      ? contacts.find((c) => c.name.toLowerCase() === params.contact!.toLowerCase())
      : undefined;

    const created = await getJson('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: params.title,
        priority: params.priority || 'medium',
        status: 'pending',
        description: params.dueDate ? `Due: ${params.dueDate}` : undefined,
        contactId: match ? Number(match.id) : undefined,
      }),
    });

    const newTask = {
      id: String(created.id),
      title: created.title,
      contact: match?.name || params.contact || 'Unassigned',
      priority: created.priority || params.priority || 'medium',
      status: created.status || 'pending',
      dueDate: params.dueDate,
      createdAt: created.createdAt,
    };

    return {
      task: newTask,
      message: `Task "${newTask.title}" created successfully`,
    };
  },

  scheduleFollowUp: async (params: { contactName: string; date: string; notes?: string }) => {
    const contacts = await loadContacts();
    const match = contacts.find((c) => c.name.toLowerCase() === params.contactName.toLowerCase());

    const created = await getJson('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Follow up with ${params.contactName}`,
        description: [`Scheduled for ${params.date}`, params.notes].filter(Boolean).join('\n'),
        priority: 'medium',
        status: 'pending',
        contactId: match ? Number(match.id) : undefined,
      }),
    });

    const followUp = {
      id: String(created.id),
      contact: params.contactName,
      scheduledDate: params.date,
      notes: params.notes || '',
      type: 'follow-up',
      status: 'scheduled',
    };

    return {
      followUp,
      message: `Follow-up scheduled with ${params.contactName} for ${params.date}`,
    };
  },
};

export function useOpenAIFunctions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeFunctionCall = useCallback(async (functionCall: FunctionCall) => {
    try {
      const { name, arguments: args } = functionCall;

      if (!(name in availableFunctions)) {
        throw new Error(`Function "${name}" not found`);
      }

      const func = availableFunctions[name as keyof typeof availableFunctions] as (
        a: any
      ) => Promise<any>;
      const result = await func(args);

      return result;
    } catch (err) {
      console.error('Function execution error:', err);
      throw err;
    }
  }, []);

  const processMessage = useCallback(
    async (
      messages: Message[],
      enabledFunctions: string[] = Object.keys(availableFunctions)
    ): Promise<string> => {
      setIsLoading(true);
      setError(null);

      try {
        const lastMessage = messages[messages.length - 1];
        const userQuery = lastMessage.content.toLowerCase();

        // Simple pattern matching to determine which function to call
        let response = '';
        let functionCalled = false;

        if (
          userQuery.includes('find') ||
          userQuery.includes('search') ||
          userQuery.includes('show')
        ) {
          if (userQuery.includes('contact')) {
            const searchResult = (await executeFunctionCall({
              name: 'searchContacts',
              arguments: { query: userQuery.split(' ').slice(-1)[0] || '', limit: 5 },
            })) as { contacts: any[]; count: number; query: string };

            response = `I found ${searchResult.count} contacts:\n\n`;
            searchResult.contacts.forEach((contact: any) => {
              response += `• ${contact.name} (${contact.company}) - ${contact.email}\n`;
            });
            functionCalled = true;
          } else if (userQuery.includes('deal')) {
            const searchResult = (await executeFunctionCall({
              name: 'searchDeals',
              arguments: { limit: 5 },
            })) as { deals: any[]; count: number; totalValue: number };

            response = `Here are the current deals (Total value: $${searchResult.totalValue.toLocaleString()}):\n\n`;
            searchResult.deals.forEach((deal: any) => {
              response += `• ${deal.title} - $${deal.value.toLocaleString()} (${deal.status})\n`;
            });
            functionCalled = true;
          }
        } else if (userQuery.includes('create') && userQuery.includes('task')) {
          const taskTitle = userQuery.replace(/create|task|a|new/g, '').trim();
          const createResult = (await executeFunctionCall({
            name: 'createTask',
            arguments: { title: taskTitle || 'New task', priority: 'medium' },
          })) as { task: any; message: string };

          response = createResult.message;
          functionCalled = true;
        } else if (userQuery.includes('follow') && userQuery.includes('up')) {
          const nameMatch = lastMessage.content.match(/\bwith\s+(.+?)\s*$/i);
          if (!nameMatch) {
            throw new Error('Please say who the follow-up is with, e.g. "Schedule a follow-up with Sarah"');
          }
          const scheduleResult = (await executeFunctionCall({
            name: 'scheduleFollowUp',
            arguments: {
              contactName: nameMatch[1],
              date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            },
          })) as { followUp: any; message: string };

          response = scheduleResult.message;
          functionCalled = true;
        }

        if (!functionCalled) {
          response = `I can help you with:
• Searching contacts and deals
• Creating tasks
• Scheduling follow-ups
• Getting contact or deal information

Try asking something like:
• "Find contacts at ABC Corp"
• "Show me all deals"
• "Create a task to call John"
• "Schedule a follow-up with Sarah"`;
        }

        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [executeFunctionCall]
  );

  return {
    processMessage,
    executeFunctionCall,
    isLoading,
    error,
    availableFunctions: Object.keys(availableFunctions),
  };
}
