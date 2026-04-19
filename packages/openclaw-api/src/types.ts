// OpenClaw API Types
export interface OpenClawConfig {
  baseUrl: string;
  apiKey: string;
  workspaceId?: string;
}

export interface OpenClawContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  enrichedData?: {
    linkedinUrl?: string;
    jobTitle?: string;
    location?: string;
    industry?: string;
    aiScore?: number;
    lastEnriched?: string;
  };
}

export interface OpenClawDeal {
  id: string;
  title: string;
  value: number;
  stage: string;
  contactId: string;
  probability?: number;
  aiInsights?: {
    predictedCloseDate?: string;
    riskFactors?: string[];
    recommendations?: string[];
  };
}

export interface OpenClawChatRequest {
  message: string;
  context?: {
    contacts?: OpenClawContact[];
    deals?: OpenClawDeal[];
    currentView?: string;
  };
}

export interface OpenClawChatResponse {
  response: string;
  suggestions?: string[];
  actions?: Array<{
    type: string;
    label: string;
    data: any;
  }>;
}

export interface OpenClawEnrichmentRequest {
  contactId: string;
  data: Partial<OpenClawContact>;
}

export interface OpenClawEnrichmentResponse {
  success: boolean;
  enrichedData: OpenClawContact['enrichedData'];
  confidence: number;
}
