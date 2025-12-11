# Complete Supabase Email Templates Installation Guide

## 📦 What You Have

✅ **5 Production-Ready Email Templates**
- All using modern **token_hash** approach (not deprecated `.ConfirmationURL`)
- Consistent SmartCRM branding and design
- Mobile responsive with Outlook/MSO compatibility
- Security best practices built-in

## 🚀 Installation Steps

### Step 1: Access Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your **SmartCRM** project
3. Navigate to: **Authentication** → **Email Templates**

### Step 2: Install Each Template

You'll see 5 email template options in Supabase. Update them in this order:

#### Template 1: Confirm Signup
1. Click **"Confirm signup"** in Supabase dashboard
2. **Delete all existing content** in the editor
3. Open file: `1-confirm-signup.html`
4. **Copy ALL content** (Ctrl+A, Ctrl+C)
5. **Paste** into Supabase editor
6. Click **Save**

#### Template 2: Invite User
1. Click **"Invite user"** in Supabase dashboard
2. **Delete all existing content**
3. Open file: `2-invite-user.html`
4. **Copy ALL content**
5. **Paste** into Supabase editor
6. Click **Save**

#### Template 3: Magic Link
1. Click **"Magic Link"** in Supabase dashboard
2. **Delete all existing content**
3. Open file: `3-magic-link.html`
4. **Copy ALL content**
5. **Paste** into Supabase editor
6. Click **Save**

#### Template 4: Change Email Address
1. Click **"Change Email Address"** in Supabase dashboard
2. **Delete all existing content**
3. Open file: `4-change-email.html`
4. **Copy ALL content**
5. **Paste** into Supabase editor
6. Click **Save**

#### Template 5: Reset Password
1. Click **"Reset Password"** in Supabase dashboard
2. **Delete all existing content**
3. Open file: `5-reset-password.html`
4. **Copy ALL content**
5. **Paste** into Supabase editor
6. Click **Save**

### Step 3: Configure Site URL

**CRITICAL**: Set your Site URL to match your production domain.

1. Go to: **Settings** → **General** → **Configuration**
2. Find **"Site URL"** field
3. Set to: `https://app.smartcrm.vip` (for production)
4. For development, you can use: `https://smartcrm-videoremix.replit.dev`
5. Click **Save**

### Step 4: Configure Redirect URLs

Whitelist your authentication callback URLs:

1. Go to: **Authentication** → **URL Configuration**
2. Find **"Redirect URLs"** section
3. Add these URLs (one per line):

**Production URLs:**
```
https://app.smartcrm.vip/auth/confirm
https://app.smartcrm.vip/auth/reset-password
https://app.smartcrm.vip/**
```

**Development URLs** (optional):
```
https://smartcrm-videoremix.replit.dev/auth/confirm
https://smartcrm-videoremix.replit.dev/auth/reset-password
https://smartcrm-videoremix.replit.dev/**
```

4. Click **Save**

## 🧪 Testing Your Templates

### Test Password Reset (Most Important!)

1. Go to your app's forgot password page
2. Enter your email address
3. Click "Send Reset Link"
4. **Check your email inbox**
5. Email should look professional with SmartCRM branding
6. Click "Set New Password" button
7. Should redirect to: `https://app.smartcrm.vip/auth/reset-password`
8. Enter new password
9. Success! ✅

### Test Signup Flow

1. Go to signup page
2. Create new account with valid email
3. Check email for "Confirm Email Address" message
4. Click confirmation button
5. Should redirect to dashboard

### Test Other Templates

- **Magic Link**: Try passwordless login (if enabled)
- **Invite User**: Send invitation from admin panel (if available)
- **Change Email**: Update email in profile settings

## ✅ Verification Checklist

After installation, verify:

- [ ] All 5 templates uploaded to Supabase
- [ ] Site URL set correctly (`https://app.smartcrm.vip`)
- [ ] Redirect URLs whitelisted
- [ ] Password reset email works end-to-end
- [ ] Signup confirmation email works
- [ ] Emails look professional on mobile
- [ ] Emails render correctly in Gmail
- [ ] Emails render correctly in Outlook
- [ ] All links work (no empty URLs!)

