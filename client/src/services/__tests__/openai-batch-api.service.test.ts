import { describe, it, expect, vi, beforeEach } from 'vitest';

const fetchContacts = vi.fn(async () => {});
vi.mock('../../hooks/useContactStore', () => ({
  useContactStore: { getState: () => ({ fetchContacts }) },
}));
vi.mock('../logger.service', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('../leadAutomationApi', async (importOriginal) => ({
  ...(await importOriginal<any>()),
  scoreContact: vi.fn(),
}));

import { batchAPIService } from '../openai-batch-api.service';
import { scoreContact, NeedsApiKeyError } from '../leadAutomationApi';

const ok = (id: string) => ({
  contactId: Number(id),
  score: 70 + Number(id),
  priority: 'warm' as const,
  rationale: `why ${id}`,
  method: 'ai',
  qualified: true,
});

describe('batchAPIService.enrichContactsBulk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('records real results and refreshes contacts', async () => {
    (scoreContact as any).mockImplementation(async (id: string) => ok(id));
    const job = await batchAPIService.enrichContactsBulk(['1', '2', '2']);
    expect(job.status).toBe('completed');
    expect(job.itemCount).toBe(2);
    expect(job.completedCount).toBe(2);
    expect(job.results.map((r) => r.score)).toEqual([71, 72]);
    expect(job.failed).toEqual([]);
    expect(fetchContacts).toHaveBeenCalledTimes(1);
  });

  it('keeps the server message per failed contact and continues', async () => {
    (scoreContact as any).mockImplementation(async (id: string) => {
      if (id === '2') throw new NeedsApiKeyError('Add your OpenAI key');
      if (id === '3') throw new Error('Contact not found');
      return ok(id);
    });
    const job = await batchAPIService.enrichContactsBulk(['1', '2', '3']);
    expect(job.status).toBe('completed');
    expect(job.completedCount).toBe(1);
    expect(job.failed).toEqual([
      { contactId: '2', message: 'Add your OpenAI key', needsApiKey: true },
      { contactId: '3', message: 'Contact not found', needsApiKey: false },
    ]);
  });

  it('is failed and skips the refresh when every contact fails', async () => {
    (scoreContact as any).mockRejectedValue(new Error('boom'));
    const job = await batchAPIService.enrichContactsBulk(['1', '2']);
    expect(job.status).toBe('failed');
    expect(fetchContacts).not.toHaveBeenCalled();
  });

  it('runs at most 3 at a time', async () => {
    let active = 0;
    let peak = 0;
    (scoreContact as any).mockImplementation(async (id: string) => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return ok(id);
    });
    const job = await batchAPIService.enrichContactsBulk(['1', '2', '3', '4', '5', '6', '7']);
    expect(peak).toBe(3);
    expect(job.completedCount).toBe(7);
  });

  it('can be cancelled so remaining contacts are not scored', async () => {
    (scoreContact as any).mockImplementation(async (id: string) => {
      await new Promise((r) => setTimeout(r, 5));
      return ok(id);
    });
    const job = await batchAPIService.enrichContactsBulk(['1', '2', '3', '4', '5', '6', '7', '8'], {
      onStart: (j) => batchAPIService.cancelBatchJob(j.id),
    });
    expect(job.status).toBe('cancelled');
    expect(scoreContact).not.toHaveBeenCalled();
  });

  it('notifies subscribers with progress', async () => {
    (scoreContact as any).mockImplementation(async (id: string) => ok(id));
    const seen: number[] = [];
    const off = batchAPIService.subscribe((jobs) => seen.push(jobs[0].completedCount));
    await batchAPIService.enrichContactsBulk(['1', '2']);
    off();
    expect(seen).toContain(1);
    expect(seen[seen.length - 1]).toBe(2);
  });
});
