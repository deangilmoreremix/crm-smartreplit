import { useState, useCallback } from 'react';
import { generateAI } from './aiGenerate';
import { useContactStore } from '../store/contactStore';
import { useDealStore } from '../store/dealStore';
import { useTaskStore } from '../store/taskStore';

/**
 * Function-calling assistant over the user's real CRM data (contacts, deals, tasks from the stores).
 * The model answers questions from a snapshot of that data and may request one action
 * (createTask / scheduleFollowUp), which is executed against the task store.
 */

interface FunctionCall {
  name: string;
  arguments: any;
}

interface AssistantResult {
  content: string;
  function_call?: FunctionCall;
}

export const functionSchemas = [
  { name: 'searchContacts', description: 'Search contacts by name, company or email' },
  { name: 'searchDeals', description: 'Search deals by title, stage or value' },
  { name: 'getContactInfo', description: 'Details of a contact with related deals and tasks' },
  { name: 'getDealInfo', description: 'Details of a deal with related contact and tasks' },
  { name: 'createTask', description: 'Create a task' },
  { name: 'scheduleFollowUp', description: 'Schedule a follow-up task with a contact' },
];

const MAX_ITEMS = 50;

export function useOpenAIFunctions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { contacts } = useContactStore();
  const { deals } = useDealStore();
  const { tasks, addTask } = useTaskStore();

  const executeFunctionCall = useCallback(
    (functionCall: FunctionCall) => {
      const { name, arguments: args = {} } = functionCall;
      if (name === 'createTask' || name === 'scheduleFollowUp') {
        const title =
          name === 'scheduleFollowUp'
            ? `Follow up with ${args.contactName || args.contact || 'contact'}${args.notes ? `: ${args.notes}` : ''}`
            : args.title || 'New task';
        addTask({
          title,
          description: args.notes || args.description || '',
          priority: ['low', 'medium', 'high'].includes(args.priority) ? args.priority : 'medium',
          status: 'pending',
          dueDate: args.dueDate || args.date ? new Date(args.dueDate || args.date) : undefined,
          type: name === 'scheduleFollowUp' ? 'follow-up' : 'other',
        } as any);
        return { message: `Task "${title}" created` };
      }
      throw new Error(`Function "${name}" is not available`);
    },
    [addTask]
  );

  const salesAssistantWithFunctions = useCallback(
    async (
      query: string,
      context = '',
      previousMessages: Array<{ role: string; content: string }> = [],
      enabledFunctions: string[] = functionSchemas.map((f) => f.name)
    ): Promise<AssistantResult> => {
      setIsLoading(true);
      setError(null);
      try {
        const snapshot = {
          contacts: Object.values(contacts || {})
            .slice(0, MAX_ITEMS)
            .map((c: any) => ({ id: c.id, name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim(), company: c.company, email: c.email, title: c.title, status: c.status })),
          deals: (deals || []).slice(0, MAX_ITEMS).map((d: any) => ({ id: d.id, title: d.title, value: d.value, stage: d.stage, probability: d.probability, contact: d.contactName || d.contact })),
          tasks: (tasks || []).slice(0, MAX_ITEMS).map((t: any) => ({ id: t.id, title: t.title, status: t.status, priority: t.priority, dueDate: t.dueDate })),
        };
        const actions = enabledFunctions.filter((f) => f === 'createTask' || f === 'scheduleFollowUp');

        const { content } = await generateAI({
          json: true,
          system: `You are a CRM sales assistant. ${context}
Answer only from the CRM data below; say so if the data does not contain the answer.
${actions.length ? `You may request one action: ${actions.join(', ')}.` : 'You cannot perform actions.'}
Respond as JSON: {"reply": string, "action": null | {"name": "createTask" | "scheduleFollowUp", "arguments": {"title"?: string, "contactName"?: string, "priority"?: "low"|"medium"|"high", "dueDate"?: "YYYY-MM-DD", "notes"?: string}}}

CRM data: ${JSON.stringify(snapshot)}`,
          prompt: [...previousMessages.slice(-10).map((m) => `${m.role}: ${m.content}`), `user: ${query}`].join('\n'),
        });

        const parsed = JSON.parse(content);
        let reply: string = parsed.reply || '';
        let functionCall: FunctionCall | undefined;
        if (parsed.action?.name && actions.includes(parsed.action.name)) {
          functionCall = { name: parsed.action.name, arguments: parsed.action.arguments || {} };
          const result = executeFunctionCall(functionCall);
          reply = `${reply}\n\n${result.message}`.trim();
        }
        return { content: reply, function_call: functionCall };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [contacts, deals, tasks, executeFunctionCall]
  );

  const processMessage = useCallback(
    async (messages: Array<{ role: string; content: string }>, enabledFunctions?: string[]) => {
      const last = messages[messages.length - 1];
      const result = await salesAssistantWithFunctions(last?.content || '', '', messages.slice(0, -1), enabledFunctions);
      return result.content;
    },
    [salesAssistantWithFunctions]
  );

  return {
    salesAssistantWithFunctions,
    processMessage,
    executeFunctionCall,
    functionSchemas,
    isLoading,
    error,
    availableFunctions: functionSchemas.map((f) => f.name),
  };
}
