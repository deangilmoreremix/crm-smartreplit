/**
 * AI jobs: long-running OpenAI work that cannot fit in a synchronous Netlify Function
 * (10s default, 26s max). The API (server/routes/aiJobs.ts) inserts a row in `ai_jobs`
 * and fires the Netlify BACKGROUND function `ai-jobs-background` (15 minute limit), which
 * is built from this file (`npm run build:ai-jobs-background`) and calls `handler` below.
 *
 * Kinds: bulk_lead_score, image_generate_hq, batch_respond.
 * All database writes use the Supabase service role.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type OpenAI from 'openai';
import { createUserClient, respondJson, respondText } from '../services/openaiClient';
import { generateImages } from '../services/openaiImages';

export type AiJobKind = 'bulk_lead_score' | 'image_generate_hq' | 'batch_respond';
export type AiJobStatus = 'pending' | 'running' | 'done' | 'failed';

export interface AiJobRow {
  id: string;
  user_id: string;
  kind: AiJobKind;
  input: Record<string, any>;
  status: AiJobStatus;
  result: any;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export const AI_JOB_KINDS: readonly AiJobKind[] = ['bulk_lead_score', 'image_generate_hq', 'batch_respond'];
export const IMAGE_BUCKET = 'generated-images';
export const JOB_CONCURRENCY = 3;
export const MAX_CONTACTS = 200;
export const MAX_PROMPTS = 100;

export interface JobDeps {
  respondJson: typeof respondJson;
  respondText: typeof respondText;
  generateImages: typeof generateImages;
}

const defaultDeps: JobDeps = { respondJson, respondText, generateImages };

let cachedAdmin: SupabaseClient | null = null;
export function getAdminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  return (cachedAdmin ??= createClient(url, key, { auth: { persistSession: false } }));
}

/** Validates and normalises the input for a kind. Throws a user-facing Error on bad input. */
export function validateJobInput(kind: string, input: any): Record<string, any> {
  if (!AI_JOB_KINDS.includes(kind as AiJobKind)) throw new Error(`Unknown job kind "${kind}"`);
  if (!input || typeof input !== 'object') throw new Error('input must be an object');
  if (kind === 'bulk_lead_score') {
    if (!Array.isArray(input.contacts) || !input.contacts.length) throw new Error('contacts must be a non-empty array');
    if (input.contacts.length > MAX_CONTACTS) throw new Error(`At most ${MAX_CONTACTS} contacts per job`);
    return { contacts: input.contacts };
  }
  if (kind === 'batch_respond') {
    if (!Array.isArray(input.prompts) || !input.prompts.length) throw new Error('prompts must be a non-empty array');
    if (input.prompts.length > MAX_PROMPTS) throw new Error(`At most ${MAX_PROMPTS} prompts per job`);
    const prompts = input.prompts.map((p: any) => String(p?.prompt ?? p ?? ''));
    if (prompts.some((p: string) => !p.trim())) throw new Error('Every prompt must be non-empty');
    const maxOutputTokens = Number(input.maxOutputTokens) || 1000;
    return { prompts, system: typeof input.system === 'string' ? input.system : undefined, maxOutputTokens };
  }
  // image_generate_hq
  if (typeof input.prompt !== 'string' || !input.prompt.trim()) throw new Error('prompt is required');
  const out: Record<string, any> = { prompt: input.prompt };
  for (const k of ['size', 'quality', 'complexity', 'background', 'outputFormat', 'tier', 'model']) {
    if (typeof input[k] === 'string') out[k] = input[k];
  }
  out.n = Math.min(4, Math.max(1, Math.floor(Number(input.n) || 1)));
  return out;
}

