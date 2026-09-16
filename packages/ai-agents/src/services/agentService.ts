import axios, { AxiosInstance } from 'axios';
import {
  AgentStatus,
  LeadQualificationResult,
  EmailAnalysisResult,
  DealAnalysisResult,
  CustomerHealthResult,
  MeetingScheduleResult,
  DashboardData,
  LeadQualificationRequest,
  EmailAnalysisRequest,
  DealAnalysisRequest,
  CustomerMonitorRequest,
  MeetingScheduleRequest,
  DashboardRequest,
  AgentResponse,
  WorkflowTrigger,
  WorkflowResult,
} from '../types';

export class AIAgentService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:8000') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // ============================================================================
  // HEALTH & STATUS
  // ============================================================================

  async getHealth(): Promise<{
    api: string;
    database: string;
    agents: AgentStatus;
    redis: string;
  }> {
    const response = await this.client.get('/');
    return response.data;
  }

  async getAgentStatus(): Promise<AgentStatus> {
    const response = await this.client.get('/health');
    return response.data.agents;
  }

  // ============================================================================
  // LEAD QUALIFICATION AGENT
  // ============================================================================

  async qualifyLead(
    request: LeadQualificationRequest
  ): Promise<AgentResponse<LeadQualificationResult>> {
    const response = await this.client.post('/api/agents/qualify-lead', request);
    return response.data;
  }

  // ============================================================================
  // EMAIL INTELLIGENCE AGENT
  // ============================================================================

  async analyzeEmail(request: EmailAnalysisRequest): Promise<AgentResponse<EmailAnalysisResult>> {
    const response = await this.client.post('/api/agents/analyze-email', request);
    return response.data;
  }

  // ============================================================================
  // SALES PIPELINE AGENT
  // ============================================================================

  async analyzeDeal(request: DealAnalysisRequest): Promise<AgentResponse<DealAnalysisResult>> {
    const response = await this.client.post(`/api/agents/analyze-deal/${request.deal_id}`, request);
    return response.data;
  }

  // ============================================================================
  // CUSTOMER SUCCESS AGENT
  // ============================================================================

  async monitorCustomer(
    request: CustomerMonitorRequest
  ): Promise<AgentResponse<CustomerHealthResult>> {
    const response = await this.client.post(
      `/api/agents/monitor-customer/${request.customer_id}`,
      request
    );
    return response.data;
  }

  // ============================================================================
  // MEETING SCHEDULER AGENT
  // ============================================================================

  async scheduleMeeting(
    request: MeetingScheduleRequest
  ): Promise<AgentResponse<MeetingScheduleResult>> {
    const response = await this.client.post('/api/agents/schedule-meeting', request);
    return response.data;
  }

  // ============================================================================
  // ANALYTICS AGENT
  // ============================================================================

  async generateDashboard(request: DashboardRequest = {}): Promise<DashboardData> {
    const response = await this.client.post('/api/agents/generate-dashboard', request);
    return response.data;
  }

  // ============================================================================
  // WEBHOOKS
  // ============================================================================

  async processIncomingEmail(
    emailData: EmailAnalysisRequest['email_data']
  ): Promise<AgentResponse> {
    const response = await this.client.post('/webhooks/email-received', { email_data: emailData });
    return response.data;
  }

  async processFormSubmission(formData: Record<string, any>): Promise<AgentResponse> {
    const response = await this.client.post('/webhooks/form-submission', { form_data: formData });
    return response.data;
  }

  // ============================================================================
  // CRM DATA ENDPOINTS
  // ============================================================================

  async getLeads(params?: Record<string, any>): Promise<any[]> {
    const response = await this.client.get('/api/leads', { params });
    return response.data;
  }

  async getDeals(params?: Record<string, any>): Promise<any[]> {
    const response = await this.client.get('/api/deals', { params });
    return response.data;
  }

  async getCustomers(params?: Record<string, any>): Promise<any[]> {
    const response = await this.client.get('/api/customers', { params });
    return response.data;
  }

  async getEmails(params?: Record<string, any>): Promise<any[]> {
    const response = await this.client.get('/api/emails', { params });
    return response.data;
  }

  async getMeetings(params?: Record<string, any>): Promise<any[]> {
    const response = await this.client.get('/api/meetings', { params });
    return response.data;
  }

  async getAnalytics(params?: Record<string, any>): Promise<any> {
    const response = await this.client.get('/api/analytics', { params });
    return response.data;
  }

  // ============================================================================
  // WORKFLOW MANAGEMENT
  // ============================================================================

  async triggerWorkflow(trigger: WorkflowTrigger): Promise<WorkflowResult> {
    let endpoint = '';
    let data = {};

    switch (trigger.type) {
      case 'lead':
        endpoint = '/api/agents/qualify-lead';
        data = { lead_data: trigger.data };
        break;
      case 'email':
        endpoint = '/api/agents/analyze-email';
        data = { email_data: trigger.data };
        break;
      case 'deal':
        endpoint = `/api/agents/analyze-deal/${trigger.data.deal_id}`;
        data = trigger.data;
        break;
      case 'customer':
        endpoint = `/api/agents/monitor-customer/${trigger.data.customer_id}`;
        data = trigger.data;
        break;
      case 'meeting':
        endpoint = '/api/agents/schedule-meeting';
        data = trigger.data;
        break;
    }

    const response = await this.client.post(endpoint, data);
    return {
      workflow_id: `${trigger.type}_${Date.now()}`,
      status: 'processing',
      results: [response.data],
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  setBaseURL(url: string): void {
    this.baseURL = url;
    this.client.defaults.baseURL = url;
  }

  setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Error handling wrapper
  private async handleRequest<T>(request: Promise<T>): Promise<T> {
    try {
      return await request;
    } catch (error: any) {
      if (error.response) {
        // Server responded with error status
        throw new Error(
          `AI Agent API Error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`
        );
      } else if (error.request) {
        // Network error
        throw new Error('AI Agent API Network Error: Unable to connect to agent service');
      } else {
        // Other error
        throw new Error(`AI Agent API Error: ${error.message}`);
      }
    }
  }
}

// Default instance
export const aiAgentService = new AIAgentService();

// Factory function for custom instances
export const createAIAgentService = (baseURL?: string) => {
  return new AIAgentService(baseURL);
};
