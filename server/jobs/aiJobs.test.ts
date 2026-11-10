import { describe, it, expect, vi } from 'vitest';
import { createAiJob, processAiJob, validateJobInput, handler, type JobDeps } from './aiJobs';

/** Minimal in-memory supabase double for ai_jobs + storage. */
function fakeSupabase(initial: any[] = []) {
  const rows = new Map<string, any>(initial.map((r) => [r.id, { ...r }]));
  const uploads: string[] = [];
  const client: any = {
    rows,
    uploads,
    from(table: string) {
      if (table === 'user_api_keys_openai') {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) };
      }
      expect(table).toBe('ai_jobs');
      return {
        insert(values: any) {
          const row = { id: `job-${rows.size + 1}`, result: null, error: null, ...values };
          rows.set(row.id, row);
          return { select: () => ({ single: async () => ({ data: row, error: null }) }) };
        },
        select: () => ({
          eq: (_c: string, id: string) => ({ single: async () => ({ data: rows.get(id) ?? null, error: rows.has(id) ? null : { message: 'nf' } }) }),
        }),
        update: (patch: any) => ({
          eq: async (_c: string, id: string) => {
            Object.assign(rows.get(id), patch);
            return { error: null };
          },
        }),
      };
    },
    storage: {
      from: () => ({
        upload: async (path: string) => {
          uploads.push(path);
          return { error: null };
        },
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.test/${path}` } }),
      }),
    },
  };
  return client;
}

const deps = (over: Partial<JobDeps> = {}): JobDeps => ({
  respondJson: vi.fn(async () => ({ data: { score: 80 }, usage: {} as any, model: 'm' })),
  respondText: vi.fn(async () => ({ text: 'hi', usage: {} as any, model: 'm' })),
  generateImages: vi.fn(async () => [{ b64: Buffer.from('x').toString('base64'), mimeType: 'image/png' }]),
  ...over,
});

describe('validateJobInput', () => {
  it('rejects unknown kinds and empty inputs', () => {
    expect(() => validateJobInput('nope', {})).toThrow(/Unknown job kind/);
    expect(() => validateJobInput('bulk_lead_score', { contacts: [] })).toThrow();
    expect(() => validateJobInput('batch_respond', { prompts: ['a', ' '] })).toThrow();
    expect(() => validateJobInput('image_generate_hq', {})).toThrow(/prompt/);
  });
  it('clamps image count', () => {
    expect(validateJobInput('image_generate_hq', { prompt: 'p', n: 99 }).n).toBe(4);
  });
});

describe('createAiJob', () => {
  it('inserts a pending row owned by the user', async () => {
    const sb = fakeSupabase();
    const job = await createAiJob(sb, 'u1', 'batch_respond', { prompts: ['a'] });
    expect(job).toMatchObject({ user_id: 'u1', kind: 'batch_respond', status: 'pending' });
  });
});

describe('processAiJob', () => {
  it('scores leads and marks the job done', async () => {
    const sb = fakeSupabase();
    const job = await createAiJob(sb, 'u1', 'bulk_lead_score', { contacts: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }] });
    const d = deps();
    expect(await processAiJob(job.id, sb, d)).toBe('done');
    expect(d.respondJson).toHaveBeenCalledTimes(4);
    const row = sb.rows.get(job.id);
    expect(row.status).toBe('done');
    expect(row.result.results).toHaveLength(4);
  });

  it('keeps partial failures but fails when everything fails', async () => {
    const sb = fakeSupabase();
    const job = await createAiJob(sb, 'u1', 'batch_respond', { prompts: ['a', 'b'] });
    const d = deps({ respondText: vi.fn(async () => { throw new Error('boom'); }) as any });
    expect(await processAiJob(job.id, sb, d)).toBe('failed');
    expect(sb.rows.get(job.id).error).toMatch(/boom/);
  });

  it('stores generated images in the bucket and returns public URLs', async () => {
    const sb = fakeSupabase();
    const job = await createAiJob(sb, 'u1', 'image_generate_hq', { prompt: 'cat', quality: 'xhigh' });
    const d = deps();
    expect(await processAiJob(job.id, sb, d)).toBe('done');
    expect(sb.uploads).toEqual([`u1/${job.id}-0.png`]);
    expect(sb.rows.get(job.id).result.images[0].url).toBe(`https://cdn.test/u1/${job.id}-0.png`);
    expect((d.generateImages as any).mock.calls[0][0]).toMatchObject({ quality: 'xhigh', tier: 'quality', userId: 'u1' });
  });

  it('does not reprocess a job that is not pending', async () => {
    const sb = fakeSupabase([{ id: 'x', user_id: 'u', kind: 'batch_respond', input: { prompts: ['a'] }, status: 'running' }]);
    const d = deps();
    expect(await processAiJob('x', sb, d)).toBe('running');
    expect(d.respondText).not.toHaveBeenCalled();
  });
});

describe('handler', () => {
  it('rejects a missing or wrong secret', async () => {
    process.env.AI_JOBS_SECRET = 's3';
    expect((await handler({ headers: {}, body: '{"jobId":"x"}' })).statusCode).toBe(401);
    expect((await handler({ headers: { 'x-ai-jobs-secret': 'bad' }, body: '{}' })).statusCode).toBe(401);
    expect((await handler({ headers: { 'x-ai-jobs-secret': 's3' }, body: '{}' })).statusCode).toBe(400);
  });
});
