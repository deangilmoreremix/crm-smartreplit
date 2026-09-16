import axios, { AxiosInstance } from 'axios';
import {
  Lead,
  LeadEnrichmentData,
  LinkedInProfile,
  CompanyProfile,
  ResearchReport,
  QualificationResult,
  QualificationCriteria,
  OutreachReport,
  PersonalizedEmail,
  InterviewScript,
  CRMConfig,
  CRMContact,
  CRMDeal,
  OutreachWorkflow,
  WorkflowStep,
  OutreachAPIResponse,
} from '../types';

export class SalesOutreachService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:8000') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 60000, // Longer timeout for research operations
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // ============================================================================
  // LEAD MANAGEMENT
  // ============================================================================

  async listLeads(params?: { status?: string; limit?: number; offset?: number }): Promise<Lead[]> {
    const response = await this.client.get('/leads', { params });
    return response.data.leads || [];
  }

  async getLead(id: string): Promise<Lead> {
    const response = await this.client.get(`/leads/${id}`);
    return response.data;
  }

  async createLead(lead: Partial<Lead>): Promise<Lead> {
    const response = await this.client.post('/leads', lead);
    return response.data;
  }

  async updateLead(id: string, lead: Partial<Lead>): Promise<Lead> {
    const response = await this.client.put(`/leads/${id}`, lead);
    return response.data;
  }

  async deleteLead(id: string): Promise<void> {
    await this.client.delete(`/leads/${id}`);
  }

  async fetchLeadsFromCRM(): Promise<Lead[]> {
    const response = await this.client.post('/leads/fetch-from-crm');
    return response.data.leads || [];
  }

  // ============================================================================
  // LEAD ENRICHMENT
  // ============================================================================

  async enrichLead(
    id: string,
    options?: {
      includeLinkedIn?: boolean;
      includeCompany?: boolean;
      includeSocialMedia?: boolean;
      includeNews?: boolean;
    }
  ): Promise<LeadEnrichmentData> {
    const response = await this.client.post(`/leads/${id}/enrich`, options || {});
    return response.data;
  }

  async enrichLeadByLinkedIn(linkedinUrl: string): Promise<LinkedInProfile> {
    const response = await this.client.post('/enrichment/linkedin', { url: linkedinUrl });
    return response.data;
  }

  async enrichCompany(companyName: string, website?: string): Promise<CompanyProfile> {
    const response = await this.client.post('/enrichment/company', {
      name: companyName,
      website,
    });
    return response.data;
  }

  // ============================================================================
  // RESEARCH & ANALYSIS
  // ============================================================================

  async generateResearchReport(leadId: string): Promise<ResearchReport> {
    const response = await this.client.post(`/research/${leadId}/generate`);
    return response.data;
  }

  async analyzeDigitalPresence(companyProfile: CompanyProfile): Promise<any> {
    const response = await this.client.post('/research/digital-presence', {
      company: companyProfile,
    });
    return response.data;
  }

  async analyzeRecentNews(companyName: string): Promise<any> {
    const response = await this.client.post('/research/news', { company: companyName });
    return response.data;
  }

  async identifyPainPoints(
    companyProfile: CompanyProfile,
    digitalPresence: any
  ): Promise<string[]> {
    const response = await this.client.post('/research/pain-points', {
      company: companyProfile,
      digitalPresence,
    });
    return response.data.painPoints || [];
  }

  // ============================================================================
  // LEAD QUALIFICATION
  // ============================================================================

  async qualifyLead(
    leadId: string,
    criteria?: Partial<QualificationCriteria>
  ): Promise<QualificationResult> {
    const response = await this.client.post(`/qualification/${leadId}/qualify`, {
      criteria: criteria || {},
    });
    return response.data;
  }

  async batchQualifyLead(leadIds: string[]): Promise<QualificationResult[]> {
    const response = await this.client.post('/qualification/batch', { leadIds });
    return response.data.results || [];
  }

  async updateQualificationCriteria(criteria: QualificationCriteria): Promise<void> {
    await this.client.put('/qualification/criteria', { criteria });
  }

  // ============================================================================
  // OUTREACH MATERIALS GENERATION
  // ============================================================================

  async generateOutreachReport(leadId: string): Promise<OutreachReport> {
    const response = await this.client.post(`/outreach/${leadId}/report`);
    return response.data;
  }

  async generatePersonalizedEmail(leadId: string, reportId?: string): Promise<PersonalizedEmail> {
    const response = await this.client.post(`/outreach/${leadId}/email`, {
      reportId,
    });
    return response.data;
  }

  async generateInterviewScript(leadId: string, reportId?: string): Promise<InterviewScript> {
    const response = await this.client.post(`/outreach/${leadId}/script`, {
      reportId,
    });
    return response.data;
  }

  async generateAllOutreachMaterials(leadId: string): Promise<{
    report: OutreachReport;
    email: PersonalizedEmail;
    script: InterviewScript;
  }> {
    const response = await this.client.post(`/outreach/${leadId}/generate-all`);
    return response.data;
  }

  // ============================================================================
  // WORKFLOW MANAGEMENT
  // ============================================================================

  async startWorkflow(leadId: string): Promise<OutreachWorkflow> {
    const response = await this.client.post(`/workflow/${leadId}/start`);
    return response.data;
  }

  async getWorkflowStatus(workflowId: string): Promise<OutreachWorkflow> {
    const response = await this.client.get(`/workflow/${workflowId}/status`);
    return response.data;
  }

  async getWorkflowSteps(workflowId: string): Promise<WorkflowStep[]> {
    const response = await this.client.get(`/workflow/${workflowId}/steps`);
    return response.data.steps || [];
  }

  async pauseWorkflow(workflowId: string): Promise<void> {
    await this.client.post(`/workflow/${workflowId}/pause`);
  }

  async resumeWorkflow(workflowId: string): Promise<void> {
    await this.client.post(`/workflow/${workflowId}/resume`);
  }

  async cancelWorkflow(workflowId: string): Promise<void> {
    await this.client.post(`/workflow/${workflowId}/cancel`);
  }

  // ============================================================================
  // CRM INTEGRATION
  // ============================================================================

  async configureCRM(config: CRMConfig): Promise<void> {
    await this.client.post('/crm/configure', { config });
  }

  async getCRMContacts(): Promise<CRMContact[]> {
    const response = await this.client.get('/crm/contacts');
    return response.data.contacts || [];
  }

  async syncLeadToCRM(leadId: string): Promise<void> {
    await this.client.post(`/crm/${leadId}/sync`);
  }

  async updateCRMLeadStatus(leadId: string, status: string): Promise<void> {
    await this.client.put(`/crm/${leadId}/status`, { status });
  }

  async createCRMDealFromLead(leadId: string, dealData?: Partial<CRMDeal>): Promise<CRMDeal> {
    const response = await this.client.post(`/crm/${leadId}/create-deal`, dealData || {});
    return response.data;
  }

  // ============================================================================
  // FULL AUTOMATION RUN
  // ============================================================================

  async runFullAutomation(): Promise<{
    leadsProcessed: number;
    reportsGenerated: number;
    emailsSent: number;
    crmUpdates: number;
  }> {
    const response = await this.client.post('/automation/run-full');
    return response.data;
  }

  async runLeadNurturingSequence(leadId: string): Promise<void> {
    await this.client.post(`/automation/${leadId}/nurture`);
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

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch {
      return false;
    }
  }
}

// Default instance
export const salesOutreachService = new SalesOutreachService();

// Factory function
export const createSalesOutreachService = (baseURL?: string) => {
  return new SalesOutreachService(baseURL);
};
