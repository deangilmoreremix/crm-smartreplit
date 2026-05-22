// Remote App Registry - Central configuration for all federated apps
import { RemoteApp, AppCapability } from './types';

// Complete registry of all module federation apps
export const REMOTE_APPS: Record<string, RemoteApp> = {
  contacts: {
    id: 'contacts',
    name: 'Enhanced Contacts Module',
    domain: 'contacts.smartcrm.vip',
    url: 'https://taupe-sprinkles-83c9ee.netlify.app',
    scope: 'enhanced_contacts',
    modules: ['./ContactsApp', './ContactDetail', './LeadScore'],
    capabilities: ['contacts', 'ai-scoring', 'import-export']
  },
  agency: {
    id: 'agency',
    name: 'AI Agency Suite',
    domain: 'agency.smartcrm.vip',
    url: 'https://tubular-choux-2a9b3c.netlify.app',
    scope: 'ai_agency',
    modules: ['./AgencyApp', './CampaignBuilder'],
    capabilities: ['campaigns', 'automation', 'ai-content']
  },
  analytics: {
    id: 'analytics',
    name: 'AI Analytics Dashboard',
    domain: 'analytics.smartcrm.vip',
    url: 'https://subtle-florentine-8fd315.netlify.app',
    scope: 'ai_analytics',
    modules: ['./AnalyticsApp', './InsightsPanel'],
    capabilities: ['analytics', 'insights', 'forecasting']
  },
  pipeline: {
    id: 'pipeline',
    name: 'Enhanced Pipeline Deals',
    domain: 'pipeline.smartcrm.vip',
    url: 'https://cheery-syrniki-b5b6ca.netlify.app',
    scope: 'pipeline_deals',
    modules: ['./PipelineApp', './DealTracker'],
    capabilities: ['pipeline', 'deals', 'forecasting']
  },
  research: {
    id: 'research',
    name: 'Product Research Module',
    domain: 'research.smartcrm.vip',
    url: 'https://clever-syrniki-4df87f.netlify.app',
    scope: 'product_research',
    modules: ['./ResearchApp', './ProductInsights'],
    capabilities: ['research', 'market-analysis']
  },
  calendar: {
    id: 'calendar',
    name: 'Advanced AI Calendar',
    domain: 'calendar.smartcrm.vip',
    url: 'https://voluble-vacherin-add80d.netlify.app',
    scope: 'ai_calendar',
    modules: ['./CalendarApp', './ScheduleOptimizer'],
    capabilities: ['calendar', 'scheduling', 'ai-suggestions']
  },
  'ai-analytics': {
    id: 'ai-analytics',
    name: 'AI-Powered Analytics Dashboard',
    domain: 'ai-analytics.smartcrm.vip',
    url: 'https://dulcet-salmiakki-445c47.netlify.app',
    scope: 'multi_analytics',
    modules: ['./MultiAnalyticsApp', './CrossAppInsights'],
    capabilities: ['analytics', 'cross-app', 'ai-insights']
  }
};

class RemoteRegistry {
  private apps: Record<string, RemoteApp>;

  constructor() {
    this.apps = REMOTE_APPS;
  }

  /**
   * Get app by ID
   */
  getApp(id: string): RemoteApp | undefined {
    return this.apps[id];
  }

  /**
   * Get all registered apps
   */
  getAllApps(): RemoteApp[] {
    return Object.values(this.apps);
  }

  /**
   * Get apps by capability
   */
  getAppsByCapability(capability: AppCapability): RemoteApp[] {
    return Object.values(this.apps).filter(app => 
      app.capabilities.includes(capability)
    );
  }

  /**
   * Check if app exists
   */
  hasApp(id: string): boolean {
    return id in this.apps;
  }

  /**
   * Check if app has a specific capability
   */
  hasCapability(id: string, capability: AppCapability): boolean {
    const app = this.apps[id];
    return app ? app.capabilities.includes(capability) : false;
  }

  /**
   * Get remote entry URL for an app
   */
  getRemoteEntryUrl(id: string): string {
    const app = this.apps[id];
    if (!app) {
      throw new Error(`App not found: ${id}`);
    }
    return `${app.url}/remoteEntry.js`;
  }

  /**
   * Get module scope for an app
   */
  getScope(id: string): string {
    const app = this.apps[id];
    if (!app) {
      throw new Error(`App not found: ${id}`);
    }
    return app.scope;
  }
}

export const remoteRegistry = new RemoteRegistry();