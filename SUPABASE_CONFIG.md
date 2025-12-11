# Supabase Authentication Configuration

## Complete Authentication Setup

This app uses Supabase for all authentication flows:
- ✅ Email/Password Signup & Confirmation
- ✅ Magic Link (Passwordless Login)
- ✅ Password Reset
- ✅ Email Change Confirmation
- ✅ User Invitations
- ✅ Reauthentication

All flows use a **unified `/auth/confirm` endpoint** that handles token verification and redirects users to the appropriate destination.

### Step 1: Access Supabase Dashboard

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your SmartCRM project
3. Navigate to **Authentication** → **URL Configuration**

### Step 2: Add Redirect URLs

Add these URLs to the **Redirect URLs** allowlist:

#### Development (Replit App)
```
https://smartcrm-videoremix.replit.app/auth/confirm
```

#### Production (Custom Domain)
```
https://app.smartcrm.vip/auth/confirm
```

**That's it!** The `/auth/confirm` endpoint handles all authentication flows.

### Step 3: Verify Site URL

Make sure your **Site URL** is set correctly:
- Development: `https://smartcrm-videoremix.replit.app`
- Production: `https://app.smartcrm.vip`

### Step 4: Configure Email Templates (Optional)

For better branding, you can customize the email templates:

1. Go to **Authentication** → **Email Templates**
2. Customize the following templates:
   - **Confirm signup**
   - **Magic Link**
   - **Change Email Address**
   - **Reset Password** ← This is the important one for password reset

### Step 5: Test All Flows

**Signup Flow:**
1. Go to `/signup` → Enter email/password
2. Check email for confirmation link
3. Click link → Should redirect to `/auth/confirm` → Then to `/dashboard`

**Password Reset:**
1. Go to `/auth/forgot-password` → Enter email
2. Check email for reset link
3. Click link → `/auth/confirm` → `/auth/reset-password`
4. Enter new password → Success!

**Magic Link:**
1. Request magic link → Check email
2. Click link → `/auth/confirm` → `/dashboard`

## Current Configuration Status

✅ Unified `/auth/confirm` endpoint handles all auth flows
✅ Auto-detects flow type (signup, recovery, invite, email_change, magic link)
✅ Proper error handling with user-friendly messages
✅ Automatic redirects to appropriate destinations
⚠️ **Action Required**: Add redirect URL to Supabase dashboard (see Step 2 above)

## Authentication Flows Covered

| Flow | Email Type | Redirect Behavior |
|------|-----------|-------------------|
| Signup | Confirm signup | `/auth/confirm` → `/dashboard` |
| Magic Link | Magic Link | `/auth/confirm` → `/dashboard` |
| Password Reset | Reset Password | `/auth/confirm` → `/auth/reset-password` |
| Email Change | Change Email | `/auth/confirm` → `/dashboard` |
| Invite User | Invite user | `/auth/confirm` → `/dashboard` |
| Reauthentication | Reauthentication | OTP code (no redirect) |

## Troubleshooting

### "Invalid or expired reset link" error
- Check that the redirect URL is added to Supabase dashboard
- Verify the email link hasn't expired (default is 1 hour)
- Make sure you're using the correct Supabase project

### Email not received
- Check spam folder
- Verify email settings in Supabase dashboard
- Confirm the email address exists in your users table

### "Authentication service is not configured" error
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in environment variables
- Check that these values match your Supabase project

## How It Works

1. **User requests reset**: Clicks "Forgot Password" → Enters email → Supabase sends email with reset link
2. **User clicks link**: Link contains `#access_token=...&type=recovery` → Redirects to `/auth/reset-password`
3. **Supabase auto-detects**: Client detects token in URL hash → Creates temporary session
4. **User resets password**: Enters new password → Calls `supabase.auth.updateUser({ password })`
5. **Success**: Password updated → Redirects to login page
