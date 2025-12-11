// Remote Assistant Bridge Service
// Exposes AI Assistant functionality to remote contacts and deals apps

import { persistentAssistantService, PersistentAssistant } from './persistentAssistantService';
import { assistantThreadManager } from './assistantThreadManager';

export interface AssistantMessage {
  type: string;
  data: any;
  entityId?: string;
  assistantType?: 'contact' | 'deal' | 'task' | 'pipeline';
  timestamp?: number;
}

export interface AssistantResponse {
  success: boolean;
  data?: any;
  error?: string;
  threadId?: string;
}

export class RemoteAssistantBridge {
  private origin: string;
  private assistantService = persistentAssistantService;
  private activeIframes: Set<HTMLIFrameElement> = new Set();

  constructor(origin: string = '*') {
    this.origin = origin;
    this.setupMessageListener();
    this.initializeAssistants();
  }

  private async initializeAssistants() {
    try {
      await this.assistantService.initialize();
      console.log('✅ Assistant Bridge: Services initialized');
    } catch (error) {
      console.error('❌ Assistant Bridge: Failed to initialize:', error);
    }
  }

  registerIframe(iframe: HTMLIFrameElement) {
    this.activeIframes.add(iframe);
    console.log('📱 Assistant Bridge: Iframe registered');
  }

  unregisterIframe(iframe: HTMLIFrameElement) {
    this.activeIframes.delete(iframe);
    console.log('📱 Assistant Bridge: Iframe unregistered');
  }

