import { logger } from './logger.service';
import { scoreContact, NeedsApiKeyError } from './leadAutomationApi';
import { useContactStore } from '../hooks/useContactStore';

/**
 * Bulk contact analysis. Each contact is scored by the server (POST /api/lead-automation/score/:id),
 * which uses the user's lead-automation settings and OpenAI key and saves the score. This runner
 * only schedules those calls (3 at a time) and records the real outcome of each one.
 */

const CONCURRENCY = 3;

export interface BatchJobResult {
  contactId: string;
  score: number;
  priority: 'hot' | 'warm' | 'cold';
  rationale: string;
  qualified: boolean;
}

export interface BatchJobFailure {
  contactId: string;
  message: string;
  needsApiKey: boolean;
}

export interface BatchJob {
  id: string;
  type: 'contact_enrichment';
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  itemCount: number;
  /** Contacts the server has scored successfully. */
  completedCount: number;
  failed: BatchJobFailure[];
  results: BatchJobResult[];
  createdAt: string;
  completedAt?: string;
}

type Listener = (jobs: BatchJob[]) => void;

class OpenAIBatchAPIService {
  private jobs: Map<string, BatchJob> = new Map();
  private cancelled: Set<string> = new Set();
  private listeners: Set<Listener> = new Set();
  private counter = 0;

  /**
   * Score the given contacts. Resolves when every contact has been tried (or the job was cancelled);
   * pass `onStart` to get the live job object as soon as it exists.
   */
  async enrichContactsBulk(
    contactIds: string[],
    options: { onStart?: (job: BatchJob) => void } = {}
  ): Promise<BatchJob> {
    const ids = Array.from(new Set(contactIds.map(String)));
    const job: BatchJob = {
      id: `batch_scoring_${Date.now()}_${++this.counter}`,
      type: 'contact_enrichment',
      status: 'processing',
      itemCount: ids.length,
      completedCount: 0,
      failed: [],
      results: [],
      createdAt: new Date().toISOString(),
    };
    this.jobs.set(job.id, job);
    options.onStart?.(job);
    this.notify();

    let next = 0;
    const worker = async () => {
      while (!this.cancelled.has(job.id) && next < ids.length) {
        const contactId = ids[next++];
        try {
          const r = await scoreContact(contactId);
          job.results.push({
            contactId,
            score: r.score,
            priority: r.priority,
            rationale: r.rationale,
            qualified: r.qualified,
          });
          job.completedCount++;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          job.failed.push({
            contactId,
            message,
            needsApiKey: error instanceof NeedsApiKeyError,
          });
          logger.error(`Scoring contact ${contactId} failed`, error as Error);
        }
        this.notify();
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, ids.length) }, worker));

    if (this.cancelled.has(job.id)) job.status = 'cancelled';
    else job.status = ids.length > 0 && job.failed.length === ids.length ? 'failed' : 'completed';
    job.completedAt = new Date().toISOString();
    this.cancelled.delete(job.id);

    if (job.completedCount > 0) {
      try {
        await useContactStore.getState().fetchContacts();
      } catch (error) {
        logger.error('Refreshing contacts after batch scoring failed', error as Error);
      }
    }
    this.notify();
    return job;
  }

  /** Stop picking up new contacts; scoring calls already in flight still finish. */
  cancelBatchJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job?.status === 'processing') this.cancelled.add(jobId);
  }

  getBatchJob(jobId: string): BatchJob | undefined {
    return this.jobs.get(jobId);
  }

  getAllBatchJobs(): BatchJob[] {
    return Array.from(this.jobs.values()).reverse();
  }

  /** Called after every progress change; returns an unsubscribe function. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const snapshot = this.getAllBatchJobs().map((j) => ({
      ...j,
      failed: [...j.failed],
      results: [...j.results],
    }));
    this.listeners.forEach((l) => l(snapshot));
  }
}

export const batchAPIService = new OpenAIBatchAPIService();
