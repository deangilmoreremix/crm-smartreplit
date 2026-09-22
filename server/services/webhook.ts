import crypto from 'crypto';

export interface WebhookConfig {
  url: string;
  events: WebhookEventType[];
  secret: string;
  active: boolean;
  tenantId?: string;
  profileId?: string;
}

export type WebhookEventType =
  | 'contact_created'
  | 'contact_updated'
  | 'contact_deleted'
  | 'deal_created'
  | 'deal_stage_changed'
  | 'deal_updated'
  | 'deal_deleted'
  | 'task_created'
  | 'task_completed'
  | 'appointment_scheduled';

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  timestamp: string;
  profileId: string;
  tenantId?: string;
  data: Record<string, any>;
}

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  response?: any;
  error?: string;
  attempts: number;
}

export class WebhookService {
  private static async getWebhooks(
    profileId: string,
    eventType?: WebhookEventType
  ): Promise<WebhookConfig[]> {
    return [];
  }

  static async sendWebhook(
    config: WebhookConfig,
    event: WebhookEvent
  ): Promise<WebhookDeliveryResult> {
    if (!config.active) {
      return { success: false, error: 'Webhook is inactive', attempts: 0 };
    }

    const payload = JSON.stringify(event);
    const signature = this.generateSignature(payload, config.secret);
    const timestamp = Date.now().toString();

    try {
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Timestamp': timestamp,
          'X-Webhook-Event': event.type,
          'X-Webhook-ID': event.id,
        },
        body: payload,
      });

      const responseBody = await response.text().catch(() => '');

      return {
        success: response.ok,
        statusCode: response.status,
        response: responseBody,
        attempts: 1,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        attempts: 1,
      };
    }
  }

  static generateSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  static verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
    timestamp?: string,
    toleranceSeconds: number = 300
  ): boolean {
    if (timestamp) {
      const timestampAge = Math.floor((Date.now() - parseInt(timestamp)) / 1000);
      if (timestampAge > toleranceSeconds) {
        return false;
      }
    }

    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  static async dispatchEvent(
    profileId: string,
    eventType: WebhookEventType,
    data: Record<string, any>,
    tenantId?: string
  ): Promise<void> {
    const webhooks = await this.getWebhooks(profileId, eventType);

    const event: WebhookEvent = {
      id: crypto.randomUUID(),
      type: eventType,
      timestamp: new Date().toISOString(),
      profileId,
      tenantId,
      data,
    };

    const deliveryPromises = webhooks
      .filter((webhook) => webhook.events.includes(eventType))
      .map((webhook) => this.sendWebhook(webhook, event));

    await Promise.allSettled(deliveryPromises);
  }

  static async logWebhookEvent(
    eventId: string,
    source: string,
    eventType: string,
    userId: string,
    payload: Record<string, any>
  ): Promise<void> {
    try {
      const { db } = await import('../db');
      const { webhookEvents } = await import('../../shared/schema.js');

      await db.insert(webhookEvents).values({
        id: eventId,
        source,
        eventType,
        userId,
        payload,
      });
    } catch (error) {
      console.error('Failed to log webhook event:', error);
    }
  }
}

export const webhookService = WebhookService;
