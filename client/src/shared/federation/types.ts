// Shared Types for Module Federation

import { User, Session } from '@supabase/supabase-js';

export interface RemoteApp {
  id: string;
  name: string;
  domain: string;
  url: string;
  scope: string;
  modules: string[];
  capabilities: AppCapability[];
}

export type AppCapability = 
  | 'contacts' 
  | 'ai-scoring' 
  | 'import-export'
  | 'campaigns' 
  | 'automation' 
  | 'ai-content'
  | 'analytics' 
  | 'insights' 
  | 'forecasting'
  | 'pipeline' 
  | 'deals'
  | 'research' 
  | 'market-analysis'
  | 'calendar' 
  | 'scheduling' 
  | 'ai-suggestions'
  | 'cross-app' 
  | 'ai-insights';

export interface FeatureFlags {
  enableAI: boolean;
  enableScoring: boolean;
  enableForecasting: boolean;
  enableAutomation: boolean;
}

export interface SharedState {
  selectedContact?: SharedContact;
  activeDeal?: SharedDeal;
  currentTenant?: string;
  userPreferences?: UserPreferences;
  whitelabelConfig?: any;
  // Auth state shared from host to remote apps
  user?: User | null;
  session?: Session | null;
  isAuthenticated?: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
  whitelabelConfig?: any;
}

export interface RemoteContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  score?: number;
  lastActivity?: string;
}

export type SharedContact = RemoteContact;

export interface SharedDeal {
  id: string;
  title: string;
  value: number;
  stage: string;
  contactId?: string;
}

export interface FederationEvent {
  type: string;
  payload?: any;
  source?: string;
  timestamp: number;
}

export type { WhitelabelConfig } from '../../types/whitelabel';
