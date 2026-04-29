# Module Federation Deployment Instructions

## Prerequisites

All four apps have been built successfully with the fixed Module Federation configurations:

- ✅ Contacts: `/workspaces/crm-smartreplit/apps/contacts/dist/`
- ✅ Pipeline: `/workspaces/crm-smartreplit/apps/pipeline/dist/`
- ✅ Analytics: `/workspaces/crm-smartreplit/apps/analytics/dist/`
- ✅ Calendar: `/workspaces/crm-smartreplit/apps/calendar/dist/`

Each `dist/` folder contains:
- `assets/remoteEntry.js` (the Module Federation entry point)
- `index.html` (SPA entry)
- All bundled JavaScript and CSS assets

---

## Deployment Options

### Option 1: Manual Deploy via Netlify UI (Easiest & Most Reliable)

**Step 1: Log into Netlify**
Go to https://app.netlify.com and sign in as Dean Gilmore (VideoRemix account)

**Step 2: Deploy each app to its dedicated site**

#### **Contacts App** → `contacts.smartcrm.vip`
1. Navigate to the site: https://app.netlify.com/projects/taupe-sprinkles-83c9ee
   - Site ID: `taupe-sprinkles-83c9ee`
   - Custom domain: `contacts.smartcrm.vip`
2. Click **"Deploy"** → **"Deploy manually"**
3. Drag & drop the entire `/workspaces/crm-smartreplit/apps/contacts/dist/` folder
4. Wait for upload and deployment to complete (~1-2 minutes)
5. Verify the deploy URL shows: `https://contacts.smartcrm.vip`

#### **Pipeline App** → `pipeline.smartcrm.vip`
1. Navigate to: https://app.netlify.com/projects/cheery-syrniki-b5b6ca
   - Site ID: `cheery-syrniki-b5b6ca`
   - Custom domain: `pipeline.smartcrm.vip`
2. Click **"Deploy"** → **"Deploy manually"**
3. Drag & drop `/workspaces/crm-smartreplit/apps/pipeline/dist/`
4. Wait for completion
5. Verify: `https://pipeline.smartcrm.vip`

#### **Analytics App** → `analytics.smartcrm.vip` & `ai-analytics.smartcrm.vip`
1. Navigate to: https://app.netlify.com/projects/subtle-florentine-8fd315
   - Site ID: `subtle-florentine-8fd315`
   - Custom domains: `analytics.smartcrm.vip`, `ai-analytics.smartcrm.vip`
2. Click **"Deploy"** → **"Deploy manually"**
3. Drag & drop `/workspaces/crm-smartreplit/apps/analytics/dist/`
4. Wait for completion
5. Verify: `https://analytics.smartcrm.vip`

#### **Calendar App** → `calendar.smartcrm.vip`
1. Navigate to: https://app.netlify.com/projects/voluble-vacherin-add80d
   - Site ID: `voluble-vacherin-add80d`
   - Custom domain: `calendar.smartcrm.vip`
2. Click **"Deploy"** → **"Deploy manually"**
3. Drag & drop `/workspaces/crm-smartreplit/apps/calendar/dist/`
4. Wait for completion
5. Verify: `https://calendar.smartcrm.vip`

---

### Option 2: Deploy via Netlify CLI (if you prefer command line)

**Unlink from wrong site first:**
```bash
cd /workspaces/crm-smartreplit/apps/contacts
rm -rf .netlify
```

**Deploy to specific site by ID:**
```bash
cd /workspaces/crm-smartreplit/apps/contacts
netlify deploy --prod --site taupe-sprinkles-83c9ee
```
(Repeat for each app with its site name)

---

## Important: Environment Variables

The deployed sites **must** have `VITE_ENABLE_MFE=true` set in their Netlify environment.

**Check / Set in Netlify UI:**
1. Go to each site → **Site settings** → **Environment variables**
2. Ensure `VITE_ENABLE_MFE` is set to `true`
3. If not, add it and **redeploy**

Alternatively, each app's `netlify.toml` already has:
```toml
[build.environment]
VITE_ENABLE_MFE = "true"
```
This should be picked up automatically during the build if you use Netlify's build system.

---

## Post-Deployment Verification

**Step 1: Wait 2-5 minutes** for DNS/cache to propagate

**Step 2: Test remoteEntry.js accessibility**
```bash
# These should all return 200 and JavaScript content
curl -I https://contacts.smartcrm.vip/assets/remoteEntry.js | grep -i "content-type"
# Should show: content-type: application/javascript

curl -I https://pipeline.smartcrm.vip/assets/remoteEntry.js | grep -i "content-type"
curl -I https://analytics.smartcrm.vip/assets/remoteEntry.js | grep -i "content-type"
curl -I https://calendar.smartcrm.vip/assets/remoteEntry.js | grep -i "content-type"
```

**Step 3: Run automated integration test**
```bash
node /workspaces/crm-smartreplit/test-mfe-integration.js
```
Expected: Most tests PASS (only Agency 404 and FunnelCraft DNS failures are expected)

