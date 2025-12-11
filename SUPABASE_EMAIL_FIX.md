# FIX: Empty Recovery URL in Supabase Password Reset Emails

## Problem
Password reset emails are sending, but the `{{ .ConfirmationURL }}` is empty or not populated with your custom redirect URL.

## Root Cause
Based on official Supabase GitHub issue #10534, the problem is:
1. The email template variable might not be correctly set up
2. OR the redirect URL needs an exact match in the whitelist INCLUDING the full path

## ✅ SOLUTION: Use Token Hash Email Template

Since `{{ .ConfirmationURL }}` is empty in your emails, you need to use the token_hash approach instead.

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project: `Business Branding AI`
3. Navigate to: **Authentication** → **Email Templates**
4. Click on **Reset Password** template

### Step 2: **REPLACE** Your Template With This Token Hash Version

This is the proven working solution for your issue:

```html
<h2>Reset Your Password</h2>

<p>Follow this link to reset the password for your SmartCRM account:</p>

<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/reset-password">Reset Password</a>
</p>

<p>If clicking the link doesn't work, copy and paste this URL into your browser:</p>
<p><code>{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/reset-password</code></p>

<p>If you didn't request this password reset, you can safely ignore this email.</p>
```

**✅ Your app already has the handler!**

Good news! Your existing `/client/src/pages/Auth/AuthConfirm.tsx` already handles this token_hash flow:
- It checks for `token_hash` and `type` query parameters  
- It calls `supabase.auth.verifyOtp()` to verify the token
- It redirects to `/auth/reset-password` for recovery type
- The route is already registered in `App.tsx` as `/auth/confirm`

**No code changes needed!** Just update the Supabase email template and it will work immediately.

### Step 3: Double-Check Redirect URLs

Make sure these EXACT URLs are in your whitelist (Authentication → URL Configuration → Redirect URLs):

```
https://app.smartcrm.vip/auth/reset-password
https://app.smartcrm.vip/auth/confirm
https://app.smartcrm.vip/auth/callback
https://app.smartcrm.vip/**
```

**IMPORTANT**: 
- URLs must match EXACTLY (including trailing slashes if your code uses them)
- Use `/**` wildcard to match all paths under your domain

### Step 4: Test

1. Clear browser cache (Ctrl+Shift+R)
2. Test password reset flow
3. Check your email
4. Click the link - it should now work!

## Why This Happens

From Supabase GitHub issue #10534:
> "The redirect URL's in the dashboard need to match the redirectTo URL including the path."

The `{{ .ConfirmationURL }}` variable only populates correctly when:
1. Your redirect URL is EXACTLY whitelisted (full path, not just domain)
2. The email template is properly configured
3. You're using the correct Supabase auth flow (PKCE)

## Quick Verification

After updating the template, check the raw email HTML:
1. Send yourself a test password reset email
2. View the email source/HTML
3. Look for the `href=` attribute
4. It should show: `https://app.smartcrm.vip/auth/confirm?token_hash=...&type=recovery&next=/auth/reset-password`

**How it works:**
- Link goes to `/auth/confirm` first (handled by your AuthConfirm.tsx)
- AuthConfirm verifies the token_hash with Supabase
- On success, it redirects to `/auth/reset-password` where you can set a new password

If the URL is missing or wrong, the template variable isn't configured correctly.

## Still Not Working?

1. **Wait 5 minutes** - Supabase template changes take time to propagate
2. **Check Site URL** - Make sure it's set to `https://app.smartcrm.vip` in Dashboard → Authentication → Settings
3. **Test with different email** - Some email providers cache templates
4. **Check Supabase Logs** - Dashboard → Logs → Auth Logs for errors
5. **Try incognito mode** - Rules out browser caching issues

## Your Code is Correct!

Your current implementation in `client/src/lib/supabase.ts` is perfect:
- ✅ Correctly sends `redirectTo` parameter
- ✅ Uses proper production URL
- ✅ Has comprehensive logging

The issue is purely in the Supabase email template configuration.
