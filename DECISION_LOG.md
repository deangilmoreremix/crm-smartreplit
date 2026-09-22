# SmartCRM Decision Log

## Overview

SmartCRM is a multi-tenant CRM system with white-label support, built for scalability and customization across different tenants.

## Technology Stack

### Frontend

| Technology     | Decision | Rationale                                             |
| -------------- | -------- | ----------------------------------------------------- |
| React 18       | Chosen   | Component-based architecture with excellent ecosystem |
| Vite 7         | Chosen   | Fast HMR, optimized builds, native ESM support        |
| Tailwind CSS 4 | Chosen   | Utility-first, maintainable styling                   |
| Wouter         | Chosen   | Lightweight router, React 18 compatible               |
| TanStack Query | Chosen   | Server state management, caching, optimistic updates  |
| Zustand        | Chosen   | Client state management, simple API                   |
| Radix UI       | Chosen   | Accessible, unstyled primitives                       |
| Recharts       | Chosen   | Composable charts, React-native                       |
| Framer Motion  | Chosen   | Declarative animations                                |

### Backend

| Technology  | Decision | Rationale                                        |
| ----------- | -------- | ------------------------------------------------ |
| Express.js  | Chosen   | Battle-tested Node.js framework                  |
| Supabase    | Chosen   | PostgreSQL + Auth + Realtime + Vector extensions |
| Drizzle ORM | Chosen   | Type-safe, lightweight, SQL-like syntax          |
| Passport.js | Chosen   | Flexible authentication middleware               |
| OpenAI SDK  | Chosen   | AI/ML capabilities for contact enrichment        |

### Infrastructure

| Technology        | Decision | Rationale                       |
| ----------------- | -------- | ------------------------------- |
| Netlify           | Chosen   | Edge functions, serverless, CDN |
| Redis             | Chosen   | Session storage, caching layer  |
| Neon (PostgreSQL) | Chosen   | Serverless Postgres, branching  |

## Architecture Decisions

### 1. Multi-Tenant Architecture

**Decision:** Row-level security (RLS) with tenant isolation via `tenant_id`

**Implementation:**

- All tenant-scoped tables include `tenant_id` column
- RLS policies enforce tenant isolation
- API routes validate tenant context from JWT claims

**Alternatives Considered:**

- Separate databases per tenant: Rejected due to operational complexity
- Schema-per-tenant: Rejected due to migration management overhead

### 2. Module Federation for White-Label

**Decision:** @originjs/vite-plugin-federation for micro-frontends

**Implementation:**

- Host application loads remote modules at runtime
- White-label configurations served as remote modules
- Theming via CSS variables and runtime configuration

**Benefits:**

- Independent deployment of tenant customizations
- Shared core application code
- Dynamic module loading based on tenant

### 3. API Design

**Decision:** RESTful API with function-based serverless endpoints

**Structure:**

- `/api/*` routes mapped to Netlify Functions
- Express middleware stack for authentication, validation
- Standard response format: `{ data, error, meta }`

### 4. Authentication Flow

**Decision:** Supabase Auth with JWT session management

**Flow:**

1. User authenticates via Supabase
2. JWT contains `tenant_id` and `user_id` claims
3. Session stored in Redis for scaling
4. RLS policies enforce data access

### 5. Contact Enrichment & AI Scoring

**Decision:** OpenAI-powered enrichment with caching

**Features:**

- AI-based contact data enrichment
- Lead scoring with detailed rationale
- Activity tracking and timeline
- Bulk enrichment support

**Caching:**

- Enrichment results cached to reduce API calls
- 7-day TTL for cached data
- Background refresh capability

### 6. Custom Fields System

**Decision:** EAV (Entity-Attribute-Value) pattern

**Implementation:**

- `custom_fields` table with JSONB storage
- Dynamic field definitions per tenant
- Type validation (string, number, date, boolean)

### 7. Real-time Features

**Decision:** Supabase Realtime subscriptions

**Use Cases:**

- Contact updates
- Deal stage changes
- Activity feed
- Notifications

## Performance Optimizations

1. **Edge Caching:** Static assets cached at CDN level
2. **Database Indexing:** Strategic indexes on frequent queries
3. **Query Optimization:** Drizzle ORM query analysis
4. **Lazy Loading:** Route-based code splitting
5. **Background Processing:** Bulk operations queued

## Security Measures

1. **Row-Level Security:** Database-level tenant isolation
2. **Input Validation:** Zod schemas for all inputs
3. **Rate Limiting:** API endpoint protection
4. **CORS:** Configured for production domains
5. **Helmet.js:** Security headers
6. **Secret Scanning:** Netlify build-time scanning

## Future Considerations

1. GraphQL API for complex queries
2. WebSocket connections for real-time
3. Advanced analytics with data warehousing
4. Machine learning for predictive lead scoring
