import axios, { AxiosInstance } from 'axios';
import {
  GTMRole,
  RoleProfile,
  GTMIndustry,
  IndustryProfile,
  GTMMethodology,
  MethodologyProfile,
  GTMWorkflow,
  WorkflowProfile,
  GTMPrompt,
  PromptVariable,
  GTMTonality,
  TonalityProfile,
  SignalType,
  BuyingSignal,
  AgentWorkflowRequest,
  AgentWorkflowResult,
  MCPConnectionConfig,
  MCPTool,
  CompanyResearch,
  ContactResearch,
  EmailDraftRequest,
  EmailDraft,
  DiscoveryCallPrep,
  DiscoveryQuestion,
  CompetitorAnalysis,
  GTMAPIResponse,
} from '../types';

export class GTMSkillsService {
  private client: AxiosInstance;
  private mcpServerEnabled: boolean;
  private mcpConfig: MCPConnectionConfig | null;

  constructor(baseURL: string = 'https://api.gtm-skills.com', mcpConfig?: MCPConnectionConfig) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.mcpServerEnabled = !!mcpConfig;
    this.mcpConfig = mcpConfig || null;
  }

  // ============================================================================
  // PROMPTS LIBRARY
  // ============================================================================

  async listPrompts(filters?: {
    role?: GTMRole;
    industry?: GTMIndustry;
    methodology?: GTMMethodology;
    workflow?: GTMWorkflow;
    tonality?: GTMTonality;
    category?: string;
    search?: string;
  }): Promise<GTMPrompt[]> {
    const response = await this.client.get('/prompts', { params: filters });
    return response.data.prompts || [];
  }

  async getPrompt(id: string): Promise<GTMPrompt> {
    const response = await this.client.get(`/prompts/${id}`);
    return response.data;
  }

  async searchPrompts(query: string, limit?: number): Promise<GTMPrompt[]> {
    const response = await this.client.get('/prompts/search', {
      params: { q: query, limit },
    });
    return response.data.results || [];
  }

  async getPromptsByRole(role: GTMRole): Promise<GTMPrompt[]> {
    const response = await this.client.get(`/prompts/by-role/${role}`);
    return response.data.prompts || [];
  }

  async getPromptsByIndustry(industry: GTMIndustry): Promise<GTMPrompt[]> {
    const response = await this.client.get(`/prompts/by-industry/${industry}`);
    return response.data.prompts || [];
  }

  async getPromptsByMethodology(methodology: GTMMethodology): Promise<GTMPrompt[]> {
    const response = await this.client.get(`/prompts/by-methodology/${methodology}`);
    return response.data.prompts || [];
  }

  async executePrompt(
    promptId: string,
    variables: Record<string, string>,
    tonality?: GTMTonality
  ): Promise<{ output: string }> {
    const response = await this.client.post(`/prompts/${promptId}/execute`, {
      variables,
      tonality,
    });
    return response.data;
  }

  async renderPrompt(promptContent: string, variables: Record<string, string>): Promise<string> {
    const response = await this.client.post('/prompts/render', {
      prompt: promptContent,
      variables,
    });
    return response.data.rendered;
  }

  // ============================================================================
  // ROLES
  // ============================================================================

  async listRoles(): Promise<RoleProfile[]> {
    const response = await this.client.get('/roles');
    return response.data.roles || [];
  }

  async getRole(id: GTMRole): Promise<RoleProfile> {
    const response = await this.client.get(`/roles/${id}`);
    return response.data;
  }

  // ============================================================================
  // INDUSTRIES
  // ============================================================================

  async listIndustries(): Promise<IndustryProfile[]> {
    const response = await this.client.get('/industries');
    return response.data.industries || [];
  }

  async getIndustry(id: GTMIndustry): Promise<IndustryProfile> {
    const response = await this.client.get(`/industries/${id}`);
    return response.data;
  }

  // ============================================================================
  // METHODOLOGIES
  // ============================================================================

  async listMethodologies(): Promise<MethodologyProfile[]> {
    const response = await this.client.get('/methodologies');
    return response.data.methodologies || [];
  }

  async getMethodology(id: GTMMethodology): Promise<MethodologyProfile> {
    const response = await this.client.get(`/methodologies/${id}`);
    return response.data;
  }

  async getMethodologyQuestions(id: GTMMethodology): Promise<string[]> {
    const response = await this.client.get(`/methodologies/${id}/questions`);
    return response.data.questions || [];
  }

  // ============================================================================
  // WORKFLOWS
  // ============================================================================

  async listWorkflows(): Promise<WorkflowProfile[]> {
    const response = await this.client.get('/workflows');
    return response.data.workflows || [];
  }

  async getWorkflow(id: GTMWorkflow): Promise<WorkflowProfile> {
    const response = await this.client.get(`/workflows/${id}`);
    return response.data;
  }

  // ============================================================================
  // TONALITIES
  // ============================================================================

  async listTonalities(): Promise<TonalityProfile[]> {
    const response = await this.client.get('/tonalities');
    return response.data.tonalities || [];
  }

  async getTonality(id: GTMTonality): Promise<TonalityProfile> {
    const response = await this.client.get(`/tonalities/${id}`);
    return response.data;
  }

  // ============================================================================
  // SALES TOOLS
  // ============================================================================

  async researchCompany(companyName: string, includeNews?: boolean): Promise<CompanyResearch> {
    const response = await this.client.post('/tools/research-company', {
      company: companyName,
      includeNews,
    });
    return response.data;
  }

  async researchContact(email: string): Promise<ContactResearch> {
    const response = await this.client.post('/tools/research-contact', { email });
    return response.data;
  }

  async draftEmail(request: EmailDraftRequest): Promise<EmailDraft> {
    const response = await this.client.post('/tools/draft-email', request);
    return response.data;
  }

  async draftLinkedInMessage(
    recipient: { name: string; company: string },
    context: { reason?: string; sharedInterest?: string }
  ): Promise<{ message: string }> {
    const response = await this.client.post('/tools/draft-linkedin', {
      recipient,
      context,
    });
    return response.data;
  }

  async generateDiscoveryQuestions(
    company: string,
    contactTitle?: string
  ): Promise<DiscoveryQuestion[]> {
    const response = await this.client.post('/tools/discovery-questions', {
      company,
      contactTitle,
    });
    return response.data.questions || [];
  }

  async generateInterviewScript(
    company: string,
    contactName: string
  ): Promise<{ questions: DiscoveryQuestion[]; openingStatements: string[] }> {
    const response = await this.client.post('/tools/interview-script', {
      company,
      contactName,
    });
    return response.data;
  }

  async handleObjection(
    objection: string,
    competitor?: string
  ): Promise<{ response: string; approach: string }> {
    const response = await this.client.post('/tools/handle-objection', {
      objection,
      competitor,
    });
    return response.data;
  }

  async generateColdCallScript(
    company: string,
    contactTitle: string,
    painPoint?: string
  ): Promise<{ script: string; keyPoints: string[] }> {
    const response = await this.client.post('/tools/cold-call-script', {
      company,
      contactTitle,
      painPoint,
    });
    return response.data;
  }

  async buildValueProposition(
    company: string,
    competitor?: string
  ): Promise<{ proposition: string; proofPoints: string[] }> {
    const response = await this.client.post('/tools/value-proposition', {
      company,
      competitor,
    });
    return response.data;
  }

  async analyzeCompetitor(competitor: string, buyerPersona?: string): Promise<CompetitorAnalysis> {
    const response = await this.client.post('/tools/analyze-competitor', {
      competitor,
      buyerPersona,
    });
    return response.data;
  }

  async createFollowUpSequence(
    initialEmailType: string,
    recipientName: string
  ): Promise<{ sequence: { day: number; subject: string; body: string }[] }> {
    const response = await this.client.post('/tools/follow-up-sequence', {
      initialEmailType,
      recipientName,
    });
    return response.data;
  }

  // ============================================================================
  // BUYING SIGNALS
  // ============================================================================

  async detectSignals(companyName: string): Promise<BuyingSignal[]> {
    const response = await this.client.post('/signals/detect', { company: companyName });
    return response.data.signals || [];
  }

  async getSignalPrompts(signalType: SignalType): Promise<GTMPrompt[]> {
    const response = await this.client.get(`/signals/${signalType}/prompts`);
    return response.data.prompts || [];
  }

  // ============================================================================
  // OBJECTION HANDLING
  // ============================================================================

  async listObjectionCategories(): Promise<string[]> {
    const response = await this.client.get('/objections/categories');
    return response.data.categories || [];
  }

  async getObjections(category?: string): Promise<{ category: string; objections: string[] }[]> {
    const response = await this.client.get('/objections', {
      params: { category },
    });
    return response.data.objections || [];
  }

  async getObjectionResponse(objection: string): Promise<{
    response: string;
    alternativeResponses: string[];
    whenToUse: string[];
  }> {
    const response = await this.client.post('/objections/get-response', { objection });
    return response.data;
  }

  // ============================================================================
  // DISCOVERY FRAMEWORKS
  // ============================================================================

  async getDiscoveryFramework(methodology: 'spin' | 'meddpicc' | 'gap'): Promise<{
    framework: string;
    questions: DiscoveryQuestion[];
    tips: string[];
  }> {
    const response = await this.client.get(`/discovery/${methodology}`);
    return response.data;
  }

  async prepareDiscoveryCall(
    company: string,
    contact: ContactResearch
  ): Promise<DiscoveryCallPrep> {
    const response = await this.client.post('/discovery/prepare-call', {
      company,
      contact,
    });
    return response.data;
  }

  // ============================================================================
  // COMPETITIVE INTELLIGENCE
  // ============================================================================

  async getCompetitorBattleCard(competitor: string): Promise<CompetitorAnalysis> {
    const response = await this.client.get(`/competitive/${competitor}`);
    return response.data;
  }

  async compareCompetitors(competitors: string[]): Promise<{
    comparison: {
      dimension: string;
      ratings: Record<string, number>;
      winner: string;
    }[];
    recommendations: string[];
  }> {
    const response = await this.client.post('/competitive/compare', { competitors });
    return response.data;
  }

  // ============================================================================
  // AGENTIC WORKFLOWS
  // ============================================================================

  async runAgentWorkflow(request: AgentWorkflowRequest): Promise<AgentWorkflowResult> {
    const response = await this.client.post('/agent/workflow', request);
    return response.data;
  }

  async runAccountStrategy(company: string): Promise<{
    stakeholderMap: { name: string; title: string; influence: string }[];
    buyingProcess: string[];
    keyDates: { date: string; event: string }[];
    recommendedActions: string[];
  }> {
    const response = await this.client.post('/agent/account-strategy', { company });
    return response.data;
  }

  async runCompetitiveDealWorkflow(
    competitor: string,
    prospectCompany: string
  ): Promise<{
    positioning: string;
    keyMessages: string[];
    proofPoints: string[];
    objections: { objection: string; response: string }[];
  }> {
    const response = await this.client.post('/agent/competitive-deal', {
      competitor,
      prospectCompany,
    });
    return response.data;
  }

  async runFullSalesCycle(context: {
    company: string;
    contact: string;
    product?: string;
  }): Promise<{
    stages: { name: string; tasks: string[]; completed: boolean }[];
    timeline: string;
    successCriteria: string[];
  }> {
    const response = await this.client.post('/agent/full-sales-cycle', context);
    return response.data;
  }

  // ============================================================================
  // MCP SERVER
  // ============================================================================

  getMCPServerCommand(): MCPConnectionConfig | null {
    if (!this.mcpServerEnabled || !this.mcpConfig) {
      return {
        command: 'npx',
        args: ['gtm-mcp-server'],
      };
    }
    return this.mcpConfig;
  }

  async getMCPTools(): Promise<MCPTool[]> {
    const response = await this.client.get('/mcp/tools');
    return response.data.tools || [];
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  setBaseURL(url: string): void {
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
export const gtmSkillsService = new GTMSkillsService();

// Factory function
export const createGTMSkillsService = (baseURL?: string, mcpConfig?: MCPConnectionConfig) => {
  return new GTMSkillsService(baseURL, mcpConfig);
};
