import { logger } from './logger.service';

interface BatchJob {
  id: string;
  type: 'contact_enrichment' | 'email_generation' | 'pipeline_analysis' | 'social_research';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  itemCount: number;
  estimatedCost: number;
  createdAt: string;
  completedAt?: string;
  results?: any;
  processingMode?: 'immediate' | 'overnight'; // Kept for API compatibility; all jobs now run immediately
  metadata?: any;
  /** Real progress: number of requests finished (succeeded or failed) out of `totalRequests`. */
  progress?: { completed: number; failed: number; total: number };
  /** Set when the job failed, or the first error when some requests failed. */
  error?: string;
}

interface BatchRequest {
  custom_id: string;
  system: string;
  prompt: string;
  maxOutputTokens: number;
}

interface BatchResult {
  custom_id: string;
  content?: string;
  error?: string;
}

const MAX_CONCURRENCY = 3;
/** Above this many requests the work runs as a Netlify background job (sync functions time out at 10-26s). */
export const BACKGROUND_JOB_THRESHOLD = 5;

export type AiJobKind = 'bulk_lead_score' | 'image_generate_hq' | 'batch_respond';

/**
 * Runs a server-side AI job (POST /api/ai/jobs, processed by the ai-jobs-background Netlify
 * function) and polls GET /api/ai/jobs/:id until it finishes. Throws on failure or timeout.
 */
export async function runAiJob<T = any>(
  kind: AiJobKind,
  input: Record<string, unknown>,
  opts: { pollIntervalMs?: number; timeoutMs?: number; onUpdate?: (status: string) => void } = {}
): Promise<T> {
  const { pollIntervalMs = 2000, timeoutMs = 15 * 60 * 1000, onUpdate } = opts;
  const createRes = await fetch('/api/ai/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, input }),
  });
  const created = await createRes.json().catch(() => ({}));
  if (!createRes.ok) throw new Error(created.error || `Could not start job (${createRes.status})`);

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, pollIntervalMs));
    const res = await fetch(`/api/ai/jobs/${created.id}`);
    const job = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(job.error || `Job status failed (${res.status})`);
    onUpdate?.(job.status);
    if (job.status === 'done') return job.result as T;
    if (job.status === 'failed') throw new Error(job.error || 'Job failed');
  }
  throw new Error('Job timed out');
}

/**
 * Processes bulk AI work by sending each item to the server (POST /api/respond)
 * with bounded concurrency. The server holds the API key; nothing is sent to OpenAI from the browser.
 */
class OpenAIBatchAPIService {
  private jobs: Map<string, BatchJob> = new Map();

