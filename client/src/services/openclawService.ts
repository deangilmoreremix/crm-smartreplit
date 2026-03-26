/**
 * OpenClaw AI CRM Integration Service
 *
 * Provides client-side API for communicating with OpenClaw's AI CRM capabilities.
 * OpenClaw is an AI-first CRM with 40+ API endpoints that can be accessed via
 * the server proxy at /api/openclaw
 */

import { unifiedApiClient, api, ApiResponse } from './unifiedApiClient';
import { unifiedEventSystem } from './unifiedEventSystem';

// ============================================================================
// Types
// ============================================================================

export interface OpenClawMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface OpenClawChatRequest {
  messages: OpenClawMessage[];
  context?: Record<string, any>;
  stream?: boolean;
}

export interface OpenClawChatResponse {
  message: string;
  tool_calls?: OpenClawToolCall[];
  context?: Record<string, any>;
}

export interface OpenClawToolCall {
  tool: string;
  action: string;
  parameters?: Record<string, any>;
  result?: any;
}

export interface OpenClawTool {
  id: string;
  name: string;
  description: string;
  category: string;
  parameters?: Record<string, any>;
}

export interface OpenClawToolExecutionRequest {
  tool: string;
  action: string;
  parameters?: Record<string, any>;
}

export interface OpenClawToolExecutionResponse {
  success: boolean;
  result?: any;
  error?: string;
}

export interface OpenClawHealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  version?: string;
  services?: Record<string, string>;
  timestamp?: string;
}

// ============================================================================
// CRM Tool Definitions
// These tools are available through OpenClaw and can control Module Federation apps
// ============================================================================

export const OPENCLAW_CRM_TOOLS: Record<string, OpenClawTool> = {
  // Contact Management
  'contacts:create': {
    id: 'contacts:create',
    name: 'Create Contact',
    description: 'Create a new contact in the CRM',
    category: 'Contacts',
  },
  'contacts:update': {
    id: 'contacts:update',
    name: 'Update Contact',
    description: 'Update an existing contact',
    category: 'Contacts',
  },
  'contacts:delete': {
    id: 'contacts:delete',
    name: 'Delete Contact',
    description: 'Delete a contact from the CRM',
    category: 'Contacts',
  },
  'contacts:search': {
    id: 'contacts:search',
    name: 'Search Contacts',
    description: 'Search contacts by name, email, or other criteria',
    category: 'Contacts',
  },
  'contacts:get': {
    id: 'contacts:get',
    name: 'Get Contact',
    description: 'Get a specific contact by ID',
    category: 'Contacts',
  },

  // Deal/Pipeline Management
  'deals:create': {
    id: 'deals:create',
    name: 'Create Deal',
    description: 'Create a new deal in the pipeline',
    category: 'Deals',
  },
  'deals:update': {
    id: 'deals:update',
    name: 'Update Deal',
    description: 'Update an existing deal',
    category: 'Deals',
  },
  'deals:move': {
    id: 'deals:move',
    name: 'Move Deal Stage',
    description: 'Move deal to a different pipeline stage',
    category: 'Deals',
  },
  'deals:close': {
    id: 'deals:close',
    name: 'Close Deal',
    description: 'Mark a deal as closed won or lost',
    category: 'Deals',
  },
  'deals:get': {
    id: 'deals:get',
    name: 'Get Deal',
    description: 'Get a specific deal by ID',
    category: 'Deals',
  },
  'deals:list': {
    id: 'deals:list',
    name: 'List Deals',
    description: 'List all deals in the pipeline',
    category: 'Deals',
  },

  // Company Management
  'companies:create': {
    id: 'companies:create',
    name: 'Create Company',
    description: 'Create a new company',
    category: 'Companies',
  },
  'companies:update': {
    id: 'companies:update',
    name: 'Update Company',
    description: 'Update an existing company',
    category: 'Companies',
  },
  'companies:get': {
    id: 'companies:get',
    name: 'Get Company',
    description: 'Get a specific company by ID',
    category: 'Companies',
  },

  // Task Management
  'tasks:create': {
    id: 'tasks:create',
    name: 'Create Task',
    description: 'Create a new task',
    category: 'Tasks',
  },
  'tasks:update': {
    id: 'tasks:update',
    name: 'Update Task',
    description: 'Update an existing task',
    category: 'Tasks',
  },
  'tasks:complete': {
    id: 'tasks:complete',
    name: 'Complete Task',
    description: 'Mark a task as completed',
    category: 'Tasks',
  },
  'tasks:get': {
    id: 'tasks:get',
    name: 'Get Task',
    description: 'Get a specific task by ID',
    category: 'Tasks',
  },

  // Appointment Management
  'appointments:create': {
    id: 'appointments:create',
    name: 'Create Appointment',
    description: 'Schedule a new appointment',
    category: 'Appointments',
  },
  'appointments:update': {
    id: 'appointments:update',
    name: 'Update Appointment',
    description: 'Update an existing appointment',
    category: 'Appointments',
  },
  'appointments:cancel': {
    id: 'appointments:cancel',
    name: 'Cancel Appointment',
    description: 'Cancel an appointment',
    category: 'Appointments',
  },

  // Communication
  'email:send': {
    id: 'email:send',
    name: 'Send Email',
    description: 'Send an email to a contact',
    category: 'Communication',
  },
  'sms:send': {
    id: 'sms:send',
    name: 'Send SMS',
    description: 'Send an SMS to a contact',
    category: 'Communication',
  },

  // Navigation (control Module Federation apps)
  'navigation:goto': {
    id: 'navigation:goto',
    name: 'Navigate To',
    description: 'Navigate to a specific page in the CRM',
    category: 'Navigation',
  },
  'navigation:contacts': {
    id: 'navigation:contacts',
    name: 'Go to Contacts',
    description: 'Navigate to the Contacts app',
    category: 'Navigation',
  },
  'navigation:pipeline': {
    id: 'navigation:pipeline',
    name: 'Go to Pipeline',
    description: 'Navigate to the Pipeline/Deals app',
    category: 'Navigation',
  },
  'navigation:calendar': {
    id: 'navigation:calendar',
    name: 'Go to Calendar',
    description: 'Navigate to the Calendar app',
    category: 'Navigation',
  },
  'navigation:dashboard': {
    id: 'navigation:dashboard',
    name: 'Go to Dashboard',
    description: 'Navigate to the main dashboard',
    category: 'Navigation',
  },
};

