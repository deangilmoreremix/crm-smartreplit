/**
 * Workflow automation + outbound webhook routes.
 *   Workflow triggers   GET/PUT /api/workflows/:id/triggers, POST/DELETE /api/workflows/:id/webhook-token
 *   Versions            GET/POST /api/workflows/:id/versions, POST .../versions/:vid/activate,
 *                       POST /api/workflows/:id/publish, DELETE /api/workflows/:id/active-version
 *   Paused runs         GET /api/workflows/runs/:runId/waits, POST /api/workflows/runs/:runId/resume
 *   Custom events       POST /api/workflows/events
 *   Inbound webhook     POST /api/hooks/workflows/:token   (public, token = credential)
 *   Outbound webhooks   /api/outbound-webhooks (CRUD + deliveries)
 * All authenticated routes are owner-scoped (service-role client, explicit user_id filters).
 */
import { randomBytes } from 'node:crypto';
import type { Express, Request, Response } from 'express';
import { supabase } from '../supabase';
import { requireAuth } from './auth';
import {
  assertPublicHttps,
  isValidCron,
  nextCronRun,
  resumeWait,
  resumeWaitersForKeys,
  runWorkflow,
  validateFormSubmission,
} from '@smartcrm/workflows';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HOOK_TOKEN = /^[a-f0-9]{48}$/;
export const HOOK_MAX_BODY_BYTES = 64 * 1024;
export const HOOK_RATE_PER_MINUTE = 60;
export const MAX_STEPS_PER_VERSION = 200;
export const MAX_WEBHOOKS_PER_USER = 20;

export const WEBHOOK_EVENT_NAMES = [
  '*',
  ...['contact', 'deal', 'task', 'company'].flatMap((o) => [`${o}.created`, `${o}.updated`, `${o}.deleted`]),
];

const uid = (req: Request): string => (req as any).userId;
const auth = requireAuth({ checkEntitlement: false });

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function db() {
  if (!supabase) throw new HttpError(503, 'Database is not configured');
  return supabase;
}

