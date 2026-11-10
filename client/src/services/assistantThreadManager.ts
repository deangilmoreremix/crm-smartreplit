import { openaiAssistantsService } from './openaiAssistantsService';

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
    context?: Record<string, any>,
    assistantId?: string
  ): Promise<AssistantThread> {
    const threadKey = `${entityType}_${entityId}`;

    if (this.threads.has(threadKey)) {
      return this.threads.get(threadKey)!;
    }

    // Create new persistent thread
    const thread = await this.createAssistantThread(entityType, entityId, context, assistantId);
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
    context?: Record<string, any>,
    assistantId?: string
  ): Promise<AssistantThread> {
    const thread = await openaiAssistantsService.createThread(assistantId, `${entityType}:${entityId}`);

    return {
      id: thread.id,
      type: entityType as any,
      entityId,
      assistantId: assistantId || '',
      lastInteraction: new Date(),
      messageCount: 0,
      context: context || {},
    };
  }

  private async syncThreadAcrossApps(thread: AssistantThread): Promise<void> {
    // Broadcast thread updates to all remote apps
    const remoteApps = [
      'pipeline-intelligence',
      'contact-analytics',
      'deal-insights',
      'task-automation',
    ];

    for (const app of remoteApps) {
      try {
        await fetch(`/api/remote-sync/${app}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ thread }),
        });
      } catch (error) {
        console.warn(`Failed to sync thread to ${app}:`, error);
      }
    }
  }
}

export const assistantThreadManager = new AssistantThreadManager();