// ============================================================================
// OpenClaw Service Class
// ============================================================================

class OpenClawService {
  private static instance: OpenClawService;
  private baseEndpoint = '/api/openclaw';
  private initialized = false;
  private healthStatus: OpenClawHealthStatus | null = null;

  static getInstance(): OpenClawService {
    if (!OpenClawService.instance) {
      OpenClawService.instance = new OpenClawService();
    }
    return OpenClawService.instance;
  }

  private constructor() {
    // Initialize on creation
  }

  /**
   * Initialize the service - check health and set up
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    try {
      const health = await this.checkHealth();
      this.initialized = health.status === 'healthy';
      return this.initialized;
    } catch (error) {
      console.error('Failed to initialize OpenClaw service:', error);
      return false;
    }
  }

  /**
   * Check health status of OpenClaw service
   */
  async checkHealth(): Promise<OpenClawHealthStatus> {
    try {
      const response = await api.get<OpenClawHealthStatus>(`${this.baseEndpoint}/health`, {
        cache: false,
        timeout: 10000,
      });

      if (response.success && response.data) {
        this.healthStatus = response.data;
        return response.data;
      }

      return { status: 'down', services: {} };
    } catch (error) {
      console.error('OpenClaw health check failed:', error);
      return { status: 'down', services: {} };
    }
  }

  /**
   * Get available tools from OpenClaw
   */
  async getTools(): Promise<OpenClawTool[]> {
    try {
      const response = await api.get<{ tools: OpenClawTool[] }>(
        `${this.baseEndpoint}/tools`,
        { cache: true, cacheTTL: 300000 } // Cache for 5 minutes
      );

      if (response.success && response.data?.tools) {
        return response.data.tools;
      }

      // Return default tools if API fails
      return Object.values(OPENCLAW_CRM_TOOLS);
    } catch (error) {
      console.error('Failed to get OpenClaw tools:', error);
      return Object.values(OPENCLAW_CRM_TOOLS);
    }
  }

  /**
   * Send a chat message to OpenClaw AI
   */
  async chat(
    messages: OpenClawMessage[],
    context?: Record<string, any>
  ): Promise<OpenClawChatResponse> {
    try {
      const response = await api.post<OpenClawChatResponse>(
        `${this.baseEndpoint}/chat`,
        { messages, context, stream: false },
        { timeout: 60000 } // Longer timeout for AI responses
      );

      if (response.success && response.data) {
        // Emit event for tool calls if any
        if (response.data.tool_calls?.length) {
          this.emitToolCallsEvent(response.data.tool_calls);
        }
        return response.data;
      }

      return {
        message: 'Failed to get response from OpenClaw',
        tool_calls: [],
      };
    } catch (error) {
      console.error('OpenClaw chat failed:', error);
      return {
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        tool_calls: [],
      };
    }
  }