export async function createAiJob(
  supabase: SupabaseClient,
  userId: string,
  kind: string,
  rawInput: any
): Promise<AiJobRow> {
  const input = validateJobInput(kind, rawInput);
  const { data, error } = await supabase
    .from('ai_jobs')
    .insert({ user_id: userId, kind, input, status: 'pending' })
    .select()
    .single();
  if (error || !data) throw new Error(`Failed to create job: ${error?.message ?? 'no row returned'}`);
  return data as AiJobRow;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

const LEAD_SCORE_SYSTEM =
  'You are an expert sales analyst. Analyze the contact data and provide a lead score (0-100) with detailed rationale. Consider: engagement level, company fit, deal history, response patterns, and buying signals. Return JSON with: score (number), rationale (string), buyingSignals (array), riskFactors (array), recommendedActions (array), priority (hot/warm/cold).';

/** The user's own key (canonical user_api_keys_openai view), else undefined => env OPENAI_API_KEY. */
async function userClientFor(supabase: SupabaseClient, userId: string): Promise<OpenAI | undefined> {
  const { data } = await supabase
    .from('user_api_keys_openai')
    .select('api_key')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.api_key ? createUserClient(data.api_key as string) : undefined;
}

async function runBulkLeadScore(job: AiJobRow, deps: JobDeps, client?: OpenAI) {
  const contacts: any[] = job.input.contacts;
  const results = await mapLimit(contacts, JOB_CONCURRENCY, async (contact, index) => {
    try {
      const { data } = await deps.respondJson({
        tier: 'fast',
        instructions: LEAD_SCORE_SYSTEM,
        input: `Analyze this contact for lead scoring: ${JSON.stringify(contact)}`,
        maxOutputTokens: 600,
        client,
      });
      return { index, contactId: contact?.id ?? null, ok: true, data };
    } catch (e: any) {
      return { index, contactId: contact?.id ?? null, ok: false, error: e?.message ?? String(e) };
    }
  });
  const failed = results.filter((r) => !r.ok).length;
  if (failed === results.length) throw new Error(`All ${failed} lead scores failed: ${(results[0] as any).error}`);
  return { results, summary: { total: results.length, failed } };
}

async function runBatchRespond(job: AiJobRow, deps: JobDeps, client?: OpenAI) {
  const { prompts, system, maxOutputTokens } = job.input;
  const results = await mapLimit(prompts as string[], JOB_CONCURRENCY, async (prompt, index) => {
    try {
      const { text } = await deps.respondText({
        tier: 'default',
        instructions: system,
        input: prompt,
        maxOutputTokens,
        client,
      });
      return { index, ok: true, text };
    } catch (e: any) {
      return { index, ok: false, error: e?.message ?? String(e) };
    }
  });
  const failed = results.filter((r) => !r.ok).length;
  if (failed === results.length) throw new Error(`All ${failed} prompts failed: ${(results[0] as any).error}`);
  return { results, summary: { total: results.length, failed } };
}

const EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/gif': 'gif',
};

async function runImageGenerate(job: AiJobRow, deps: JobDeps, supabase: SupabaseClient, client?: OpenAI) {
  const input = job.input;
  const images = await deps.generateImages({
    prompt: input.prompt,
    tier: input.tier ?? 'quality',
    model: typeof input.model === 'string' && input.model.startsWith('gpt-image-') ? input.model : undefined,
    size: input.size,
    quality: input.quality,
    complexity: input.complexity,
    background: input.background,
    outputFormat: input.outputFormat,
    n: input.n,
    userId: job.user_id,
    client,
  });
  const urls: string[] = [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const path = `${job.user_id}/${job.id}-${i}.${EXT[img.mimeType] ?? 'png'}`;
    const { error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(path, Buffer.from(img.b64, 'base64'), { contentType: img.mimeType, upsert: true });
    if (error) throw new Error(`Image upload failed: ${error.message}`);
    urls.push(supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl);
  }
  return { images: urls.map((url, i) => ({ url, mimeType: images[i].mimeType })) };
}

async function update(supabase: SupabaseClient, id: string, patch: Record<string, unknown>) {
  const { error } = await supabase
    .from('ai_jobs')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(`Failed to update job ${id}: ${error.message}`);
}

/** Runs one pending job to completion. Never throws for job-level failures; they are stored on the row. */
export async function processAiJob(
  jobId: string,
  supabase: SupabaseClient = getAdminClient(),
  deps: JobDeps = defaultDeps
): Promise<AiJobRow['status']> {
  const { data: job, error } = await supabase.from('ai_jobs').select('*').eq('id', jobId).single();
  if (error || !job) throw new Error(`Job ${jobId} not found`);
  const row = job as AiJobRow;
  if (row.status !== 'pending') return row.status; // already claimed; avoids double processing

  await update(supabase, jobId, { status: 'running' });
  try {
    let result: any;
    const client = await userClientFor(supabase, row.user_id);
    if (row.kind === 'bulk_lead_score') result = await runBulkLeadScore(row, deps, client);
    else if (row.kind === 'batch_respond') result = await runBatchRespond(row, deps, client);
    else if (row.kind === 'image_generate_hq') result = await runImageGenerate(row, deps, supabase, client);
    else throw new Error(`Unknown job kind "${row.kind}"`);
    await update(supabase, jobId, { status: 'done', result, error: null });
    return 'done';
  } catch (e: any) {
    await update(supabase, jobId, { status: 'failed', error: e?.message ?? String(e) });
    return 'failed';
  }
}

/** Netlify background function entry (file name ends in -background => 15 minute limit). */
export const handler = async (event: { headers?: Record<string, string | undefined>; body?: string | null }) => {
  const secret = process.env.AI_JOBS_SECRET;
  const provided = event.headers?.['x-ai-jobs-secret'];
  if (!secret || provided !== secret) return { statusCode: 401, body: 'Unauthorized' };
  let jobId: string | undefined;
  try {
    jobId = JSON.parse(event.body || '{}').jobId;
  } catch {
    /* fallthrough */
  }
  if (!jobId) return { statusCode: 400, body: 'jobId required' };
  try {
    await processAiJob(jobId);
  } catch (e: any) {
    console.error('ai-jobs-background failed:', e?.message);
    return { statusCode: 500, body: 'Job processing error' };
  }
  return { statusCode: 200, body: 'ok' };
};
