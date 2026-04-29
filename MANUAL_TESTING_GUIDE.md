# SmartCRM Entitlement Integration - Manual Testing Guide

## Pre-requisites
1. Dev server running: `npm run dev`
2. Access at http://localhost:3000
3. Use test accounts below

---

## Test Matrix

| User Type | Email | Password | Expected Features |
|-----------|-------|----------|-------------------|
| Super Admin | dean@smartcrm.vip | (login via magic link) | All features visible |
| Whitelabel | fredrik.kaada@gmail.com | (login via magic link) | White Label + Core CRM + AI + Communication (no Admin/OpenClaw) |
| SmartMarketer | thomaspublications@gmail.com | (login via magic link) | All AI + Analytics + Communication (no White Label/OpenClaw/Admin) |
| No Access | stevebarrett.ceo@gmail.com | (login via magic link) | Nothing - redirects to upgrade |
| New User | [any new email] | (sign up) | Core CRM only (Dashboard, Contacts, Pipeline, Calendar) |

---

## Test 1: Super Admin (dean@smartcrm.vip)

**Steps:**
1. Sign in with `dean@smartcrm.vip`
2. Check Navbar menu items visible:
   - [x] Dashboard
   - [x] Contacts (with AI Enhancements tab)
   - [x] Pipeline
   - [x] Calendar
   - [x] AI Tools
   - [x] AI Goals
   - [x] GTM Prompt Hub
   - [x] Analytics / Deal Intelligence
   - [x] Communication Hub (Video Email, SMS, Phone, Appointments)
   - [x] OpenClaw AI CRM (/openclaw accessible)
   - [x] White Label menu (Customization, Management, Package Builder, Revenue, Partner Dashboard, Partner Onboarding)
   - [x] Admin menu (/admin accessible)

**Direct URL Tests:**
- `/openclaw` → loads OpenClaw page
- `/admin` → loads Admin dashboard
- `/white-label` → loads White Label Customization

---

## Test 2: Whitelabel User (fredrik.kaada@gmail.com)

**Steps:**
1. Sign in with `fredrik.kaada@gmail.com`
2. Check Navbar:
   - [x] Core CRM (Dashboard, Contacts, Pipeline, Calendar)
   - [x] AI Tools and Analytics
   - [x] Communication Hub (SMS, Phone, Video Email, Appointments)
   - [x] White Label menu (Customization, Management, Package Builder, Revenue Sharing, Partner Dashboard, Partner Onboarding)
   - [ ] OpenClaw (NOT visible - no openclaw feature)
   - [ ] Admin menu (NOT visible - no admin_panel feature)

**Direct URL Tests:**
- `/white-label` → ✅ loads
- `/white-label-management` → ✅ loads
- `/package-builder` → ✅ loads
- `/partner-dashboard` → ✅ loads
- `/partner-onboarding` → ✅ loads
- `/openclaw` → ❌ redirects to /upgrade
- `/admin` → ❌ redirects to /upgrade
- `/ai-tools` → ✅ loads
- `/text-messages` → ✅ loads
- `/phone-system` → ✅ loads

---

## Test 3: SmartMarketer User (thomaspublications@gmail.com)

**Steps:**
1. Sign in with `thomaspublications@gmail.com`
2. Check Navbar:
   - [x] Core CRM (Dashboard, Contacts, Pipeline, Calendar)
   - [x] AI Tools, AI Goals, GTM Prompt Hub
   - [x] Analytics & Intelligence dashboards
   - [x] Communication Hub (SMS, Phone, Video Email, Appointments)
   - [x] Buy Credits
   - [ ] White Label menu (NOT visible)
   - [ ] OpenClaw (NOT visible)
   - [ ] Admin menu (NOT visible)

**Direct URL Tests:**
- `/ai-tools` → ✅ loads
- `/analytics` → ✅ loads
- `/text-messages` → ✅ loads
- `/phone-system` → ✅ loads
- `/video-email` → ✅ loads
- `/appointments` → ✅ loads
- `/white-label` → ❌ redirects to /upgrade
- `/openclaw` → ❌ redirects to /upgrade
- `/admin` → ❌ redirects to /upgrade

---

## Test 4: No Access User (stevebarrett.ceo@gmail.com)

**Steps:**
1. Sign in with `stevebarrett.ceo@gmail.com`
2. Expected behavior:
   - Dashboard immediately redirects to `/upgrade`
   - Navbar shows minimal (only Sign Out maybe)
   - Any API call to `/api/*` returns 403

**Direct URL Tests:**
- `/dashboard` → ❌ redirects to /upgrade
- `/contacts` → ❌ redirects to /upgrade
- `/api/contacts` → ❌ 403 Forbidden
- `/api/appointments` → ❌ 403 Forbidden

---

## Test 5: New User Registration

**Steps:**
1. Sign up with a new email (e.g., `newuser@test.com`)
2. Complete registration
3. Expected:
   - Auto-creates `regular` package in `user_entitlements`
   - Navbar shows: Dashboard, Contacts, Pipeline, Calendar only
   - Cannot access AI Tools (redirects to upgrade)
   - Cannot access White Label (redirects)
   - Cannot access Communications (redirects — communications require at least smartmarketer)

**Direct URL Tests:**
- `/dashboard` → ✅ loads
- `/contacts` → ✅ loads
- `/ai-tools` → ❌ redirects to /upgrade
- `/text-messages` → ❌ redirects to /upgrade

---

## API-Level Verification (DevTools/Postman)

After logging in as each user, inspect network calls:

**Expected 200 OK:**
- `GET /api/contacts` (if user has contacts feature)
- `GET /api/appointments` (if user has appointments)

**Expected 403 Forbidden:**
- `GET /api/themes` (whitelabel only) — smartmarketer gets 403
- `GET /api/openclaw/...` (openclaw only) — whitelabel/smartmarketer get 403
- Any `/api/*` for no_access user → 403

---

## Common Issues & Fixes

**Issue**: Navbar still shows menu items user shouldn't see
- Check: `EntitlementContext` loaded? Look for loading spinner
- Fix: Ensure Supabase client is configured correctly in lib/supabase.ts

**Issue**: Routes don't redirect to upgrade
- Check: `ProtectedRoute` is wrapping the route with correct `featureKey`
- Fix: Verify `FeatureKey` enum matches ROUTE_FEATURE_MAP in entitlements.ts

**Issue**: API calls succeed but shouldn't
- Check: Server middleware order (requireAuth + requireEntitlement)
- Fix: Clear session, re-login to refresh entitlements

---

## Verification Checklist

- [ ] Super admin sees ALL features, can access /admin and /openclaw
- [ ] Whitelabel sees White Label menu and AI tools, but NOT OpenClaw/Admin
- [ ] SmartMarketer sees AI, Analytics, Communication, but NOT White Label/OpenClaw/Admin
- [ ] NoAccess user sees nothing, all routes redirect
- [ ] New user gets regular package with only core CRM
- [ ] API protection: no_access requests are blocked server-side
- [ ] API protection: wrong package feature requests are blocked (e.g., smartmarketer accessing /api/themes)

All tests pass → Integration complete ✓