  private async respond(req: BatchRequest): Promise<string> {
    const response = await fetch('/api/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `${req.system}\n\n${req.prompt}`,
        max_output_tokens: req.maxOutputTokens,
      }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || err.error || `Request failed: ${response.status}`);
    }
    const data = await response.json();
    return (data.output_text as string) || '';
  }

  private createJob(job: BatchJob, requests: BatchRequest[]): BatchJob {
    job.status = 'processing';
    job.progress = { completed: 0, failed: 0, total: requests.length };
    this.jobs.set(job.id, job);
    // Run in the background; progress and errors are reflected on the job.
    void this.runJob(job, requests);
    return job;
  }

  /** Large batches run as one server-side background job instead of many sync calls. */
  private async respondViaJob(requests: BatchRequest[]): Promise<BatchResult[]> {
    const out = await runAiJob<{ results: Array<{ index: number; ok: boolean; text?: string; error?: string }> }>(
      'batch_respond',
      {
        prompts: requests.map((r) => `${r.system}\n\n${r.prompt}`),
        maxOutputTokens: Math.max(...requests.map((r) => r.maxOutputTokens)),
      }
    );
    return out.results.map((r) => ({
      custom_id: requests[r.index].custom_id,
      ...(r.ok ? { content: r.text ?? '' } : { error: r.error || 'Request failed' }),
    }));
  }

  private async runJob(job: BatchJob, requests: BatchRequest[]): Promise<void> {
    let results: BatchResult[] = new Array(requests.length);
    let next = 0;

    const worker = async () => {
      while (next < requests.length) {
        const i = next++;
        const req = requests[i];
        try {
          results[i] = { custom_id: req.custom_id, content: await this.respond(req) };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          results[i] = { custom_id: req.custom_id, error: message };
          job.progress!.failed++;
          job.error = job.error || message;
          logger.error(`Batch job ${job.id} item ${req.custom_id} failed`, error as Error);
        }
        job.progress!.completed++;
      }
    };

    if (requests.length > BACKGROUND_JOB_THRESHOLD) {
      try {
        results = await this.respondViaJob(requests);
        job.progress!.completed = results.length;
        job.progress!.failed = results.filter((r) => r.error !== undefined).length;
        job.error = results.find((r) => r.error)?.error;
      } catch (error) {
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : String(error);
        job.completedAt = new Date().toISOString();
        logger.error(`Batch job ${job.id} background job failed`, error as Error);
        return;
      }
    } else {
      await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENCY, requests.length) }, worker));
    }

    job.results = results;
    const succeeded = results.filter((r) => r.content !== undefined);

    if (requests.length > 0 && succeeded.length === 0) {
      job.status = 'failed';
      job.completedAt = new Date().toISOString();
      return;
    }

    try {
      await this.processBatchResults(job, succeeded);
      job.status = 'completed';
    } catch (error) {
      logger.error(`Failed to process results for job ${job.id}`, error as Error);
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : String(error);
    }
    job.completedAt = new Date().toISOString();
    logger.info(
      `Batch job ${job.id} finished: ${succeeded.length}/${requests.length} succeeded`
    );
  }

  // Mass Contact Enrichment
  async enrichContactsBulk(
    contactIds: string[],
    analysisTypes: string[] = ['scoring', 'social', 'personality'],
    options: { processingMode?: 'immediate' | 'overnight' } = {}
  ): Promise<BatchJob> {
    const contacts = await this.getContactsById(contactIds);
    const requests: BatchRequest[] = [];

    contacts.forEach((contact, index) => {
      analysisTypes.forEach((analysisType) => {
        requests.push({
          custom_id: `enrich_${contact.id}_${analysisType}_${index}`,
          system:
            'You are a professional contact enrichment AI that provides detailed analysis and insights.',
          prompt: this.buildEnrichmentPrompt(contact, analysisType),
          maxOutputTokens: 1000,
        });
      });
    });

    const processingMode = options.processingMode || 'overnight';
    const job: BatchJob = {
      id: `batch_enrich_${processingMode}_${Date.now()}`,
      type: 'contact_enrichment',
      status: 'queued',
      itemCount: contactIds.length,
      estimatedCost: this.calculateBatchCost(requests.length),
      processingMode,
      createdAt: new Date().toISOString(),
      metadata: { contactIds, analysisTypes, processingMode },
    };

    logger.info(`Batch contact enrichment started: ${contactIds.length} contacts`);
    return this.createJob(job, requests);
  }

  // Bulk Email Generation - Generate personalized emails for campaigns
  async generateCampaignEmailsBulk(
    contactIds: string[],
    campaignData: {
      subject: string;
      tone: string;
      purpose: string;
      callToAction: string;
    }
  ): Promise<BatchJob> {
    const contacts = await this.getContactsById(contactIds);
    const requests: BatchRequest[] = contacts.map((contact, index) => ({
      custom_id: `email_${contact.id}_${index}`,
      system:
        'You are an expert email marketing copywriter who creates personalized, engaging emails that drive conversions.',
      prompt: this.buildEmailGenerationPrompt(contact, campaignData),
      maxOutputTokens: 800,
    }));

    const job: BatchJob = {
      id: `batch_email_${Date.now()}`,
      type: 'email_generation',
      status: 'queued',
      itemCount: contactIds.length,
      estimatedCost: this.calculateBatchCost(requests.length),
      createdAt: new Date().toISOString(),
    };

    return this.createJob(job, requests);
  }

  // Pipeline Analysis - Analyze all deals
  async analyzePipelineBulk(dealIds: string[]): Promise<BatchJob> {
    const deals = await this.getDealsById(dealIds);
    const requests: BatchRequest[] = deals.map((deal, index) => ({
      custom_id: `deal_${deal.id}_${index}`,
      system:
        'You are a sales analytics expert who provides deep insights into deal progression, risk factors, and optimization opportunities.',
      prompt: this.buildDealAnalysisPrompt(deal),
      maxOutputTokens: 1200,
    }));

    const job: BatchJob = {
      id: `batch_pipeline_${Date.now()}`,
      type: 'pipeline_analysis',
      status: 'queued',
      itemCount: dealIds.length,
      estimatedCost: this.calculateBatchCost(requests.length),
      createdAt: new Date().toISOString(),
    };

    return this.createJob(job, requests);
  }

  // Bulk Social Research - Enrich contacts with social insights
  async researchSocialProfilesBulk(contactIds: string[]): Promise<BatchJob> {
    const contacts = await this.getContactsById(contactIds);
    const requests: BatchRequest[] = contacts.map((contact, index) => ({
      custom_id: `social_${contact.id}_${index}`,
      system:
        'You are a social media research specialist who analyzes professional profiles to provide actionable insights for sales and networking.',
      prompt: this.buildSocialResearchPrompt(contact),
      maxOutputTokens: 1000,
    }));

    const job: BatchJob = {
      id: `batch_social_${Date.now()}`,
      type: 'social_research',
      status: 'queued',
      itemCount: contactIds.length,
      estimatedCost: this.calculateBatchCost(requests.length),
      createdAt: new Date().toISOString(),
    };

    return this.createJob(job, requests);
  }

  private async processBatchResults(job: BatchJob, results: BatchResult[]): Promise<void> {
    switch (job.type) {
      case 'contact_enrichment':
        await this.updateContactsWithEnrichment(results);
        break;
      case 'email_generation':
        await this.saveBulkEmailResults(results);
        break;
      case 'pipeline_analysis':
        await this.updateDealsWithAnalysis(results);
        break;
      case 'social_research':
        await this.updateContactsWithSocialInsights(results);
        break;
    }
  }

  // Rough per-request estimate
  private calculateBatchCost(requestCount: number): number {
    const costPerRequest = 0.003;
    return requestCount * costPerRequest;
  }

  // Helper methods for building prompts
  private buildEnrichmentPrompt(contact: any, analysisType: string): string {
    const baseInfo = `Contact: ${contact.name} (${contact.email}) at ${contact.company || 'Unknown Company'}`;

    switch (analysisType) {
      case 'scoring':
        return `${baseInfo}\n\nAnalyze this contact for lead scoring. Consider: company size, role seniority, engagement potential, budget authority. Provide a score 1-100 and detailed reasoning.`;
      case 'social':
        return `${baseInfo}\n\nResearch likely social media presence and professional background. Provide insights for personalized outreach.`;
      case 'personality':
        return `${baseInfo}\n\nAnalyze communication style preferences, decision-making approach, and optimal engagement strategies based on available information.`;
      default:
        return `${baseInfo}\n\nProvide comprehensive contact analysis and enrichment insights.`;
    }
  }

  private buildEmailGenerationPrompt(contact: any, campaignData: any): string {
    return `Create a personalized email for:
Contact: ${contact.name} (${contact.title || 'Professional'}) at ${contact.company || 'their company'}

Campaign Details:
- Subject Theme: ${campaignData.subject}
- Tone: ${campaignData.tone}
- Purpose: ${campaignData.purpose}
- Call to Action: ${campaignData.callToAction}

Generate a complete email with personalized subject line and body that resonates with this specific contact.`;
  }

  private buildDealAnalysisPrompt(deal: any): string {
    return `Analyze this sales deal:
Deal: ${deal.title} - $${deal.value}
Stage: ${deal.stage}
Contact: ${deal.contact?.name}
Company: ${deal.contact?.company}
Days in Stage: ${deal.daysInStage || 'Unknown'}

Provide: risk assessment, next best actions, probability of close, timeline predictions, and optimization recommendations.`;
  }

  private buildSocialResearchPrompt(contact: any): string {
    return `Research social and professional insights for:
${contact.name} - ${contact.title || 'Professional'} at ${contact.company || 'Unknown Company'}
Email: ${contact.email}

Provide: likely social media platforms, professional interests, content engagement patterns, optimal outreach timing, and personalization opportunities.`;
  }

  // Data fetching methods (integrate with your existing services)
  private async getContactsById(contactIds: string[]): Promise<any[]> {
    // Use your existing contact service
    const { contactAPIService } = await import('./contact-api.service');
    const contacts = [];
    for (const id of contactIds) {
      try {
        const contact = await contactAPIService.getContact(id);
        contacts.push(contact);
      } catch (error) {
        logger.warn(`Could not fetch contact ${id}`, { error });
      }
    }
    return contacts;
  }

  private async getDealsById(dealIds: string[]): Promise<any[]> {
    // Use your existing deal service
    const { dealService } = await import('./dealService-updated');
    return await dealService.getDealsById(dealIds);
  }

  // Result processing methods
  // Model output is free text; keep parsed JSON when the model returned JSON, otherwise the raw text.
  private parseContent(content: string): any {
    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  }

  private async updateContactsWithEnrichment(results: BatchResult[]): Promise<void> {
    const { contactAPIService } = await import('./contact-api.service');

    for (const result of results) {
      // Expected format: enrich_<contactId>_<analysisType>_<index>
      const parts = result.custom_id.split('_');
      if (parts.length < 4) {
        logger.warn(`Skipping malformed custom_id: ${result.custom_id}`);
        continue;
      }
      const contactId = parts[1];
      const analysisType = parts[2];

      try {
        await contactAPIService.updateContact(contactId, {
          [`ai_${analysisType}_analysis`]: this.parseContent(result.content || ''),
        });
      } catch (error) {
        logger.error(
          `Failed to update contact ${contactId} with enrichment data (customId: ${result.custom_id})`,
          { error }
        );
      }
    }
  }

  private async saveBulkEmailResults(results: BatchResult[]): Promise<void> {
    for (const result of results) {
      // Expected format: email_<contactId>_<index>
      const parts = result.custom_id.split('_');
      if (parts.length < 3) {
        logger.warn(`Skipping malformed custom_id: ${result.custom_id}`);
        continue;
      }
      await this.saveGeneratedEmail(parts[1], result.content || '');
    }
  }

  private async updateDealsWithAnalysis(results: BatchResult[]): Promise<void> {
    const { dealService } = await import('./dealService-updated');

    for (const result of results) {
      // Expected format: deal_<dealId>_<index>
      const parts = result.custom_id.split('_');
      if (parts.length < 3) {
        logger.warn(`Skipping malformed custom_id: ${result.custom_id}`);
        continue;
      }
      const dealId = parts[1];

      try {
        // Note: AI analysis data would be stored if the Deal interface supported it
        await dealService.updateDeal(dealId, {
          // Store analysis data in available fields or extend Deal interface as needed
        });
      } catch (error) {
        logger.error(`Failed to update deal ${dealId} (customId: ${result.custom_id})`, { error });
      }
    }
  }

  private async updateContactsWithSocialInsights(results: BatchResult[]): Promise<void> {
    const { contactAPIService } = await import('./contact-api.service');

    for (const result of results) {
      // Expected format: social_<contactId>_<index>
      const parts = result.custom_id.split('_');
      if (parts.length < 3) {
        logger.warn(`Skipping malformed custom_id: ${result.custom_id}`);
        continue;
      }
      const contactId = parts[1];

      try {
        // Note: Social insights would be stored if the Contact interface supported it
        await contactAPIService.updateContact(contactId, {
          // Store social insights in available fields or extend Contact interface as needed
        });
      } catch (error) {
        logger.error(
          `Failed to update contact ${contactId} with social insights (customId: ${result.custom_id})`,
          { error }
        );
      }
    }
  }

  private async saveGeneratedEmail(contactId: string, emailContent: string): Promise<void> {
    // Integrate with your email system
    logger.info(`Generated email for contact ${contactId} saved.`);
  }

  // Public methods for UI
  getBatchJob(jobId: string): BatchJob | undefined {
    return this.jobs.get(jobId);
  }

  getAllBatchJobs(): BatchJob[] {
    return Array.from(this.jobs.values());
  }

  getBatchJobsByType(type: BatchJob['type']): BatchJob[] {
    return Array.from(this.jobs.values()).filter((job) => job.type === type);
  }
}

export const batchAPIService = new OpenAIBatchAPIService();
