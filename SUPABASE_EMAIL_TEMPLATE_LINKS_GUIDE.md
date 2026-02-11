# Supabase Email Template Link Configuration Guide

## Understanding Supabase Email Template Variables

Supabase provides several built-in template variables that automatically populate with the correct URLs and data:

### **Available Variables:**

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `{{ .ConfirmationURL }}` | Link to confirm email/signup OR reset password | `https://yourapp.com/auth/confirm?token=xyz` |
| `{{ .InviteURL }}` | Link to accept invitation | `https://yourapp.com/auth/invite?token=xyz` |
| `{{ .SiteURL }}` | Your application's base URL | `https://yourapp.com` |
| `{{ .Email }}` | User's email address | `user@example.com` |
| `{{ .Token }}` | Authentication token | `abc123xyz...` |

## **Updated CTA Buttons in Each Template:**

### 1. **Confirm Signup Template**
```html
<!-- Main CTA Button -->
<a href="{{ .ConfirmationURL }}" class="cta-button">
    Activate Your SmartCRM Account
</a>

<!-- Footer Links -->
<div class="footer-links">
    <a href="{{ .SiteURL }}/help" class="footer-link">Help Center</a>
    <a href="{{ .SiteURL }}/support" class="footer-link">Contact Support</a>
    <a href="{{ .SiteURL }}/privacy" class="footer-link">Privacy Policy</a>
</div>
```

### 2. **Magic Link Template**
```html
<!-- Main CTA Button -->
<a href="{{ .ConfirmationURL }}" class="cta-button">
    Sign In to SmartCRM
</a>

<!-- Footer Links -->
<div class="footer-links">
    <a href="{{ .SiteURL }}/help" class="footer-link">Help Center</a>
    <a href="{{ .SiteURL }}/support" class="footer-link">Contact Support</a>
    <a href="{{ .SiteURL }}/privacy" class="footer-link">Privacy Policy</a>
</div>
```

### 3. **Password Recovery Template**
```html
<!-- Main CTA Button -->
<a href="{{ .ConfirmationURL }}" class="cta-button">
    Reset Your Password
</a>

<!-- Footer Links -->
<div class="footer-links">
    <a href="{{ .SiteURL }}/security" class="footer-link">Security Center</a>
    <a href="{{ .SiteURL }}/support" class="footer-link">Contact Support</a>
    <a href="{{ .SiteURL }}/privacy" class="footer-link">Privacy Policy</a>
</div>
```

### 4. **Invite Template**
```html
<!-- Main CTA Button -->
<a href="{{ .InviteURL }}" class="cta-button">
    Accept Invitation & Join SmartCRM
</a>

<!-- Footer Links -->
<div class="footer-links">
    <a href="{{ .SiteURL }}" class="footer-link">Learn More</a>
    <a href="{{ .SiteURL }}/support" class="footer-link">Contact Support</a>
    <a href="{{ .SiteURL }}/privacy" class="footer-link">Privacy Policy</a>
</div>
```

### 5. **Change Email Template**
```html
<!-- Main CTA Button -->
<a href="{{ .EmailChangeURL }}" class="cta-button">
    Confirm Email Change
</a>

<!-- Footer Links -->
<div class="footer-links">
    <a href="{{ .SiteURL }}/security" class="footer-link">Security Center</a>
    <a href="{{ .SiteURL }}/support" class="footer-link">Contact Support</a>
    <a href="{{ .SiteURL }}/privacy" class="footer-link">Privacy Policy</a>
</div>
```

## **How to Upload Templates to Supabase:**

### **Step 1: Access Email Templates**
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. You'll see 5 template types:
   - Confirm signup
   - Magic Link
   - Recovery (Password reset)
   - Invite user
   - Email change confirmation

### **Step 2: Configure Each Template**

For each template type:

1. **Click on the template** (e.g., "Confirm signup")
2. **Switch to HTML mode** (toggle from text to HTML)
3. **Copy and paste** the corresponding HTML template content
4. **Click "Save"**

### **Step 3: Configure Site URL**

1. Go to **Settings** → **Authentication**
2. Find **"Site URL"** field
3. Set to your production URL: `https://your-production-domain.com`
4. For development: `http://localhost:5000` or your Replit URL

### **Step 4: Configure Redirect URLs**

1. Still in **Authentication Settings**
2. Find **"Additional Redirect URLs"** 
3. Add these URLs (replace with your actual domain):
   ```
   https://your-domain.com/auth/callback
   https://your-domain.com/auth/confirm
   https://your-domain.com/auth/reset-password
   https://your-domain.com/dashboard
   ```

## **Testing the Links:**

### **Test Signup Flow:**
```javascript
// Test signup with app context
const { data, error } = await supabase.auth.signUp({
  email: 'test@smartcrm.com',
  password: 'password123',
  options: {
    data: {
      app_context: 'smartcrm',
      first_name: 'Test',
      last_name: 'User'
    }
  }
})
```

### **Test Magic Link:**
```javascript
// Test magic link
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'test@smartcrm.com',
  options: {
    data: {
      app_context: 'smartcrm'
    }
  }
})
```

### **Test Password Recovery:**
```javascript
// Test password recovery
// Note: Supabase automatically includes token_hash and type=recovery in ConfirmationURL
const { data, error } = await supabase.auth.resetPasswordForEmail('test@smartcrm.com', {
  redirectTo: 'https://your-app.com/auth/reset-password',
})
```

## **Multi-Tenant Setup:**

For multiple apps using the same Supabase project:

### **Option 1: Multiple Template Sets**
Create separate template sets in Supabase:
- `smartcrm_templates` (green branding)
- `otherapp_templates` (different branding)

### **Option 2: Dynamic Content**
Use conditional logic in templates:
```html
<!-- Example dynamic branding -->
<div style="background-color: {{ if eq .AppContext "smartcrm" }}#22c55e{{ else }}#3b82f6{{ end }};">
    <h1>Welcome to {{ if eq .AppContext "smartcrm" }}SmartCRM{{ else }}OtherApp{{ end }}!</h1>
</div>
```

## **Troubleshooting:**

### **Links Not Working?**
1. Check Site URL in Supabase settings
2. Verify redirect URLs are configured
3. Ensure CORS settings allow your domain

### **Variables Not Populating?**
1. Use exact variable syntax: `{{ .VariableName }}`
2. Check template is saved in HTML mode
3. Test with a real signup/recovery attempt

### **Styling Issues?**
1. Use inline CSS for email compatibility
2. Test with different email clients
3. Keep CSS simple and widely supported

## **Final Verification:**

1. **Sign up** with a test user via `/signup?app=smartcrm`
2. **Check email** for proper SmartCRM branding and working links
3. **Test all CTA buttons** to ensure they redirect correctly
4. **Verify footer links** navigate to proper pages
5. **Monitor webhook logs** for successful routing

Your email templates now have properly configured links that will automatically work with Supabase's authentication flow!