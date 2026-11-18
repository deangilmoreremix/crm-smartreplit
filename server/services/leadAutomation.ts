import { and, desc, eq, inArray, lte, sql } from 'drizzle-orm';
import { db } from '../db';
import {
  campaignEnrollments,
  campaigns,
  contactActivities,
  contacts,
  deals,
  leadAutomationSettings,
  tasks,
  type CampaignAudience,
  type CampaignStep,
} from '../../shared/schema';

// Lead automation: scoring, campaigns and their follow-up tasks. Campaign steps create tasks in the CRM;
// nothing is sent to contacts automatically.

const DAY_MS = 86_400_000;

export const CONVERTED_STATUSES = ['converted', 'customer'];
const NO_QUALIFY_STATUSES = ['qualified', 'converted', 'customer', 'lost', 'churned', 'inactive'];

export interface LeadAutomationSettings {
  scoringModel: 'ai-powered' | 'rule-based' | 'hybrid';
  qualificationThreshold: number;
  createFollowupTasks: boolean;
}

export const DEFAULT_SETTINGS: LeadAutomationSettings = {
  scoringModel: 'ai-powered',
  qualificationThreshold: 70,
  createFollowupTasks: true,
};

const SCORING_MODELS = ['ai-powered', 'rule-based', 'hybrid'];

/** Validate a settings update; returns the cleaned fields or an error message. */
export function parseSettings(body: any): { value: LeadAutomationSettings } | { error: string } {
  const value = { ...DEFAULT_SETTINGS };
  if (body?.scoringModel !== undefined) {
    if (!SCORING_MODELS.includes(body.scoringModel)) return { error: 'Invalid scoringModel' };
    value.scoringModel = body.scoringModel;
  }
  if (body?.qualificationThreshold !== undefined) {
    const n = Number(body.qualificationThreshold);
    if (!Number.isInteger(n) || n < 0 || n > 100) return { error: 'qualificationThreshold must be 0-100' };
    value.qualificationThreshold = n;
  }
  if (body?.createFollowupTasks !== undefined) {
    if (typeof body.createFollowupTasks !== 'boolean') return { error: 'createFollowupTasks must be a boolean' };
    value.createFollowupTasks = body.createFollowupTasks;
  }
  return { value };
}

export async function getSettings(profileId: string): Promise<LeadAutomationSettings> {
  const [row] = await db!.select().from(leadAutomationSettings).where(eq(leadAutomationSettings.profileId, profileId));
  if (!row) return { ...DEFAULT_SETTINGS };
  return {
    scoringModel: row.scoringModel as LeadAutomationSettings['scoringModel'],
    qualificationThreshold: row.qualificationThreshold,
    createFollowupTasks: row.createFollowupTasks,
  };
}

export async function saveSettings(profileId: string, settings: LeadAutomationSettings): Promise<LeadAutomationSettings> {
  await db!
    .insert(leadAutomationSettings)
    .values({ profileId, ...settings })
    .onConflictDoUpdate({
      target: leadAutomationSettings.profileId,
      set: { ...settings, updatedAt: new Date() },
    });
  return settings;
}

// ---- Scoring ----

export interface ScoreResult {
  score: number; // 0-100
  priority: 'hot' | 'warm' | 'cold';
  rationale: string;
}

