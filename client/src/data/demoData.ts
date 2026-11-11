/**
 * Sample ("demo") content shown ALONGSIDE real data while the user has demo data enabled
 * (see DemoDataContext). Everything here is clearly labelled as sample in the UI and is never
 * sent to the server. Pure data + helpers only.
 */
import type { Deal, DealStage } from '../types/deal';

/** Default pipeline stages (shared by dealStore; lives here so demo deals can reference them). */
export const DEFAULT_DEAL_STAGES: DealStage[] = [
  { id: 'qualification', name: 'Qualification', order: 1, color: '#3B82F6', probability: 20, isActive: true },
  { id: 'proposal', name: 'Proposal', order: 2, color: '#F59E0B', probability: 40, isActive: true },
  { id: 'negotiation', name: 'Negotiation', order: 3, color: '#8B5CF6', probability: 70, isActive: true },
  { id: 'closed-won', name: 'Closed Won', order: 4, color: '#10B981', probability: 100, isActive: true },
  { id: 'closed-lost', name: 'Closed Lost', order: 5, color: '#EF4444', probability: 0, isActive: true },
];

export const DEMO_ID_PREFIX = 'demo-';

/** True for ids of sample records (never sent to the server). */
export const isDemoId = (id: unknown): boolean => typeof id === 'string' && id.startsWith(DEMO_ID_PREFIX);

const [QUALIFICATION, PROPOSAL, NEGOTIATION, CLOSED_WON] = DEFAULT_DEAL_STAGES;

export const DEMO_DEALS: Deal[] = [
  {
    id: 'demo-1',
    isDemo: true,
    title: 'Enterprise Software License',
    description: 'Annual license for enterprise software suite',
    value: 75000,
    stage: NEGOTIATION,
    probability: 85,
    contactId: '1',
    dueDate: new Date('2024-02-15'),
    priority: 'high',
    daysInStage: 5,
    source: 'referral',
    tags: ['enterprise', 'software'],
    customFields: {},
    activities: [],
    attachments: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    currency: 'USD',
    expectedCloseDate: new Date('2024-02-15'),
  },
  {
    id: 'demo-2',
    isDemo: true,
    title: 'Marketing Automation Platform',
    description: 'Complete marketing automation solution',
    value: 45000,
    stage: PROPOSAL,
    probability: 65,
    contactId: '2',
    dueDate: new Date('2024-03-01'),
    priority: 'medium',
    daysInStage: 12,
    source: 'website',
    tags: ['marketing', 'automation'],
    customFields: {},
    activities: [],
    attachments: [],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-20'),
    currency: 'USD',
    expectedCloseDate: new Date('2024-03-01'),
  },
  {
    id: 'demo-3',
    isDemo: true,
    title: 'CRM Integration Services',
    description: 'Custom CRM integration and setup',
    value: 25000,
    stage: QUALIFICATION,
    probability: 30,
    contactId: '3',
    priority: 'low',
    daysInStage: 8,
    source: 'cold-call',
    tags: ['crm', 'integration'],
    customFields: {},
    activities: [],
    attachments: [],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-25'),
    currency: 'USD',
    expectedCloseDate: new Date('2024-04-01'),
  },
  {
    id: 'demo-4',
    isDemo: true,
    title: 'Cloud Infrastructure Setup',
    description: 'Complete cloud migration and setup',
    value: 120000,
    stage: CLOSED_WON,
    probability: 100,
    contactId: '4',
    priority: 'high',
    daysInStage: 0,
    source: 'referral',
    tags: ['cloud', 'infrastructure'],
    customFields: {},
    activities: [],
    attachments: [],
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2024-01-10'),
    closedAt: new Date('2024-01-10'),
    actualCloseDate: new Date('2024-01-10'),
    currency: 'USD',
  },
];

// --- Chart sample series (same shapes as the real aggregates in chartData.ts) ---

/**
 * Sample revenue / closed-deal counts per time bucket, oldest first. They carry no labels: the
 * charts lay the trailing values onto the real bucket labels (see alignPerformance in chartData).
 * 7 values cover the largest bucket count (the daily week view).
 */
export const DEMO_PERFORMANCE: Array<{ revenue: number; deals: number }> = [
  { revenue: 12000, deals: 8 },
  { revenue: 15000, deals: 10 },
  { revenue: 18000, deals: 12 },
  { revenue: 16000, deals: 9 },
  { revenue: 21000, deals: 15 },
  { revenue: 19000, deals: 14 },
  { revenue: 23000, deals: 16 },
];

/** Deals per stage (names match chartData's stage labels so real counts sum into them). */
export const DEMO_PIPELINE: Array<{ name: string; value: number }> = [
  { name: 'Lead', value: 120 },
  { name: 'Qualified', value: 85 },
  { name: 'Proposal', value: 60 },
  { name: 'Negotiation', value: 40 },
  { name: 'Closed Won', value: 30 },
];

/** Sample pipeline value in dollars per stage (names match chartData's stage labels so real values sum into them). */
export const DEMO_BREAKDOWN: Array<{ name: string; value: number }> = [
  { name: 'Qualified', value: 25000 },
  { name: 'Proposal', value: 45000 },
  { name: 'Negotiation', value: 75000 },
  { name: 'Closed Won', value: 120000 },
];

/** Funnel conversion sample (rate in %, delta = change vs previous period in points). */
export const DEMO_CONVERSIONS: Array<{ label: string; rate: number; delta: number }> = [
  { label: 'Lead to Opportunity', rate: 32, delta: 4.5 },
  { label: 'Opportunity to Proposal', rate: 68, delta: 2.1 },
  { label: 'Proposal to Win', rate: 45, delta: -1.2 },
];
