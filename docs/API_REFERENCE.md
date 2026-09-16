# SmartCRM API Reference

Complete REST API documentation for SmartCRM integration.

## Base URL

```
https://your-domain.com/api
```

## Authentication

All API requests require Bearer token authentication:

```http
Authorization: Bearer <access_token>
```

### Session Authentication Flow

```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user",
    "productTier": "smartcrm"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

## Rate Limits

| Tier    | Requests/Min | Burst | Use Case          |
| ------- | ------------ | ----- | ----------------- |
| API     | 100          | 150   | General calls     |
| Auth    | 10           | 20    | Authentication    |
| AI      | 10           | 15    | AI features       |
| Admin   | 50           | 75    | Admin operations  |
| Upload  | 5            | 10    | File uploads      |
| Webhook | 30           | 50    | Webhook endpoints |

## Contact CRUD

### Create Contact

```http
POST /api/contacts
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "company": "Tech Inc",
  "position": "CTO",
  "tags": ["lead", "enterprise"]
}
```

**Response (201):**

```json
{
  "id": "uuid",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "createdAt": "2026-04-19T14:00:00Z"
}
```

### List Contacts

```http
GET /api/contacts?page=1&limit=50&search=john
Authorization: Bearer <token>
```

**Query Parameters:**

- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 50, max: 100)
- `search` (string): Search query
- `tags` (string): Filter by tags (comma-separated)
- `status` (string): Filter by status

**Response (200):**

```json
{
  "contacts": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "company": "Acme Corp",
      "position": "CEO",
      "tags": ["vip"],
      "status": "active",
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-04-19T14:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```

### Get Contact

```http
GET /api/contacts/:id
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Acme Corp",
  "position": "CEO",
  "tags": ["vip", "enterprise"],
  "status": "active",
  "customFields": {
    "industry": "Technology",
    "employees": "500+"
  },
  "deals": [
    {
      "id": "uuid",
      "title": "Enterprise Deal",
      "value": 50000,
      "stage": "negotiation"
    }
  ],
  "activities": [
    {
      "id": "uuid",
      "type": "email",
      "subject": "Follow-up",
      "date": "2026-04-18T10:00:00Z"
    }
  ],
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-04-19T14:00:00Z"
}
```

### Update Contact

```http
PATCH /api/contacts/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "phone": "+0987654321",
  "tags": ["lead", "qualified"]
}
```

**Response (200):**

```json
{
  "id": "uuid",
  "name": "Jane Smith",
  "phone": "+0987654321",
  "tags": ["lead", "qualified"],
  "updatedAt": "2026-04-19T14:30:00Z"
}
```

### Delete Contact

```http
DELETE /api/contacts/:id
Authorization: Bearer <token>
```

**Response (204):** No Content

## Deal CRUD

### Create Deal

```http
POST /api/deals
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "New Enterprise Deal",
  "value": 75000,
  "stage": "qualification",
  "probability": 50,
  "expectedCloseDate": "2026-06-01",
  "contactId": "uuid"
}
```

### List Deals

```http
GET /api/deals?stage=negotiation&minValue=10000
Authorization: Bearer <token>
```

### Move Deal

```http
PATCH /api/deals/:id/move
Content-Type: application/json
Authorization: Bearer <token>

{
  "stage": "negotiation",
  "probability": 75
}
```

## AI Endpoints

### Enrich Contact

```http
POST /api/ai/enrich-contact
Content-Type: application/json
Authorization: Bearer <token>

{
  "contactId": "uuid"
}
```

**Response (200):**

```json
{
  "contactId": "uuid",
  "enrichment": {
    "company": {
      "name": "Acme Corp",
      "industry": "Technology",
      "size": "500-1000",
      "revenue": "$50M-$100M"
    },
    "social": {
      "linkedin": "https://linkedin.com/in/johndoe"
    }
  },
  "confidence": 0.95,
  "sources": ["LinkedIn", "Crunchbase"]
}
```

### Score Contact

```http
POST /api/contacts/:id/score
Authorization: Bearer <token>
```

### AI Chat

```http
POST /api/ai/chat
Content-Type: application/json
Authorization: Bearer <token>

{
  "message": "Summarize my deals for this month",
  "context": {
    "userId": "uuid",
    "page": "dashboard"
  }
}
```

## Webhook Events

### Available Events

| Event             | Description         |
| ----------------- | ------------------- |
| `contact.created` | New contact created |
| `contact.updated` | Contact updated     |
| `contact.deleted` | Contact deleted     |
| `deal.created`    | New deal created    |
| `deal.updated`    | Deal updated        |
| `deal.moved`      | Deal stage changed  |
| `deal.won`        | Deal won            |
| `deal.lost`       | Deal lost           |
| `task.created`    | New task created    |
| `task.completed`  | Task completed      |
| `user.signed_up`  | New user signup     |

### Webhook Payload

```json
{
  "event": "deal.won",
  "timestamp": "2026-04-19T14:00:00Z",
  "data": {
    "id": "uuid",
    "title": "Enterprise Deal",
    "value": 50000,
    "stage": "won",
    "contact": {
      "id": "uuid",
      "name": "John Doe"
    }
  },
  "tenant": {
    "id": "uuid",
    "name": "Acme CRM"
  }
}
```

### Webhook Signature

All webhooks include signature header:

```http
X-SmartCRM-Signature: sha256=abc123...
```

**Verification (Node.js):**

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
```

## Error Responses

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  },
  "timestamp": "2026-04-19T14:00:00Z",
  "requestId": "req_123456"
}
```

### HTTP Status Codes

| Code | Meaning               |
| ---- | --------------------- |
| 200  | OK                    |
| 201  | Created               |
| 204  | No Content            |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 429  | Too Many Requests     |
| 500  | Internal Server Error |

## Error Codes

| Code                  | Description               |
| --------------------- | ------------------------- |
| `AUTH_REQUIRED`       | Authentication required   |
| `INVALID_CREDENTIALS` | Invalid email or password |
| `NO_PRODUCT_TIER`     | Subscription required     |
| `RATE_LIMIT_EXCEEDED` | Too many requests         |
| `VALIDATION_ERROR`    | Input validation failed   |
| `RESOURCE_NOT_FOUND`  | Resource does not exist   |
| `PERMISSION_DENIED`   | Insufficient permissions  |

## Best Practices

1. **Use Pagination** - Always paginate large result sets
2. **Handle Rate Limits** - Implement exponential backoff
3. **Verify Webhooks** - Always verify signatures
4. **Cache Responses** - Cache GET responses when appropriate
5. **Monitor Usage** - Track API usage to stay within limits

## SDKs

### JavaScript/TypeScript

```bash
npm install @smartcrm/sdk
```

```typescript
import { SmartCRM } from '@smartcrm/sdk';

const crm = new SmartCRM({
  apiKey: 'your_api_key',
  baseUrl: 'https://your-domain.com',
});

const contacts = await crm.contacts.list({ page: 1, limit: 50 });
```

### Python

```bash
pip install smartcrm-sdk
```

```python
from smartcrm import SmartCRM

crm = SmartCRM(api_key='your_api_key', base_url='https://your-domain.com')
contacts = crm.contacts.list(page=1, limit=50)
```

## Support

- **Email**: api-support@smartcrm.vip
- **Documentation**: https://docs.smartcrm.vip
- **Discord**: https://discord.gg/smartcrm
- **GitHub**: https://github.com/smartcrm/sdk

**Last Updated**: April 19, 2026
**API Version**: v1