## 🎨 What Makes These Templates Special

### Token Hash Method
```html
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery
```

**Why this works:**
- ✅ Reliable: Supabase always populates `{{ .TokenHash }}`
- ✅ Secure: One-time use tokens with expiration
- ✅ Flexible: Your app handles routing via `AuthConfirm.tsx`

**Old method (broken):**
```html
{{ .ConfirmationURL }}  ❌ Often stays empty!
```

### Consistent Design
All templates share:
- **SmartCRM logo** with green accent (#16a34a)
- **Professional layout** with card design
- **Clear call-to-action** buttons
- **Fallback links** if buttons don't work
- **Security messaging** (expiration, one-time use)
- **Support contact** in footer

### Email Client Compatibility
- ✅ Gmail (Web, iOS, Android)
- ✅ Outlook (Desktop, Web)
- ✅ Apple Mail (iOS, macOS)
- ✅ Yahoo Mail
- ✅ ProtonMail
- ✅ Dark mode support

## 🐛 Troubleshooting

### Problem: Email link is empty or shows template code

**Symptoms:**
- Link shows `{{ .TokenHash }}` instead of actual token
- Clicking link does nothing

**Solution:**
1. Make sure you copied the ENTIRE template (including DOCTYPE)
2. Verify you're using the correct file for each template type
3. Save the template in Supabase after pasting

### Problem: Link redirects to wrong page

**Check:**
1. Verify Site URL is correct in Supabase settings
2. Check redirect URLs are whitelisted
3. For password reset, link should include `&next=/auth/reset-password`

### Problem: "Invalid token" error

**Causes:**
- Token expired (1-24 hours depending on type)
- Token already used (one-time use only)
- Site URL mismatch

**Solution:**
1. Request a new email
2. Verify Site URL matches between Supabase and your app
3. Check token hasn't been used already

### Problem: Email not arriving

**Check:**
1. Spam/junk folder
2. Email rate limits (Supabase free tier: 3-4 emails/hour)
3. SMTP configuration in Supabase
4. Correct email address entered

### Problem: Styling looks broken in email

**Usually affects:** Outlook, older email clients

**Check:**
1. Did you copy the complete HTML (including `<style>` section)?
2. Make sure DOCTYPE declaration is included
3. Verify no content was accidentally cut off

## 📊 Template Features Comparison

| Feature | Signup | Invite | Magic Link | Change Email | Reset Password |
|---------|--------|--------|------------|--------------|----------------|
| Token Type | signup | invite | magiclink | email_change | recovery |
| Expiration | 24h | 7 days | 1h | 24h | 1h |
| One-time use | ✅ | ✅ | ✅ | ✅ | ✅ |
| Redirects to | Dashboard | Dashboard | Dashboard | Dashboard | Reset Password |

## 🎯 Production Deployment

Before going live with production:

1. **Test in staging first**
   - Use development URLs initially
   - Send test emails to yourself
   - Verify all flows work correctly

2. **Update to production URLs**
   - Change Site URL to `https://app.smartcrm.vip`
   - Update redirect URL whitelist
   - Test again with production domain

3. **Monitor first 24 hours**
   - Watch for email delivery issues
   - Check token expiration is working
   - Verify redirects land on correct pages
   - Monitor support emails for issues

4. **Common launch issues**
   - DNS propagation delays (wait 24-48h)
   - Cached redirect URLs (clear browser cache)
   - Email provider blocking (check spam score)

## 📞 Need Help?

- **Email support**: support@smartcrm.vip
- **Documentation**: See `README.md` and `TEMPLATE-MAPPING.md`
- **Supabase docs**: https://supabase.com/docs/guides/auth/auth-email-templates

## 🎉 You're Done!

Once all templates are installed and tested, your SmartCRM authentication system will have:

✅ Professional, branded email communications  
✅ Reliable token-based authentication flows  
✅ Secure password reset functionality  
✅ Beautiful emails on all devices and clients  
✅ Clear user guidance with security messaging  

---

**Installation Date**: _________________  
**Tested By**: _________________  
**Production Ready**: ☐ Yes ☐ No  

**SmartCRM** · Smart Solutions for Your Business
