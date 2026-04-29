# Module Federation Integration Test Suite

Comprehensive test suite for verifying Module Federation (MFE) deployment and integration for SmartCRM.

## Files

### 1. Node.js Test Script
**File:** `test-mfe-integration.js`

Node.js script that performs automated HTTP tests on all MFE routes and remoteEntry.js endpoints.

**Usage:**
```bash
# Test default URL (https://app.smartcrm.vip)
node test-mfe-integration.js

# Test custom URL (e.g., staging or dev)
node test-mfe-integration.js https://your-domain.com
```

**What it tests:**
- HTTP status codes (expects 200) for all MFE routes
- Presence of "Module Unavailable" fallback messages
- RemoteEntry.js file accessibility  
- CORS headers on remoteEntry.js responses
- Content type validation
- Page title correctness
- Iframe accessibility for analytics route
- Optional: excluded iframe URLs (funnelcraft-ai, smartcrm-closer)

**Exit codes:**
- `0` = All tests passed
- `1` = One or more tests failed

### 2. Browser Test Page
**File:** `client/public/mfe-test.html`

Interactive HTML page for manual testing directly in the browser.

**How to use:**
1. Build/deploy the app so that `/mfe-test.html` is accessible
2. Open in browser: `https://app.smartcrm.vip/mfe-test.html`
3. View the current `VITE_ENABLE_MFE` value displayed at the top
4. Click test buttons to individually test each route and remoteEntry
5. See real-time results and summary counts

**Features:**
- Shows whether MFE is enabled (reads `import.meta.env.VITE_ENABLE_MFE`)
- One-click testing of all 5 MFE routes
- One-click testing of all 5 remoteEntry.js files
- Optional testing of excluded iframe apps
- Live log of all test actions
- Color-coded results (green = pass, red = fail, yellow = warning)
- Summary counter showing passed/failed/warning counts

## Tested Routes

| Route | Type | Expected Behavior |
|-------|------|-------------------|
| `/contacts` | MFE | Loads ContactsApp via Module Federation |
| `/pipeline` | MFE | Loads PipelineApp via Module Federation |
| `/calendar` | MFE | Loads CalendarApp via Module Federation |
| `/ai-goals` | Placeholder | Shows "Coming Soon" message (MFE disabled) |
| `/analytics-remote` | Iframe | Shows Analytics app in iframe |

**Not tested** (iframe-only, no MFE):
- `/funnelcraft-ai` → loads `https://landing.smartcrm.vip/`
- `/smartcrm-closer` → loads `https://agency.smartcrm.vip/`

## RemoteEntry.js Endpoints

| App | URL |
|-----|-----|
| Contacts | `https://contacts.smartcrm.vip/assets/remoteEntry.js` |
| Pipeline | `https://pipeline.smartcrm.vip/assets/remoteEntry.js` |
| Calendar | `https://calendar.smartcrm.vip/assets/remoteEntry.js` |
| Agency (AI Goals) | `https://agency.smartcrm.vip/assets/remoteEntry.js` |
| Analytics | `https://ai-analytics.smartcrm.vip/assets/remoteEntry.js` |

## What the Tests Check

### For Routes
1. **Status Code 200** – Page loads successfully
2. **No Fallback** – Not showing "Module Unavailable" message
3. **Correct Content** – Placeholder vs. loaded MFE as expected
4. **Iframe Presence** – Analytics page contains iframe element
5. **Page Title** – Matches expected app name

### For RemoteEntry.js
1. **Accessible (200)** – File can be fetched
2. **CORS Headers** – `Access-Control-Allow-Origin` present
3. **JavaScript Content-Type** – `application/javascript`
4. **Valid remoteEntry** – Contains Module Federation initialization code

## Interpreting Results

### ✅ All Passed
All routes and remoteEntry.js files are accessible. MFE integration is healthy.

### ❌ Some Failed
Check:
- All remote apps are deployed and running
- `assets/remoteEntry.js` exists at correct paths
- CORS headers are configured on remote servers
- DNS resolves for all `*.smartcrm.vip` subdomains
- `VITE_ENABLE_MFE=true` in production environment
- `NODE_ENV=production` (MFEs only load in production per vite.config.ts:15)

### ⚠️ Warnings
- Missing CORS headers (may still work in some scenarios)
- Unexpected page title (might be intentional)
- Content length too short (possibly empty response)

## Configuration Notes

From `vite.config.ts`:
- MFE only loads when `NODE_ENV === 'production'` (line 15)
- `VITE_ENABLE_MFE` environment variable controls MFE activation
- Remotes configured as: PipelineApp, AnalyticsApp, ContactsApp, CalendarApp, AIGoalsApp

Environment Variables:
```env
VITE_ENABLE_MFE=true   # Enable MFE loading
NODE_ENV=production    # Required for MFE to initialize (vite-plugin-federation)
```

## Quick Test in CI/CD

Add to your deployment pipeline:

```bash
# After deployment, run:
node test-mfe-integration.js https://app.smartcrm.vip

# If exit code is 0, MFE integration is healthy
```

## Troubleshooting

### "Module Unavailable" fallback showing
- `VITE_ENABLE_MFE` is `false` or undefined
- `NODE_ENV` is not `production`
- RemoteEntry.js failed to load (404/CORS/network error)

### RemoteEntry.js 404
- Deploy may not be complete
- Check path: should be at `https://[app].smartcrm.vip/assets/remoteEntry.js`
- Vite builds to `dist/assets/` by default

### CORS errors in browser
- Add `Access-Control-Allow-Origin: *` (or specific origin) on remote servers
- Preflight OPTIONS requests also need CORS headers
- Test with the Node script (bypasses CORS) to isolate server vs. browser issues

### Tests pass but app still shows fallback
- Browser may be loading an old cached build
- Clear CDN cache if using Cloudflare/other CDN
- Check `NODE_ENV=production` is set on server
- Verify environment variable `VITE_ENABLE_MFE=true` is in built client
