# SmartCRM End-to-End Testing Execution Plan

**Date:** 2026-02-11
**Status:** Ready for Execution

## Overview

This document outlines the comprehensive end-to-end testing plan for SmartCRM. Due to the testing environment requirements (running server with configured environment variables), this plan provides execution steps for testing when the server is available.

## Test Environment Requirements

### Required Environment Variables

```bash
# Server-side
BASE_URL=http://localhost:5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
GOOGLE_AI_API_KEY=your-google-ai-key
GEMINI_API_KEY=your-gemini-key
ELEVENLABS_API_KEY=your-elevenlabs-key

# Client-side (in client/.env)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Test Execution Commands

### 1. Start the Server
```bash
npm run dev
```

### 2. Run API Health Tests
```bash
node test-api-health.test.js
```

### 3. Run Comprehensive Test Suite
```bash
node comprehensive-test-runner.test.js
```

### 4. Run Supabase Edge Function Tests
```bash
node supabase-edge-functions.test.js
```

### 5. Run Fallback Mechanism Tests
```bash
node fallback-mechanisms.test.js
```

## Authentication Flow Tests

### Test 1: User Registration
**Endpoint:** POST `/api/auth/signup`
**Test Data:**
```json
{
  "email": "test@example.com",
  "password": "SecurePassword123!",
  "user_metadata": {
    "first_name": "Test",
    "last_name": "User"
  }
}
```
**Expected Result:** 201 Created with user object

### Test 2: User Login
**Endpoint:** POST `/api/auth/login`
**Test Data:**
```json
{
  "email": "test@example.com",
  "password": "SecurePassword123!"
}
```
**Expected Result:** 200 OK with session tokens

### Test 3: Password Reset
**Endpoint:** POST `/api/auth/reset-password`
**Test Data:**
```json
{
  "email": "test@example.com"
}
```
**Expected Result:** 200 OK (email sent)

### Test 4: Session Persistence
**Steps:**
1. Login and capture tokens
2. Make authenticated request with token
3. Token should be valid for 24 hours
**Expected Result:** Session persists across requests

## Core Platform Feature Tests

### Test 1: Contact Management
| Operation | Endpoint | Expected Result |
|-----------|----------|-----------------|
| Create Contact | POST `/api/contacts` | 201 Created |
| Get Contacts | GET `/api/contacts` | 200 OK with array |
| Update Contact | PUT `/api/contacts/:id` | 200 OK |
| Delete Contact | DELETE `/api/contacts/:id` | 200 OK |
| Search Contacts | GET `/api/contacts?search=query` | 200 OK with filtered results |

### Test 2: Deal Tracking
| Operation | Endpoint | Expected Result |
|-----------|----------|-----------------|
| Create Deal | POST `/api/deals` | 201 Created |
| Get Deals | GET `/api/deals` | 200 OK with array |
| Update Deal | PUT `/api/deals/:id` | 200 OK |
| Update Stage | PATCH `/api/deals/:id/stage` | 200 OK |
| Close Deal | POST `/api/deals/:id/close` | 200 OK |

### Test 3: Task Scheduling
| Operation | Endpoint | Expected Result |
|-----------|----------|-----------------|
| Create Task | POST `/api/tasks` | 201 Created |
| Get Tasks | GET `/api/tasks` | 200 OK with array |
| Update Task | PUT `/api/tasks/:id` | 200 OK |
| Complete Task | PATCH `/api/tasks/:id/complete` | 200 OK |
| Get Due Tasks | GET `/api/tasks?filter=due` | 200 OK |

### Test 4: Pipeline Visualization
**Endpoint:** GET `/api/pipeline`
**Expected Result:**
- 200 OK
- Pipeline stages with deal counts
- Total value per stage
- Conversion rates

### Test 5: Reporting Dashboard
| Endpoint | Expected Data |
|----------|---------------|
| GET `/api/dashboard/stats` | Deal counts, revenue, activities |
| GET `/api/dashboard/activity` | Recent activity feed |
| GET `/api/dashboard/charts` | Revenue charts, pipeline charts |

## Supabase Integration Tests

### Test 1: Direct Supabase Connection
```bash
# Test Supabase client connection
curl -X POST "https://your-project.supabase.co/rest/v1/users?select=count" \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key"
```

### Test 2: Edge Functions
| Function | Endpoint | Test Method |
|----------|----------|-------------|
| Analyze Sentiment | `/functions/v1/analyze-sentiment` | POST |
| Contacts CRUD | `/functions/v1/contacts` | GET/POST/PUT/DELETE |
| Deals CRUD | `/functions/v1/deals` | GET/POST/PUT/DELETE |
| Email Generator | `/functions/v1/draft-email-response` | POST |
| Sales Pitch | `/functions/v1/generate-sales-pitch` | POST |
| NLP Query | `/functions/v1/natural-language-query` | POST |
| Task Priority | `/functions/v1/prioritize-tasks` | POST |
| Summarize Notes | `/functions/v1/summarize-customer-notes` | POST |

### Test 3: Real-time Subscriptions
```javascript
// Test real-time subscription
const subscription = supabase
  .channel('public:contacts')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, 
    (payload) => console.log('Real-time update:', payload))
  .subscribe()
