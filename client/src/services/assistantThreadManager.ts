import {
  createConversation,
  sendConversationMessage,
  listConversationMessages,
  type ConversationMessage,
} from './aiGenerate';
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

  /** Each entity thread is an OpenAI Responses API conversation, so context carries between turns. */
  private async createAssistantThread(
    entityType: string,
    entityId: string,
    context?: Record<string, any>
  ): Promise<AssistantThread> {
    const conversationId = await createConversation(`${entityType}:${entityId}`);
    return {
      id: conversationId,
      type: entityType as any,
      entityId,
      assistantId: this.getAssistantIdForEntity(entityType),
      lastInteraction: new Date(),
      messageCount: 0,
      context: context || {},
    };
  }

  /** Message history of a thread (conversation), oldest first. */
  async getThreadMessages(threadId: string): Promise<ConversationMessage[]> {
    return listConversationMessages(threadId);
  }

  private async syncThreadAcrossApps(thread: AssistantThread): Promise<void> {
    // /api/remote-sync/* never existed, so there is nothing to broadcast to; threads stay local
    void thread;
  }

  private getAssistantIdForEntity(entityType: string): string {
    // The built-in assistants (see openaiAssistantsService); the Assistants API IDs are gone
    return ['contact', 'deal', 'task', 'pipeline'].includes(entityType) ? `${entityType}-assistant` : 'default_assistant';
  }

  private async callAssistantThread(
    message: string,
    assistantId: string,
    threadId?: string,
    context?: any
  ): Promise<any> {
    try {
      const system = `You are a CRM assistant (${assistantId}).${context ? ` Context: ${JSON.stringify(context)}` : ''}`;
      const conversationId = threadId || (await createConversation(assistantId));
      const { content, model } = await sendConversationMessage(conversationId, message, { system, tier: 'advanced' });

      return {
        result: content,
        model,
        threadId: conversationId,
      };
    } catch (error) {
      console.error('Assistant thread call failed:', error);
      throw error;
    }
  }
}

export const assistantThreadManager = new AssistantThreadManager();
