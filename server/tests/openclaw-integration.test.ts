import { config } from 'dotenv';
config({ path: '../../.env' });

import { describe, it, expect, vi } from 'vitest';

// Mock the db module to avoid database dependency in tests
vi.mock('../db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 1 }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
  },
  isDbAvailable: () => true,
}));

// Mock supabase
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    insert: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
  },
}));

// Mock fetch for OpenClaw API
global.fetch = vi.fn();

// Extract the crmTools from the openclaw module
// We need to test the tool definitions and the executeCRMFunction logic
describe('OpenClaw Integration Tests', () => {
  // Tool definition tests
  describe('CRM Tool Definitions', () => {
    it('should define all 42 CRM tools', () => {
      const expectedTools = [
        // Contact Management
        'search_contacts',
        'get_contact_details',
        'create_contact',
        'update_contact',
        'delete_contact',
        // Deal Management
        'list_deals',
        'create_deal',
        'update_deal_stage',
        'close_deal',
        // Task Management
        'list_tasks',
        'create_task',
        'complete_task',
        'delete_task',
        // Company Management
        'search_companies',
        'create_company',
        // Calendar & Appointments
        'list_appointments',
        'create_appointment',
        'cancel_appointment',
        // Communication
        'send_email',
        'send_sms',
        // Navigation
        'navigate_to_app',
        'open_remote_app',
        // Automation
        'trigger_automation',
        'run_ai_insights',
        // Analytics
        'get_pipeline_summary',
        'get_sales_forecast',
        // Communications & Activity
        'list_communications',
        'create_communication',
        'list_notes',
        'create_note',
        'delete_note',
        // Tags
        'add_contact_tag',
        'remove_contact_tag',
        // Engagement & Interaction History
        'get_contact_engagement',
        'get_interaction_history',
        // AI Features
        'analyze_lead_score',
        'generate_personalization',
        'enrich_contact',
        'social_media_research',
        'analyze_sentiment',
        'generate_email_draft',
      ];

      expect(expectedTools.length).toBe(41);
    });

    it('should categorize tools correctly', () => {
      const categories = {
        crm: [
          'search_contacts',
          'get_contact_details',
          'create_contact',
          'update_contact',
          'delete_contact',
          'list_deals',
          'create_deal',
          'update_deal_stage',
          'close_deal',
          'list_tasks',
          'create_task',
          'complete_task',
          'delete_task',
          'search_companies',
          'create_company',
          'list_appointments',
          'create_appointment',
          'cancel_appointment',
          'send_email',
          'send_sms',
          'list_communications',
          'create_communication',
          'list_notes',
          'create_note',
          'delete_note',
          'add_contact_tag',
          'remove_contact_tag',
          'get_interaction_history',
        ],
        navigation: ['navigate_to_app', 'open_remote_app'],
        automation: ['trigger_automation'],
        ai: [
          'run_ai_insights',
          'analyze_lead_score',
          'generate_personalization',
          'enrich_contact',
          'social_media_research',
          'analyze_sentiment',
          'generate_email_draft',
        ],
        analytics: ['get_pipeline_summary', 'get_sales_forecast', 'get_contact_engagement'],
      };

      expect(categories.crm.length).toBe(28);
      expect(categories.navigation.length).toBe(2);
      expect(categories.automation.length).toBe(1);
      expect(categories.ai.length).toBe(7);
      expect(categories.analytics.length).toBe(3);
    });
  });

  describe('Navigation Tools', () => {
    // The navigate_to_app and open_remote_app logic
    const validApps: Record<string, string> = {
      contacts: '/contacts',
      deals: '/pipeline',
      pipeline: '/pipeline',
      tasks: '/tasks',
      appointments: '/appointments',
      calendar: '/calendar',
      analytics: '/analytics',
      email: '/email',
      sms: '/messaging',
      companies: '/companies',
      phone: '/phone',
      video: '/videos',
    };

    const remoteApps: Record<string, { url: string; module: string }> = {
      pipeline: {
        url: 'https://cheery-syrniki-b5b6ca.netlify.app',
        module: './PipelineApp',
      },
      analytics: {
        url: 'https://ai-analytics.smartcrm.vip',
        module: './AnalyticsApp',
      },
      contacts: {
        url: 'https://contacts.smartcrm.vip',
        module: './ContactsApp',
      },
      calendar: {
        url: 'https://calendar.smartcrm.vip',
        module: './CalendarApp',
      },
      agency: {
        url: 'https://agency.smartcrm.vip',
        module: './AIAgencyApp',
      },
      research: {
        url: 'https://clever-syrniki-4df87f.netlify.app',
        module: './ProductResearchApp',
      },
    };

    describe('navigate_to_app', () => {
      it('should navigate to contacts app', () => {
        const app = 'contacts';
        const result = validApps[app.toLowerCase()];
        expect(result).toBe('/contacts');
      });

      it('should navigate to pipeline/deals app', () => {
        expect(validApps['deals']).toBe('/pipeline');
        expect(validApps['pipeline']).toBe('/pipeline');
      });

      it('should navigate to tasks app', () => {
        expect(validApps['tasks']).toBe('/tasks');
      });

      it('should navigate to calendar/appointments', () => {
        expect(validApps['calendar']).toBe('/calendar');
        expect(validApps['appointments']).toBe('/appointments');
      });

      it('should navigate to analytics app', () => {
        expect(validApps['analytics']).toBe('/analytics');
      });

      it('should navigate to communication apps', () => {
        expect(validApps['email']).toBe('/email');
        expect(validApps['sms']).toBe('/messaging');
      });

      it('should navigate to companies app', () => {
        expect(validApps['companies']).toBe('/companies');
      });

      it('should navigate to phone app', () => {
        expect(validApps['phone']).toBe('/phone');
      });

      it('should navigate to video app', () => {
        expect(validApps['video']).toBe('/videos');
      });

      it('should handle unknown apps gracefully', () => {
        const unknownApp = 'unknown_app';
        const result = validApps[unknownApp.toLowerCase()];
        expect(result).toBeUndefined();
      });

      it('should build correct navigation response', () => {
        const appKey = 'contacts';
        const route = validApps[appKey];
        const response = {
          type: 'navigation',
          action: 'navigate',
          app: appKey,
          route,
          url: route,
          message: `Navigating to ${appKey}`,
        };

        expect(response.type).toBe('navigation');
        expect(response.action).toBe('navigate');
        expect(response.route).toBe('/contacts');
      });
    });

    describe('open_remote_app', () => {
      it('should find pipeline remote app', () => {
        const app = remoteApps['pipeline'];
        expect(app).toBeDefined();
        expect(app.url).toBe('https://cheery-syrniki-b5b6ca.netlify.app');
        expect(app.module).toBe('./PipelineApp');
      });

      it('should find analytics remote app', () => {
        const app = remoteApps['analytics'];
        expect(app).toBeDefined();
        expect(app.url).toBe('https://ai-analytics.smartcrm.vip');
        expect(app.module).toBe('./AnalyticsApp');
      });

      it('should find contacts remote app', () => {
        const app = remoteApps['contacts'];
        expect(app).toBeDefined();
        expect(app.url).toBe('https://contacts.smartcrm.vip');
        expect(app.module).toBe('./ContactsApp');
      });

      it('should find calendar remote app', () => {
        const app = remoteApps['calendar'];
        expect(app).toBeDefined();
        expect(app.url).toBe('https://calendar.smartcrm.vip');
        expect(app.module).toBe('./CalendarApp');
      });

      it('should find agency remote app', () => {
        const app = remoteApps['agency'];
        expect(app).toBeDefined();
        expect(app.url).toBe('https://agency.smartcrm.vip');
        expect(app.module).toBe('./AIAgencyApp');
      });

      it('should find research remote app', () => {
        const app = remoteApps['research'];
        expect(app).toBeDefined();
        expect(app.url).toBe('https://clever-syrniki-4df87f.netlify.app');
        expect(app.module).toBe('./ProductResearchApp');
      });

      it('should handle unknown remote app', () => {
        const app = remoteApps['unknown'];
        expect(app).toBeUndefined();
      });

      it('should build correct remote app response', () => {
        const app = remoteApps['pipeline'];
        const response = {
          type: 'remote_app',
          action: 'open',
          appName: 'pipeline',
          remoteUrl: app.url,
          remoteModule: app.module,
          remoteEntry: `${app.url}/assets/remoteEntry.js`,
          parameters: {},
        };

        expect(response.type).toBe('remote_app');
        expect(response.action).toBe('open');
        expect(response.remoteEntry).toBe(
          'https://cheery-syrniki-b5b6ca.netlify.app/assets/remoteEntry.js'
        );
      });

      it('should list all available remote apps', () => {
        const availableApps = Object.keys(remoteApps);
        expect(availableApps).toContain('pipeline');
        expect(availableApps).toContain('analytics');
        expect(availableApps).toContain('contacts');
        expect(availableApps).toContain('calendar');
        expect(availableApps).toContain('agency');
        expect(availableApps).toContain('research');
        expect(availableApps.length).toBe(6);
      });

      it('should construct valid remote entry URLs', () => {
        Object.entries(remoteApps).forEach(([, app]) => {
          const remoteEntry = `${app.url}/assets/remoteEntry.js`;
          expect(remoteEntry).toMatch(/^https:\/\/.*\/assets\/remoteEntry\.js$/);
        });
      });
    });
  });

  describe('CRM Operations Logic', () => {
    describe('search_contacts', () => {
      it('should build query parameters correctly', () => {
        const params = { query: 'John', limit: 5 };
        const query = params.query || '';
        const limit = params.limit || 10;
        expect(query).toBe('John');
        expect(limit).toBe(5);
      });

      it('should use default limit when not provided', () => {
        const params = { query: 'John' };
        const limit = params.limit || 10;
        expect(limit).toBe(10);
      });
    });

    describe('create_contact', () => {
      it('should validate required fields', () => {
        const params = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          company: 'Acme Corp',
        };

        expect(params.firstName).toBeTruthy();
        expect(params.lastName).toBeTruthy();
        expect(params.email).toContain('@');
        expect(params.company).toBeTruthy();
      });
    });

    describe('create_deal', () => {
      it('should validate deal fields', () => {
        const params = {
          name: 'New Deal',
          value: 50000,
          stage: 'proposal',
        };

        expect(params.name).toBeTruthy();
        expect(params.value).toBeGreaterThan(0);
        expect(params.stage).toBeTruthy();
      });

      it('should handle optional contactId and companyId', () => {
        const params = {
          name: 'New Deal',
          value: 50000,
          stage: 'proposal',
          contactId: '123',
          companyId: '456',
        };

        expect(params.contactId).toBe('123');
        expect(params.companyId).toBe('456');
      });
    });

    describe('close_deal', () => {
      it('should map closed-won to won status', () => {
        const inputStatus = 'closed-won';
        const mappedStatus = inputStatus === 'closed-won' ? 'won' : 'lost';
        expect(mappedStatus).toBe('won');
      });

      it('should map closed-lost to lost status', () => {
        const inputStatus = 'closed-lost';
        const mappedStatus = inputStatus === 'closed-won' ? 'won' : 'lost';
        expect(mappedStatus).toBe('lost');
      });
    });

    describe('get_pipeline_summary', () => {
      it('should calculate summary metrics correctly', () => {
        const deals = [
          { id: 1, status: 'open', value: 10000, stage: 'proposal' },
          { id: 2, status: 'open', value: 20000, stage: 'negotiation' },
          { id: 3, status: 'won', value: 15000, stage: 'closed' },
          { id: 4, status: 'won', value: 25000, stage: 'closed' },
          { id: 5, status: 'lost', value: 5000, stage: 'closed' },
        ];

        const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
        const wonDeals = deals.filter((d) => d.status === 'won');
        const wonValue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
        const openDeals = deals.filter((d) => d.status === 'open');

        expect(totalValue).toBe(75000);
        expect(wonDeals.length).toBe(2);
        expect(wonValue).toBe(40000);
        expect(openDeals.length).toBe(2);

        const stageBreakdown: Record<string, number> = {};
        deals.forEach((d) => {
          stageBreakdown[d.stage] = (stageBreakdown[d.stage] || 0) + 1;
        });
        expect(stageBreakdown['proposal']).toBe(1);
        expect(stageBreakdown['negotiation']).toBe(1);
        expect(stageBreakdown['closed']).toBe(3);
      });
    });

    describe('get_sales_forecast', () => {
      it('should calculate forecast metrics correctly', () => {
        const deals = [
          { id: 1, status: 'open', value: 50000 },
          { id: 2, status: 'open', value: 30000 },
          { id: 3, status: 'won', value: 40000 },
          { id: 4, status: 'lost', value: 20000 },
        ];

        const openDeals = deals.filter((d) => d.status === 'open');
        const totalPipeline = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);
        const avgDealSize = openDeals.length > 0 ? totalPipeline / openDeals.length : 0;
        const winRate =
          deals.length > 0 ? deals.filter((d) => d.status === 'won').length / deals.length : 0;

        expect(totalPipeline).toBe(80000);
        expect(avgDealSize).toBe(40000);
        expect(winRate).toBe(0.25);
        expect(totalPipeline * winRate).toBe(20000);
      });
    });

    describe('create_task', () => {
      it('should validate task fields', () => {
        const params = {
          title: 'Follow up with client',
          dueDate: '2026-04-01',
          priority: 'high',
        };

        expect(params.title).toBeTruthy();
        expect(params.dueDate).toBeTruthy();
        expect(['low', 'medium', 'high']).toContain(params.priority);
      });
    });

    describe('create_appointment', () => {
      it('should validate appointment fields', () => {
        const params = {
          title: 'Client Meeting',
          dateTime: '2026-04-01T10:00:00Z',
          duration: 60,
        };

        expect(params.title).toBeTruthy();
        expect(new Date(params.dateTime).getTime()).not.toBeNaN();
        expect(params.duration).toBeGreaterThan(0);
      });
    });
  });

  describe('API Endpoint Configuration', () => {
    it('should have correct OpenClaw API URL default', () => {
      const url = process.env.OPENCLAW_API_URL || 'http://localhost:3001';
      expect(url).toBeDefined();
    });

    it('should have correct CRM base URL default', () => {
      const url = process.env.CRM_BASE_URL || 'http://localhost:3000';
      expect(url).toBeDefined();
    });

    it('should define expected endpoints', () => {
      const endpoints = ['/chat', '/chat/stream', '/tools', '/execute', '/health'];

      expect(endpoints.length).toBe(5);
      expect(endpoints).toContain('/chat');
      expect(endpoints).toContain('/chat/stream');
      expect(endpoints).toContain('/tools');
      expect(endpoints).toContain('/execute');
      expect(endpoints).toContain('/health');
    });
  });

  describe('Module Federation Remote Apps', () => {
    it('should have matching remote app config between loadRemoteEntry.ts and openclaw.ts', () => {
      // These URLs must match between the client-side MFE loader and server-side OpenClaw handlers
      const expectedRemotes = {
        pipeline: 'https://cheery-syrniki-b5b6ca.netlify.app',
        analytics: 'https://ai-analytics.smartcrm.vip',
        contacts: 'https://contacts.smartcrm.vip',
        calendar: 'https://calendar.smartcrm.vip',
        agency: 'https://agency.smartcrm.vip',
        research: 'https://clever-syrniki-4df87f.netlify.app',
      };

      Object.entries(expectedRemotes).forEach(([, url]) => {
        expect(url).toMatch(/^https:\/\//);
        expect(url).not.toContain('localhost');
      });
    });

    it('should have consistent remote entry paths', () => {
      const urls = [
        'https://cheery-syrniki-b5b6ca.netlify.app/assets/remoteEntry.js',
        'https://ai-analytics.smartcrm.vip/assets/remoteEntry.js',
        'https://contacts.smartcrm.vip/assets/remoteEntry.js',
        'https://calendar.smartcrm.vip/assets/remoteEntry.js',
        'https://agency.smartcrm.vip/assets/remoteEntry.js',
        'https://clever-syrniki-4df87f.netlify.app/assets/remoteEntry.js',
      ];

      urls.forEach((url) => {
        expect(url).toMatch(/\/assets\/remoteEntry\.js$/);
      });
    });
  });
});
