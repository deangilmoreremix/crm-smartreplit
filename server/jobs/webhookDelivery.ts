/**
 * Netlify SCHEDULED function (every minute): delivers pending rows of webhook_deliveries.
 * Built with `npm run build:webhook-delivery` into netlify/functions/webhook-delivery.mjs.
 *
 * - POST JSON; headers X-SmartCRM-Signature: sha256=<hmac>, X-SmartCRM-Timestamp, X-SmartCRM-Event, X-SmartCRM-Delivery
 * - signature = HMAC-SHA256(secret, `${timestamp}.${body}`) (timestamp = unix seconds)
 * - 10s timeout, no redirects, https only, hostname must not resolve to a private address
 * - exponential backoff, MAX_ATTEMPTS total tries, then status 'failed'
 */
import { createHmac } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { assertPublicResolved, type HostLookup } from '@smartcrm/workflows';
import { supabase as serverSupabase } from '../supabase';

export const MAX_ATTEMPTS = 6;
export const DELIVERY_TIMEOUT_MS = 10_000;
export const BATCH_SIZE = 20;
const BASE_BACKOFF_MS = 30_000;
const MAX_BACKOFF_MS = 6 * 3600_000;
const LEASE_MS = 120_000;
const RESPONSE_BODY_LIMIT = 1000;
const TICK_BUDGET_MS = 22_000;

export function signPayload(secret: string, timestamp: number | string, body: string): string {
  return `sha256=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`;
}

/** Delay before the next try after `attempts` failed tries (1-based): 30s, 60s, 2m, 4m, 8m ... capped at 6h. */
export function backoffMs(attempts: number): number {
  return Math.min(BASE_BACKOFF_MS * 2 ** Math.max(0, attempts - 1), MAX_BACKOFF_MS);
}

export interface DeliveryRow {
  id: string;
  webhook_id: string;
  event: string;
  payload: unknown;
  attempts: number;
}
export interface WebhookRow {
  id: string;
  url: string;
  secret: string;
  active: boolean;
}
export interface DeliveryDeps {
  fetch?: typeof fetch;
  lookup?: HostLookup;
  now?: () => Date;
}
export interface DeliveryOutcome {
  ok: boolean;
  status?: number;
  body?: string;
  error?: string;
}

/** One HTTP attempt. Never throws. */
export async function attemptDelivery(
  delivery: Pick<DeliveryRow, 'id' | 'event' | 'payload'>,
  webhook: Pick<WebhookRow, 'url' | 'secret'>,
  deps: DeliveryDeps = {}
): Promise<DeliveryOutcome> {
  const doFetch = deps.fetch ?? fetch;
  const now = deps.now ?? (() => new Date());
  let url: URL;
  try {
    url = await assertPublicResolved(webhook.url, deps.lookup);
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Blocked url' };
  }
  const body = JSON.stringify(delivery.payload);
  const timestamp = Math.floor(now().getTime() / 1000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);
  try {
    const res = await doFetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SmartCRM-Webhooks/1.0',
        'X-SmartCRM-Event': delivery.event,
        'X-SmartCRM-Delivery': delivery.id,
        'X-SmartCRM-Timestamp': String(timestamp),
        'X-SmartCRM-Signature': signPayload(webhook.secret, timestamp, body),
      },
      body,
      signal: controller.signal,
      redirect: 'error',
    });
    const text = (await res.text().catch(() => '')).slice(0, RESPONSE_BODY_LIMIT);
    return res.ok ? { ok: true, status: res.status, body: text } : { ok: false, status: res.status, body: text, error: `HTTP ${res.status}` };
  } catch (e: any) {
    return { ok: false, error: e?.name === 'AbortError' ? `Timed out after ${DELIVERY_TIMEOUT_MS}ms` : e?.message ?? 'Request failed' };
  } finally {
    clearTimeout(timer);
  }
}

/** Patch for the delivery row after an attempt (attempts already counts this try). */
export function nextState(outcome: DeliveryOutcome, attempts: number, now: Date) {
  if (outcome.ok) {
    return { status: 'success', attempts, response_status: outcome.status ?? null, response_body: outcome.body ?? null };
  }
  const base = { attempts, response_status: outcome.status ?? null, response_body: outcome.body ?? outcome.error ?? null };
  if (attempts >= MAX_ATTEMPTS) return { ...base, status: 'failed' };
  return { ...base, status: 'pending', next_attempt_at: new Date(now.getTime() + backoffMs(attempts)).toISOString() };
}

export async function runDeliveryTick(db: SupabaseClient, deps: DeliveryDeps = {}) {
  const now = (deps.now ?? (() => new Date()))();
  const started = Date.now();
  const stats = { claimed: 0, delivered: 0, failed: 0, retrying: 0 };

  const { data: due, error } = await db
    .from('webhook_deliveries')
    .select('id, webhook_id, event, payload, attempts, next_attempt_at')
    .eq('status', 'pending')
    .lte('next_attempt_at', now.toISOString())
    .order('next_attempt_at', { ascending: true })
    .limit(BATCH_SIZE);
  if (error) throw new Error(error.message);

  for (const d of due || []) {
    if (Date.now() - started > TICK_BUDGET_MS) break;
    // Claim with a lease so concurrent ticks never double-send; a crash retries after LEASE_MS.
    const { data: claimed } = await db
      .from('webhook_deliveries')
      .update({ next_attempt_at: new Date(now.getTime() + LEASE_MS).toISOString() })
      .eq('id', d.id)
      .eq('status', 'pending')
      .eq('next_attempt_at', d.next_attempt_at)
      .select('id');
    if (!claimed || claimed.length === 0) continue;
    stats.claimed++;

    const { data: hook } = await db.from('webhooks').select('id, url, secret, active').eq('id', d.webhook_id).maybeSingle();
    const attempts = d.attempts + 1;
    if (!hook || !hook.active) {
      await db.from('webhook_deliveries').update({ status: 'failed', attempts, response_body: 'Webhook missing or disabled' }).eq('id', d.id);
      stats.failed++;
      continue;
    }
    const outcome = await attemptDelivery(d, hook, deps);
    const patch = nextState(outcome, attempts, now);
    await db.from('webhook_deliveries').update(patch).eq('id', d.id);
    if (patch.status === 'success') stats.delivered++;
    else if (patch.status === 'failed') stats.failed++;
    else stats.retrying++;
  }
  return stats;
}

export default async function handler(): Promise<Response> {
  if (!serverSupabase) {
    console.error('webhook-delivery: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured');
    return new Response('not configured', { status: 500 });
  }
  try {
    const stats = await runDeliveryTick(serverSupabase as unknown as SupabaseClient);
    return new Response(JSON.stringify(stats), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('webhook-delivery failed:', e?.message);
    return new Response('error', { status: 500 });
  }
}

export const config = { schedule: '* * * * *' };
