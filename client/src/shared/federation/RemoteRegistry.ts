// Remote App Registry - Central configuration for all federated apps
import { RemoteApp, AppCapability } from './types';

// Complete registry of all module federation apps
// NOTE: scope values MUST match the federation plugin `name` property in each remote's vite.config.js
export const REMOTE_APPS: Record<string, RemoteApp> = {
  contacts: {
    id: 'contacts',
    name: 'Enhanced Contacts Module',
    domain: 'contacts.smartcrm.vip',
    url: 'https://taupe-sprinkles-83c9ee.netlify.app',
    scope: 'ContactsApp',
    modules: ['./ContactsApp', './ContactsModule'],
    capabilities: ['contacts', 'ai-scoring', 'import-export']
  },
  agency: {
    id: 'agency',
    name: 'AI Agency Suite',
    domain: 'agency.smartcrm.vip',
    url: 'https://tubular-choux-2a9b3c.netlify.app',
    scope: 'AIGoalsApp',
    modules: ['./AIGoalsApp', './GoalsModule'],
    capabilities: ['campaigns', 'automation', 'ai-content']
  },
  analytics: {
    id: 'analytics',
    name: 'AI Analytics Dashboard',
    domain: 'analytics.smartcrm.vip',
    url: 'https://subtle-florentine-8fd315.netlify.app',
    scope: 'AnalyticsApp',
    modules: ['./AnalyticsApp', './InsightsModule'],
    capabilities: ['analytics', 'insights', 'forecasting']
  },
  pipeline: {
    id: 'pipeline',
    name: 'Enhanced Pipeline Deals',
    domain: 'pipeline.smartcrm.vip',
    url: 'https://cheery-syrniki-b5b6ca.netlify.app',
    scope: 'PipelineApp',
    modules: ['./PipelineApp', './DealsModule'],
    capabilities: ['pipeline', 'deals', 'forecasting']
  },
  research: {
    id: 'research',
    name: 'Product Research Module',
    domain: 'research.smartcrm.vip',
    url: 'https://clever-syrniki-4df87f.netlify.app',
    scope: 'ResearchApp',
    modules: ['./ResearchApp', './ResearchModule'],
    capabilities: ['research', 'market-analysis']
  },
  calendar: {
    id: 'calendar',
    name: 'Advanced AI Calendar',
    domain: 'calendar.smartcrm.vip',
    url: 'https://voluble-vacherin-add80d.netlify.app',
    scope: 'CalendarApp',
    modules: ['./CalendarApp', './CalendarModule'],
    capabilities: ['calendar', 'scheduling', 'ai-suggestions']
  },
  'ai-analytics': {
    id: 'ai-analytics',
    name: 'AI-Powered Analytics Dashboard',
    domain: 'ai-analytics.smartcrm.vip',
    url: 'https://dulcet-salmiakki-445c47.netlify.app',
    scope: 'AnalyticsApp',
    modules: ['./AnalyticsApp', './InsightsModule'],
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
   * Vite Module Federation outputs to /assets/remoteEntry.js by default
   */
  getRemoteEntryUrl(id: string): string {
    const app = this.apps[id];
    if (!app) {
      throw new Error(`App not found: ${id}`);
    }
    return `${app.url}/assets/remoteEntry.js`;
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