export const priorityFor = (score: number): ScoreResult['priority'] => (score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold');

/** Rule-based score from how complete the contact record is, how recent it is and its deals. */
export function ruleBasedScore(contact: any, dealCount: number, now: Date = new Date()): ScoreResult {
  const reasons: string[] = [];
  let score = 0;
  const add = (points: number, ok: boolean, label: string) => {
    if (ok) {
      score += points;
      reasons.push(`+${points} ${label}`);
    }
  };
  add(20, Boolean(contact.email), 'has an email');
  add(10, Boolean(contact.phone), 'has a phone number');
  add(15, Boolean(contact.company), 'has a company');
  add(5, Boolean(contact.industry), 'industry known');
  add(10, Array.isArray(contact.tags) && contact.tags.length > 0, 'is tagged');
  const updated = contact.updatedAt ? new Date(contact.updatedAt).getTime() : 0;
  const ageDays = updated ? (now.getTime() - updated) / DAY_MS : Infinity;
  add(20, ageDays <= 14, 'active in the last 14 days');
  add(10, ageDays > 14 && ageDays <= 60, 'active in the last 60 days');
  add(Math.min(20, dealCount * 10), dealCount > 0, `${dealCount} deal(s) in the CRM`);
  score = Math.min(100, score);
  return {
    score,
    priority: priorityFor(score),
    rationale: reasons.length ? `Rule-based score: ${reasons.join(', ')}.` : 'Rule-based score: no scoring signals on this contact.',
  };
}

export function blendScores(rule: ScoreResult, ai: ScoreResult): ScoreResult {
  const score = Math.round((rule.score + ai.score) / 2);
  return { score, priority: priorityFor(score), rationale: `Average of rule-based (${rule.score}) and AI (${ai.score}) scores. ${ai.rationale}` };
}

export const canAutoQualify = (status: string | null | undefined) => !NO_QUALIFY_STATUSES.includes(String(status || '').toLowerCase());

export async function persistScore(profileId: string, contact: any, result: ScoreResult, method: string, threshold: number) {
  const qualified = result.score >= threshold && canAutoQualify(contact.status);
  await db!
    .update(contacts)
    .set({
      score: (result.score / 100).toFixed(2),
      ...(qualified ? { status: 'qualified' } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(contacts.id, contact.id), eq(contacts.profileId, profileId)));
  await db!.insert(contactActivities).values({
    contactId: contact.id,
    activityType: 'scoring',
    description: `Lead scored ${result.score}/100 (${method})${qualified ? ' and marked qualified' : ''}`,
    metadata: { ...result, method },
  });
  return { ...result, method, qualified };
}

export async function countDeals(profileId: string, contactId: number): Promise<number> {
  const [row] = await db!
    .select({ n: sql<number>`count(*)::int` })
    .from(deals)
    .where(and(eq(deals.contactId, contactId), eq(deals.profileId, profileId)));
  return row?.n ?? 0;
}

// ---- Campaigns ----

const CHANNELS = ['email', 'call', 'sms', 'task'];

export interface CampaignInput {
  name: string;
  description?: string;
  audience: CampaignAudience;
  steps: CampaignStep[];
}

/** Validate a new campaign; returns the cleaned input or an error message. */
export function parseCampaign(body: any): { value: CampaignInput } | { error: string } {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 120) return { error: 'name is required (max 120 characters)' };
  const stepsIn = body?.steps;
  if (!Array.isArray(stepsIn) || stepsIn.length === 0 || stepsIn.length > 20) {
    return { error: 'steps must be a list of 1 to 20 steps' };
  }
  const steps: CampaignStep[] = [];
  for (const s of stepsIn) {
    const day = Number(s?.day);
    const title = typeof s?.title === 'string' ? s.title.trim() : '';
    const message = typeof s?.message === 'string' ? s.message.trim() : '';
    if (!Number.isInteger(day) || day < 0 || day > 365) return { error: 'each step needs a day between 0 and 365' };
    if (!title || title.length > 160) return { error: 'each step needs a title (max 160 characters)' };
    if (!CHANNELS.includes(s?.channel)) return { error: `step channel must be one of ${CHANNELS.join(', ')}` };
    steps.push({ day, channel: s.channel, title, message: message.slice(0, 4000) });
  }
  steps.sort((a, b) => a.day - b.day);
  const list = (v: any) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x).slice(0, 50) : undefined);
  const audience: CampaignAudience = {
    statuses: list(body?.audience?.statuses),
    sources: list(body?.audience?.sources),
    tags: list(body?.audience?.tags),
  };
  return {
    value: { name, description: typeof body?.description === 'string' ? body.description.slice(0, 1000) : undefined, audience, steps },
  };
}