const wrap =
  (fn: (req: Request, res: Response) => Promise<unknown>) => async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (e: any) {
      if (e instanceof HttpError) return res.status(e.status).json({ error: e.message });
      console.error(`${req.method} ${req.path} failed:`, e?.message || e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

function requireUuid(value: string, what: string) {
  if (!UUID.test(value)) throw new HttpError(400, `Invalid ${what}`);
}

async function findOwnedWorkflow(id: string, userId: string) {
  requireUuid(id, 'workflow id');
  const { data, error } = await db().from('workflows').select('*').eq('id', id).eq('user_id', userId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new HttpError(404, 'Workflow not found');
  return data as any;
}

// ---------------------------------------------------------------------------
// In-memory limiter (per instance) in front of the DB counter (shared across instances)
// ---------------------------------------------------------------------------
const memoryHits = new Map<string, { windowStart: number; count: number }>();

export function memoryRateLimit(key: string, limit: number, now = Date.now()): boolean {
  const windowStart = Math.floor(now / 60_000) * 60_000;
  if (memoryHits.size > 5000) {
    for (const [k, v] of memoryHits) if (v.windowStart < windowStart) memoryHits.delete(k);
  }
  const hit = memoryHits.get(key);
  if (!hit || hit.windowStart !== windowStart) {
    memoryHits.set(key, { windowStart, count: 1 });
    return true;
  }
  hit.count++;
  return hit.count <= limit;
}

/** Pure helper (tested): is this inbound hook body acceptable? */
export function checkHookBody(contentLength: string | undefined, body: unknown): { ok: true; data: Record<string, unknown> } | { ok: false; status: number; error: string } {
  if (contentLength && Number(contentLength) > HOOK_MAX_BODY_BYTES) {
    return { ok: false, status: 413, error: 'Payload too large' };
  }
  const serialized = JSON.stringify(body ?? {});
  if (serialized.length > HOOK_MAX_BODY_BYTES) return { ok: false, status: 413, error: 'Payload too large' };
  if (Array.isArray(body)) return { ok: true, data: { items: body } };
  if (body && typeof body === 'object') return { ok: true, data: body as Record<string, unknown> };
  return { ok: true, data: {} };
}

const newHookToken = () => randomBytes(24).toString('hex');
const newWebhookSecret = () => `whsec_${randomBytes(24).toString('hex')}`;

const toStepRow = (a: any) => ({
  id: a.id,
  actionType: a.action_type,
  configuration: a.config || {},
  order: a.order_index,
  condition: a.condition || undefined,
});

async function nextVersionNumber(workflowId: string): Promise<number> {
  const { data } = await db()
    .from('workflow_versions')
    .select('version')
    .eq('workflow_id', workflowId)
    .order('version', { ascending: false })
    .limit(1);
  return ((data && data[0]?.version) || 0) + 1;
}

async function activateVersion(workflowId: string, versionId: string) {
  const client = db();
  const { error: archiveError } = await client
    .from('workflow_versions')
    .update({ status: 'archived' })
    .eq('workflow_id', workflowId)
    .eq('status', 'active')
    .neq('id', versionId);
  if (archiveError) throw new Error(archiveError.message);
  const { error: activeError } = await client.from('workflow_versions').update({ status: 'active' }).eq('id', versionId);
  if (activeError) throw new Error(activeError.message);
  const { error } = await client
    .from('workflows')
    .update({ active_version_id: versionId, updated_at: new Date().toISOString() })
    .eq('id', workflowId);
  if (error) throw new Error(error.message);
}

function validateSteps(steps: unknown): any[] {
  if (!Array.isArray(steps) || steps.length > MAX_STEPS_PER_VERSION) {
    throw new HttpError(400, `steps must be an array of at most ${MAX_STEPS_PER_VERSION}`);
  }
  steps.forEach((s: any, i) => {
    if (!s || typeof s.actionType !== 'string') throw new HttpError(400, `steps[${i}].actionType is required`);
  });
  return steps.map((s: any, i) => ({
    id: String(s.id ?? `s${i + 1}`),
    actionType: s.actionType,
    configuration: s.configuration && typeof s.configuration === 'object' ? s.configuration : {},
    order: Number.isFinite(Number(s.order)) ? Number(s.order) : i + 1,
    condition: s.condition || undefined,
  }));
}

export function registerAutomationRoutes(app: Express): void {
  // ------------------------------ triggers ------------------------------
  app.get('/api/workflows/:id/triggers', auth, wrap(async (req, res) => {
    const w = await findOwnedWorkflow(req.params.id, uid(req));
    res.json({
      scheduleCron: w.schedule_cron ?? null,
      nextRunAt: w.next_run_at ?? null,
      webhookToken: w.webhook_token ?? null,
      webhookPath: w.webhook_token ? `/api/hooks/workflows/${w.webhook_token}` : null,
      activeVersionId: w.active_version_id ?? null,
      triggerType: w.trigger_type,
      enabled: w.enabled,
    });
  }));

  app.put('/api/workflows/:id/triggers', auth, wrap(async (req, res) => {
    const w = await findOwnedWorkflow(req.params.id, uid(req));
    const { scheduleCron } = req.body || {};
    let patch: Record<string, unknown>;
    if (scheduleCron === null || scheduleCron === '') {
      patch = { schedule_cron: null, next_run_at: null };
    } else if (typeof scheduleCron === 'string' && isValidCron(scheduleCron)) {
      const next = nextCronRun(scheduleCron, new Date());
      if (!next) throw new HttpError(400, 'Cron expression never fires');
      patch = { schedule_cron: scheduleCron.trim(), next_run_at: next.toISOString() };
    } else {
      throw new HttpError(400, 'scheduleCron must be a valid 5-field cron expression (UTC) or null');
    }
    const { data, error } = await db()
      .from('workflows')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', w.id)
      .eq('user_id', uid(req))
      .select()
      .single();
    if (error) throw new Error(error.message);
    res.json({ scheduleCron: data.schedule_cron, nextRunAt: data.next_run_at });
  }));

  app.post('/api/workflows/:id/webhook-token', auth, wrap(async (req, res) => {
    const w = await findOwnedWorkflow(req.params.id, uid(req));
    const token = newHookToken();
    const { error } = await db().from('workflows').update({ webhook_token: token }).eq('id', w.id).eq('user_id', uid(req));
    if (error) throw new Error(error.message);
    res.json({ webhookToken: token, webhookPath: `/api/hooks/workflows/${token}` });
  }));

  app.delete('/api/workflows/:id/webhook-token', auth, wrap(async (req, res) => {
    const w = await findOwnedWorkflow(req.params.id, uid(req));
    const { error } = await db().from('workflows').update({ webhook_token: null }).eq('id', w.id).eq('user_id', uid(req));
    if (error) throw new Error(error.message);
    res.status(204).send();
  }));

  // ------------------------------ versions ------------------------------
  app.get('/api/workflows/:id/versions', auth, wrap(async (req, res) => {
    const w = await findOwnedWorkflow(req.params.id, uid(req));
    const { data, error } = await db()
      .from('workflow_versions')
      .select('id, version, status, created_at, graph')
      .eq('workflow_id', w.id)
      .order('version', { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    res.json({
      activeVersionId: w.active_version_id ?? null,
      versions: (data || []).map((v: any) => ({
        id: v.id,
        version: v.version,
        status: v.status,
        createdAt: v.created_at,
        stepCount: Array.isArray(v.graph?.steps) ? v.graph.steps.length : 0,
      })),
    });
  }));

  async function createVersion(workflowId: string, bodySteps: unknown) {
    let steps: any[];
    if (bodySteps !== undefined) {
      steps = validateSteps(bodySteps);
    } else {
      const { data: actions, error } = await db()
        .from('workflow_actions')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('order_index');
      if (error) throw new Error(error.message);
      steps = (actions || []).map(toStepRow);
    }
    const { data, error } = await db()
      .from('workflow_versions')
      .insert({ workflow_id: workflowId, version: await nextVersionNumber(workflowId), status: 'draft', graph: { steps } })
      .select('id, version, status, created_at')
      .single();
    if (error || !data) throw new Error(error?.message || 'Failed to create version');
    return data;
  }

  // Save a draft (from body.steps, or a snapshot of the current builder steps).
  app.post('/api/workflows/:id/versions', auth, wrap(async (req, res) => {
    const w = await findOwnedWorkflow(req.params.id, uid(req));
    res.status(201).json({ version: await createVersion(w.id, req.body?.steps) });
  }));

  app.post('/api/workflows/:id/versions/:versionId/activate', auth, wrap(async (req, res) => {
    const w = await findOwnedWorkflow(req.params.id, uid(req));
    requireUuid(req.params.versionId, 'version id');
    const { data: v } = await db()
      .from('workflow_versions')
      .select('id')
      .eq('id', req.params.versionId)
      .eq('workflow_id', w.id)
      .maybeSingle();
    if (!v) throw new HttpError(404, 'Version not found');
    await activateVersion(w.id, v.id);
    res.json({ activeVersionId: v.id });
  }));

  // Snapshot the current steps and activate them in one go.
  app.post('/api/workflows/:id/publish', auth, wrap(async (req, res) => {
    const w = await findOwnedWorkflow(req.params.id, uid(req));
    const version = await createVersion(w.id, undefined);
    await activateVersion(w.id, version.id);
    res.status(201).json({ version: { ...version, status: 'active' }, activeVersionId: version.id });
  }));

  // Back to "live" mode: runs use the current builder steps again.
  app.delete('/api/workflows/:id/active-version', auth, wrap(async (req, res) => {
    const w = await findOwnedWorkflow(req.params.id, uid(req));
    await db().from('workflow_versions').update({ status: 'archived' }).eq('workflow_id', w.id).eq('status', 'active');
    const { error } = await db().from('workflows').update({ active_version_id: null }).eq('id', w.id).eq('user_id', uid(req));
    if (error) throw new Error(error.message);
    res.status(204).send();
  }));

  // ------------------------------ paused runs ------------------------------
  async function ownedRun(runId: string, userId: string) {
    requireUuid(runId, 'run id');
    const { data: run } = await db().from('workflow_runs').select('id, workflow_id, status').eq('id', runId).maybeSingle();
    if (!run) throw new HttpError(404, 'Run not found');
    const { data: wf } = await db().from('workflows').select('id').eq('id', run.workflow_id).eq('user_id', userId).maybeSingle();
    if (!wf) throw new HttpError(404, 'Run not found');
    return run as any;
  }

  app.get('/api/workflows/runs/:runId/waits', auth, wrap(async (req, res) => {
    const run = await ownedRun(req.params.runId, uid(req));
    const { data, error } = await db()
      .from('workflow_run_waits')
      .select('id, kind, step_id, resume_at, event_key, payload, resolved_at, created_at')
      .eq('run_id', run.id)
      .is('resolved_at', null);
    if (error) throw new Error(error.message);
    res.json({
      status: run.status,
      waits: (data || []).map((w: any) => ({
        id: w.id,
        kind: w.kind,
        stepId: w.step_id,
        resumeAt: w.resume_at,
        eventKey: w.event_key,
        form: w.kind === 'form' ? w.payload?.form : undefined,
        createdAt: w.created_at,
      })),
    });
  }));

  app.post('/api/workflows/runs/:runId/resume', auth, wrap(async (req, res) => {
    const run = await ownedRun(req.params.runId, uid(req));
    if (run.status !== 'waiting') throw new HttpError(409, 'Run is not waiting');
    const { data: wait } = await db()
      .from('workflow_run_waits')
      .select('id, kind, payload')
      .eq('run_id', run.id)
      .eq('kind', 'form')
      .is('resolved_at', null)
      .maybeSingle();
    if (!wait) throw new HttpError(409, 'Run is not waiting for a form');
    const checked = validateFormSubmission((wait.payload as any)?.form || { fields: [] }, req.body?.data);
    if (!checked.ok) throw new HttpError(400, checked.error);
    const updated = await resumeWait(wait.id, checked.values);
    if (!updated) throw new HttpError(409, 'Run was already resumed');
    res.json({ run: updated });
  }));

  app.post('/api/workflows/events', auth, wrap(async (req, res) => {
    const name = String(req.body?.name ?? '');
    if (!/^[A-Za-z0-9_.:-]{1,64}$/.test(name)) throw new HttpError(400, 'name must be 1-64 chars of [A-Za-z0-9_.:-]');
    const payload = req.body?.payload && typeof req.body.payload === 'object' ? req.body.payload : {};
    if (JSON.stringify(payload).length > HOOK_MAX_BODY_BYTES) throw new HttpError(413, 'Payload too large');
    const resumed = await resumeWaitersForKeys(uid(req), [`custom:${name}`], payload);
    res.json({ resumed });
  }));

  // ------------------------------ inbound webhook trigger (public) ------------------------------
  app.post('/api/hooks/workflows/:token', wrap(async (req, res) => {
    const token = req.params.token;
    if (!HOOK_TOKEN.test(token)) return res.status(404).json({ error: 'Not found' });

    const body = checkHookBody(req.headers['content-length'] as string | undefined, req.body);
    if (!body.ok) return res.status(body.status).json({ error: body.error });

    const { data: wf, error } = await db()
      .from('workflows')
      .select('id, user_id, enabled, trigger_type')
      .eq('webhook_token', token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!wf || !wf.enabled || wf.trigger_type !== 'WEBHOOK') return res.status(404).json({ error: 'Not found' });

    // Rate limit: per-instance memory first (cheap), then the shared DB counter.
    if (!memoryRateLimit(`hook:${wf.id}`, HOOK_RATE_PER_MINUTE)) {
      res.setHeader('Retry-After', '60');
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    const windowStart = new Date(Math.floor(Date.now() / 60_000) * 60_000).toISOString();
    const { data: count, error: rpcError } = await db().rpc('bump_workflow_hook_usage', {
      p_workflow_id: wf.id,
      p_window: windowStart,
    });
    if (rpcError) console.warn('hook rate-limit counter unavailable:', rpcError.message);
    else if (typeof count === 'number' && count > HOOK_RATE_PER_MINUTE * 2) {
      res.setHeader('Retry-After', '60');
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    const run = await runWorkflow({
      workflowId: wf.id,
      userId: wf.user_id,
      triggerType: 'WEBHOOK',
      triggerData: { ...body.data, receivedAt: new Date().toISOString() },
    });
    res.status(202).json({ runId: run.id, status: run.status });
  }));

  // ------------------------------ outbound webhooks ------------------------------
  const HOOK_COLUMNS = 'id, url, events, active, created_at, updated_at';

  const parseEvents = (raw: unknown): string[] => {
    if (raw === undefined) return ['*'];
    if (!Array.isArray(raw) || raw.length === 0 || raw.some((e) => !WEBHOOK_EVENT_NAMES.includes(e))) {
      throw new HttpError(400, `events must be a non-empty subset of: ${WEBHOOK_EVENT_NAMES.join(', ')}`);
    }
    return Array.from(new Set(raw as string[]));
  };
  const parseUrl = (raw: unknown): string => {
    try {
      return assertPublicHttps(String(raw)).toString();
    } catch (e: any) {
      throw new HttpError(400, e.message);
    }
  };

  app.get('/api/outbound-webhooks', auth, wrap(async (req, res) => {
    const { data, error } = await db().from('webhooks').select(HOOK_COLUMNS).eq('user_id', uid(req)).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    res.json({ webhooks: data || [], events: WEBHOOK_EVENT_NAMES });
  }));

  app.post('/api/outbound-webhooks', auth, wrap(async (req, res) => {
    const url = parseUrl(req.body?.url);
    const events = parseEvents(req.body?.events);
    const { count } = await db().from('webhooks').select('id', { count: 'exact', head: true }).eq('user_id', uid(req));
    if ((count ?? 0) >= MAX_WEBHOOKS_PER_USER) throw new HttpError(400, `At most ${MAX_WEBHOOKS_PER_USER} webhooks`);
    const secret = newWebhookSecret();
    const { data, error } = await db()
      .from('webhooks')
      .insert({ user_id: uid(req), url, events, secret, active: true })
      .select(HOOK_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    res.status(201).json({ webhook: data, secret }); // the secret is only ever returned here / on rotation
  }));

  app.patch('/api/outbound-webhooks/:id', auth, wrap(async (req, res) => {
    requireUuid(req.params.id, 'webhook id');
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (req.body?.url !== undefined) patch.url = parseUrl(req.body.url);
    if (req.body?.events !== undefined) patch.events = parseEvents(req.body.events);
    if (req.body?.active !== undefined) patch.active = !!req.body.active;
    let secret: string | undefined;
    if (req.body?.rotateSecret) {
      secret = newWebhookSecret();
      patch.secret = secret;
    }
    const { data, error } = await db()
      .from('webhooks')
      .update(patch)
      .eq('id', req.params.id)
      .eq('user_id', uid(req))
      .select(HOOK_COLUMNS)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new HttpError(404, 'Webhook not found');
    res.json({ webhook: data, ...(secret ? { secret } : {}) });
  }));

  app.delete('/api/outbound-webhooks/:id', auth, wrap(async (req, res) => {
    requireUuid(req.params.id, 'webhook id');
    const { error } = await db().from('webhooks').delete().eq('id', req.params.id).eq('user_id', uid(req));
    if (error) throw new Error(error.message);
    res.status(204).send();
  }));

  app.get('/api/outbound-webhooks/:id/deliveries', auth, wrap(async (req, res) => {
    requireUuid(req.params.id, 'webhook id');
    const { data: hook } = await db().from('webhooks').select('id').eq('id', req.params.id).eq('user_id', uid(req)).maybeSingle();
    if (!hook) throw new HttpError(404, 'Webhook not found');
    const { data, error } = await db()
      .from('webhook_deliveries')
      .select('id, event, status, attempts, next_attempt_at, response_status, response_body, created_at')
      .eq('webhook_id', hook.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    res.json({ deliveries: data || [] });
  }));
}

export default registerAutomationRoutes;
