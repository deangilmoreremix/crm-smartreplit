# SmartCRM Webhook API Documentation

## Overview

SmartCRM provides a comprehensive webhook system for real-time event notifications. Webhooks allow your application to receive instant notifications when CRM events occur.

**Base URL**: `https://your-domain.com/api`  
**Webhook Version**: v1

---

## Table of Contents

1. [Webhook Events](#webhook-events)
2. [Webhook Configuration](#webhook-configuration)
3. [Signature Verification](#signature-verification)
4. [Delivery & Retries](#delivery--retries)
5. [Event Types](#event-types)
6. [SDK Examples](#sdk-examples)

---

## Webhook Events

### Supported Events

| Event                   | Description                       |
| ----------------------- | --------------------------------- |
| `contact_created`       | A new contact was created         |
| `contact_updated`       | A contact was updated             |
| `contact_deleted`       | A contact was deleted             |
| `deal_created`          | A new deal was created            |
| `deal_stage_changed`    | A deal moved to a different stage |
| `deal_updated`          | A deal was updated                |
| `deal_deleted`          | A deal was deleted                |
| `task_created`          | A new task was created            |
| `task_completed`        | A task was marked complete        |
| `appointment_scheduled` | An appointment was scheduled      |

---

## Webhook Configuration

### Create Webhook Configuration

```http
POST /api/webhooks/config
Content-Type: application/json
Authorization: Bearer <token>

{
  "url": "https://your-server.com/webhooks/smartcrm",
  "events": ["contact_created", "deal_stage_changed"],
  "secret": "your_webhook_secret",
  "active": true
}
```

**Response** (201 Created):

```json
{
  "id": "wh_config_abc123",
  "url": "https://your-server.com/webhooks/smartcrm",
  "events": ["contact_created", "deal_stage_changed"],
  "secret": "your_webhook_secret",
  "active": true,
  "createdAt": "2026-04-19T13:00:00Z"
}
```

### List Webhook Configurations

```http
GET /api/webhooks/config
Authorization: Bearer <token>
```

**Response** (200 OK):

```json
{
  "data": [
    {
      "id": "wh_config_abc123",
      "url": "https://your-server.com/webhooks/smartcrm",
      "events": ["contact_created", "deal_stage_changed"],
      "active": true,
      "createdAt": "2026-04-19T13:00:00Z"
    }
  ]
}
```

### Update Webhook Configuration

```http
PUT /api/webhooks/config/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "url": "https://new-endpoint.com/webhooks",
  "events": ["contact_created", "contact_updated", "deal_stage_changed"],
  "active": true
}
```

### Delete Webhook Configuration

```http
DELETE /api/webhooks/config/:id
Authorization: Bearer <token>
```

**Response** (200 OK):

```json
{
  "message": "Webhook configuration deleted"
}
```

---

## Signature Verification

Every webhook request includes signature headers for security verification.

### Headers

| Header                | Description                                 |
| --------------------- | ------------------------------------------- |
| `X-Webhook-Signature` | HMAC-SHA256 signature of the payload        |
| `X-Webhook-Timestamp` | Unix timestamp when signature was generated |
| `X-Webhook-Event`     | Event type (e.g., `contact_created`)        |
| `X-Webhook-ID`        | Unique ID for this webhook delivery         |

### Verification Example

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  timestamp: string
): boolean {
  const timestampAge = Math.floor((Date.now() - parseInt(timestamp)) / 1000);

  // Reject requests older than 5 minutes
  if (timestampAge > 300) {
    return false;
  }

  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

// Express handler example
app.post('/webhooks/smartcrm', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];
  const payload = JSON.stringify(req.body);

  if (!verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET, timestamp)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process webhook event
  const event = req.body;
  console.log('Received event:', event.type);

  res.json({ received: true });
});
```

---

## Delivery & Retries

### Retry Policy

- Failed deliveries are retried up to 3 times
- Retry intervals: 1 minute, 5 minutes, 15 minutes
- After all retries fail, the event is logged for manual inspection

### Delivery Status

Webhook delivery status is tracked per event:

```json
{
  "id": "wh_evt_123",
  "eventType": "contact_created",
  "status": "delivered",
  "attempts": 1,
  "lastAttemptAt": "2026-04-19T13:00:05Z",
  "responseCode": 200
}
```

---

## Event Payloads

### contact_created

```json
{
  "id": "evt_abc123",
  "type": "contact_created",
  "timestamp": "2026-04-19T13:00:00Z",
  "profileId": "user_123",
  "data": {
    "contact": {
      "id": 456,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "company": "Acme Inc"
    }
  }
}
```

### deal_stage_changed

```json
{
  "id": "evt_def456",
  "type": "deal_stage_changed",
  "timestamp": "2026-04-19T13:05:00Z",
  "profileId": "user_123",
  "data": {
    "deal": {
      "id": 789,
      "title": "Enterprise License",
      "value": "50000.00",
      "stage": "negotiation",
      "previousStage": "proposal"
    }
  }
}
```

---

## SDK Examples

### Node.js SDK

```typescript
import { SmartCRM } from '@smartcrm/sdk';

const crm = new SmartCRM({
  apiKey: process.env.SMARTCRM_API_KEY,
  baseUrl: 'https://your-domain.com',
});

// List webhook configurations
const webhooks = await crm.webhooks.list();

// Create webhook
const webhook = await crm.webhooks.create({
  url: 'https://your-server.com/webhooks',
  events: ['contact_created', 'deal_stage_changed'],
  secret: process.env.WEBHOOK_SECRET,
});

// Delete webhook
await crm.webhooks.delete('wh_config_abc123');
```

### Python SDK

```python
from smartcrm import SmartCRM

crm = SmartCRM(
    api_key=os.getenv('SMARTCRM_API_KEY'),
    base_url='https://your-domain.com'
)

# List webhook configurations
webhooks = crm.webhooks.list()

# Create webhook
webhook = crm.webhooks.create(
    url='https://your-server.com/webhooks',
    events=['contact_created', 'deal_stage_changed'],
    secret=os.getenv('WEBHOOK_SECRET')
)

# Delete webhook
crm.webhooks.delete('wh_config_abc123')
```

---

## Best Practices

### 1. Verify Signatures

Always verify incoming webhook signatures to ensure authenticity.

### 2. Respond Quickly

Return `200 OK` immediately, then process asynchronously to avoid timeouts.

### 3. Handle Duplicates

Use the `X-Webhook-ID` header for idempotency - duplicate deliveries may occur.

### 4. Monitor Failures

Track webhook delivery failures and investigate failed events promptly.

### 5. Secure Your Endpoint

Use HTTPS and verify the signature to prevent spoofed webhooks.

---

## Support

- **Email**: api-support@smartcrm.vip
- **Discord**: https://discord.gg/smartcrm
- **GitHub**: https://github.com/smartcrm/sdk

---

**Last Updated**: April 19, 2026  
**API Version**: v1