```

## Edge Case Tests

### Network Failure Scenarios
| Scenario | Expected Behavior |
|----------|-------------------|
| Server timeout (30s) | Fallback to cached data, show offline message |
| API key invalid | Graceful degradation, user notification |
| Network disconnection | Local storage fallback, sync queue |
| Rate limit exceeded | Retry with backoff, user notification |

### Invalid Input Scenarios
| Input | Expected Behavior |
|-------|-------------------|
| Invalid email format | Validation error message |
| Missing required fields | 400 Bad Request |
| SQL injection attempt | Sanitized input, 400 error |
| XSS attempt | Input sanitized, no execution |

### Concurrent User Operations
| Scenario | Expected Behavior |
|----------|-------------------|
| Two users edit same contact | Last write wins with timestamp |
| Bulk delete while viewing | Optimistic UI updates |
| Multiple API calls | Proper session handling |

## API Response Validation

### Success Response Format
```json
{
  "status": "success",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error Response Format
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": { ... }
  }
}
```

## Security Tests

### Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Login with expired token
- [ ] Access protected route without token
- [ ] Access protected route with invalid token
- [ ] Password reset flow
- [ ] Email confirmation flow

### Authorization
- [ ] User can only access own data
- [ ] Admin can access all data
- [ ] Role-based access control (RBAC)
- [ ] API rate limiting

### Data Protection
- [ ] Sensitive data not in logs
- [ ] Passwords hashed
- [ ] API keys not exposed
- [ ] CORS configured correctly

## Performance Tests

### Load Testing
- [ ] 100 concurrent users
- [ ] 500 concurrent users
- [ ] 1000 concurrent users

### Response Time Targets
| Endpoint | Target Response Time |
|----------|---------------------|
| GET /api/health | < 100ms |
| GET /api/contacts | < 500ms |
| POST /api/deals | < 1000ms |
| GET /api/dashboard | < 2000ms |

## Browser Compatibility Tests

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] Safari (iOS)
- [ ] Chrome (Android)

### Accessibility Tests
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] ARIA labels
- [ ] Color contrast

## Test Execution Checklist

- [ ] All environment variables configured
- [ ] Server running and accessible
- [ ] Supabase project configured
- [ ] Edge functions deployed
- [ ] Test data created
- [ ] Test users created
- [ ] Monitoring active

## Bug Reporting Template

```markdown
## Bug Report

**Severity:** Critical / Major / Minor / Trivial
**Priority:** High / Medium / Low

**Steps to Reproduce:**
1. Go to...
2. Click on...
3. See error...

**Expected Behavior:**
...

**Actual Behavior:**
...

**Screenshots:**

**Environment:**
- OS:
- Browser:
- SmartCRM Version:
```

## Test Results Summary

After execution, document:
- Total tests run
- Pass rate
- Critical failures
- Warnings
- Recommendations
