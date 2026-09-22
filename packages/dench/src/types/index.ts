// DenchClaw Types

export interface DenchConfig {
  profile: string;
  gatewayPort: number;
  webPort: number;
  workspaceDir: string;
  apiKey?: string;
}

export interface DenchStatus {
  gateway: {
    running: boolean;
    port: number;
    profile: string;
  };
  web: {
    running: boolean;
    url: string;
  };
  paired: boolean;
}

export interface DenchCommand {
  command: string;
  args?: string[];
  profile?: string;
}

export interface DenchResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// Workspace Types
export interface WorkspaceObject {
  id: string;
  type: string;
  name: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ObjectQuery {
  type?: string;
  limit?: number;
  offset?: number;
  filter?: Record<string, any>;
}

// CRM Types
export interface Contact {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  title?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  enrichmentData?: Record<string, any>;
}

export interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  probability?: number;
  contactId?: string;
  company?: string;
  closeDate?: string;
  notes?: string;
  customFields?: Record<string, any>;
}

export interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string;
  contactId?: string;
  dealId?: string;
  date: string;
  duration?: number;
  metadata?: Record<string, any>;
}

// Agent Types
export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface AgentSession {
  id: string;
  workspaceId: string;
  messages: AgentMessage[];
  context?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Outreach Types
export interface OutreachSequence {
  id: string;
  name: string;
  steps: OutreachStep[];
  status: 'draft' | 'active' | 'paused' | 'completed';
}

export interface OutreachStep {
  order: number;
  type: 'email' | 'linkedin' | 'call' | 'task';
  template?: string;
  delayDays?: number;
  conditions?: Record<string, any>;
}

export interface OutreachResult {
  sequenceId: string;
  contactId: string;
  status: 'pending' | 'sent' | 'replied' | 'converted' | 'bounced' | 'failed';
  sentAt?: string;
  response?: string;
}

// Skills Types
export interface DenchSkill {
  id: string;
  name: string;
  description: string;
  category: string;
  prompts: string[];
  actions?: Record<string, any>;
}

export interface SkillExecution {
  skillId: string;
  input: Record<string, any>;
  output?: any;
  error?: string;
  executedAt: string;
}
