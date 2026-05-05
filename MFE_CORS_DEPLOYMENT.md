# Deployment Instructions for Module Federation CORS Fix

## Files to Deploy

The following files need to be deployed to their respective remote applications:

### 1. Contacts App (contacts.smartcrm.vip)
**File:** `contacts-app/netlify/_headers`
```
# CORS headers for Module Federation support
# Allow cross-origin requests from app.smartcrm.vip for dynamic imports

*.js
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization, X-Client-Info, Apikey
  Cache-Control: public, max-age=3600, s-maxage=86400

# Allow all origins for remoteEntry.js specifically
remoteEntry.js
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization, X-Client-Info, Apikey
  Cache-Control: public, max-age=1800, s-maxage=3600
```

### 2. Analytics App (ai-analytics.smartcrm.vip)
**File:** `analytics-app/netlify/_headers`
```
# CORS headers for Module Federation support
# Allow cross-origin requests from app.smartcrm.vip for dynamic imports

*.js
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization, X-Client-Info, Apikey
  Cache-Control: public, max-age=3600, s-maxage=86400

# Allow all origins for remoteEntry.js specifically
remoteEntry.js
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization, X-Client-Info, Apikey
  Cache-Control: public, max-age=1800, s-maxage=3600
```

## Deployment Steps

1. **Copy files to deployment repositories:**
   - Copy `contacts-app/netlify/_headers` to the contacts app deployment repo
   - Copy `analytics-app/netlify/_headers` to the analytics app deployment repo

2. **Deploy to Netlify:**
   - Deploy contacts app with the new `_headers` file
   - Deploy analytics app with the new `_headers` file

3. **Verify CORS headers:**
   ```bash
   curl -I https://contacts.smartcrm.vip/remoteEntry.js | grep -i access-control
   curl -I https://ai-analytics.smartcrm.vip/remoteEntry.js | grep -i access-control
   ```

## Expected Results

After deployment:
- ✅ Contacts MFE should load without CORS errors
- ✅ Analytics MFE should load without CORS errors
- ✅ Pipeline and Calendar MFEs should continue working (already have CORS)
- ✅ Improved error handling with retry buttons and user-friendly messages

## Testing

Test the main application at `https://app.smartcrm.vip` after deployment:
1. Navigate to Dashboard
2. Click on Contacts section
3. Click on Analytics section
4. Verify no CORS errors in browser console
5. Verify apps load properly

## Rollback Plan

If issues occur:
1. Remove the `_headers` files from deployments
2. Re-deploy without CORS headers
3. MFE apps will show fallback components instead