import { useState, useCallback } from 'react';

// Mock data for CRM functions
const mockContacts = [
  { id: '1', name: 'John Smith', email: 'john@example.com', company: 'ABC Corp', deal_value: 50000 },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', company: 'XYZ Inc', deal_value: 75000 },
  { id: '3', name: 'Mike Chen', email: 'mike@example.com', company: 'Tech Solutions', deal_value: 120000 }
];

const mockDeals = [
  { id: '1', title: 'ABC Corp Integration', status: 'negotiation', value: 50000, contact: 'John Smith' },
  { id: '2', title: 'XYZ Software License', status: 'proposal', value: 75000, contact: 'Sarah Johnson' },
  { id: '3', title: 'Tech Solutions Upgrade', status: 'qualified', value: 120000, contact: 'Mike Chen' }
];

const mockTasks = [
  { id: '1', title: 'Follow up with John', status: 'pending', priority: 'high', contact: 'John Smith' },
  { id: '2', title: 'Send proposal to Sarah', status: 'in-progress', priority: 'medium', contact: 'Sarah Johnson' },
  { id: '3', title: 'Demo prep for Mike', status: 'completed', priority: 'high', contact: 'Mike Chen' }
];

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
  searchContacts: (params: { query: string; limit?: number }) => {
    const { query, limit = 10 } = params;
    const filtered = mockContacts.filter(contact => 
      contact.name.toLowerCase().includes(query.toLowerCase()) ||
      contact.company.toLowerCase().includes(query.toLowerCase()) ||
      contact.email.toLowerCase().includes(query.toLowerCase())
    ).slice(0, limit);
    
    return {
      contacts: filtered,
      count: filtered.length,
      query
    };
  },

  searchDeals: (params: { query?: string; status?: string; minValue?: number; limit?: number }) => {
    const { query, status, minValue, limit = 10 } = params;
    let filtered = mockDeals;
    
    if (query) {
      filtered = filtered.filter(deal => 
        deal.title.toLowerCase().includes(query.toLowerCase()) ||
        deal.contact.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    if (status) {
      filtered = filtered.filter(deal => deal.status === status);
    }
    
    if (minValue) {
      filtered = filtered.filter(deal => deal.value >= minValue);
    }
    
    return {
      deals: filtered.slice(0, limit),
      count: filtered.length,
      totalValue: filtered.reduce((sum, deal) => sum + deal.value, 0)
    };
  },

  getContactInfo: (params: { contactId: string }) => {
    const contact = mockContacts.find(c => c.id === params.contactId);
    if (!contact) {
      return { error: 'Contact not found' };
    }
    
    const relatedDeals = mockDeals.filter(d => d.contact === contact.name);
    const relatedTasks = mockTasks.filter(t => t.contact === contact.name);
    
    return {
      contact,
      deals: relatedDeals,
      tasks: relatedTasks,
      totalDealValue: relatedDeals.reduce((sum, deal) => sum + deal.value, 0)
    };
  },

  getDealInfo: (params: { dealId: string }) => {
    const deal = mockDeals.find(d => d.id === params.dealId);
    if (!deal) {
      return { error: 'Deal not found' };
    }
    
    const contact = mockContacts.find(c => c.name === deal.contact);
    const relatedTasks = mockTasks.filter(t => t.contact === deal.contact);
    
    return {
      deal,
      contact,
      tasks: relatedTasks
    };
  },

  createTask: (params: { title: string; contact?: string; priority?: 'low' | 'medium' | 'high'; dueDate?: string }) => {
    const newTask = {
      id: String(Date.now()),
      title: params.title,
      contact: params.contact || 'Unassigned',
      priority: params.priority || 'medium',
      status: 'pending' as const,
      dueDate: params.dueDate,
      createdAt: new Date().toISOString()
    };
    
    return {
      task: newTask,
      message: `Task "${newTask.title}" created successfully`
    };
  },

  scheduleFollowUp: (params: { contactName: string; date: string; notes?: string }) => {
    const followUp = {
      id: String(Date.now()),
      contact: params.contactName,
      scheduledDate: params.date,
      notes: params.notes || '',
      type: 'follow-up',
      status: 'scheduled'
    };
    
    return {
      followUp,
      message: `Follow-up scheduled with ${params.contactName} for ${params.date}`
    };
  }
};

export function useOpenAIFunctions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeFunctionCall = useCallback((functionCall: FunctionCall) => {
    try {
      const { name, arguments: args } = functionCall;
      
      if (!(name in availableFunctions)) {
        throw new Error(`Function "${name}" not found`);
      }
      
      const func = availableFunctions[name as keyof typeof availableFunctions];
      const result = func(args);
      
      return result;
    } catch (err) {
      console.error('Function execution error:', err);
      throw err;
    }
  }, []);

  const processMessage = useCallback(async (
    messages: Message[], 
    enabledFunctions: string[] = Object.keys(availableFunctions)
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      const lastMessage = messages[messages.length - 1];
      const userQuery = lastMessage.content.toLowerCase();
      
      // Simple pattern matching to determine which function to call
      let response = '';
      let functionCalled = false;
      
      if (userQuery.includes('find') || userQuery.includes('search') || userQuery.includes('show')) {
        if (userQuery.includes('contact')) {
          const searchResult = executeFunctionCall({
            name: 'searchContacts',
            arguments: { query: userQuery.split(' ').slice(-1)[0] || '', limit: 5 }
          }) as { contacts: any[], count: number, query: string };
          
          response = `I found ${searchResult.count} contacts:\n\n`;
          searchResult.contacts.forEach((contact: any) => {
            response += `• ${contact.name} (${contact.company}) - ${contact.email}\n`;
          });
          functionCalled = true;
        } else if (userQuery.includes('deal')) {
          const searchResult = executeFunctionCall({
            name: 'searchDeals',
            arguments: { limit: 5 }
          }) as { deals: any[], count: number, totalValue: number };
          
          response = `Here are the current deals (Total value: $${searchResult.totalValue.toLocaleString()}):\n\n`;
          searchResult.deals.forEach((deal: any) => {
            response += `• ${deal.title} - $${deal.value.toLocaleString()} (${deal.status})\n`;
          });
          functionCalled = true;
        }
      } else if (userQuery.includes('create') && userQuery.includes('task')) {
        const taskTitle = userQuery.replace(/create|task|a|new/g, '').trim();
        const createResult = executeFunctionCall({
          name: 'createTask',
          arguments: { title: taskTitle || 'New task', priority: 'medium' }
        }) as { task: any, message: string };
        
        response = createResult.message;
        functionCalled = true;
      } else if (userQuery.includes('follow') && userQuery.includes('up')) {
        const scheduleResult = executeFunctionCall({
          name: 'scheduleFollowUp',
          arguments: { 
            contactName: 'Selected Contact', 
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        }) as { followUp: any, message: string };
        
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
  }, [executeFunctionCall]);

  return {
    processMessage,
    executeFunctionCall,
    isLoading,
    error,
    availableFunctions: Object.keys(availableFunctions)
  };
}