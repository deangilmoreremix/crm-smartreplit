import { openaiAssistantsService, AssistantConfig } from './openaiAssistantsService';
import { assistantThreadManager, AssistantThread } from './assistantThreadManager';

export interface PersistentAssistant {
  id: string;
  name: string;
  type: 'contact' | 'deal' | 'task' | 'pipeline' | 'general';
  instructions: string;
  activeThreads: Map<string, string>; // entityId -> threadId
  totalInteractions: number;
  lastUsed: Date;
  performance: {
    averageResponseTime: number;
    successRate: number;
    userSatisfaction: number;
  };
}

class PersistentAssistantService {
  private assistants = openaiAssistantsService;
  private activeAssistants: Map<string, PersistentAssistant> = new Map();
  private initialized = false;

  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    // Share one in-flight init so concurrent callers don't create duplicate assistants.
    if (!this.initPromise) {
      this.initPromise = (async () => {
        await this.loadPersistedAssistants();
        await this.ensureSpecializedAssistants();
        this.initialized = true;
      })().finally(() => {
        this.initPromise = null;
      });
    }
    return this.initPromise;
  }

  private async loadPersistedAssistants(): Promise<void> {
    // Errors propagate so callers can show an error state.
    const assistantsList = await this.assistants.listAssistants();

    for (const assistant of assistantsList.data) {
      const persistentAssistant: PersistentAssistant = {
        id: assistant.id,
        name: assistant.name || 'Unnamed Assistant',
        type: this.getAssistantType(assistant.name || ''),
        instructions: assistant.instructions || '',
        activeThreads: new Map(),
        totalInteractions: 0,
        lastUsed: new Date(assistant.created_at * 1000),
        performance: {
          averageResponseTime: 2000,
          successRate: 0.95,
          userSatisfaction: 4.5,
        },
      };

      this.activeAssistants.set(assistant.id, persistentAssistant);
    }
  }

  private async ensureSpecializedAssistants(): Promise<void> {
    const requiredTypes: Array<'contact' | 'deal' | 'task' | 'pipeline'> = [
      'contact',
      'deal',
      'task',
      'pipeline',
    ];

    for (const type of requiredTypes) {
      const existing = Array.from(this.activeAssistants.values()).find((a) => a.type === type);

      if (!existing) {
        try {
          const assistant = await this.assistants.createSpecializedAssistant(type);

          const persistentAssistant: PersistentAssistant = {
            id: assistant.id,
            name: assistant.name || `${type} Assistant`,
            type,
            instructions: assistant.instructions || '',
            activeThreads: new Map(),
            totalInteractions: 0,
            lastUsed: new Date(),
            performance: {
              averageResponseTime: 2000,
              successRate: 1.0,
              userSatisfaction: 5.0,
            },
          };

          this.activeAssistants.set(assistant.id, persistentAssistant);

        } catch (error) {
          console.error(`Failed to create ${type} assistant:`, error);
        }
      }
    }
  }

  private getAssistantType(name: string): 'contact' | 'deal' | 'task' | 'pipeline' | 'general' {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('contact')) return 'contact';
    if (lowerName.includes('deal')) return 'deal';
    if (lowerName.includes('task')) return 'task';
    if (lowerName.includes('pipeline')) return 'pipeline';
    return 'general';
  }

  async getOrCreateThread(
    assistantType: 'contact' | 'deal' | 'task' | 'pipeline',
    entityId: string,
    context?: Record<string, any>
  ): Promise<{ threadId: string; assistantId: string }> {
    if (!this.initialized) await this.initialize();

    const assistant = Array.from(this.activeAssistants.values()).find(
      (a) => a.type === assistantType
    );
    if (!assistant) {
      throw new Error(`No ${assistantType} assistant available`);
    }

    // Check for existing thread
    let threadId = assistant.activeThreads.get(entityId);

    if (!threadId) {
      // Create new thread
      const thread = await assistantThreadManager.getOrCreateThread(
        assistantType,
        entityId,
        context,
        assistant.id
      );
      threadId = thread.id;
      assistant.activeThreads.set(entityId, threadId);
    }

    return {
      threadId,
      assistantId: assistant.id,
    };
  }

  async chatWithPersistentAssistant(
    assistantType: 'contact' | 'deal' | 'task' | 'pipeline',
    entityId: string,
    message: string,
    context?: Record<string, any>
  ): Promise<{
    response: string;
    threadId: string;
    assistantId: string;
    persistentMemory: boolean;
    model: string;
  }> {
    const startTime = Date.now();

    try {
      const { threadId, assistantId } = await this.getOrCreateThread(
        assistantType,
        entityId,
        context
      );

      const result = await this.assistants.chatWithAssistant(
        message,
        assistantId,
        threadId,
        context
      );

      // Update performance metrics
      const assistant = this.activeAssistants.get(assistantId);
      if (assistant) {
        assistant.totalInteractions++;
        assistant.lastUsed = new Date();

        const responseTime = Date.now() - startTime;
        assistant.performance.averageResponseTime =
          assistant.performance.averageResponseTime * 0.9 + responseTime * 0.1;
      }

      // Sync thread across remote apps
      await assistantThreadManager.addMessageToThread(threadId, 'user', message, context);
      await assistantThreadManager.addMessageToThread(
        threadId,
        'assistant',
        result.response,
        context
      );

      return {
        response: result.response,
        threadId: result.threadId,
        assistantId,
        persistentMemory: true,
        model: result.model,
      };
    } catch (error) {
      console.error('Persistent assistant chat failed:', error);
      throw error;
    }
  }

  async streamChatWithPersistentAssistant(
    assistantType: 'contact' | 'deal' | 'task' | 'pipeline',
    entityId: string,
    message: string,
    context?: Record<string, any>
  ) {
    const { threadId, assistantId } = await this.getOrCreateThread(
      assistantType,
      entityId,
      context
    );

    return this.assistants.streamChatWithAssistant(message, assistantId, threadId, context);
  }

  async getAssistantMemory(
    assistantType: 'contact' | 'deal' | 'task' | 'pipeline',
    entityId: string,
    limit = 50
  ): Promise<Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>> {
    try {
      const { threadId } = await this.getOrCreateThread(assistantType, entityId);
      const messages = await this.assistants.getMessages(threadId, limit);

      return messages.data.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at * 1000),
      }));
    } catch (error) {
      console.error('Failed to get assistant memory:', error);
      return [];
    }
  }

  getAssistantStats(): Array<PersistentAssistant> {
    return Array.from(this.activeAssistants.values());
  }

  async createCustomAssistant(config: AssistantConfig & { type?: string }): Promise<string> {
    const assistant = await this.assistants.createAssistant(config);

    const persistentAssistant: PersistentAssistant = {
      id: assistant.id,
      name: config.name,
      type: (config.type as any) || 'general',
      instructions: config.instructions,
      activeThreads: new Map(),
      totalInteractions: 0,
      lastUsed: new Date(),
      performance: {
        averageResponseTime: 2000,
        successRate: 1.0,
        userSatisfaction: 5.0,
      },
    };

    this.activeAssistants.set(assistant.id, persistentAssistant);
    return assistant.id;
  }
}

export const persistentAssistantService = new PersistentAssistantService();
