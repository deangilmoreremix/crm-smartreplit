# Supabase Email Template Mapping Guide

## 📋 Quick Reference: Which Template Goes Where

| Supabase Dashboard Label | File to Use | Token Type |
|---------------------------|-------------|------------|
| **Confirm signup** | `1-confirm-signup.html` | `signup` |
| **Invite user** | `2-invite-user.html` | `invite` |
| **Magic Link** | `3-magic-link.html` | `magiclink` |
| **Change Email Address** | `4-change-email.html` | `email_change` |
| **Reset Password** | `5-reset-password.html` | `recovery` |

## 🔗 Token Hash URLs by Template

### 1. Confirm Signup
```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup
```
- **Triggered when**: User signs up with email/password
- **Redirects to**: `/dashboard` (after verification)
- **Expiration**: 24 hours

### 2. Invite User
```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite
```
- **Triggered when**: Admin invites a new user
- **Redirects to**: `/dashboard` (after accepting invitation)
- **Expiration**: 7 days

### 3. Magic Link
```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink
```
- **Triggered when**: User requests passwordless login
- **Redirects to**: `/dashboard` (after verification)
- **Expiration**: 1 hour

### 4. Change Email Address
```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change
```
- **Triggered when**: User changes their email address
- **Redirects to**: `/dashboard` (after verification)
- **Expiration**: 24 hours

### 5. Reset Password
```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/reset-password
```
- **Triggered when**: User requests password reset
- **Redirects to**: `/auth/reset-password` (to set new password)
- **Expiration**: 1 hour

## 🎯 How AuthConfirm.tsx Handles Each Type

Your app's `AuthConfirm.tsx` component handles all token verification:

```typescript
// Simplified flow
const type = params.get('type'); // signup, invite, magiclink, email_change, recovery
const tokenHash = params.get('token_hash');
const next = params.get('next'); // Optional redirect after verification

switch(type) {
  case 'signup':
    // Verify signup token → redirect to /dashboard
  case 'invite':
    // Verify invite token → redirect to /dashboard
  case 'magiclink':
    // Verify magic link → redirect to /dashboard
  case 'email_change':
    // Verify email change → redirect to /dashboard
  case 'recovery':
    // Verify recovery token → redirect to next param (/auth/reset-password)
}
```

## ⚙️ Supabase Configuration Required

### 1. Site URL Setting
**Location**: Dashboard → Settings → General → Configuration

- **Development**: `https://smartcrm-videoremix.replit.dev`
- **Production**: `https://app.smartcrm.vip`

### 2. Redirect URLs Whitelist
**Location**: Dashboard → Authentication → URL Configuration

Add these URLs:
```
https://app.smartcrm.vip/auth/confirm
https://app.smartcrm.vip/auth/reset-password
https://app.smartcrm.vip/**
```

For development, also add:
```
https://smartcrm-videoremix.replit.dev/auth/confirm
https://smartcrm-videoremix.replit.dev/auth/reset-password
https://smartcrm-videoremix.replit.dev/**
```

## 🧪 Testing Each Template

### Test Signup Email
```typescript
await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'Test123!@#'
})
```
**Expected**: Receive email with "Confirm Email Address" button

### Test Password Reset Email
```typescript
await supabase.auth.resetPasswordForEmail('test@example.com', {
  redirectTo: 'https://app.smartcrm.vip/auth/reset-password'
})
```
**Expected**: Receive email with "Set New Password" button

### Test Magic Link Email
```typescript
await supabase.auth.signInWithOtp({
  email: 'test@example.com'
})
```
**Expected**: Receive email with "Sign In to SmartCRM" button

### Test Invite Email
```typescript
await supabase.auth.admin.inviteUserByEmail('newuser@example.com')
```
**Expected**: Receive email with "Accept Invitation" button

## 🐛 Troubleshooting

### Problem: Email link is empty or shows {{ .ConfirmationURL }}
**Solution**: You're using the old template. Replace with token_hash templates from this folder.

### Problem: Link goes to wrong page
**Check**:
1. Verify `type` parameter is correct
2. Check `next` parameter (only for recovery)
3. Verify redirect URLs are whitelisted in Supabase

### Problem: "Invalid token" error
**Check**:
1. Token hasn't expired
2. Token hasn't been used already (one-time use)
3. Site URL matches in Supabase settings

### Problem: Email not arriving
**Check**:
1. Email provider settings in Supabase
2. Spam/junk folder
3. Email rate limits (Supabase free tier)
4. SMTP configuration (if using custom SMTP)

## 📚 Additional Resources

- [Supabase Email Templates Docs](https://supabase.com/docs/guides/auth/auth-email-templates)
- [GitHub Issue #10534](https://github.com/supabase/supabase/issues/10534) - Token hash approach
- SmartCRM Documentation: `SUPABASE_EMAIL_FIX.md`

---

**Last Updated**: November 2025  
**Version**: 1.0.0