/** Does a contact belong to a campaign audience? Empty filters match everyone. */
export function contactMatchesAudience(contact: any, audience: CampaignAudience): boolean {
  const lower = (v: any) => String(v ?? '').toLowerCase();
  if (audience.statuses?.length && !audience.statuses.map(lower).includes(lower(contact.status))) return false;
  if (audience.sources?.length && !audience.sources.map(lower).includes(lower(contact.source))) return false;
  if (audience.tags?.length) {
    const tags = (Array.isArray(contact.tags) ? contact.tags : []).map(lower);
    if (!audience.tags.some((t) => tags.includes(lower(t)))) return false;
  }
  return true;
}

/** When step `index` is due for an enrollment: enrolment time plus the step's day offset. */
export const stepDueAt = (enrolledAt: Date, steps: CampaignStep[], index: number): Date | null =>
  index < steps.length ? new Date(enrolledAt.getTime() + steps[index].day * DAY_MS) : null;

export async function createCampaign(profileId: string, input: CampaignInput) {
  const [campaign] = await db!
    .insert(campaigns)
    .values({ profileId, name: input.name, description: input.description, audience: input.audience, steps: input.steps, status: 'active' })
    .returning();

  const owned = await db!.select().from(contacts).where(eq(contacts.profileId, profileId));
  const matching = owned.filter((c) => contactMatchesAudience(c, input.audience));
  const now = new Date();
  if (matching.length) {
    await db!
      .insert(campaignEnrollments)
      .values(
        matching.map((c) => ({
          campaignId: campaign.id,
          contactId: c.id,
          nextStep: 0,
          nextDueAt: stepDueAt(now, input.steps, 0),
          enrolledAt: now,
        }))
      )
      .onConflictDoNothing();
  }
  const tasksCreated = await processDueSteps(profileId, campaign.id);
  return { campaign, enrolled: matching.length, tasksCreated };
}

export async function listCampaigns(profileId: string) {
  const rows = await db!.select().from(campaigns).where(eq(campaigns.profileId, profileId)).orderBy(desc(campaigns.createdAt));
  if (!rows.length) return [];
  const stats = await db!
    .select({
      campaignId: campaignEnrollments.campaignId,
      leads: sql<number>`count(*)::int`,
      converted: sql<number>`(count(*) filter (where lower(${contacts.status}) in ('converted', 'customer')))::int`,
    })
    .from(campaignEnrollments)
    .innerJoin(contacts, eq(contacts.id, campaignEnrollments.contactId))
    .where(
      inArray(
        campaignEnrollments.campaignId,
        rows.map((r) => r.id)
      )
    )
    .groupBy(campaignEnrollments.campaignId);
  const byId = new Map(stats.map((s) => [s.campaignId, s]));
  return rows.map((c) => {
    const s = byId.get(c.id);
    const leads = s?.leads ?? 0;
    return { ...c, leads, converted: s?.converted ?? 0, conversionRate: leads ? (s?.converted ?? 0) / leads : null };
  });
}

export async function getCampaign(profileId: string, id: string) {
  const [campaign] = await db!.select().from(campaigns).where(and(eq(campaigns.id, id), eq(campaigns.profileId, profileId)));
  if (!campaign) return null;
  const enrollments = await db!
    .select({
      id: campaignEnrollments.id,
      contactId: campaignEnrollments.contactId,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      nextStep: campaignEnrollments.nextStep,
      nextDueAt: campaignEnrollments.nextDueAt,
      status: campaignEnrollments.status,
    })
    .from(campaignEnrollments)
    .innerJoin(contacts, eq(contacts.id, campaignEnrollments.contactId))
    .where(eq(campaignEnrollments.campaignId, id));
  return { campaign, enrollments };
}

