# Complete Supabase Email Redirect Setup Guide

## Overview
This guide will help you configure Supabase email redirects to work perfectly with your SmartCRM application. All email links will redirect to the correct pages after user authentication.

## Current Configuration Status
✅ **Your redirect URLs are correctly configured in Supabase:**
- `${SITE_URL}` (Production)
- `${SITE_URL}/auth/callback`
- `${SITE_URL}/dashboard`
- `http://localhost:${PORT:-5000}` (Development)
- `http://localhost:${VITE_PORT:-5173}` (Development)
- `https://*.replit.app` (Replit environments)
- `https://*.replit.dev` (Replit environments)

## Authentication Routes Created
✅ **New authentication routes added to your application:**
- `/auth/callback` - Handles signup confirmations and general auth callbacks
- `/auth/confirm` - Handles email confirmations and verification
- `/auth/recovery` - Handles password reset flow with secure validation
- `/reset-password` - Legacy password reset page (updated)

## Step-by-Step Supabase Configuration

### 1. Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your SmartCRM project
3. Navigate to **Authentication** → **Settings**

### 2. Configure Site URL
In the **General Settings** section:
```
Site URL: ${SITE_URL}
```
*This is the main URL where users will be redirected after authentication*

### 3. Configure Redirect URLs
In the **Redirect URLs** section, add these URLs:
```
${SITE_URL}/auth/callback
${SITE_URL}/auth/confirm
${SITE_URL}/auth/recovery
${SITE_URL}/dashboard
http://localhost:${PORT:-5000}/auth/callback
http://localhost:${PORT:-5000}/auth/confirm
http://localhost:${PORT:-5000}/auth/recovery
https://*.replit.app
https://*.replit.dev
```

### 4. Configure Email Templates
Navigate to **Authentication** → **Email Templates** and update each template:

#### **Confirm Signup Template**
1. Select "Confirm signup" template
2. Replace with content from `email-templates/confirm-signup.html`
3. **Important:** The template uses `{{ .ConfirmationURL }}` which will automatically redirect to `/auth/callback`

#### **Recovery Template** (Password Reset)
1. Select "Recovery" template  
2. Replace with content from `email-templates/recovery-updated.html`
3. **Important:** The template uses `{{ .ConfirmationURL }}` which will redirect to `/auth/recovery`

#### **Magic Link Template**
1. Select "Magic Link" template
2. Replace with content from `email-templates/magic-link.html`
3. Uses `{{ .ConfirmationURL }}` for passwordless login

#### **Invite Template**
1. Select "Invite user" template
2. Replace with content from `email-templates/invite.html`
3. Uses `{{ .InviteURL }}` for team invitations

#### **Change Email Template**
1. Select "Change email address" template
2. Replace with content from `email-templates/change-email.html`
3. Uses `{{ .EmailChangeURL }}` for email updates

## Email Flow Configuration

### Password Reset Flow:
1. **User requests reset** → `/forgot-password` page
2. **Email sent** → Uses `recovery.html` template
3. **User clicks link** → Redirects to `/auth/recovery` 
4. **Password updated** → Redirects to `/dashboard`

### Email Confirmation Flow:
1. **User signs up** → `/signup` page
2. **Email sent** → Uses `confirm-signup.html` template
3. **User clicks link** → Redirects to `/auth/callback`
4. **Account confirmed** → Redirects to `/dashboard`

### Magic Link Flow:
1. **User requests magic link** → `/signin` page
2. **Email sent** → Uses `magic-link.html` template
3. **User clicks link** → Redirects to `/auth/callback`
4. **User signed in** → Redirects to `/dashboard`

## Template Variables Reference

| Template Type | Primary Variable | Redirect Destination |
|---------------|-----------------|---------------------|
| Confirm Signup | `{{ .ConfirmationURL }}` | `/auth/callback` |
| Recovery | `{{ .ConfirmationURL }}` | `/auth/recovery` |
| Magic Link | `{{ .ConfirmationURL }}` | `/auth/callback` |
| Invite | `{{ .InviteURL }}` | `/auth/callback` |
| Email Change | `{{ .EmailChangeURL }}` | `/auth/callback` |

## Additional Template Variables
All templates can use these variables:
- `{{ .SiteURL }}` - Your main site URL
- `{{ .Email }}` - User's email address
- `{{ .Token }}` - Authentication token
- `{{ .InviterName }}` - Name of person sending invite (invite template only)

## Testing Your Email Setup

### 1. Test Password Recovery
```bash
# In browser console or API client
const { data, error } = await supabase.auth.resetPasswordForEmail(
  'test@example.com',
  { redirectTo: '${SITE_URL}/auth/recovery' }
);
```

### 2. Test Email Signup
```bash
# Sign up with email confirmation
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123',
  options: {
    emailRedirectTo: '${SITE_URL}/auth/callback'
  }
});
```

### 3. Test Magic Link
```bash
# Sign in with magic link
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'test@example.com',
  options: {
    emailRedirectTo: '${SITE_URL}/auth/callback'
  }
});
```

## Troubleshooting

### Common Issues:

#### **Email links not working?**
1. Check that redirect URLs are added to Supabase settings
2. Verify Site URL is set correctly
3. Ensure templates use correct variables (`{{ .ConfirmationURL }}`)

#### **Redirects going to wrong page?**
1. Update `emailRedirectTo` parameter in auth calls
2. Check route configuration in `App.tsx`
3. Verify authentication routes are properly imported

#### **Templates not showing correctly?**
1. Make sure to paste HTML templates (not text)
2. Check that variables use correct syntax: `{{ .VariableName }}`
3. Test with real email signup/recovery

#### **Development environment issues?**
1. Add localhost URLs to redirect URLs list
2. Update Site URL for development: `http://localhost:${PORT:-5000}`
3. Test with Replit URLs: `https://*.replit.app`

## Security Notes

### Best Practices:
✅ **Use HTTPS** for all production URLs  
✅ **Validate tokens** server-side before password updates  
✅ **Set expiration times** for password reset links (default: 1 hour)  
✅ **Log authentication events** for security monitoring  
✅ **Rate limit** password reset requests  

### Email Security:
✅ **Professional design** reduces spam filter detection  
✅ **Clear branding** improves user trust  
✅ **Security warnings** educate users about phishing  
✅ **Alternative links** ensure accessibility  

## Production Deployment Checklist

Before going live:
- [ ] Update Site URL to production domain
- [ ] Add production redirect URLs
- [ ] Test all email flows end-to-end
- [ ] Verify email deliverability
- [ ] Configure custom SMTP (optional)
- [ ] Set up email analytics (optional)

## Success Verification

Your email system is working correctly when:
✅ Password reset emails arrive with working links  
✅ Email confirmation links redirect to dashboard  
✅ Magic links sign users in successfully  
✅ All templates display SmartCRM branding  
✅ Mobile email clients render templates correctly  

## Next Steps

1. **Upload templates** to Supabase email templates section
2. **Test each email type** with a real email address
3. **Verify redirects** work in both development and production
4. **Monitor email analytics** to track delivery rates
5. **Consider custom SMTP** for better deliverability

Your SmartCRM email authentication system is now fully configured and ready for production use!