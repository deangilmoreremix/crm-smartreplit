# SmartCRM Supabase Email Templates

Complete set of email templates for Supabase authentication using the **token_hash** approach.

## 📧 Templates Included

| #   | Template Name      | File                    | Supabase Template Type |
| --- | ------------------ | ----------------------- | ---------------------- |
| 1   | **Confirm Signup** | `1-confirm-signup.html` | Confirm signup         |
| 2   | **Invite User**    | `2-invite-user.html`    | Invite user            |
| 3   | **Magic Link**     | `3-magic-link.html`     | Magic Link             |
| 4   | **Change Email**   | `4-change-email.html`   | Change Email Address   |
| 5   | **Reset Password** | `5-reset-password.html` | Reset Password         |

## 🔧 Installation Instructions

### Step 1: Access Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your **SmartCRM** project
3. Navigate to: **Authentication** → **Email Templates**

### Step 2: Update Each Template

For each template:

1. Click on the template name (e.g., "Confirm signup")
2. **Delete all existing content**
3. **Copy the entire contents** from the corresponding `.html` file
4. **Paste** into the Supabase editor
5. Click **Save**

## 🎯 Token Hash Routing

All templates use the modern **token_hash** approach instead of the deprecated `.ConfirmationURL` method.

### URL Pattern

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type={TYPE}&next={NEXT_PAGE}
```

### Routes by Type

| Template       | Type Parameter | Next Parameter         | Final Destination      |
| -------------- | -------------- | ---------------------- | ---------------------- |
| Confirm Signup | `signup`       | _(none)_               | `/dashboard`           |
| Invite User    | `invite`       | _(none)_               | `/dashboard`           |
| Magic Link     | `magiclink`    | _(none)_               | `/dashboard`           |
| Change Email   | `email_change` | _(none)_               | `/dashboard`           |
| Reset Password | `recovery`     | `/auth/reset-password` | `/auth/reset-password` |

## 🔍 How It Works

1. **User triggers email** (signup, password reset, etc.)
2. **Supabase sends email** with token_hash URL
3. **User clicks link** → Redirects to `/auth/confirm?token_hash=...&type=...`
4. **AuthConfirm.tsx verifies** the token_hash with Supabase
5. **Success** → User is redirected to appropriate page

## ✅ Verification Checklist

After updating all templates:

- [ ] All 5 templates uploaded to Supabase
- [ ] Test signup flow (check email confirmation)
- [ ] Test password reset flow (check reset email)
- [ ] Test magic link login (if enabled)
- [ ] Verify emails render correctly in Gmail, Outlook, Apple Mail
- [ ] Check mobile email rendering

## 🎨 Design Features

All templates include:

- ✅ SmartCRM branding with green accent color (#16a34a)
- ✅ Responsive design for mobile/desktop
- ✅ Outlook MSO compatibility
- ✅ Professional layout with clear CTAs
- ✅ Security messaging (expiration times, one-time use)
- ✅ Alternative link fallback
- ✅ Support contact information

## 🔐 Security Notes

- **Token expiration**: Links expire automatically (24h for signup, 1h for magic links, etc.)
- **One-time use**: All tokens can only be used once
- **Secure URLs**: Use HTTPS in production
- **Production URL**: Update `{{ .SiteURL }}` to `https://app.smartcrm.vip` in Supabase settings

## 🚀 Production Deployment

Before going live:

1. **Update Site URL** in Supabase:
   - Go to: **Settings** → **General** → **Configuration**
   - Set **Site URL** to: `https://app.smartcrm.vip`
2. **Whitelist Redirect URLs**:
   - Go to: **Authentication** → **URL Configuration**
   - Add: `https://app.smartcrm.vip/auth/confirm`
   - Add: `https://app.smartcrm.vip/auth/reset-password`
   - Add: `https://app.smartcrm.vip/**`

3. **Test in Production**:
   - Send test emails from production domain
   - Verify all links resolve correctly
   - Check token verification works

## 📞 Support

Need help? Contact: support@smartcrm.vip

---

**Created**: November 2025  
**SmartCRM** · Smart Solutions for Your Business
