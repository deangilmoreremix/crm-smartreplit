import { createConversation, sendConversationMessage, listConversationMessages } from './aiGenerate';

// The OpenAI Assistants API was shut down on 2026-08-26. Built-in assistants now chat through the
// Responses API's Conversations (server routes /api/ai/conversations), so history persists between turns.
const ASSISTANT_INSTRUCTIONS: Record<string, string> = {
  'contact-assistant':
    'You are a specialized AI assistant for contact management and relationship intelligence. Analyze contacts, predict engagement, draft personalized communication and track relationship health. Give actionable insights.',
  'deal-assistant':
    'You are a specialized AI assistant for deal management and sales intelligence. Analyze deal progression, identify risks, suggest next steps and closing strategies. Give data-driven recommendations.',
  'task-assistant':
    'You are a specialized AI assistant for task management and workflow automation. Prioritize tasks, suggest automations and optimize productivity. Give clear action items.',
  'pipeline-assistant':
    'You are a specialized AI assistant for sales pipeline management and forecasting. Analyze pipeline health, predict outcomes and suggest process improvements.',
};

const conversationKey = (assistantId: string) => `smartcrm-ai-conversation:${assistantId}`;

function storedConversation(assistantId: string): string | null {
  try {
    return localStorage.getItem(conversationKey(assistantId));
  } catch {
    return null;
  }
}

function storeConversation(assistantId: string, conversationId: string) {
  try {
    localStorage.setItem(conversationKey(assistantId), conversationId);
  } catch {
    /* storage unavailable: the conversation just isn't remembered across reloads */
  }
}

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
  // The Assistants API was shut down; custom assistants cannot be created, read or deleted.
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
    // The built-in specialist assistants (chat runs on Responses API conversations)
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

  /** Messages of a conversation (threadId = conversation id), oldest first. */
  async getMessages(threadId: string, limit = 20) {
    if (!threadId) return { data: [] as ThreadMessage[] };
    const messages = await listConversationMessages(threadId);
    return {
      data: messages.slice(-limit).map(
        (m): ThreadMessage => ({
          id: m.id,
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.text,
          created_at: Math.floor(Date.now() / 1000),
        })
      ),
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

  /**
   * Chat with a built-in assistant. Each assistant keeps one conversation per browser (remembered in
   * localStorage) unless a threadId (conversation id) is passed.
   */
  async chatWithAssistant(
    message: string,
    assistantId: string,
    threadId?: string,
    metadata?: Record<string, string>
  ): Promise<{ response: string; threadId: string; runId: string }> {
    void metadata;
    let conversationId = threadId || storedConversation(assistantId);
    if (!conversationId) {
      conversationId = await createConversation(assistantId);
      storeConversation(assistantId, conversationId);
    }
    const result = await sendConversationMessage(conversationId, message, {
      system: ASSISTANT_INSTRUCTIONS[assistantId] || 'You are a helpful CRM assistant.',
      tier: 'advanced',
    });
    return { response: result.content, threadId: conversationId, runId: result.responseId || crypto.randomUUID() };
  }

  /** Start a fresh conversation for an assistant (forget the remembered one). */
  async resetConversation(assistantId: string): Promise<string> {
    const conversationId = await createConversation(assistantId);
    storeConversation(assistantId, conversationId);
    return conversationId;
  }

  // Utility Functions
  /** The built-in specialised assistants (no creation needed — they run on Conversations). */
  async createSpecializedAssistant(type: 'contact' | 'deal' | 'task' | 'pipeline') {
    const id = `${type}-assistant`;
    const { data } = await this.listAssistants();
    return data.find((assistant) => assistant.id === id) || { id, name: id, instructions: ASSISTANT_INSTRUCTIONS[id] };
  }
}

// Export singleton instance
export const openaiAssistantsService = new OpenAIAssistantsService();

// Legacy export for backward compatibility
export const useOpenAIAssistants = () => openaiAssistantsService;