  private setupMessageListener() {
    window.addEventListener('message', async (event) => {
      // Allow messages from any origin for remote apps
      if (this.origin !== '*' && event.origin !== this.origin) {
        return;
      }

      const message: AssistantMessage = event.data;
      
      // Only handle assistant-related messages
      if (!message.type?.startsWith('ASSISTANT_')) {
        return;
      }

      console.log('🤖 Assistant Bridge received:', message);

      try {
        const response = await this.handleAssistantMessage(message);
        this.sendResponse(event.source as Window, message.type, response);
      } catch (error) {
        console.error('❌ Assistant Bridge error:', error);
        this.sendResponse(event.source as Window, message.type, {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }

  private async handleAssistantMessage(message: AssistantMessage): Promise<AssistantResponse> {
    const { type, data, entityId, assistantType } = message;

    switch (type) {
      case 'ASSISTANT_START_CONVERSATION':
        return await this.startConversation(assistantType!, entityId!, data.initialMessage);

      case 'ASSISTANT_SEND_MESSAGE':
        return await this.sendMessage(assistantType!, entityId!, data.message, data.threadId);

      case 'ASSISTANT_GET_HISTORY':
        return await this.getConversationHistory(assistantType!, entityId!);

      case 'ASSISTANT_GET_STATUS':
        return await this.getAssistantStatus(assistantType!);

      case 'ASSISTANT_GET_SUGGESTIONS':
        return await this.getAssistantSuggestions(assistantType!, entityId!, data.context);

      case 'ASSISTANT_QUICK_ANALYSIS':
        return await this.performQuickAnalysis(assistantType!, entityId!, data);

      default:
        throw new Error(`Unknown assistant message type: ${type}`);
    }
  }

  private async startConversation(
    assistantType: 'contact' | 'deal' | 'task' | 'pipeline',
    entityId: string,
    initialMessage: string
  ): Promise<AssistantResponse> {
    try {
      const response = await this.assistantService.startConversation(
        assistantType,
        entityId,
        initialMessage
      );

      return {
        success: true,
        data: {
          response: response.content,
          threadId: response.threadId,
          assistantName: response.assistantName
        },
        threadId: response.threadId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start conversation'
      };
    }
  }

  private async sendMessage(
    assistantType: 'contact' | 'deal' | 'task' | 'pipeline',
    entityId: string,
    message: string,
    threadId?: string
  ): Promise<AssistantResponse> {
    try {
      const response = await this.assistantService.sendMessage(
        assistantType,
        entityId,
        message,
        threadId
      );

      return {
        success: true,
        data: {
          response: response.content,
          threadId: response.threadId
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      };
    }
  }

  private async getConversationHistory(
    assistantType: 'contact' | 'deal' | 'task' | 'pipeline',
    entityId: string
  ): Promise<AssistantResponse> {
    try {
      const history = await this.assistantService.getAssistantMemory(
        assistantType,
        entityId,
        20
      );

      return {
        success: true,
        data: { history }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get history'
      };
    }
  }

  private async getAssistantStatus(
    assistantType: 'contact' | 'deal' | 'task' | 'pipeline'
  ): Promise<AssistantResponse> {
    try {
      const assistants = this.assistantService.getAssistantStats();
      const assistant = assistants.find(a => a.type === assistantType);

      return {
        success: true,
        data: {
          assistant: assistant ? {
            name: assistant.name,
            totalInteractions: assistant.totalInteractions,
            activeThreads: assistant.activeThreads.size,
            performance: assistant.performance,
            lastUsed: assistant.lastUsed,
            isActive: assistant.activeThreads.size > 0
          } : null
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get status'
      };
    }
  }

  private async getAssistantSuggestions(
    assistantType: 'contact' | 'deal' | 'task' | 'pipeline',
    entityId: string,
    context: any
  ): Promise<AssistantResponse> {
    try {
      // Generate contextual suggestions based on entity type and data
      const suggestions = await this.generateSuggestions(assistantType, context);

      return {
        success: true,
        data: { suggestions }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get suggestions'
      };
    }
  }

  private async performQuickAnalysis(
    assistantType: 'contact' | 'deal' | 'task' | 'pipeline',
    entityId: string,
    data: any
  ): Promise<AssistantResponse> {
    try {
      // Quick AI analysis based on entity type
      const analysis = await this.performAnalysis(assistantType, data);

      return {
        success: true,
        data: { analysis }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to perform analysis'
      };
    }
  }

  private async generateSuggestions(
    assistantType: 'contact' | 'deal' | 'task' | 'pipeline',
    context: any
  ): Promise<string[]> {
    // Generate contextual suggestions based on assistant type
    switch (assistantType) {
      case 'contact':
        return [
          'Ask about their recent projects',
          'Schedule a follow-up meeting',
          'Send relevant case studies',
          'Connect on LinkedIn',
          'Introduce to relevant team members'
        ];
      
      case 'deal':
        return [
          'Review deal requirements',
          'Schedule decision-maker meeting',
          'Send proposal follow-up',
          'Address outstanding concerns',
          'Confirm timeline and budget'
        ];
      
      default:
        return [
          'Get AI insights',
          'Analyze recent activity',
          'Generate action items',
          'Review performance metrics'
        ];
    }
  }

  private async performAnalysis(
    assistantType: 'contact' | 'deal' | 'task' | 'pipeline',
    data: any
  ): Promise<any> {
    // Mock analysis - replace with actual AI service calls
    return {
      summary: `AI analysis for ${assistantType}`,
      insights: [
        'High engagement opportunity',
        'Strong potential for conversion',
        'Requires immediate follow-up'
      ],
      recommendations: [
        'Schedule meeting within 2 days',
        'Send personalized proposal',
        'Connect with decision maker'
      ],
      score: Math.floor(Math.random() * 100) + 1
    };
  }

  private sendResponse(target: Window, originalType: string, response: AssistantResponse) {
    const responseMessage = {
      type: `${originalType}_RESPONSE`,
      data: response,
      timestamp: Date.now()
    };

    target.postMessage(responseMessage, this.origin);
    console.log('📤 Assistant Bridge response:', responseMessage);
  }

  // Broadcast updates to all registered iframes
  broadcastAssistantUpdate(assistantType: string, entityId: string, update: any) {
    const message = {
      type: 'ASSISTANT_UPDATE',
      data: {
        assistantType,
        entityId,
        update
      },
      timestamp: Date.now()
    };

    this.activeIframes.forEach(iframe => {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(message, this.origin);
      }
    });

    console.log('📡 Assistant Bridge broadcast:', message);
  }
}

// Create global instance
export const remoteAssistantBridge = new RemoteAssistantBridge();