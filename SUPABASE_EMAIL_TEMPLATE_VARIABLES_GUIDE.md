# Supabase Email Template Variables - Correct Usage Guide

## ✅ **Your Templates Are Correctly Configured**

Great news! All your SmartCRM email templates are already using the correct Supabase standard variable: `{{ .ConfirmationURL }}`

## 📧 **Template Variables Status**

### **✅ Correctly Using {{ .ConfirmationURL }}**
All your templates properly use the standard Supabase variable:

1. **Recovery Template** (`recovery-updated.html`)
   - ✅ Uses: `{{ .ConfirmationURL }}`
   - Redirects to: `/auth/recovery`

2. **Email Change Template** (`change-email.html`)
   - ✅ Uses: `{{ .ConfirmationURL }}`
   - Redirects to: `/auth/callback`

3. **Invite Template** (`invite.html`)
   - ✅ Uses: `{{ .ConfirmationURL }}`
   - Redirects to: `/auth/callback`

4. **Magic Link Template** (`magic-link.html`)
   - ✅ Uses: `{{ .ConfirmationURL }}`
   - Redirects to: `/auth/callback`

5. **Confirm Signup Template** (`confirm-signup.html`)
   - ✅ Uses: `{{ .ConfirmationURL }}`
   - Redirects to: `/auth/callback`

## 🎯 **Why {{ .ConfirmationURL }} Is The Standard**

Supabase provides `{{ .ConfirmationURL }}` as the universal variable that works across all email template types:

- **Password Recovery**: Works perfectly
- **Email Confirmation**: Works perfectly
- **Magic Links**: Works perfectly
- **Email Changes**: Works perfectly
- **Team Invitations**: Works perfectly

## ⚠️ **Common Mistakes to Avoid**

Other projects often incorrectly use these variables (which may not populate):
- ❌ `{{ .RecoveryURL }}` (legacy/deprecated)
- ❌ `{{ .EmailChangeURL }}` (legacy/deprecated)
- ❌ `{{ .InviteURL }}` (legacy/deprecated)

**Your templates avoid these issues!**

## 🔄 **How Supabase Handles Redirects**

When a user clicks `{{ .ConfirmationURL }}`, Supabase:

1. **Validates the token** server-side
2. **Adds URL fragments** with the session data
3. **Redirects to your configured redirect URL**
4. **Your auth routes** (`/auth/callback`, `/auth/recovery`) handle the session

## 📋 **Template Variable Reference**

### **Standard Variables (Available in ALL templates)**
```html
{{ .ConfirmationURL }}  <!-- Main action link -->
{{ .SiteURL }}          <!-- Your site base URL -->
{{ .Email }}            <!-- User's email address -->
{{ .Token }}            <!-- Authentication token -->
```

### **Template-Specific Variables**
```html
<!-- Invite Template -->
{{ .InviterName }}      <!-- Person sending invite -->
{{ .InviterEmail }}     <!-- Inviter's email -->

<!-- Email Change Template -->
{{ .OldEmail }}         <!-- Previous email address -->
{{ .NewEmail }}         <!-- New email address -->

<!-- Recovery Template -->
{{ .TokenHash }}        <!-- Password reset token -->
```

## 🛠️ **Testing Your Templates**

### **Password Reset Test**
```javascript
const { data, error } = await supabase.auth.resetPasswordForEmail(
  'test@example.com',
  { redirectTo: 'https://smart-crm.videoremix.io/auth/recovery' }
);
```

### **Email Confirmation Test**
```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123',
  options: {
    emailRedirectTo: 'https://smart-crm.videoremix.io/auth/callback'
  }
});
```

### **Magic Link Test**
```javascript
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'test@example.com',
  options: {
    emailRedirectTo: 'https://smart-crm.videoremix.io/auth/callback'
  }
});
```

## 🎨 **Your Template Design Features**

Your templates include professional design elements:

### **Professional Branding**
- SmartCRM logo and colors
- Consistent visual hierarchy
- Mobile-responsive design
- Professional typography

### **Security Features**
- Clear security warnings
- Expiration information
- Anti-phishing education
- Alternative access methods

### **User Experience**
- Clear call-to-action buttons
- Alternative link options
- Contact information
- Help and support links

## 🔒 **Security Best Practices**

Your templates follow security best practices:

### **Anti-Spam Features**
- Professional design reduces spam filtering
- Clear branding builds trust
- Proper text-to-image ratio
- No suspicious content patterns

### **User Safety**
- Clear expiration warnings
- Security tip sections
- Contact information for concerns
- Instructions for unintended recipients

## 📱 **Mobile Optimization**

Your templates include responsive design:

```css
@media (max-width: 600px) {
  .header, .content, .footer {
    padding: 24px 20px;
  }
  
  .cta-button {
    padding: 14px 24px;
    font-size: 15px;
  }
}
```

## 🚀 **Production Deployment Checklist**

### **Supabase Configuration**
- [ ] Upload templates to Supabase email templates section
- [ ] Configure redirect URLs in Supabase settings
- [ ] Set Site URL to production domain
- [ ] Test each template type with real emails

### **DNS & Email**
- [ ] Configure SPF records for better deliverability
- [ ] Set up DKIM signing (optional)
- [ ] Configure custom SMTP if needed
- [ ] Monitor email analytics

## ✅ **Success Indicators**

Your email system is working correctly when:

1. **Password reset emails** arrive with working links
2. **Email confirmation** emails redirect properly
3. **Magic links** sign users in successfully
4. **Team invitations** work end-to-end
5. **All templates** display correctly on mobile
6. **Links populate** with actual URLs (not empty)
7. **Redirects work** in both development and production

## 🎯 **Next Steps**

Your email template system is production-ready! Simply:

1. **Upload to Supabase**: Copy each template to the appropriate email template section
2. **Test thoroughly**: Verify each email type works end-to-end
3. **Monitor delivery**: Track email open rates and deliverability
4. **Gather feedback**: Monitor user experience with email flows

Your SmartCRM email system is professionally designed and follows all Supabase best practices!