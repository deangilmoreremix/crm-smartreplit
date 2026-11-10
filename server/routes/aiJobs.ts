/**
 * AI job API.
 *   POST /api/ai/jobs      { kind, input } -> 202 { id, status }  (inserts a row, fires the background function)
 *   GET  /api/ai/jobs/:id                   -> owner-scoped job row
 * The heavy work runs in the Netlify background function (server/jobs/aiJobs.ts).
 */
import type { Express, Request, Response } from 'express';
import { requireAuth } from './auth';
import { requireEntitlement } from '../middleware/entitlements';
import { FeatureKey } from '../types/entitlements';
import { createAiJob, getAdminClient } from '../jobs/aiJobs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function registerAIJobRoutes(app: Express): void {
  const guard = [requireAuth(), requireEntitlement(FeatureKey.AI_TOOLS)];

  app.post('/api/ai/jobs', ...guard, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const secret = process.env.AI_JOBS_SECRET;
    const siteUrl = process.env.URL;
    if (!secret || !siteUrl) {
      return res.status(503).json({ error: 'AI jobs are not configured (AI_JOBS_SECRET / URL)' });
    }
    let supabase;
    try {
      supabase = getAdminClient();
    } catch (e: any) {
      return res.status(503).json({ error: e.message });
    }

    let job;
    try {
      job = await createAiJob(supabase, userId, req.body?.kind, req.body?.input);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }

    try {
      // Background functions answer 202 immediately; the work continues server-side.
      const resp = await fetch(`${siteUrl}/.netlify/functions/ai-jobs-background`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-ai-jobs-secret': secret },
        body: JSON.stringify({ jobId: job.id }),
      });
      if (!resp.ok && resp.status !== 202) throw new Error(`background function responded ${resp.status}`);
    } catch (e: any) {
      await supabase
        .from('ai_jobs')
        .update({ status: 'failed', error: `Could not start job: ${e.message}`, updated_at: new Date().toISOString() })
        .eq('id', job.id);
      return res.status(502).json({ error: `Could not start job: ${e.message}`, id: job.id });
    }
    res.status(202).json({ id: job.id, status: job.status });
  });

  app.get('/api/ai/jobs/:id', requireAuth(), async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    if (!UUID.test(req.params.id)) return res.status(400).json({ error: 'Invalid job id' });
    try {
      const { data, error } = await getAdminClient()
        .from('ai_jobs')
        .select('id, kind, status, result, error, created_at, updated_at')
        .eq('id', req.params.id)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return res.status(404).json({ error: 'Job not found' });
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
