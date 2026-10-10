import axios, { AxiosInstance } from 'axios';
import {
  DenchConfig,
  DenchStatus,
  DenchCommand,
  DenchResponse,
  WorkspaceObject,
  ObjectQuery,
  Contact,
  Deal,
  Activity,
  AgentMessage,
  AgentSession,
  OutreachSequence,
  OutreachResult,
  DenchSkill,
  SkillExecution,
} from '../types';

export class DenchService {
  private client: AxiosInstance;
  private profile: string;
  private gatewayPort: number;
  private webPort: number;

  constructor(config?: Partial<DenchConfig>) {
    this.profile = config?.profile || 'dench';
    this.gatewayPort = config?.gatewayPort || 19001;
    this.webPort = config?.webPort || 3100;

    const baseURL = `http://localhost:${this.gatewayPort}`;
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // ============================================================================
  // STATUS & CONFIGURATION
  // ============================================================================

  async getStatus(): Promise<DenchStatus> {
    const response = await this.client.get('/status');
    return response.data;
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch {
      return false;
    }
  }

  async updateConfig(config: Partial<DenchConfig>): Promise<DenchResponse> {
    const response = await this.client.post('/config/update', config);
    return response.data;
  }

  // ============================================================================
  // WORKSPACE OBJECTS
  // ============================================================================

  async listObjects(query?: ObjectQuery): Promise<WorkspaceObject[]> {
    const response = await this.client.get('/objects', { params: query });
    return response.data.objects || [];
  }

  async getObject(id: string): Promise<WorkspaceObject> {
    const response = await this.client.get(`/objects/${id}`);
    return response.data;
  }

  async createObject(object: Partial<WorkspaceObject>): Promise<WorkspaceObject> {
    const response = await this.client.post('/objects', object);
    return response.data;
  }

  async updateObject(id: string, object: Partial<WorkspaceObject>): Promise<WorkspaceObject> {
    const response = await this.client.put(`/objects/${id}`, object);
    return response.data;
  }

  async deleteObject(id: string): Promise<void> {
    await this.client.delete(`/objects/${id}`);
  }

  // ============================================================================
  // CRM OPERATIONS
  // ============================================================================

  async listContacts(params?: {
    limit?: number;
    offset?: number;
    filter?: string;
  }): Promise<Contact[]> {
    const response = await this.client.get('/crm/contacts', { params });
    return response.data.contacts || [];
  }

  async getContact(id: string): Promise<Contact> {
    const response = await this.client.get(`/crm/contacts/${id}`);
    return response.data;
  }

  async createContact(contact: Partial<Contact>): Promise<Contact> {
    const response = await this.client.post('/crm/contacts', contact);
    return response.data;
  }

  async updateContact(id: string, contact: Partial<Contact>): Promise<Contact> {
    const response = await this.client.put(`/crm/contacts/${id}`, contact);
    return response.data;
  }

  async deleteContact(id: string): Promise<void> {
    await this.client.delete(`/crm/contacts/${id}`);
  }

  async listDeals(params?: { limit?: number; offset?: number; stage?: string }): Promise<Deal[]> {
    const response = await this.client.get('/crm/deals', { params });
    return response.data.deals || [];
  }

  async getDeal(id: string): Promise<Deal> {
    const response = await this.client.get(`/crm/deals/${id}`);
    return response.data;
  }

  async createDeal(deal: Partial<Deal>): Promise<Deal> {
    const response = await this.client.post('/crm/deals', deal);
    return response.data;
  }

  async updateDeal(id: string, deal: Partial<Deal>): Promise<Deal> {
    const response = await this.client.put(`/crm/deals/${id}`, deal);
    return response.data;
  }

  async listActivities(params?: { contactId?: string; dealId?: string }): Promise<Activity[]> {
    const response = await this.client.get('/crm/activities', { params });
    return response.data.activities || [];
  }

  async createActivity(activity: Partial<Activity>): Promise<Activity> {
    const response = await this.client.post('/crm/activities', activity);
    return response.data;
  }

  // ============================================================================
  // AGENT OPERATIONS
  // ============================================================================

  async createSession(context?: Record<string, any>): Promise<AgentSession> {
    const response = await this.client.post('/agent/sessions', { context });
    return response.data;
  }

  async sendMessage(sessionId: string, message: string): Promise<AgentMessage> {
    const response = await this.client.post(`/agent/sessions/${sessionId}/messages`, {
      role: 'user',
      content: message,
    });
    return response.data;
  }

  async getSessionHistory(sessionId: string): Promise<AgentMessage[]> {
    const response = await this.client.get(`/agent/sessions/${sessionId}/messages`);
    return response.data.messages || [];
  }

  async executeAgentTask(task: string, context?: Record<string, any>): Promise<any> {
    const response = await this.client.post('/agent/execute', { task, context });
    return response.data;
  }

  // ============================================================================
  // OUTREACH OPERATIONS
  // ============================================================================

  async listSequences(): Promise<OutreachSequence[]> {
    const response = await this.client.get('/outreach/sequences');
    return response.data.sequences || [];
  }

  async getSequence(id: string): Promise<OutreachSequence> {
    const response = await this.client.get(`/outreach/sequences/${id}`);
    return response.data;
  }

  async createSequence(sequence: Partial<OutreachSequence>): Promise<OutreachSequence> {
    const response = await this.client.post('/outreach/sequences', sequence);
    return response.data;
  }

  async updateSequence(id: string, sequence: Partial<OutreachSequence>): Promise<OutreachSequence> {
    const response = await this.client.put(`/outreach/sequences/${id}`, sequence);
    return response.data;
  }

  async launchSequence(sequenceId: string, contactIds: string[]): Promise<OutreachResult[]> {
    const response = await this.client.post(`/outreach/sequences/${sequenceId}/launch`, {
      contactIds,
    });
    return response.data.results || [];
  }

  async getOutreachResults(sequenceId: string): Promise<OutreachResult[]> {
    const response = await this.client.get(`/outreach/sequences/${sequenceId}/results`);
    return response.data.results || [];
  }

  // ============================================================================
  // SKILLS OPERATIONS
  // ============================================================================

  async listSkills(category?: string): Promise<DenchSkill[]> {
    const response = await this.client.get('/skills', { params: { category } });
    return response.data.skills || [];
  }

  async executeSkill(skillId: string, input: Record<string, any>): Promise<SkillExecution> {
    const response = await this.client.post(`/skills/${skillId}/execute`, { input });
    return response.data;
  }

  async installSkill(skillUrl: string): Promise<DenchSkill> {
    const response = await this.client.post('/skills/install', { url: skillUrl });
    return response.data;
  }

  // ============================================================================
  // COMMAND EXECUTION
  // ============================================================================

  async executeCommand(command: DenchCommand): Promise<DenchResponse> {
    const response = await this.client.post('/command/execute', {
      command: command.command,
      args: command.args,
      profile: command.profile || this.profile,
    });
    return response.data;
  }

  async restartGateway(): Promise<DenchResponse> {
    return this.executeCommand({
      command: 'gateway',
      args: ['restart'],
      profile: this.profile,
    });
  }

  async listDevices(): Promise<any[]> {
    const response = await this.client.get('/devices');
    return response.data.devices || [];
  }

  async approveDevice(requestId: string): Promise<DenchResponse> {
    const response = await this.client.post('/devices/approve', { requestId });
    return response.data;
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  setProfile(profile: string): void {
    this.profile = profile;
  }

  setPorts(gatewayPort: number, webPort: number): void {
    this.gatewayPort = gatewayPort;
    this.webPort = webPort;
    this.client.defaults.baseURL = `http://localhost:${gatewayPort}`;
  }

  getWebURL(): string {
    return `http://localhost:${this.webPort}`;
  }
}

// Default instance
export const denchService = new DenchService();

// Factory function
export const createDenchService = (config?: Partial<DenchConfig>) => {
  return new DenchService(config);
};
