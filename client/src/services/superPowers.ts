// SuperPowers Integration - Unified AI Services Hub
// This file exports all AI agent integrations from external repositories

export { AIAgentService, aiAgentService, createAIAgentService } from '@smartcrm/ai-agents';
export type {
  AgentStatus,
  LeadQualificationResult,
  EmailAnalysisResult,
  DealAnalysisResult,
  CustomerHealthResult,
  MeetingScheduleResult,
  DashboardData,
  WorkflowTrigger,
  WorkflowResult,
} from '@smartcrm/ai-agents';

export { DenchService, denchService, createDenchService } from '@smartcrm/dench';
export type {
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
  OutreachStep,
  OutreachResult,
  DenchSkill,
  SkillExecution,
} from '@smartcrm/dench';

export {
  SalesOutreachService,
  salesOutreachService,
  createSalesOutreachService,
} from '@smartcrm/sales-outreach';
export type {
  Lead,
  LeadStatus,
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
} from '@smartcrm/sales-outreach';

export { GTMSkillsService, gtmSkillsService, createGTMSkillsService } from '@smartcrm/gtm-skills';
export type {
  GTMRole,
  GTMPrompt,
  GTMTonality,
  GTMMethodology,
  GTMWorkflow,
  GTMIndustry,
  CompanyResearch,
  ContactResearch,
  EmailDraftRequest,
  EmailDraft,
  DiscoveryCallPrep,
  DiscoveryQuestion,
  CompetitorAnalysis,
  BuyingSignal,
  AgentWorkflowRequest,
  AgentWorkflowResult,
} from '@smartcrm/gtm-skills';

// Integration utilities
export interface SuperPowersConfig {
  aiAgentsUrl?: string;
  denchProfile?: string;
  denchGatewayPort?: number;
  denchWebPort?: number;
  salesOutreachUrl?: string;
  gtmSkillsUrl?: string;
}

export function initializeSuperPowers(config: SuperPowersConfig) {
  const services = {
    aiAgents: createAIAgentService(config.aiAgentsUrl),
    dench: createDenchService({
      profile: config.denchProfile || 'dench',
      gatewayPort: config.denchGatewayPort || 19001,
      webPort: config.denchWebPort || 3100,
    }),
    salesOutreach: createSalesOutreachService(config.salesOutreachUrl),
    gtmSkills: createGTMSkillsService(config.gtmSkillsUrl),
  };

  return services;
}

// Re-export for convenience
import { createAIAgentService } from '@smartcrm/ai-agents';
import { createDenchService } from '@smartcrm/dench';
import { createSalesOutreachService } from '@smartcrm/sales-outreach';
import { createGTMSkillsService } from '@smartcrm/gtm-skills';

export const superPowers = initializeSuperPowers({});

export default superPowers;
