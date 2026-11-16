import { generateAI } from './aiGenerate';
import OpenAI from 'openai';

export interface AssistantThread {
  id: string;
  type: 'contact' | 'deal' | 'task' | 'pipeline';
  entityId: string;
  assistantId: string;
  lastInteraction: Date;
  messageCount: number;
  context: Record<string, any>;
}

export class AssistantThreadManager {
  private threads: Map<string, AssistantThread> = new Map();

  async getOrCreateThread(
    entityType: 'contact' | 'deal' | 'task' | 'pipeline',
    entityId: string,
    context?: Record<string, any>
  ): Promise<AssistantThread> {
    const threadKey = `${entityType}_${entityId}`;

    if (this.threads.has(threadKey)) {
      return this.threads.get(threadKey)!;
    }

    // Create new persistent thread
    const thread = await this.createAssistantThread(entityType, entityId, context);
    this.threads.set(threadKey, thread);

    return thread;
  }

  async addMessageToThread(
    threadId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Add message to OpenAI Assistant thread
    // This maintains persistent conversation context

    const thread = Array.from(this.threads.values()).find((t) => t.id === threadId);
    if (thread) {
      thread.lastInteraction = new Date();
      thread.messageCount++;

      // Sync across all remote apps
      await this.syncThreadAcrossApps(thread);
    }
  }

  private async createAssistantThread(
    entityType: string,
    entityId: string,
    context?: Record<string, any>
  ): Promise<AssistantThread> {
    // There is no server-side Assistants thread API; threads are tracked locally in this manager
    return {
      id: crypto.randomUUID(),
      type: entityType as any,
      entityId,
      assistantId: this.getAssistantIdForEntity(entityType),
      lastInteraction: new Date(),
      messageCount: 0,
      context: context || {},
    };
  }

  private async syncThreadAcrossApps(thread: AssistantThread): Promise<void> {
    // /api/remote-sync/* never existed, so there is nothing to broadcast to; threads stay local
    void thread;
  }

  private getAssistantIdForEntity(entityType: string): string {
    const assistantMap = {
      contact: process.env.VITE_CONTACT_ASSISTANT_ID,
      deal: process.env.VITE_DEAL_ASSISTANT_ID,
      task: process.env.VITE_TASK_ASSISTANT_ID,
      pipeline: process.env.VITE_PIPELINE_ASSISTANT_ID,
    };

    return assistantMap[entityType as keyof typeof assistantMap] || 'default_assistant';
  }

  private async callAssistantThread(
    message: string,
    assistantId: string,
    threadId?: string,
    context?: any
  ): Promise<any> {
    try {
      // /api/openai/assistants/chat never existed; answer through the server's generation route
      const { content, model } = await generateAI({
        tier: 'advanced',
        system: `You are a CRM assistant (${assistantId}).${context ? ` Context: ${JSON.stringify(context)}` : ''}`,
        prompt: message,
      });

      return {
        result: content,
        model,
        threadId,
      };
    } catch (error) {
      console.error('Assistant thread call failed:', error);
      throw error;
    }
  }
}

export const assistantThreadManager = new AssistantThreadManager();