/**
 * Create the CRM task for every due campaign step (campaign active, follow-up tasks enabled) and advance the
 * enrollment. Returns how many tasks were created. Without `profileId` it processes every user (scheduled run).
 */
export async function processDueSteps(profileId?: string, campaignId?: string, now: Date = new Date()): Promise<number> {
  const due = await db!
    .select({ enrollment: campaignEnrollments, campaign: campaigns, contact: contacts })
    .from(campaignEnrollments)
    .innerJoin(campaigns, eq(campaigns.id, campaignEnrollments.campaignId))
    .innerJoin(contacts, eq(contacts.id, campaignEnrollments.contactId))
    .where(
      and(
        eq(campaignEnrollments.status, 'active'),
        eq(campaigns.status, 'active'),
        lte(campaignEnrollments.nextDueAt, now),
        ...(profileId ? [eq(campaigns.profileId, profileId)] : []),
        ...(campaignId ? [eq(campaigns.id, campaignId)] : [])
      )
    )
    .limit(500);

  const settingsCache = new Map<string, LeadAutomationSettings>();
  let created = 0;
  const touchedCampaigns = new Set<string>();

  for (const { enrollment, campaign, contact } of due) {
    let settings = settingsCache.get(campaign.profileId);
    if (!settings) {
      settings = await getSettings(campaign.profileId);
      settingsCache.set(campaign.profileId, settings);
    }
    if (!settings.createFollowupTasks) continue;

    const steps = (campaign.steps || []) as CampaignStep[];
    const step = steps[enrollment.nextStep];
    const nextIndex = enrollment.nextStep + 1;
    if (step) {
      const name = `${contact.firstName} ${contact.lastName}`.trim();
      await db!.insert(tasks).values({
        title: `[${campaign.name}] ${step.title} — ${name}`,
        description: step.message || null,
        priority: 'medium',
        dueDate: enrollment.nextDueAt ?? now,
        contactId: contact.id,
        profileId: campaign.profileId,
        customFields: { campaignId: campaign.id, step: enrollment.nextStep, channel: step.channel },
      });
      created++;
    }
    const nextDue = stepDueAt(enrollment.enrolledAt ?? now, steps, nextIndex);
    await db!
      .update(campaignEnrollments)
      .set({ nextStep: nextIndex, nextDueAt: nextDue, status: nextDue ? 'active' : 'done' })
      .where(eq(campaignEnrollments.id, enrollment.id));
    touchedCampaigns.add(campaign.id);
  }

  // A campaign with no active enrollments left is completed
  for (const id of touchedCampaigns) {
    const [row] = await db!
      .select({ n: sql<number>`count(*)::int` })
      .from(campaignEnrollments)
      .where(and(eq(campaignEnrollments.campaignId, id), eq(campaignEnrollments.status, 'active')));
    if ((row?.n ?? 0) === 0) {
      await db!.update(campaigns).set({ status: 'completed', updatedAt: new Date() }).where(and(eq(campaigns.id, id), eq(campaigns.status, 'active')));
    }
  }
  return created;
}

export async function updateCampaign(profileId: string, id: string, body: any) {
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (body?.status !== undefined) {
    if (!['active', 'paused'].includes(body.status)) return { error: 'status must be active or paused' as const };
    set.status = body.status;
  }
  if (body?.name !== undefined) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name || name.length > 120) return { error: 'name must be 1-120 characters' as const };
    set.name = name;
  }
  const [row] = await db!
    .update(campaigns)
    .set(set)
    .where(and(eq(campaigns.id, id), eq(campaigns.profileId, profileId)))
    .returning();
  return { campaign: row ?? null };
}

export async function deleteCampaign(profileId: string, id: string): Promise<boolean> {
  const rows = await db!
    .delete(campaigns)
    .where(and(eq(campaigns.id, id), eq(campaigns.profileId, profileId)))
    .returning({ id: campaigns.id });
  return rows.length > 0;
}
