# Password Reset Flow Audit - SmartCRM

## Error: "Authentication service is not configured. Please contact support."

---

## DEBUG PACKET (Please fill in):

1. **App URL (production):** ____________________

2. **Supabase Project Ref:** `gadedbrnqzpfqtsdfzcg` (confirmed linked)

3. **Supabase Auth settings:**
   - Site URL: ____________________
   - Redirect URLs list: ____________________

4. **Netlify env vars (names only):**
   - VITE_SUPABASE_URL = (present? yes/no)
   - VITE_SUPABASE_ANON_KEY = (present? yes/no)
   - Any others: ____________________

5. **Password reset email link format:**
   ```
   {{ .SiteURL }}/auth/reset-password?token_hash={{ .TokenHash }}&type=recovery
   ```

6. **Frontend routes:**
   - /auth/reset-password exists? yes/no
   - /auth/callback exists? yes/no

7. **Browser console error:** ____________________

8. **Network response for failing request:** ____________________

---

## Expected Password Reset Flow (Correct Implementation)

```
1. User enters email on /forgot-password
2. Supabase sends email with link:
   https://app.smartcrm.vip/auth/reset-password?token_hash=XXX&type=recovery
3. User clicks link → /auth/reset-password?token_hash=XXX&type=recovery
4. Frontend extracts token_hash from URL
5. Frontend calls supabase.auth.resetPasswordForEmail(newPassword, options)
   - Must include: { email, token_hash, type: 'recovery' }
6. Supabase verifies token
7. Password updated, session established
8. User redirected to /dashboard
```

---

## 5 Most Likely Root Causes

| # | Root Cause | Why |
|---|------------|-----|
| 1 | **Site URL mismatch** | Supabase checks that redirect URLs match Site URL exactly |
| 2 | **Redirect URLs missing** | Reset URL not in allowed redirect list |
| 3 | **Token hash not extracted** | Frontend fails to get token_hash from URL params |
| 4 | **VITE_ env vars missing** | Client can't reach Supabase API |
| 5 | **Email template wrong** | Reset link points to wrong URL |

---

## 10-Minute Diagnostic Plan

### Step 1: Verify Netlify Env Vars (2 min)
```bash
# Check if VITE_ vars are present in deployed app
# Open browser DevTools → Network tab
# Look for requests to supabase.co
```

**Expected:** Requests succeed, 200 OK  
**Fix if fail:** Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Netlify

### Step 2: Check Supabase Site URL (2 min)
- Go to Supabase Dashboard → Authentication → URL Configuration
- Verify Site URL matches your app URL exactly

**Expected:** Site URL = `https://app.smartcrm.vip`  
**Fix:** Update Site URL if different

### Step 3: Check Redirect URLs (2 min)
- Supabase Dashboard → Authentication → URL Configuration
- Verify these URLs are in "Redirect URLs":
  - `https://app.smartcrm.vip/auth/reset-password`
  - `https://app.smartcrm.vip/auth/callback`
  - `https://app.smartcrm.vip/auth/recovery`

**Expected:** All 3 URLs present  
**Fix:** Add missing URLs

### Step 4: Check Reset Email Template (2 min)
- Supabase Dashboard → Authentication → Email Templates
- Verify reset template has correct URL:
  ```
  {{ .SiteURL }}/auth/reset-password?token_hash={{ .TokenHash }}&type=recovery
  ```

**Expected:** URL matches your reset route exactly  
**Fix:** Update template if URL format is wrong

### Step 5: Check Frontend Route Handler (2 min)
- Open `/auth/reset-password` page in browser
- Check console for errors when page loads
- Check Network tab for API calls

**Expected:** No errors, token_hash extracted from URL  
**Fix:** Update page code if token not being parsed

---

## Supabase Dashboard Checklist

### Authentication → URL Configuration
- [ ] Site URL: `https://app.smartcrm.vip`
- [ ] Redirect URLs:
  - [ ] `https://app.smartcrm.vip/auth/reset-password`
  - [ ] `https://app.smartcrm.vip/auth/callback`
  - [ ] `https://app.smartcrm.vip/auth/recovery`
  - [ ] `https://app.smartcrm.vip`
  - [ ] `http://localhost:5173` (for local dev)

### Authentication → Email Templates
- [ ] Reset password template URL:
  ```
  {{ .SiteURL }}/auth/reset-password?token_hash={{ .TokenHash }}&type=recovery
  ```

### Authentication → Users
- [ ] Keith's account exists and is confirmed

---

## Netlify Checklist

### Site Settings → Environment Variables
- [ ] `VITE_SUPABASE_URL` = `https://gadedbrnqzpfqtsdfzcg.supabase.co`
- [ ] `VITE_SUPABASE_ANON_KEY` = (anon key value)

---

## Next 3 Checks

1. **Verify Netlify deployment** - Check that VITE_ variables are actually deployed
2. **Check Supabase Site URL** - Confirm it matches your app URL exactly
3. **Test the reset flow** - Trigger a reset and capture browser console logs
