export interface AssistantConfig {
  name: string;
  instructions: string;
  /** Tier name (fast|default|deep|max) or a concrete model id. */
  model?: string;
  /** e.g. 'code_interpreter', 'web_search' or {type: ...}; unsupported tools are dropped server-side. */
  tools?: any[];
}

export interface Assistant {
  id: string;
  name: string;
  instructions: string;
  model: string | null;
  tools: any[];
  /** Unix seconds (kept from the legacy shape). */
  created_at: number;
}

export interface ThreadMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: number;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  let body: any = null;
  try {
    body = await response.json();
  } catch {
    // non-JSON error body
  }
  if (!response.ok) {
    throw new Error(body?.error || `Assistants request failed (${response.status})`);
  }
  return body as T;
}

const toAssistant = (row: any): Assistant => ({
  id: row.id,
  name: row.name,
  instructions: row.instructions ?? '',
  model: row.model ?? null,
  tools: row.tools ?? [],
  created_at: Math.floor(new Date(row.created_at).getTime() / 1000),
});

export class OpenAIAssistantsService {
  // Assistant management. Accepts a config object or (name, instructions, tools).
  async createAssistant(
    configOrName: AssistantConfig | string,
    instructions?: string,
    tools?: any[]
  ): Promise<Assistant> {
    const config: AssistantConfig =
      typeof configOrName === 'string'
        ? { name: configOrName, instructions: instructions ?? '', tools }
        : configOrName;
    const { assistant } = await request<{ assistant: any }>('/api/assistants/create', {
      method: 'POST',
      body: JSON.stringify(config),
    });
    return toAssistant(assistant);
  }

  async getAssistant(assistantId: string): Promise<Assistant> {
    const { assistant } = await request<{ assistant: any }>(`/api/assistants/${assistantId}`);
    return toAssistant(assistant);
  }

  async deleteAssistant(assistantId: string) {
    return request<{ deleted: boolean; id: string }>(`/api/assistants/${assistantId}`, {
      method: 'DELETE',
    });
  }

  async listAssistants(_limit = 20): Promise<{ data: Assistant[] }> {
    const { assistants } = await request<{ assistants: any[] }>('/api/assistants');
    return { data: assistants.map(toAssistant) };
  }

  // Threads
  async createThread(assistantId?: string, title?: string): Promise<{ id: string }> {
    const { thread } = await request<{ thread: any }>('/api/assistants/threads', {
      method: 'POST',
      body: JSON.stringify({ assistantId, title }),
    });
    return { id: thread.id };
  }

  async getMessages(threadId: string, limit = 20): Promise<{ data: ThreadMessage[] }> {
    const { messages } = await request<{ messages: any[] }>(
      `/api/assistants/threads/${threadId}/messages`
    );
    const data = messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      created_at: Math.floor(new Date(m.created_at).getTime() / 1000),
    }));
    return { data: data.slice(-limit) };
  }

  async getThreadMessages(threadId: string) {
    return this.getMessages(threadId, 100);
  }

  async streamChatWithAssistant(
    message: string,
    assistantId: string,
    threadId?: string,
    _metadata?: Record<string, string>
  ) {
    return this.chatWithAssistant(message, assistantId, threadId);
  }

  // One synchronous Responses call; the server chains previous_response_id per thread.
  // Throws on any failure: callers must show an error state, never a fabricated reply.
  async chatWithAssistant(
    message: string,
    assistantId: string,
    threadId?: string,
    _metadata?: Record<string, any>
  ): Promise<{
    response: string;
    threadId: string;
    runId: string;
    responseId: string;
    model: string;
    usage: { inputTokens: number; outputTokens: number; totalTokens: number };
  }> {
    const result = await request<any>('/api/assistants/chat', {
      method: 'POST',
      body: JSON.stringify({ message, assistantId, threadId }),
    });
    return {
      response: result.message,
      threadId: result.threadId,
      runId: result.responseId,
      responseId: result.responseId,
      model: result.model,
      usage: result.usage,
    };
  }

  // Utility Functions
  async createSpecializedAssistant(type: 'contact' | 'deal' | 'task' | 'pipeline') {
    const configs = {
      contact: {
        name: 'Contact Intelligence Agent',
        instructions: `You are a specialized AI assistant for contact management and relationship intelligence. 
        You help analyze contacts, predict engagement, generate personalized communication, and track relationship health.
        Always provide actionable insights based on contact data, interaction history, and communication patterns.`,
        tools: ['code_interpreter'],
      },
      deal: {
        name: 'Deal Assistant Agent',
        instructions: `You are a specialized AI assistant for deal management and sales intelligence.
        You help analyze deal progression, identify risks, suggest next steps, and optimize closing strategies.
        Always provide data-driven insights and specific recommendations for deal advancement.`,
        tools: ['code_interpreter'],
      },
      task: {
        name: 'Task Automation Agent',
        instructions: `You are a specialized AI assistant for task management and workflow automation.
        You help prioritize tasks, automate routine activities, and optimize productivity workflows.
        Always provide clear action items and automation suggestions.`,
        tools: ['code_interpreter'],
      },
      pipeline: {
        name: 'Pipeline Management Bot',
        instructions: `You are a specialized AI assistant for sales pipeline management and forecasting.
        You help analyze pipeline health, predict outcomes, and optimize sales processes.
        Always provide strategic insights and actionable pipeline improvements.`,
        tools: ['code_interpreter'],
      },
    };

    return await this.createAssistant(configs[type]);
  }
}

// Export singleton instance
export const openaiAssistantsService = new OpenAIAssistantsService();

// Legacy export for backward compatibility
export const useOpenAIAssistants = () => openaiAssistantsService;
