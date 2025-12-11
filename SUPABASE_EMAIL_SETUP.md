# SmartCRM Custom Email Templates for Supabase

## Overview
Custom email templates designed to match your SmartCRM application's design system, featuring:

- **Brand Consistency**: SmartCRM logo with green accent
- **Modern Design**: Clean layouts, rounded corners, gradient buttons
- **Responsive**: Mobile-optimized layouts
- **Professional**: Security notes, clear CTAs, brand colors

## Templates Created

### 1. **confirm-signup.html** - Account Confirmation
- **Use**: Email verification for new signups
- **Color**: Green gradient CTA button
- **Features**: Welcome message, security note, alternative link

### 2. **magic-link.html** - Magic Link Sign In
- **Use**: Passwordless login links
- **Color**: Blue gradient CTA button  
- **Features**: Quick stats, security info, expiration notice

### 3. **recovery.html** - Password Reset
- **Use**: Password recovery emails
- **Color**: Red gradient CTA button
- **Features**: Security warnings, tips for strong passwords

### 4. **invite.html** - Team Invitations
- **Use**: Inviting users to workspaces
- **Color**: Purple gradient CTA button
- **Features**: Inviter info, feature grid, benefits showcase

### 5. **change-email.html** - Email Change Confirmation
- **Use**: Confirming email address changes
- **Color**: Blue gradient CTA button
- **Features**: Old/new email display, security warnings

## How to Implement in Supabase

### Step 1: Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Email Templates**

### Step 2: Upload Custom Templates

For each template type:

1. **Confirm signup**:
   - Copy content from `email-templates/confirm-signup.html`
   - Paste into "Confirm signup" template editor
   - Save changes

2. **Magic Link**:
   - Copy content from `email-templates/magic-link.html`
   - Paste into "Magic Link" template editor
   - Save changes

3. **Recovery**:
   - Copy content from `email-templates/recovery.html`
   - Paste into "Recovery" template editor
   - Save changes

4. **Invite**:
   - Copy content from `email-templates/invite.html`
   - Paste into "Invite" template editor
   - Save changes

5. **Change email address**:
   - Copy content from `email-templates/change-email.html`
   - Paste into "Change email address" template editor
   - Save changes

### Step 3: Configure Template Variables

Supabase uses these variables in templates:
- `{{ .ConfirmationURL }}` - The action link
- `{{ .Token }}` - Confirmation token
- `{{ .InviterName }}` - Name of person sending invite
- `{{ .OldEmail }}` - Previous email (for email changes)
- `{{ .NewEmail }}` - New email (for email changes)

### Step 4: Test Your Templates

1. **Test signup**: Create a new account to see confirmation email
2. **Test magic link**: Use passwordless login
3. **Test recovery**: Use "Forgot Password" feature
4. **Test invite**: Invite a team member
5. **Test email change**: Change your email address

## Design Features

