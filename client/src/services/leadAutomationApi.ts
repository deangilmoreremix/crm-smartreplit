/**
 * Client for the Lead Automation API (settings, scoring, campaigns). Campaign steps create CRM tasks;
 * nothing is sent to contacts automatically. Errors carry the server's message.
 */
export interface LeadAutomationSettings {
  scoringModel: 'ai-powered' | 'rule-based' | 'hybrid';
  qualificationThreshold: number;
  createFollowupTasks: boolean;
}

export interface CampaignStep {
  day: number;
  channel: 'email' | 'call' | 'sms' | 'task';
  title: string;
  message: string;
}

export interface CampaignAudience {
  statuses?: string[];
  sources?: string[];
  tags?: string[];
}

export interface CampaignSummary {
  id: string;
  name: string;
  description?: string | null;
  status: 'active' | 'paused' | 'completed';
  audience: CampaignAudience;
  steps: CampaignStep[];
  leads: number;
  converted: number;
  conversionRate: number | null;
  createdAt?: string;
}

export interface CampaignDetails {
  campaign: CampaignSummary;
  enrollments: Array<{
    id: string;
    contactId: number;
    firstName: string;
    lastName: string;
    nextStep: number;
    nextDueAt: string | null;
    status: 'active' | 'done';
  }>;
}

export interface ScoreResult {
  contactId: number;
  score: number;
  priority: 'hot' | 'warm' | 'cold';
  rationale: string;
  method: string;
  qualified: boolean;
}

export class NeedsApiKeyError extends Error {}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/lead-automation${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    const message = data.message || data.error || `Request failed (${response.status})`;
    if (data.needsApiKey) throw new NeedsApiKeyError(message);
    throw new Error(message);
  }
  return data as T;
}

export const getSettings = () => call<LeadAutomationSettings>('/settings');
export const saveSettings = (settings: Partial<LeadAutomationSettings>) =>
  call<LeadAutomationSettings>('/settings', { method: 'PUT', body: JSON.stringify(settings) });

export const scoreContact = (contactId: string | number) =>
  call<ScoreResult>(`/score/${encodeURIComponent(String(contactId))}`, { method: 'POST' });

export const listCampaigns = () => call<CampaignSummary[]>('/campaigns');
export const getCampaign = (id: string) => call<CampaignDetails>(`/campaigns/${encodeURIComponent(id)}`);
export const createCampaign = (input: { name: string; description?: string; audience: CampaignAudience; steps: CampaignStep[] }) =>
  call<{ campaign: CampaignSummary; enrolled: number; tasksCreated: number }>('/campaigns', {
    method: 'POST',
    body: JSON.stringify(input),
  });
export const setCampaignStatus = (id: string, status: 'active' | 'paused') =>
  call<CampaignSummary>(`/campaigns/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ status }) });
export const deleteCampaign = (id: string) =>
  call<{ success: boolean }>(`/campaigns/${encodeURIComponent(id)}`, { method: 'DELETE' });
export const processDueSteps = () => call<{ tasksCreated: number }>('/process', { method: 'POST' });

/** Does a contact belong to a campaign audience? Mirrors the server rule so the dialog can preview the count. */
export function contactMatchesAudience(
  contact: { status?: string; source?: string; tags?: string[] },
  audience: CampaignAudience
): boolean {
  const lower = (v: unknown) => String(v ?? '').toLowerCase();
  if (audience.statuses?.length && !audience.statuses.map(lower).includes(lower(contact.status))) return false;
  if (audience.sources?.length && !audience.sources.map(lower).includes(lower(contact.source))) return false;
  if (audience.tags?.length) {
    const tags = (contact.tags || []).map(lower);
    if (!audience.tags.some((t) => tags.includes(lower(t)))) return false;
  }
  return true;
}

export const STEP_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['steps'],
  properties: {
    steps: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['day', 'channel', 'title', 'message'],
        properties: {
          day: { type: 'integer', description: 'Days after the contact is enrolled (0 = immediately)' },
          channel: { type: 'string', enum: ['email', 'call', 'sms', 'task'] },
          title: { type: 'string', description: 'Short task title, e.g. "Intro email"' },
          message: { type: 'string', description: 'The ready-to-use text of the email/SMS or a call talking-points note' },
        },
      },
    },
  },
} as const;

/** Clean AI-generated steps into valid campaign steps. */
export function normalizeSteps(raw: unknown): CampaignStep[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s: any) => ({
      day: Math.max(0, Math.min(365, Math.round(Number(s?.day) || 0))),
      channel: (['email', 'call', 'sms', 'task'].includes(s?.channel) ? s.channel : 'task') as CampaignStep['channel'],
      title: String(s?.title || '').trim().slice(0, 160),
      message: String(s?.message || '').trim(),
    }))
    .filter((s) => s.title)
    .slice(0, 20)
    .sort((a, b) => a.day - b.day);
}
