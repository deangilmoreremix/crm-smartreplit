/**
 * AI Tools API Service
 * Client-side service for all Twenty CRM AI-powered features.
 * Provides typed API calls to the backend AI routes.
 */

const API_BASE = '/api/ai';

async function apiCall(endpoint: string, body: any): Promise<any> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// ============================================================
// AI SALES TOOLS
// ============================================================

export const aiSalesTools = {
  salesAssistant: (question: string, context?: any) =>
    apiCall('/sales-assistant', { question, context }),

  leadScore: (contactData: any) =>
    apiCall('/lead-score', { contactData }),

  dealIntelligence: (dealData: any, contactHistory?: any[], marketContext?: any) =>
    apiCall('/deal-intelligence', { dealData, contactHistory, marketContext }),

  pipelineIntelligence: (deals: any[]) =>
    apiCall('/pipeline-intelligence', { deals }),

  dealRiskMonitor: (deals: any[]) =>
    apiCall('/deal-risk-monitor', { deals }),

  conversionOptimization: (deals: any[], contacts: any[]) =>
    apiCall('/conversion-optimization', { deals, contacts }),

  winRateIntelligence: (deals: any[]) =>
    apiCall('/win-rate-intelligence', { deals }),

  salesForecast: (deals: any[], period?: string) =>
    apiCall('/sales-forecast', { deals, period }),

  liveDealAnalysis: (deals: any[]) =>
    apiCall('/live-deal-analysis', { deals }),

  pipelineHealth: (deals: any[]) =>
    apiCall('/pipeline-health', { deals }),
};

// ============================================================
// AI COMMUNICATION TOOLS
// ============================================================

export const aiCommunication = {
  composeEmail: (params: {
    recipientName: string;
    recipientCompany: string;
    purpose: string;
    tone?: string;
    keyPoints?: string[];
    callToAction?: string;
  }) => apiCall('/email/compose', params),

  generateReply: (originalEmail: string, context?: string, tone?: string) =>
    apiCall('/email/reply', { originalEmail, context, tone }),

  generateFollowUp: (contactData: any, lastInteraction: string, purpose: string) =>
    apiCall('/follow-up/generate', { contactData, lastInteraction, purpose }),

  handleObjection: (objection: string, productInfo: string, contactData?: any) =>
    apiCall('/objection/handle', { objection, productInfo, contactData }),

  generateProposal: (params: {
    clientName: string;
    projectDescription: string;
    budget?: string;
    timeline?: string;
    deliverables?: string[];
  }) => apiCall('/proposal/generate', params),

  generateAppointmentMessage: (appointmentData: any, messageType?: string) =>
    apiCall('/appointment/message', { appointmentData, messageType }),

  generateVideoScript: (params: {
    recipientName: string;
    productName: string;
    keyMessage: string;
    duration?: string;
  }) => apiCall('/video/script', params),

  generateSMS: (purpose: string, contactName: string, context?: string) =>
    apiCall('/sms/generate', { purpose, contactName, context }),

  generateVoiceScript: (params: {
    purpose: string;
    contactName: string;
    keyPoints?: string[];
    duration?: string;
  }) => apiCall('/voice/script', params),
};

// ============================================================
// CONTENT & MARKETING TOOLS
// ============================================================

