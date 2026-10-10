// AI Agents Types
export interface AgentStatus {
  lead_qualification: string;
  email_intelligence: string;
  sales_pipeline: string;
  customer_success: string;
  meeting_scheduler: string;
  analytics: string;
}

export interface LeadQualificationResult {
  score: number;
  routing: {
    team: string;
    priority: string;
  };
  enriched_data: Record<string, any>;
  buying_signals: string[];
}

export interface EmailAnalysisResult {
  sentiment: {
    label: string;
    score: number;
  };
  category: string;
  priority: string;
  draft_response: string;
  suggested_actions: string[];
}

export interface DealAnalysisResult {
  health_score: number;
  is_stalled: boolean;
  risk_factors: string[];
  next_actions: string[];
  close_probability: number;
}

export interface CustomerHealthResult {
  health_score: number;
  churn_risk: {
    level: string;
    probability: number;
  };
  upsell_opportunities: string[];
  retention_actions: string[];
}

export interface MeetingScheduleResult {
  subject: string;
  scheduled_time: string;
  duration_minutes: number;
  attendees: string[];
  agenda: string[];
  prep_materials: string[];
}

export interface DashboardData {
  metrics: Record<string, any>;
  insights: string[];
  recommendations: string[];
  alerts: string[];
}

// Agent Service Request/Response Types
export interface LeadQualificationRequest {
  lead_data: {
    email: string;
    first_name?: string;
    last_name?: string;
    job_title?: string;
    company?: string;
    website?: string;
    linkedin?: string;
  };
}

export interface EmailAnalysisRequest {
  email_data: {
    from: string;
    to: string;
    subject: string;
    body: string;
    timestamp?: string;
  };
}

export interface DealAnalysisRequest {
  deal_id: string;
  action?: string;
}

export interface CustomerMonitorRequest {
  customer_id: string;
  action?: string;
}

export interface MeetingScheduleRequest {
  action: string;
  meeting_type?: string;
  attendees: string[];
  duration?: number;
  subject?: string;
  description?: string;
}

export interface DashboardRequest {
  category?: string;
}

// Agent Service Response Types
export interface AgentResponse<T = any> {
  status: string;
  message: string;
  data?: T;
}

// Workflow Types
export interface WorkflowTrigger {
  type: 'lead' | 'email' | 'deal' | 'customer' | 'meeting';
  data: Record<string, any>;
}

export interface WorkflowResult {
  workflow_id: string;
  status: 'processing' | 'completed' | 'failed';
  results: Record<string, any>[];
  timestamp: string;
}
