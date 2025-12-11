# Supabase Webhook Configuration Guide

## Current Status
✅ Webhook endpoint is working: `https://9f38fddb-d049-4cd4-9f57-c41b6a878a9d-00-2xv27ubfspt46.riker.replit.dev/api/auth-webhook`
✅ Email templates are ready and configured
✅ Bulk import system is operational

## Why Your Webhook Might Not Be Working

### 1. UPDATED: Supabase Uses Different Email Template System
**After reviewing Supabase docs:** Auth Hooks are for password validation and MFA, not email template routing.

**For Email Templates, Use:**
1. Go to **Authentication → Emails** in your Supabase Dashboard
2. Upload custom email templates directly
3. Set default templates for:
   - Confirm signup
   - Magic link
   - Recovery (password reset)
   - Invite user
   - Email change

### 2. Alternative: Direct Template Upload
Instead of webhooks, upload our email templates:
- Use the HTML files from `/email-templates/` folder
- Upload directly in Authentication → Emails → Templates
- This ensures SmartCRM branding for all auth emails

### 2. Wrong Event Types Selected
Make sure you have selected:
- ✅ `user.created` (for new signups)
- ✅ `user.updated` (for profile updates)

### 3. Webhook URL Issues
- ✅ Current URL is correct and tested
- ✅ Endpoint responds properly to test requests
- The URL will change if your Replit project restarts with a new domain

### 4. Network/Firewall Issues
- Supabase might not be able to reach your Replit project
- This is rare but can happen with Replit's networking

## Testing Your Webhook

### Manual Test (Already Working)
```bash
curl -X POST https://9f38fddb-d049-4cd4-9f57-c41b6a878a9d-00-2xv27ubfspt46.riker.replit.dev/api/auth-webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"INSERT","record":{"email":"test@example.com","user_metadata":{"app_context":"smartcrm"}}}'
```

### What Should Happen When Working
1. User signs up → Supabase triggers webhook
2. Webhook receives event → Routes to SmartCRM templates  
3. Email sent using custom SmartCRM branding
4. User receives email with proper design

## Quick Fix Steps

1. **Check Supabase Dashboard**:
   - Go to Authentication > Settings > Webhooks
   - Look for any existing webhooks
   - If none exist, create one with the URL above

2. **Verify Events**:
   - Make sure `user.created` is selected
   - Save the webhook configuration

3. **Test Signup**:
   - Try signing up a new user
   - Check your server logs for webhook activity

## Alternative: Manual Email Templates

If webhooks continue to have issues, you can:
1. Set email templates directly in Supabase Auth settings
2. Upload the HTML templates from `/email-templates/` folder
3. This bypasses the webhook but loses multi-tenant routing

## Current Email Templates Ready
- ✅ confirm-signup.html (with SmartCRM branding)
- ✅ recovery.html (password reset)  
- ✅ invite.html (user invitations)
- ✅ magic-link.html (magic link auth)
- ✅ email-change.html (email changes)

## Contact Support
If webhook issues persist:
- support@videoremix.io
- Include: webhook URL, error messages, Supabase project ID