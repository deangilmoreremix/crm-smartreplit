# Commit Documentation: Bug Fixes and UI Improvements

## Overview
This commit addresses multiple production readiness issues and UI bugs identified during the signing process.

## Changes Summary

### 1. Authentication & Security Fixes (server/routes/auth.ts)
**Issue:** No rate limiting on authentication endpoints  
**Fix:** Added in-memory rate limiter to prevent brute force attacks
- 5 login attempts per 15-minute window per IP
- Returns 429 status code with retry timer when exceeded
- Applied to all `/api/auth` routes

### 2. Edge Function Security (server/entitlements/index.ts)
**Issue:** Hardcoded user ID ('dev-user-12345') in production entitlements edge function  
**Fix:** Implemented JWT token parsing from Authorization header
- Extracts and validates JWT token from Bearer header
- Parses user ID from token payload
- Maintains dev bypass for development environments
- Returns 401 for missing/invalid authentication

### 3. Business Intelligence Dropdown (client/src/components/Navbar.tsx)
**Issue:** "Business Intel" dropdown menu was empty when clicked  
**Fix:** Added proper dropdown items with Business Intelligence features
- KPI Analysis
- Deal Intelligence
- Contact Analytics
- Task Intelligence
- Revenue Forecast
- Productivity Metrics
- AI Business Insights
- External Analytics
- Implemented portal-based dropdown for consistent UX

### 4. AI Assistant Chat (client/src/pages/AITools.tsx)
**Issue:** AI Assistant tool not rendering when clicked  
**Root Cause:** ID mismatch - tool used 'ai-assistant' but switch case looked for 'ai-assistant-chat'  
**Fix:**
- Fixed switch case from 'ai-assistant-chat' to 'ai-assistant'
- Added missing import for AIAssistantChat component

### 5. Landing Page Branding
**Issue:** Multiple pages showing "Smart CRMCRM" instead of "SmartCRM"  
**Fix:** Normalized all branding to "SmartCRM" consistently across:
- LandingPage.tsx
- LandingHeader.tsx
- LandingFooter.tsx

## Testing
- All dropdown menus now display proper items
- AI Assistant opens correctly when clicked
- Rate limiting tested with multiple rapid requests
- Authentication flow verified

## Deployment Notes
- Database migration for tenant_configs table should be run
- Environment variables should be verified (OPENAI_API_KEY, etc.)
- Dev bypass is preserved for local development

## Files Modified
- server/routes/auth.ts
- server/entitlements/index.ts
- client/src/components/Navbar.tsx
- client/src/pages/AITools.tsx
- client/src/pages/LandingPage.tsx
- client/src/pages/landing/components/LandingHeader.tsx
- client/src/pages/landing/components/LandingFooter.tsx

Commit: <PENDING>
Date: 2026-01-31
