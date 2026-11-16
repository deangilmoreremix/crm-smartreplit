import { generateAI } from './aiGenerate';

export interface AssistantConfig {
  name: string;
  instructions: string;
  model?: string;
  tools?: any[];
  file_ids?: string[];
}

export interface ThreadMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: number;
  metadata?: Record<string, any>;
}

export interface AssistantRun {
  id: string;
  status:
    | 'queued'
    | 'in_progress'
    | 'requires_action'
    | 'cancelling'
    | 'cancelled'
    | 'failed'
    | 'completed'
    | 'expired';
  thread_id: string;
  assistant_id: string;
  created_at: number;
  completed_at?: number;
  required_action?: any;
}

export class OpenAIAssistantsService {
  // Assistant Management
  // There is no server-side Assistants API; custom assistants cannot be created, read or deleted.
  async createAssistant(_config: AssistantConfig): Promise<any> {
    throw new Error('Custom OpenAI Assistants are not available; use the built-in assistants.');
  }

  async getAssistant(_assistantId: string): Promise<any> {
    throw new Error('Custom OpenAI Assistants are not available; use the built-in assistants.');
  }

  async deleteAssistant(_assistantId: string): Promise<any> {
    throw new Error('Custom OpenAI Assistants are not available; use the built-in assistants.');
  }

  async listAssistants(limit = 20) {
    // The built-in specialist assistants (chat runs through /api/ai/generate)
    void limit;
    return {
      data: [
        {
          id: 'contact-assistant',
          name: 'Contact Intelligence Agent',
          created_at: Date.now() / 1000,
          instructions: 'Contact management specialist',
        },
        {
          id: 'deal-assistant',
          name: 'Deal Assistant Agent',
          created_at: Date.now() / 1000,
          instructions: 'Deal progression specialist',
        },
        {
          id: 'task-assistant',
          name: 'Task Automation Agent',
          created_at: Date.now() / 1000,
          instructions: 'Task workflow specialist',
        },
        {
          id: 'pipeline-assistant',
          name: 'Pipeline Management Bot',
          created_at: Date.now() / 1000,
          instructions: 'Pipeline forecasting specialist',
        },
      ],
    };
  }

  async getMessages(_threadId: string, _limit = 20) {
    // Threads are not stored server-side, so there is no message history to return
    return {
      data: [],
    };
  }

  async streamChatWithAssistant(
    message: string,
    assistantId: string,
    threadId?: string,
    metadata?: Record<string, string>
  ) {
    return this.chatWithAssistant(message, assistantId, threadId, metadata);
  }

  // Enhanced Chat with Full Assistants API
  async chatWithAssistant(
    message: string,
    assistantId: string,
    threadId?: string,
    metadata?: Record<string, string>
  ): Promise<{ response: string; threadId: string; runId: string }> {
    // /api/assistants/chat never existed; answer through the server's generation route
    void metadata;
    const instructions: Record<string, string> = {
      'contact-assistant': 'You are a contact management and relationship intelligence specialist.',
      'deal-assistant': 'You are a deal progression and sales intelligence specialist.',
      'task-assistant': 'You are a task prioritization and workflow automation specialist.',
      'pipeline-assistant': 'You are a sales pipeline management and forecasting specialist.',
    };
    const { content } = await generateAI({
      tier: 'advanced',
      system: instructions[assistantId] || 'You are a helpful CRM assistant.',
      prompt: message,
    });

    const id = threadId || crypto.randomUUID();
    return { response: content, threadId: id, runId: crypto.randomUUID() };
  }

  // Utility Functions
  async createSpecializedAssistant(type: 'contact' | 'deal' | 'task' | 'pipeline') {
    const configs = {
      contact: {
        name: 'Contact Intelligence Agent',
        instructions: `You are a specialized AI assistant for contact management and relationship intelligence. 
        You help analyze contacts, predict engagement, generate personalized communication, and track relationship health.
        Always provide actionable insights based on contact data, interaction history, and communication patterns.`,
        tools: [{ type: 'code_interpreter' }],
      },
      deal: {
        name: 'Deal Assistant Agent',
        instructions: `You are a specialized AI assistant for deal management and sales intelligence.
        You help analyze deal progression, identify risks, suggest next steps, and optimize closing strategies.
        Always provide data-driven insights and specific recommendations for deal advancement.`,
        tools: [{ type: 'code_interpreter' }],
      },
      task: {
        name: 'Task Automation Agent',
        instructions: `You are a specialized AI assistant for task management and workflow automation.
        You help prioritize tasks, automate routine activities, and optimize productivity workflows.
        Always provide clear action items and automation suggestions.`,
        tools: [{ type: 'code_interpreter' }],
      },
      pipeline: {
        name: 'Pipeline Management Bot',
        instructions: `You are a specialized AI assistant for sales pipeline management and forecasting.
        You help analyze pipeline health, predict outcomes, and optimize sales processes.
        Always provide strategic insights and actionable pipeline improvements.`,
        tools: [{ type: 'code_interpreter' }],
      },
    };

    return await this.createAssistant(configs[type]);
  }
}

// Export singleton instance
export const openaiAssistantsService = new OpenAIAssistantsService();

// Legacy export for backward compatibility
export const useOpenAIAssistants = () => openaiAssistantsService;