export const aiContent = {
  generateContent: (params: {
    type: string;
    topic: string;
    audience?: string;
    tone?: string;
    keywords?: string[];
  }) => apiCall('/content/generate', params),

  generateSalesPage: (params: {
    productName: string;
    targetAudience?: string;
    keyBenefits?: string[];
    price?: string;
  }) => apiCall('/content/sales-page', params),

  generateProposal: (params: {
    clientName: string;
    projectDescription: string;
    budget?: string;
    timeline?: string;
    deliverables?: string[];
  }) => apiCall('/content/proposal', params),

  generateOffer: (params: {
    productName: string;
    targetAudience?: string;
    pricePoint?: string;
    uniqueValue?: string;
  }) => apiCall('/content/offer', params),

  generateSocialPost: (params: {
    platform: string;
    topic: string;
    tone?: string;
    includeHashtags?: boolean;
  }) => apiCall('/content/social-post', params),

  generateWebinarInvite: (params: {
    topic: string;
    speakerName?: string;
    date?: string;
    duration?: string;
    keyTakeaways?: string[];
  }) => apiCall('/content/webinar-invite', params),

  generateCaseStudy: (params: {
    clientName: string;
    challenge: string;
    solution?: string;
    results?: string[];
  }) => apiCall('/content/case-study', params),

  transformTestimonial: (rawTestimonial: string, format?: string) =>
    apiCall('/content/testimonial', { rawTestimonial, format }),

  analyzeBusiness: (businessData: any) =>
    apiCall('/business/analyze', { businessData }),

  saveContent: (title: string, content: string, type?: string, tags?: string[]) =>
    apiCall('/content/save', { title, content, type, tags }),
};

// ============================================================
// MEETING & PRODUCTIVITY TOOLS
// ============================================================

export const aiProductivity = {
  summarizeMeeting: (transcript: string) =>
    apiCall('/meeting/summarize', { transcript }),

  speechToText: (audioContext: string) =>
    apiCall('/speech/to-text', { audioContext }),

  createTask: (description: string, context?: any) =>
    apiCall('/task/create', { description, context }),

  generateMeetingNotes: (meetingData: any) =>
    apiCall('/meeting/notes', { meetingData }),

  suggestFollowUpTasks: (completedTask: string, context?: any) =>
    apiCall('/task/follow-up-suggestions', { completedTask, context }),

  suggestCalendar: (appointments?: any[], preferences?: any) =>
    apiCall('/calendar/suggest', { appointments, preferences }),
};

// ============================================================
// ADVANCED AI TOOLS
// ============================================================

export const aiAdvanced = {
  analyzeImage: (imageUrl: string, prompt?: string) =>
    apiCall('/vision/analyze', { imageUrl, prompt }),

  semanticSearch: (query: string, items?: any[]) =>
    apiCall('/search/semantic', { query, items }),

  functionAssistant: (request: string, context?: any) =>
    apiCall('/function/assistant', { request, context }),

  generateReasoning: (task: string, data?: any) =>
    apiCall('/reasoning/generate', { task, data }),

  researchTopic: (topic: string, depth?: string) =>
    apiCall('/research/topic', { topic, depth }),

  getRecommendations: (type: string, data?: any, preferences?: any) =>
    apiCall('/recommendations', { type, data, preferences }),
};

// ============================================================
// AUTOMATION TOOLS
// ============================================================

export const aiAutomation = {
  generateWorkflow: (workflowData: any) =>
    apiCall('/automation/workflow', { workflowData }),

  followUpAutomation: (contactData: any, lastInteraction: string, purpose: string) =>
    apiCall('/automation/follow-up', { contactData, lastInteraction, purpose }),

  appointmentAutomation: (appointmentData: any, messageType?: string) =>
    apiCall('/automation/appointment', { appointmentData, messageType }),

  pipelineStageAutomation: (deals: any[], targetStage?: string) =>
    apiCall('/automation/pipeline-stage', { deals, targetStage }),

  formSubmissionAutomation: (formData: any, formType?: string) =>
    apiCall('/automation/form-submission', { formData, formType }),

  segmentContacts: (contacts: any[], criteria?: string) =>
    apiCall('/automation/segment', { contacts, criteria }),

  autoSaveSuggestions: (data: any, type: string) =>
    apiCall('/automation/auto-save', { data, type }),

  generateAutomationRules: (context?: any) =>
    apiCall('/automation/rules', { context }),
};

export default {
  sales: aiSalesTools,
  communication: aiCommunication,
  content: aiContent,
  productivity: aiProductivity,
  advanced: aiAdvanced,
  automation: aiAutomation,
};
