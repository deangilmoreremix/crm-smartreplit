# Supabase Email Template Fix - Password Recovery

## Problem
The password reset email is sending the **"Change Email"** template instead of the **"Recovery"** template.

**Symptoms:**
- Email subject: "Confirm your new SmartCRM email address"
- URL contains: `type=email_change` (WRONG - should be `type=recovery`)

## Solution

### Step 1: Configure Recovery Template (Password Reset)

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Click on **"Recovery"** template
3. Switch to **HTML mode**
4. Replace with this content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width" />
  <title>Reset your SmartCRM password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #ffffff; color: #222; line-height: 1.6; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border: 1px solid #e4e8ee; border-radius: 16px; box-shadow: 0 4px 14px rgba(0,0,0,0.06); }
    .header { text-align: center; padding: 32px 20px 16px 20px; }
    .logo { font-size: 26px; font-weight: 800; color: #111; }
    .logo span { color: #16a34a; }
    h1 { font-size: 22px; text-align: center; color: #111; margin: 0 0 16px 0; }
    p { font-size: 15px; color: #333; margin: 0 0 20px 0; text-align: center; }
    .button { display: inline-block; padding: 14px 28px; background: #16a34a; color: #ffffff !important; font-size: 16px; font-weight: 700; border-radius: 10px; text-decoration: none; }
    .alt-box { margin: 24px auto 0 auto; background: #f9fafb; border: 1px solid #e4e8ee; border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #555; text-align: center; word-break: break-all; }
    .footer { border-top: 1px solid #e4e8ee; background: #f9fafb; padding: 18px 16px; text-align: center; font-size: 13px; color: #555; border-radius: 0 0 16px 16px; }
    .footer a { color: #16a34a; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Smart<span>CRM</span></div>
    </div>
    <div style="padding: 0 24px 24px 24px;">
      <h1>Reset your password</h1>
      <p>You requested to reset the password for your <strong>SmartCRM</strong> account.<br>Click the button below to set a new password.</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: auto;">
        <tr>
          <td align="center" bgcolor="#16a34a" style="border-radius: 10px;">
            <a class="button" href="{{ .SiteURL }}/auth/reset-password?token_hash={{ .TokenHash }}&type=recovery" target="_blank">Set New Password</a>
          </td>
        </tr>
      </table>
      <div class="alt-box">
        If the button doesn't work, copy and paste this link:<br>
        <a href="{{ .SiteURL }}/auth/reset-password?token_hash={{ .TokenHash }}&type=recovery">{{ .SiteURL }}/auth/reset-password?token_hash={{ .TokenHash }}&type=recovery</a>
      </div>
      <p style="font-size: 13px; color: #666; margin-top: 20px;">🔐 This link will expire soon and can be used only once.</p>
    </div>
    <div class="footer">
      Need help? <a href="mailto:support@smartcrm.vip">Contact Support</a><br />
      SmartCRM · Smart Solutions for Your Business
    </div>
  </div>
</body>
</html>
```

5. Click **Save**

### Step 2: Configure Change Email Template (For Email Changes)

1. Click on **"Change Email"** template
2. Switch to **HTML mode**
3. Use this content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width" />
  <title>Confirm your new SmartCRM email address</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #ffffff; color: #222; line-height: 1.6; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border: 1px solid #e4e8ee; border-radius: 16px; box-shadow: 0 4px 14px rgba(0,0,0,0.06); }
    .header { text-align: center; padding: 32px 20px 16px 20px; }
    .logo { font-size: 26px; font-weight: 800; color: #111; }
    .logo span { color: #16a34a; }
    h1 { font-size: 22px; text-align: center; color: #111; margin: 0 0 16px 0; }
    p { font-size: 15px; color: #333; margin: 0 0 20px 0; text-align: center; }
    .button { display: inline-block; padding: 14px 28px; background: #16a34a; color: #ffffff !important; font-size: 16px; font-weight: 700; border-radius: 10px; text-decoration: none; }
    .footer { border-top: 1px solid #e4e8ee; background: #f9fafb; padding: 18px 16px; text-align: center; font-size: 13px; color: #555; border-radius: 0 0 16px 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Smart<span>CRM</span></div>
    </div>
    <div style="padding: 0 24px 24px 24px;">
      <h1>Confirm email address change</h1>
      <p>You requested to change the email address for your <strong>SmartCRM</strong> account.<br>Click the button below to confirm this change.</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: auto;">
        <tr>
          <td align="center" bgcolor="#16a34a" style="border-radius: 10px;">
            <a class="button" href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change" target="_blank">Confirm New Email</a>
          </td>
        </tr>
      </table>
      <p style="font-size: 13px; color: #666; margin-top: 20px;">🔐 This link will expire soon and can be used only once.</p>
    </div>
    <div class="footer">
      Need help? <a href="mailto:support@smartcrm.vip">Contact Support</a>
    </div>
  </div>
</body>
</html>
```

4. Click **Save**

### Step 3: Verify Redirect URLs

Go to **Authentication** → **Settings** → **URL Configuration**

Make sure these URLs are added:
- `https://app.smartcrm.vip/auth/reset-password`
- `https://app.smartcrm.vip/auth/confirm`
- `https://app.smartcrm.vip/auth/callback`

## Testing

1. Go to `https://app.smartcrm.vip/auth/forgot-password`
2. Enter email: `keith@beappsolute.com`
3. Click "Send Reset Link"
4. Check email - you should receive:
   - Subject: "Reset your SmartCRM password" ✅
   - URL: Contains `type=recovery` ✅