### Color Scheme
- **Primary**: Green (#22c55e) for success actions
- **Secondary**: Blue (#3b82f6) for informational actions  
- **Warning**: Red (#dc2626) for security actions
- **Special**: Purple (#8b5cf6) for invitations

### Typography
- **Font**: System fonts (Apple System, Segoe UI, Roboto)
- **Headers**: 24-32px, bold
- **Body**: 16px, medium weight
- **Small text**: 14px for secondary info

### Layout
- **Max width**: 600px for desktop readability
- **Mobile responsive**: Stacks and adjusts on small screens
- **Padding**: Consistent 30-40px spacing
- **Borders**: Rounded 16px containers

### Interactive Elements
- **Buttons**: Gradient backgrounds with hover effects
- **Links**: Green accent color matching brand
- **Security notes**: Color-coded backgrounds
- **Alternative links**: Monospace font for URLs

## Customization Options

### Update Brand Colors
Change these CSS custom properties in each template:
```css
/* Primary green */
background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);

/* Secondary blue */  
background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);

/* Warning red */
background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
```

### Update Company Info
Replace placeholder links in footer sections:
```html
<a href="YOUR_HELP_CENTER_URL" class="footer-link">Help Center</a>
<a href="YOUR_SUPPORT_URL" class="footer-link">Contact Support</a>
<a href="YOUR_PRIVACY_URL" class="footer-link">Privacy Policy</a>
```

### Add Your Domain
Update security notes with your actual domain:
```html
<p class="security-text">
    If you didn't request this, contact support at support@yourdomain.com
</p>
```

## Benefits

✅ **Brand Consistency**: Matches your application design
✅ **Professional**: Modern, clean appearance  
✅ **Mobile Friendly**: Responsive on all devices
✅ **Security Focused**: Clear security messaging
✅ **User Experience**: Intuitive layouts and clear CTAs
✅ **Conversion Optimized**: Compelling design encourages action

## Next Steps

1. Upload templates to Supabase dashboard
2. Test each email type thoroughly
3. Update any placeholder URLs with your actual links
4. Consider A/B testing different CTA button colors
5. Monitor email open rates and click-through rates

Your SmartCRM now has professional, branded email communications that will enhance user trust and engagement!

---

## CRITICAL: Fixing Empty {{ .RecoveryURL }} / {{ .ConfirmationURL }}

### The Problem
Password reset emails send successfully, but the `{{ .RecoveryURL }}` or `{{ .ConfirmationURL }}` variable is empty, preventing users from resetting their passwords.

### Root Cause
Supabase generates the recovery/confirmation URL only when:
1. The redirect URL is **whitelisted** in your Supabase project settings
2. The URL is **exact match** (including path)
3. The protocol (https://) matches

### SOLUTION: Whitelist Redirect URLs

#### Step 1: Add Production URLs to Supabase
1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. In the **Redirect URLs** section, add these EXACT URLs:
   ```
   https://app.smartcrm.vip/auth/reset-password
   https://app.smartcrm.vip/auth/confirm
   https://app.smartcrm.vip/auth/callback
   https://app.smartcrm.vip/**
   ```

#### Step 2: Add Development URLs (for testing)
Also add your Replit development URL:
```
https://YOUR-REPLIT-URL.replit.dev/auth/reset-password
https://YOUR-REPLIT-URL.replit.dev/auth/confirm
```

#### Step 3: Important Template Variable Notes
- **For Password Reset**: Use `{{ .ConfirmationURL }}` (NOT `{{ .RecoveryURL }}`)
- **For Email Confirmation**: Use `{{ .ConfirmationURL }}`
- **For Magic Links**: Use `{{ .ConfirmationURL }}`

### Verification Steps

1. **Check Console Logs**: Open browser console when testing password reset
2. Look for this log:
   ```
   🔐 Password Reset Request: {
     email: "test@example.com",
     redirectTo: "https://app.smartcrm.vip/auth/reset-password",
     environment: "production"
   }
   ```
3. **Verify Email**: The link in the email should now be populated
4. **Test Click**: Clicking should take you to `/auth/reset-password` with a valid token

### Common Mistakes

❌ **Wrong**: Adding only the domain `https://app.smartcrm.vip`
✅ **Correct**: Adding the full path `https://app.smartcrm.vip/auth/reset-password`

❌ **Wrong**: Using `{{ .RecoveryURL }}` in password reset template
✅ **Correct**: Using `{{ .ConfirmationURL }}` in password reset template

❌ **Wrong**: Forgetting to click "Save" in Supabase dashboard
✅ **Correct**: Always save changes and wait 2-3 minutes for propagation

### Still Not Working?

1. **Clear Browser Cache**: Hard refresh (Ctrl+Shift+R)
2. **Check Supabase Logs**: Dashboard → Logs → Auth Logs
3. **Verify SMTP**: Make sure SMTP is configured in Project Settings
4. **Wait for Propagation**: Configuration changes can take 5-10 minutes
5. **Check Spam Folder**: Email might be filtered

### Current Code Status
✅ Your code is correctly configured in:
- `client/src/lib/supabase.ts` (lines 116-155)
- Sends correct `redirectTo` URL based on environment
- Includes comprehensive logging for debugging

The issue is **NOT in your code** - it's a Supabase dashboard configuration issue. Follow the steps above to whitelist your URLs.