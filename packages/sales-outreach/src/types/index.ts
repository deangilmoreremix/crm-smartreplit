// Sales Outreach Automation Types

export interface Lead {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  phone?: string;
  linkedinUrl?: string;
  status: LeadStatus;
  qualificationScore?: number;
  enrichmentData?: LeadEnrichmentData;
  createdAt: string;
  updatedAt: string;
}

export type LeadStatus =
  | 'new'
  | 'researching'
  | 'qualified'
  | 'outreach_sent'
  | 'replied'
  | 'converted'
  | 'disqualified';

export interface LeadEnrichmentData {
  linkedin?: LinkedInProfile;
  company?: CompanyProfile;
  socialMedia?: SocialMediaProfiles;
  recentNews?: NewsArticle[];
  painPoints?: string[];
}

export interface LinkedInProfile {
  url: string;
  headline?: string;
  about?: string;
  experience?: WorkExperience[];
  education?: Education[];
  skills?: string[];
}

export interface WorkExperience {
  title: string;
  company: string;
  duration: string;
  description?: string;
}

export interface Education {
  degree: string;
  field: string;
  school: string;
  year?: string;
}

export interface CompanyProfile {
  name: string;
  website: string;
  description?: string;
  industry?: string;
  size?: string;
  location?: string;
  socialMedia?: SocialMediaProfiles;
  techStack?: string[];
  blogContent?: BlogPost[];
}

export interface SocialMediaProfiles {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  youtube?: string;
  instagram?: string;
}

export interface NewsArticle {
  title: string;
  url: string;
  publishedAt: string;
  summary?: string;
  source?: string;
}

export interface BlogPost {
  title: string;
  url: string;
  publishedAt?: string;
  summary?: string;
}

// Research & Analysis Types
export interface ResearchReport {
  leadId: string;
  leadProfile: LeadProfileReport;
  companyProfile: CompanyProfileReport;
  digitalPresenceAnalysis: DigitalPresenceReport;
  consolidatedReport: ConsolidatedReport;
  generatedAt: string;
}

export interface LeadProfileReport {
  summary: string;
  challenges: string[];
  opportunities: string[];
  engagementRecommendations: string[];
}

export interface CompanyProfileReport {
  summary: string;
  productsServices: string[];
  targetMarket: string[];
  competitors?: string[];
  recentInitiatives: string[];
  potentialPainPoints: string[];
}

export interface DigitalPresenceReport {
  websiteAnalysis: {
    quality: 'excellent' | 'good' | 'average' | 'poor';
    seoScore?: number;
    mobileFriendly?: boolean;
    issues: string[];
  };
  socialMediaAnalysis: {
    platform: string;
    activity: 'high' | 'medium' | 'low';
    engagement: number;
    followers?: number;
  }[];
  contentQuality: {
    blogQuality: 'excellent' | 'good' | 'average' | 'poor';
    contentTopics: string[];
    contentGaps: string[];
  };
  newsSentiment: 'positive' | 'neutral' | 'negative';
  overallScore: number;
}

export interface ConsolidatedReport {
  summary: string;
  keyInsights: string[];
  recommendedApproach: string;
  priorityLevel: 'high' | 'medium' | 'low';
}

// Qualification Types
export interface QualificationCriteria {
  digitalPresenceScore?: number;
  socialMediaScore?: number;
  industryFit?: 'excellent' | 'good' | 'average' | 'poor' | 'not_fit';
  companyScale?: 'enterprise' | 'mid_market' | 'small_business';
  aiAutomationPotential?: 'high' | 'medium' | 'low';
}

export interface QualificationResult {
  leadId: string;
  isQualified: boolean;
  scores: QualificationCriteria;
  overallScore: number;
  recommendations: string[];
  qualifiedAt: string;
}

// Outreach Types
export interface OutreachReport {
  leadId: string;
  challengesIdentified: string[];
  howWeCanHelp: string[];
  caseStudies: CaseStudy[];
  recommendedApproach: string;
  generatedAt: string;
}

export interface CaseStudy {
  title: string;
  client: string;
  problem: string;
  solution: string;
  results: string;
  relevance: string;
}

export interface PersonalizedEmail {
  subject: string;
  body: string;
  reportLink?: string;
  signature?: string;
  generatedAt: string;
}

export interface InterviewScript {
  leadId: string;
  questions: SPINQuestion[];
  openingStatements: string[];
  closingSuggestions: string[];
  generatedAt: string;
}

export interface SPINQuestion {
  type: 'situation' | 'problem' | 'implication' | 'need-payoff';
  question: string;
  purpose: string;
}

// CRM Integration Types
export interface CRMConfig {
  type: 'hubspot' | 'airtable' | 'google_sheets' | 'custom';
  apiKey?: string;
  baseUrl?: string;
  credentials?: Record<string, string>;
}

export interface CRMContact {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  leadStatus?: string;
  customFields?: Record<string, any>;
}

export interface CRMDeal {
  id?: string;
  title: string;
  value?: number;
  stage?: string;
  contactId?: string;
  closeDate?: string;
  customFields?: Record<string, any>;
}

// Workflow Types
export interface OutreachWorkflow {
  id: string;
  leadId: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  currentStep: number;
  startedAt: string;
  completedAt?: string;
}

export type WorkflowStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export interface WorkflowStep {
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  result?: any;
  error?: string;
}

// API Response Types
export interface OutreachAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