  /**
   * Stream chat responses (for real-time output)
   */
  async *chatStream(
    messages: OpenClawMessage[],
    context?: Record<string, any>
  ): AsyncGenerator<string> {
    try {
      const response = await fetch(`${this.baseEndpoint}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages, context, stream: true }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                yield parsed.content;
              }
            } catch {
              // Ignore parse errors for non-JSON chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('OpenClaw stream failed:', error);
      yield `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Execute a specific tool
   */
  async executeTool(
    tool: string,
    action: string,
    parameters?: Record<string, any>
  ): Promise<OpenClawToolExecutionResponse> {
    try {
      const response = await api.post<OpenClawToolExecutionResponse>(
        `${this.baseEndpoint}/execute`,
        { tool, action, parameters },
        { timeout: 30000 }
      );

      if (response.success && response.data) {
        // Emit event for tool execution
        this.emitToolExecutionEvent(tool, action, parameters, response.data);
        return response.data;
      }

      return {
        success: false,
        error: 'Failed to execute tool',
      };
    } catch (error) {
      console.error('Tool execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute a navigation action (control Module Federation apps)
   */
  async navigateTo(page: string, params?: Record<string, any>): Promise<boolean> {
    const result = await this.executeTool('navigation', 'goto', { page, ...params });

    // Emit navigation event for Module Federation apps
    if (result.success) {
      unifiedEventSystem.emit({
        type: 'OPENCLAW_NAVIGATION',
        source: 'openclawService',
        data: { page, params },
        priority: 'high',
      });
    }

    return result.success;
  }

  /**
   * Navigate to Contacts app
   */
  async goToContacts(contactId?: string): Promise<boolean> {
    return this.navigateTo('contacts', contactId ? { contactId } : undefined);
  }

  /**
   * Navigate to Pipeline/Deals app
   */
  async goToPipeline(dealId?: string): Promise<boolean> {
    return this.navigateTo('pipeline', dealId ? { dealId } : undefined);
  }

  /**
   * Navigate to Calendar app
   */
  async goToCalendar(appointmentId?: string): Promise<boolean> {
    return this.navigateTo('calendar', appointmentId ? { appointmentId } : undefined);
  }

  /**
   * Navigate to Dashboard
   */
  async goToDashboard(): Promise<boolean> {
    return this.navigateTo('dashboard');
  }

  // ========================================================================
  // Event Emission
  // ========================================================================

  private emitToolCallsEvent(toolCalls: OpenClawToolCall[]): void {
    unifiedEventSystem.emit({
      type: 'OPENCLAW_TOOL_CALLS',
      source: 'openclawService',
      data: { toolCalls },
      priority: 'medium',
    });
  }

  private emitToolExecutionEvent(
    tool: string,
    action: string,
    parameters: Record<string, any> | undefined,
    result: any
  ): void {
    unifiedEventSystem.emit({
      type: 'OPENCLAW_TOOL_EXECUTION',
      source: 'openclawService',
      data: { tool, action, parameters, result },
      priority: 'high',
    });
  }

  // ========================================================================
  // Getters
  // ========================================================================

  getHealthStatus(): OpenClawHealthStatus | null {
    return this.healthStatus;
  }

  isHealthy(): boolean {
    return this.healthStatus?.status === 'healthy';
  }

  getToolsByCategory(): Record<string, OpenClawTool[]> {
    const tools = Object.values(OPENCLAW_CRM_TOOLS);
    return tools.reduce(
      (acc, tool) => {
        if (!acc[tool.category]) {
          acc[tool.category] = [];
        }
        acc[tool.category].push(tool);
        return acc;
      },
      {} as Record<string, OpenClawTool[]>
    );
  }
}

// ============================================================================
// Export singleton and convenience functions
// ============================================================================

export const openclawService = OpenClawService.getInstance();

// Convenience functions for common operations
export const openclaw = {
  /**
   * Initialize the service
   */
  initialize: () => openclawService.initialize(),

  /**
   * Check health status
   */
  health: () => openclawService.checkHealth(),

  /**
   * Get available tools
   */
  tools: () => openclawService.getTools(),

  /**
   * Send a chat message
   */
  chat: (messages: OpenClawMessage[], context?: Record<string, any>) =>
    openclawService.chat(messages, context),

  /**
   * Stream chat responses
   */
  chatStream: function* (messages: OpenClawMessage[], context?: Record<string, any>) {
    return openclawService.chatStream(messages, context);
  },

  /**
   * Execute a tool
   */
  execute: (tool: string, action: string, parameters?: Record<string, any>) =>
    openclawService.executeTool(tool, action, parameters),

  /**
   * Navigation shortcuts
   */
  goTo: {
    contacts: (contactId?: string) => openclawService.goToContacts(contactId),
    pipeline: (dealId?: string) => openclawService.goToPipeline(dealId),
    calendar: (appointmentId?: string) => openclawService.goToCalendar(appointmentId),
    dashboard: () => openclawService.goToDashboard(),
  },
};
