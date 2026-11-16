import type { Express, Response } from 'express';
import { and, desc, eq } from 'drizzle-orm';
import { requireAuth } from './auth';
import { requireEntitlement } from '../middleware/entitlements';
import { FeatureKey } from '../types/entitlements';
import { db } from '../db';
import { communications } from '../../shared/schema';
import { getUserOpenAIClient, NO_KEY_MESSAGE } from '../services/userOpenAI';
import { respond } from '../services/openaiResponses';

// Call records are stored per user in the communications table (type = 'call').
// Previously this module served two hardcoded sample calls, fixed stats and a canned "analysis".
interface Call {
  id: string;
  caller: string;
  duration: number;
  status: 'completed' | 'missed' | 'ongoing' | 'voicemail';
  sentiment: 'positive' | 'neutral' | 'negative';
  transcript?: string;
  recording?: string;
  gpt5Analysis?: {
    summary: string;
    keyPoints: string[];
    actionItems: string[];
    sentimentScore: number;
  };
  createdAt?: Date | null;
}

const CALL_FIELDS = ['caller', 'duration', 'status', 'sentiment', 'transcript', 'recording', 'gpt5Analysis'] as const;

const toCall = (row: any): Call => ({
  id: row.id,
  ...(row.metadata || {}),
  transcript: row.content ?? row.metadata?.transcript,
  createdAt: row.createdAt,
});

const noDb = (res: Response) => res.status(503).json({ error: 'Database not configured' });

async function findCall(userId: string, id: string) {
  const [row] = await db!
    .select()
    .from(communications)
    .where(and(eq(communications.id, id), eq(communications.profileId, userId), eq(communications.type, 'call')));
  return row;
}

const ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'keyPoints', 'actionItems', 'sentimentScore', 'sentiment'],
  properties: {
    summary: { type: 'string' },
    keyPoints: { type: 'array', items: { type: 'string' } },
    actionItems: { type: 'array', items: { type: 'string' } },
    sentimentScore: { type: 'number', description: '0 (very negative) to 1 (very positive)' },
    sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
  },
};