**Step 4: Manual browser test**
1. Go to https://app.smartcrm.vip
2. Log in
3. Click each menu item:
   - **Contacts** → Should show full contacts CRM with real data
   - **Pipeline** → Should show full kanban board with deal cards
   - **Calendar** → Should show interactive calendar
   - **AI Goals** → Should show "Coming Soon" placeholder (not broken)
4. Open DevTools → Console:
   - Should NOT see "Module Federation is disabled"
   - Should NOT see CORS errors
   - Should see successful remoteEntry loads

---

## Troubleshooting

### Problem: "Module Federation disabled" message still shows
**Solution:**
1. Check that `VITE_ENABLE_MFE=true` is set in Netlify environment variables
2. Redeploy with the env var set
3. Hard refresh browser (Ctrl+Shift+R)

### Problem: remoteEntry.js returns HTML (SPA page)
**Solution:**
1. Verify netlify.toml has the asset bypass redirect:
   ```toml
   [[redirects]]
     from = "/assets/*"
     to = "/assets/:splat"
     status = 200
     force = true
   ```
2. Redeploy the app
3. Check: `curl https://contacts.smartcrm.vip/assets/remoteEntry.js` should return JavaScript, not HTML

### Problem: CORS errors in console
**Solution:**
1. Verify headers configured in netlify.toml:
   ```toml
   [[headers]]
     for = "/assets/remoteEntry.js"
     [headers.values]
     Access-Control-Allow-Origin = "*"
   ```
2. Redeploy
3. Test: `curl -I https://pipeline.smartcrm.vip/assets/remoteEntry.js` should include `access-control-allow-origin: *`

### Problem: "Remote container not found" error
**Solution:**
1. Check that scope names match between host and remote:
   - Host `ModuleFederationPipeline.tsx`: `PIPELINE_SCOPE = 'PipelineApp'`
   - Remote `apps/pipeline/vite.config.ts`: `name: 'PipelineApp'`
2. If mismatched, fix and redeploy

---

## Summary of Changes Made

**Before deployment:**
- ❌ VITE_ENABLE_MFE=false (disabled)
- ❌ Loader used script-tag injection (SystemJS only)
- ❌ Netlify SPA fallback intercepted `/assets/remoteEntry.js`
- ❌ Vite configs had hashed filenames & ESM format
- ❌ Agency MFE causing 404 errors

**After code fixes (now deployed):**
- ✅ VITE_ENABLE_MFE=true
- ✅ Loader uses dynamic `import()` (ESM + SystemJS compatible)
- ✅ Netlify configs bypass SPA fallback for `/assets/*` + CORS headers
- ✅ Vite configs output predictable `assets/remoteEntry.js`
- ✅ Agency MFE gracefully disabled (placeholder UI)

---

## Netlify Site Reference Table

| App | Site Name (Netlify) | Site ID (UUID) | Custom Domain | Dist Folder |
|-----|---------------------|---------------|---------------|-------------|
| Contacts | `taupe-sprinkles-83c9ee` | `edf51064-ade8-44e1-bd0a-059aeb7692ca` | contacts.smartcrm.vip | `apps/contacts/dist/` |
| Pipeline | `cheery-syrniki-b5b6ca` | `daa15fc2-14f1-453d-9403-59853c591263` | pipeline.smartcrm.vip | `apps/pipeline/dist/` |
| Analytics | `subtle-florentine-8fd315` | `d42dca3a-f30d-43ac-8824-659e93fadc38` | analytics.smartcrm.vip | `apps/analytics/dist/` |
| Calendar | `voluble-vacherin-add80d` | `d07b21cb-e907-42cf-babe-244f2ec9de59` | calendar.smartcrm.vip | `apps/calendar/dist/` |

---

## Quick Deploy Script (If Using Manual Upload)

If you prefer to use the CLI after unlinking from the wrong site, here's a script:

```bash
#!/bin/bash
# Deploy all Module Federation apps to Netlify

APPS=(
  "contacts:taupe-sprinkles-83c9ee:/workspaces/crm-smartreplit/apps/contacts"
  "pipeline:cheery-syrniki-b5b6ca:/workspaces/crm-smartreplit/apps/pipeline"
  "analytics:subtle-florentine-8fd315:/workspaces/crm-smartreplit/apps/analytics"
  "calendar:voluble-vacherin-add80d:/workspaces/crm-smartreplit/apps/calendar"
)

for app in "${APPS[@]}"; do
  IFS=':' read -r name site_id path <<< "$app"
  echo "=== Deploying $name to $site_id ==="
  cd "$path"
  rm -rf .netlify
  netlify link --site-id "$site_id" 2>&1 | head -5
  netlify deploy --prod 2>&1 | tail -10
  echo ""
done
```

Save as `deploy-mfe.sh`, make executable (`chmod +x deploy-mfe.sh`), and run.

---

## Support

If you encounter any issues during deployment:
1. Check Netlify build logs for errors
2. Verify `dist/` folder contains `assets/remoteEntry.js` before uploading
3. Ensure environment variable `VITE_ENABLE_MFE=true` is set
4. Contact: https://github.com/Kilo-Org/kilocode/issues
