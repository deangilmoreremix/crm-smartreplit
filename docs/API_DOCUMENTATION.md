# SmartCRM API Documentation

## Overview
Complete API reference for the SmartCRM White Label Platform. This documentation covers all REST endpoints, authentication, rate limiting, and integration patterns.

**Base URL**: `https://your-domain.com/api`  
**API Version**: v1  
**Last Updated**: January 25, 2026

---

## Table of Contents
1. [Authentication](#authentication)
2. [Rate Limiting](#rate-limiting)
3. [Error Handling](#error-handling)
4. [Core Endpoints](#core-endpoints)
5. [AI Features](#ai-features)
6. [White Label](#white-label)
7. [Webhooks](#webhooks)
8. [SDKs](#sdks)

---

## Authentication

### Session-Based Authentication
SmartCRM uses session-based authentication with Supabase Auth.

#### Sign Up
```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Response** (201 Created):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

#### Sign In
```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response** (200 OK):
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

#### Sign Out
```http
POST /api/auth/signout
```

**Response** (200 OK):
```json
{
  "message": "Signed out successfully"
}
```

#### Password Reset
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "message": "Password reset email sent"
}
```

---

## Rate Limiting

### Rate Limit Tiers

| Tier | Requests/Minute | Burst | Use Case |
|------|-----------------|-------|----------|
| **API** | 100 | 150 | General API calls |
| **Auth** | 10 | 20 | Authentication endpoints |
| **AI** | 10 | 15 | AI-powered features |
| **Admin** | 50 | 75 | Admin operations |
| **Upload** | 5 | 10 | File uploads |
| **Webhook** | 30 | 50 | Webhook endpoints |

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

### Rate Limit Exceeded
**Response** (429 Too Many Requests):
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60,
  "limit": 100,
  "remaining": 0
}
```

---

## Error Handling

### Standard Error Response
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  },
  "timestamp": "2026-01-25T03:30:00Z",
  "requestId": "req_123456"
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication required |
| `INVALID_CREDENTIALS` | Invalid email or password |
| `NO_PRODUCT_TIER` | Subscription required |
| `SUBSCRIPTION_INACTIVE` | Subscription expired |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `VALIDATION_ERROR` | Input validation failed |
| `RESOURCE_NOT_FOUND` | Resource does not exist |
| `PERMISSION_DENIED` | Insufficient permissions |

---

## Core Endpoints

### Contacts

#### List Contacts
```http
GET /api/contacts?page=1&limit=50&search=john
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `search` (optional): Search query
- `tags` (optional): Filter by tags (comma-separated)
- `status` (optional): Filter by status

**Response** (200 OK):
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
      "tags": ["vip", "enterprise"],
      "status": "active",
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-25T00:00:00Z"
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

#### Get Contact
```http
GET /api/contacts/:id
```

**Response** (200 OK):
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
      "date": "2026-01-24T10:00:00Z"
    }
  ],
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-25T00:00:00Z"
}
```

#### Create Contact
```http
POST /api/contacts
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "company": "Tech Inc",
  "position": "CTO",
  "tags": ["lead"],
  "customFields": {
    "source": "website"
  }
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "createdAt": "2026-01-25T03:30:00Z"
}
```

#### Update Contact
```http
PATCH /api/contacts/:id
Content-Type: application/json

{
  "phone": "+0987654321",
  "tags": ["lead", "qualified"]
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Jane Smith",
  "phone": "+0987654321",
  "tags": ["lead", "qualified"],
  "updatedAt": "2026-01-25T03:31:00Z"
}
```

#### Delete Contact
```http
DELETE /api/contacts/:id
```

**Response** (204 No Content)

---

### Deals

#### List Deals
```http
GET /api/deals?stage=negotiation&minValue=10000
```

**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `stage` (optional): Filter by stage
- `minValue` (optional): Minimum deal value
- `maxValue` (optional): Maximum deal value
- `contactId` (optional): Filter by contact

**Response** (200 OK):
```json
{
  "deals": [
    {
      "id": "uuid",
      "title": "Enterprise Deal",
      "value": 50000,
      "stage": "negotiation",
      "probability": 75,
      "expectedCloseDate": "2026-02-15",
      "contact": {
        "id": "uuid",
        "name": "John Doe"
      },
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-25T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "pages": 1
  },
  "summary": {
    "totalValue": 500000,
    "averageValue": 20000,
    "winRate": 65
  }
}
```

#### Create Deal
```http
POST /api/deals
Content-Type: application/json

{
  "title": "New Enterprise Deal",
  "value": 75000,
  "stage": "qualification",
  "probability": 50,
  "expectedCloseDate": "2026-03-01",
  "contactId": "uuid",
  "customFields": {
    "product": "Enterprise Plan",
    "seats": 100
  }
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "title": "New Enterprise Deal",
  "value": 75000,
  "stage": "qualification",
  "createdAt": "2026-01-25T03:30:00Z"
}
```

#### Move Deal
```http
PATCH /api/deals/:id/move
Content-Type: application/json

{
  "stage": "negotiation",
  "probability": 75
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "stage": "negotiation",
  "probability": 75,
  "updatedAt": "2026-01-25T03:31:00Z"
}
```

---

### Tasks

#### List Tasks
```http
GET /api/tasks?status=pending&assignedTo=me
```

**Query Parameters**:
- `status` (optional): Filter by status (pending, completed, overdue)
- `assignedTo` (optional): Filter by assignee (me, userId)
- `dueDate` (optional): Filter by due date
- `priority` (optional): Filter by priority (low, medium, high)

**Response** (200 OK):
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Follow up with John",
      "description": "Discuss pricing",
      "status": "pending",
      "priority": "high",
      "dueDate": "2026-01-26",
      "assignedTo": {
        "id": "uuid",
        "name": "Current User"
      },
      "relatedTo": {
        "type": "contact",
        "id": "uuid",
        "name": "John Doe"
      },
      "createdAt": "2026-01-25T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 15,
    "pages": 1
  }
}
```

#### Create Task
```http
POST /api/tasks
Content-Type: application/json

{
  "title": "Send proposal",
  "description": "Send pricing proposal to client",
  "priority": "high",
  "dueDate": "2026-01-27",
  "assignedTo": "uuid",
  "relatedTo": {
    "type": "deal",
    "id": "uuid"
  }
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "title": "Send proposal",
  "status": "pending",
  "createdAt": "2026-01-25T03:30:00Z"
}
```

#### Complete Task
```http
PATCH /api/tasks/:id/complete
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "status": "completed",
  "completedAt": "2026-01-25T03:31:00Z"
}
```

---

## AI Features

### AI Enrichment

#### Enrich Contact
```http
POST /api/ai/enrich-contact
Content-Type: application/json

{
  "contactId": "uuid"
}
```

**Response** (200 OK):
```json
{
  "contactId": "uuid",
  "enrichment": {
    "company": {
      "name": "Acme Corp",
      "industry": "Technology",
      "size": "500-1000",
      "revenue": "$50M-$100M",
      "website": "https://acme.com"
    },
    "social": {
      "linkedin": "https://linkedin.com/in/johndoe",
      "twitter": "@johndoe"
    },
    "insights": [
      "Recently promoted to CEO",
      "Company raised Series B funding"
    ]
  },
  "confidence": 0.95,
  "sources": ["LinkedIn", "Crunchbase", "Company Website"]
}
```

### AI Chat

#### Send Message
```http
POST /api/ai/chat
Content-Type: application/json

{
  "message": "Summarize my deals for this month",
  "context": {
    "userId": "uuid",
    "page": "dashboard"
  }
}
```

**Response** (200 OK):
```json
{
  "response": "You have 15 active deals this month with a total value of $500,000. Your top deal is 'Enterprise Deal' worth $75,000 in the negotiation stage.",
  "suggestions": [
    "View deal details",
    "Create follow-up task",
    "Generate proposal"
  ],
  "usage": {
    "tokens": 150,
    "cost": 0.003
  }
}
```

### AI Image Generation

#### Generate Image
```http
POST /api/ai/generate-image
Content-Type: application/json

{
  "prompt": "Professional business presentation slide",
  "size": "1024x1024",
  "style": "professional"
}
```

**Response** (200 OK):
```json
{
  "imageUrl": "https://cdn.smartcrm.vip/images/uuid.png",
  "prompt": "Professional business presentation slide",
  "size": "1024x1024",
  "usage": {
    "cost": 0.02
  }
}
```

---

## White Label

### Tenant Management

#### Get Tenant Configuration
```http
GET /api/white-label/config
```

**Response** (200 OK):
```json
{
  "tenant": {
    "id": "uuid",
    "name": "Acme CRM",
    "domain": "crm.acme.com",
    "branding": {
      "logo": "https://cdn.acme.com/logo.png",
      "primaryColor": "#007bff",
      "secondaryColor": "#6c757d",
      "favicon": "https://cdn.acme.com/favicon.ico"
    },
    "features": {
      "ai_tools": true,
      "video_calling": true,
      "custom_domain": true
    },
    "limits": {
      "users": 100,
      "contacts": 10000,
      "storage": "50GB"
    }
  }
}
```

#### Update Branding
```http
PATCH /api/white-label/branding
Content-Type: application/json

{
  "logo": "https://cdn.acme.com/new-logo.png",
  "primaryColor": "#ff6b6b",
  "customCSS": ".header { background: #ff6b6b; }"
}
```

**Response** (200 OK):
```json
{
  "branding": {
    "logo": "https://cdn.acme.com/new-logo.png",
    "primaryColor": "#ff6b6b",
    "updatedAt": "2026-01-25T03:31:00Z"
  }
}
```

---

## Webhooks

### Webhook Events

#### Available Events
- `contact.created`
- `contact.updated`
- `contact.deleted`
- `deal.created`
- `deal.updated`
- `deal.moved`
- `deal.won`
- `deal.lost`
- `task.created`
- `task.completed`
- `user.signed_up`
- `subscription.updated`

#### Webhook Payload
```json
{
  "event": "deal.won",
  "timestamp": "2026-01-25T03:30:00Z",
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

#### Webhook Signature
All webhooks include a signature header for verification:
```http
X-SmartCRM-Signature: sha256=abc123...
```

**Verification**:
```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
```

---

## SDKs

### JavaScript/TypeScript SDK

#### Installation
```bash
npm install @smartcrm/sdk
```

#### Usage
```typescript
import { SmartCRM } from '@smartcrm/sdk';

const crm = new SmartCRM({
  apiKey: 'your_api_key',
  baseUrl: 'https://your-domain.com'
});

// List contacts
const contacts = await crm.contacts.list({
  page: 1,
  limit: 50
});

// Create contact
const contact = await crm.contacts.create({
  name: 'Jane Smith',
  email: 'jane@example.com'
});

// AI enrichment
const enrichment = await crm.ai.enrichContact(contact.id);
```

### Python SDK

#### Installation
```bash
pip install smartcrm-sdk
```

#### Usage
```python
from smartcrm import SmartCRM

crm = SmartCRM(
    api_key='your_api_key',
    base_url='https://your-domain.com'
)

# List contacts
contacts = crm.contacts.list(page=1, limit=50)

# Create contact
contact = crm.contacts.create(
    name='Jane Smith',
    email='jane@example.com'
)

# AI enrichment
enrichment = crm.ai.enrich_contact(contact['id'])
```

---

## Pagination

All list endpoints support pagination with consistent parameters:

**Request**:
```http
GET /api/contacts?page=2&limit=25
```

**Response**:
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 25,
    "total": 150,
    "pages": 6,
    "hasNext": true,
    "hasPrev": true
  }
}
```

---

## Filtering and Sorting

### Filtering
Use query parameters for filtering:
```http
GET /api/contacts?status=active&tags=vip,enterprise
```

### Sorting
Use `sort` and `order` parameters:
```http
GET /api/contacts?sort=createdAt&order=desc
```

### Search
Use `search` parameter for full-text search:
```http
GET /api/contacts?search=john+doe
```

---

## Best Practices

### 1. Use Pagination
Always paginate large result sets to improve performance.

### 2. Handle Rate Limits
Implement exponential backoff when rate limited.

### 3. Verify Webhooks
Always verify webhook signatures to ensure authenticity.

### 4. Cache Responses
Cache GET responses when appropriate to reduce API calls.

### 5. Use Batch Operations
Use batch endpoints when creating/updating multiple resources.

### 6. Monitor Usage
Track API usage to stay within rate limits and budget.

---

## Support

### Documentation
- **Full Docs**: https://docs.smartcrm.vip
- **API Reference**: https://api.smartcrm.vip/docs
- **Changelog**: https://docs.smartcrm.vip/changelog

### Contact
- **Email**: api-support@smartcrm.vip
- **Discord**: https://discord.gg/smartcrm
- **GitHub**: https://github.com/smartcrm/sdk

---

**Last Updated**: January 25, 2026  
**API Version**: v1  
**Status**: Production Ready ✅