export function registerPhoneRoutes(app: Express): void {
  // Protect all phone routes: require auth + phone_system entitlement
  app.use('/api/phone', requireAuth(), requireEntitlement(FeatureKey.PHONE_SYSTEM));

  // Get all calls for the authenticated user
  app.get('/api/phone/calls', async (req, res) => {
    try {
      if (!db) return noDb(res);
      const rows = await db
        .select()
        .from(communications)
        .where(and(eq(communications.profileId, (req as any).userId), eq(communications.type, 'call')))
        .orderBy(desc(communications.createdAt));
      res.json(rows.map(toCall));
    } catch (error) {
      console.error('Error fetching calls:', error);
      res.status(500).json({ error: 'Failed to fetch calls' });
    }
  });

  // Phone statistics computed from the user's call records (unmeasured metrics are null)
  app.get('/api/phone/stats', async (req, res) => {
    try {
      if (!db) return noDb(res);
      const rows = await db
        .select()
        .from(communications)
        .where(and(eq(communications.profileId, (req as any).userId), eq(communications.type, 'call')));
      const calls = rows.map(toCall);
      const answered = calls.filter((c) => c.status === 'completed');
      res.json({
        totalCalls: calls.length,
        answeredCalls: answered.length,
        averageCallDuration: answered.length
          ? Math.round(answered.reduce((sum, c) => sum + (Number(c.duration) || 0), 0) / answered.length)
          : 0,
        callQuality: null,
        customerSatisfaction: null,
        aiAccuracy: null,
      });
    } catch (error) {
      console.error('Error fetching phone stats:', error);
      res.status(500).json({ error: 'Failed to fetch phone stats' });
    }
  });

  // Create a new call record
  app.post('/api/phone/calls', async (req, res) => {
    try {
      if (!db) return noDb(res);
      const { caller, duration, status, transcript, sentiment, recording } = req.body;

      if (!caller || status === undefined) {
        return res.status(400).json({ error: 'Caller and status are required' });
      }

      const [row] = await db
        .insert(communications)
        .values({
          type: 'call',
          direction: 'outbound',
          status: String(status),
          content: transcript ?? null,
          profileId: (req as any).userId,
          metadata: { caller, duration: Number(duration) || 0, status, sentiment: sentiment || 'neutral', recording },
        })
        .returning();
      res.status(201).json(toCall(row));
    } catch (error) {
      console.error('Error creating call:', error);
      res.status(500).json({ error: 'Failed to create call' });
    }
  });

  // Get a specific call
  app.get('/api/phone/calls/:id', async (req, res) => {
    try {
      if (!db) return noDb(res);
      const row = await findCall((req as any).userId, req.params.id);
      if (!row) return res.status(404).json({ error: 'Call not found' });
      res.json(toCall(row));
    } catch (error) {
      console.error('Error fetching call:', error);
      res.status(500).json({ error: 'Failed to fetch call' });
    }
  });

  // Update a call
  app.put('/api/phone/calls/:id', async (req, res) => {
    try {
      if (!db) return noDb(res);
      const row = await findCall((req as any).userId, req.params.id);
      if (!row) return res.status(404).json({ error: 'Call not found' });

      // Whitelist allowed fields to prevent mass assignment
      const updates: Record<string, unknown> = {};
      for (const field of CALL_FIELDS) if (field in req.body) updates[field] = req.body[field];

      const [updated] = await db
        .update(communications)
        .set({
          metadata: { ...(row.metadata as object), ...updates },
          ...('transcript' in updates ? { content: String(updates.transcript ?? '') } : {}),
          ...('status' in updates ? { status: String(updates.status) } : {}),
          updatedAt: new Date(),
        })
        .where(eq(communications.id, row.id))
        .returning();
      res.json(toCall(updated));
    } catch (error) {
      console.error('Error updating call:', error);
      res.status(500).json({ error: 'Failed to update call' });
    }
  });

  // Analyze a call transcript with the user's OpenAI key (Responses API, structured output)
  app.post('/api/phone/calls/:id/analyze', async (req, res) => {
    try {
      if (!db) return noDb(res);
      const userId = (req as any).userId;
      const row = await findCall(userId, req.params.id);
      if (!row) return res.status(404).json({ error: 'Call not found' });

      const call = toCall(row);
      if (!call.transcript) {
        return res.status(400).json({ error: 'Call has no transcript to analyze' });
      }

      const openaiData = await getUserOpenAIClient(userId);
      if (!openaiData) {
        return res.status(400).json({ error: 'No OpenAI API key configured', message: NO_KEY_MESSAGE, needsApiKey: true });
      }

      const result = await respond(openaiData.client, {
        model: openaiData.model,
        instructions:
          'You analyse sales call transcripts. Summarise, list key points and concrete action items, and rate sentiment. Use only what the transcript says.',
        input: `Caller: ${call.caller}\nTranscript:\n${call.transcript}`,
        json: { name: 'call_analysis', schema: ANALYSIS_SCHEMA },
      });
      if (!result.data) return res.status(502).json({ error: 'The AI response was not valid JSON' });

      const { sentiment, ...analysis } = result.data;
      await db
        .update(communications)
        .set({ metadata: { ...(row.metadata as object), sentiment, gpt5Analysis: analysis }, updatedAt: new Date() })
        .where(eq(communications.id, row.id));
      res.json(analysis);
    } catch (error: any) {
      console.error('Error analyzing call:', error);
      res.status(500).json({ error: error?.message || 'Failed to analyze call' });
    }
  });

  // Placing calls needs a voice provider integration, which isn't connected
  app.post('/api/phone/calls/start', async (req, res) => {
    const { number } = req.body || {};
    if (!number) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    res.status(501).json({
      error: 'Outbound calling is not connected. Use your phone app, then log the call.',
    });
  });
}
