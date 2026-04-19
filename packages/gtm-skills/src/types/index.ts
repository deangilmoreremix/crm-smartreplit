// GTM Skills Types

// Role Types
export type GTMRole = 'sdr' | 'bdr' | 'ae' | 'sales_manager' | 'revops' | 'csm' | 'founder';

export interface RoleProfile {
  id: GTMRole;
  name: string;
  description: string;
  promptCount: number;
  categories: string[];
}

// Industry Types
export type GTMIndustry =
  | 'saas'
  | 'fintech'
  | 'healthcare'
  | 'manufacturing'
  | 'professional_services'
  | 'ecommerce'
  | 'real_estate'
  | 'education'
  | 'media'
  | 'government'
  | 'nonprofit';

export interface IndustryProfile {
  id: GTMIndustry;
  name: string;
  useCases: string[];
  specificChallenges: string[];
  complianceRequirements?: string[];
}

// Methodology Types
export type GTMMethodology =
  | 'meddpicc'
  | 'spin'
  | 'challenger'
  | 'gap_selling'
  | 'value_selling'
  | 'sandler'
  | 'command_of_message'
  | 'target_account';

export interface MethodologyProfile {
  id: GTMMethodology;
  name: string;
  description: string;
  keyConcepts: string[];
  whenToUse: string[];
  keyQuestions: string[];
}

// Workflow Types
export type GTMWorkflow =
  | 'cold_to_close'
  | 'discovery'
  | 'demo_proposal'
  | 'competitive'
  | 'expansion'
  | 'qbr'
  | 'objection_handling'
  | 'territory_planning'
  | 'forecasting';

export interface WorkflowProfile {
  id: GTMWorkflow;
  name: string;
  description: string;
  steps: string[];
  bestFor: string[];
  expectedOutcome: string;
}

// Prompt Types
export interface GTMPrompt {
  id: string;
  title: string;
  content: string;
  role?: GTMRole;
  industry?: GTMIndustry;
  methodology?: GTMMethodology;
  workflow?: GTMWorkflow;
  tonality?: GTMTonality;
  category: string;
  tags: string[];
  examples?: string[];
  variables?: PromptVariable[];
}

export interface PromptVariable {
  name: string;
  description: string;
  example?: string;
  required: boolean;
}

// Tonality Types
export type GTMTonality =
  | 'executive'
  | 'thought_leader'
  | 'analyst'
  | 'expert'
  | 'conversational'
  | 'friendly'
  | 'empathetic'
  | 'peer_to_peer'
  | 'consultative'
  | 'challenger'
  | 'value_focused'
  | 'urgency'
  | 'direct'
  | 'concise'
  | 'educational'
  | 'technical'
  | 'professional'
  | 'casual'
  | 'confident'
  | 'humble'
  | 'enthusiastic'
  | 'calm'
  | 'bold'
  | 'measured';

export interface TonalityProfile {
  id: GTMTonality;
  name: string;
  description: string;
  guidelines: string[];
  examplePhrases: string[];
  whenToUse: string[];
  whenToAvoid: string[];
}

// Signal Types
export type SignalType =
  | 'funding_announced'
  | 'leadership_change'
  | 'expansion_news'
  | 'new_product'
  | 'partnership'
  | 'positive_news'
  | 'hiring_spree'
  | 'tech_stack_change'
  | 'event_participation'
  | 'social_engagement';

export interface BuyingSignal {
  type: SignalType;
  company: string;
  description: string;
  relevance: 'high' | 'medium' | 'low';
  suggestedAction: string;
  detectedAt: string;
}

// Agent Workflow Types
export interface AgentWorkflowRequest {
  workflowType: string;
  context: {
    company?: string;
    contact?: {
      name: string;
      title: string;
      company: string;
    };
    deal?: {
      value: number;
      stage: string;
    };
    competitor?: string;
    [key: string]: any;
  };
}

export interface AgentWorkflowResult {
  workflowType: string;
  steps: {
    name: string;
    completed: boolean;
    output?: any;
    error?: string;
  }[];
  finalOutput: any;
  completedAt: string;
}

// MCP Server Types
export interface MCPConnectionConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  outputSchema?: Record<string, any>;
}

// Research Types
export interface CompanyResearch {
  companyName: string;
  industry?: string;
  size?: string;
  location?: string;
  recentNews: {
    title: string;
    url?: string;
    date: string;
    summary?: string;
  }[];
  techStack?: string[];
  competitors?: string[];
  socialMedia?: {
    platform: string;
    handle?: string;
    url?: string;
  }[];
  funding?: {
    amount: string;
    date: string;
    round: string;
  };
}

export interface ContactResearch {
  name: string;
  title?: string;
  company?: string;
  linkedin?: string;
  recentActivity?: string[];
  connections?: number;
  mutualConnections?: string[];
}

// Email Types
export interface EmailDraftRequest {
  type: 'cold_email' | 'follow_up' | 'sequence' | 'meeting_request' | 'proposal';
  recipient: {
    name: string;
    title?: string;
    company: string;
    email: string;
  };
  context: {
    painPoint?: string;
    valueProposition?: string;
    competitor?: string;
    previousInteraction?: string;
    customFields?: Record<string, string>;
  };
  tonality?: GTMTonality;
  includeCTA?: boolean;
  ctaType?: 'meeting' | 'call' | 'demo' | 'reply';
}

export interface EmailDraft {
  subject: string;
  body: string;
  preview?: string;
  tonality: GTMTonality;
  suggestedSendTime?: string;
}

// Objection Types
export interface ObjectionCategory {
  category: string;
  objections: Objection[];
}

export interface Objection {
  objection: string;
  response: string;
  whenToUse: string[];
  exampleConversation?: string;
}

// Discovery Types
export interface DiscoveryQuestion {
  type: 'situation' | 'problem' | 'implication' | 'need_payoff';
  question: string;
  purpose: string;
  followUpQuestions?: string[];
  listeningFor?: string[];
}

export interface DiscoveryCallPrep {
  contact: ContactResearch;
  company: CompanyResearch;
  keyQuestions: DiscoveryQuestion[];
  anticipatedObjections: Objection[];
  successMetrics: string[];
  competitorNotes?: string;
}

// Battle Card Types
export interface CompetitorAnalysis {
  competitor: string;
  strengths: string[];
  weaknesses: string[];
  commonObjections: Objection[];
  trapQuestions: string[];
  valueNarrative: string;
  proofPoints: {
    caseStudy: string;
    data: string;
  }[];
}

// API Response Types
export interface GTMAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
