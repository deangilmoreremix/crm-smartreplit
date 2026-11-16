import type { Express, Response } from 'express';
import { and, desc, eq } from 'drizzle-orm';
import { requireAuth } from './auth';
import { requireEntitlement } from '../middleware/entitlements';
import { FeatureKey } from '../types/entitlements';
import { db } from '../db';
import { communications } from '../../shared/schema';
import { twilioClient } from '../messaging';

// SMS is sent through Twilio (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER) and each user's
// messages are stored in the communications table (type = 'sms'). Previously this module served sample
// messages, fixed stats and an always-"active" provider, and "sent" messages without sending them.

interface Message {
  id: string;
  content: string;
  recipient: string;
  provider: string;
  status: string;
  sentAt: string;
  priority: 'low' | 'medium' | 'high';
  error?: string;
}

const twilioConfigured = () =>
  Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);

const toMessage = (row: any): Message => ({
  id: row.id,
  content: row.content || '',
  recipient: row.metadata?.recipient || '',
  provider: row.metadata?.provider || 'twilio',
  status: row.status || 'sent',
  sentAt: (row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt || Date.now())).toISOString(),
  priority: row.metadata?.priority || 'medium',
  ...(row.metadata?.error ? { error: row.metadata.error } : {}),
});

const noDb = (res: Response) => res.status(503).json({ error: 'Database not configured' });

async function userMessages(userId: string) {
  return db!
    .select()
    .from(communications)
    .where(and(eq(communications.profileId, userId), eq(communications.type, 'sms')))
    .orderBy(desc(communications.createdAt));
}

export function registerMessagingRoutes(app: Express): void {
  // Protect all messaging routes: require auth + text_messages entitlement
  app.use('/api/messaging', requireAuth(), requireEntitlement(FeatureKey.TEXT_MESSAGES));

  // Providers with their real configuration state
  app.get('/api/messaging/providers', async (_req, res) => {
    res.json([
      {
        id: 'twilio',
        name: 'Twilio',
        supportedFeatures: ['SMS'],
        status: twilioConfigured() ? 'active' : 'inactive',
        ...(twilioConfigured() ? {} : { message: 'Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER' }),
      },
    ]);
  });

  // The user's messages
  app.get('/api/messaging/messages', async (req, res) => {
    try {
      if (!db) return noDb(res);
      res.json((await userMessages((req as any).userId)).map(toMessage));
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  // Stats computed from the user's messages (unmeasured metrics are null)
  app.get('/api/messaging/stats', async (req, res) => {
    try {
      if (!db) return noDb(res);
      const messages = (await userMessages((req as any).userId)).map(toMessage);
      const delivered = messages.filter((m) => m.status === 'delivered').length;
      const failed = messages.filter((m) => m.status === 'failed').length;
      res.json({
        totalMessages: messages.length,
        deliveredMessages: delivered,
        failedMessages: failed,
        deliveryRate: messages.length ? delivered / messages.length : null,
        averageResponseTime: null,
        totalCost: null,
        costPerMessage: null,
        activeProviders: twilioConfigured() ? 1 : 0,
      });
    } catch (error) {
      console.error('Error fetching messaging stats:', error);
      res.status(500).json({ error: 'Failed to fetch messaging stats' });
    }
  });

  // Send an SMS through Twilio
  app.post('/api/messaging/send', async (req, res) => {
    try {
      const { content, recipient, provider = 'twilio' } = req.body || {};

      if (!content || !recipient) {
        return res.status(400).json({ error: 'Content and recipient are required' });
      }
      if (typeof content !== 'string' || content.length === 0 || content.length > 1600) {
        return res.status(400).json({ error: 'Content must be between 1 and 1600 characters' });
      }
      if (typeof recipient !== 'string' || !/^\+?[0-9\s().-]{7,20}$/.test(recipient)) {
        return res.status(400).json({ error: 'Recipient must be a phone number' });
      }
      if (provider !== 'twilio') {
        return res.status(400).json({ error: `Unsupported provider: ${provider}` });
      }
      if (!twilioConfigured()) {
        return res.status(501).json({
          error: 'SMS is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER.',
        });
      }
      if (!db) return noDb(res);

      const to = recipient.replace(/[\s().-]/g, '');
      let status = 'failed';
      let sid: string | undefined;
      let error: string | undefined;
      try {
        const sent = await twilioClient(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!).messages.create({
          body: content,
          from: process.env.TWILIO_PHONE_NUMBER,
          to,
        });
        status = sent.status || 'queued';
        sid = sent.sid;
      } catch (sendError: any) {
        error = sendError?.message || 'Twilio send failed';
      }

      const [row] = await db
        .insert(communications)
        .values({
          type: 'sms',
          direction: 'outbound',
          content,
          status,
          profileId: (req as any).userId,
          metadata: { recipient: to, provider: 'twilio', sid, ...(error ? { error } : {}) },
        })
        .returning();

      if (error) return res.status(502).json({ error, message: toMessage(row) });
      res.status(201).json(toMessage(row));
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // A specific message of the user
  app.get('/api/messaging/messages/:id', async (req, res) => {
    try {
      if (!db) return noDb(res);
      const [row] = await db
        .select()
        .from(communications)
        .where(
          and(
            eq(communications.id, req.params.id),
            eq(communications.profileId, (req as any).userId),
            eq(communications.type, 'sms')
          )
        );
      if (!row) return res.status(404).json({ error: 'Message not found' });
      res.json(toMessage(row));
    } catch (error) {
      console.error('Error fetching message:', error);
      res.status(500).json({ error: 'Failed to fetch message' });
    }
  });

  // Update message status (delivery confirmations)
  app.put('/api/messaging/messages/:id/status', async (req, res) => {
    try {
      if (!db) return noDb(res);
      const { status } = req.body || {};
      if (!['queued', 'sent', 'delivered', 'failed', 'undelivered'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      const [row] = await db
        .update(communications)
        .set({ status, updatedAt: new Date() })
        .where(
          and(
            eq(communications.id, req.params.id),
            eq(communications.profileId, (req as any).userId),
            eq(communications.type, 'sms')
          )
        )
        .returning();
      if (!row) return res.status(404).json({ error: 'Message not found' });
      res.json(toMessage(row));
    } catch (error) {
      console.error('Error updating message status:', error);
      res.status(500).json({ error: 'Failed to update message status' });
    }
  });
}
