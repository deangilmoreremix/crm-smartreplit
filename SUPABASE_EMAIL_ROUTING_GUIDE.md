# Supabase Email Routing Guide for 3-Tier Role System

## Account Types and Email Routing

### **1. Super Admin Accounts**
**Email Addresses:**
- dean@videoremix.io
- victor@videoremix.io 
- samuel@videoremix.io

**Email Configuration:**
- **Template Set**: SmartCRM Admin Templates
- **App Context**: 'smartcrm'
- **Role**: 'super_admin'
- **Email Features**: 
  - Admin notifications
  - User management alerts
  - System status updates
  - All standard SmartCRM emails

### **2. WL Users (White Label Users)**
**Who Gets This:**
- All existing users (except super admins)
- Users invited as WL Users
- Premium/paid subscribers

**Email Configuration:**
- **Template Set**: SmartCRM Premium Templates
- **App Context**: 'smartcrm'
- **Role**: 'wl_user'
- **Email Features**:
  - AI feature notifications
  - Advanced feature updates
  - Premium content alerts
  - All standard SmartCRM emails

### **3. Regular Users**
**Who Gets This:**
- New users (default)
- Free tier users
- Basic CRM users

**Email Configuration:**
- **Template Set**: SmartCRM Basic Templates
- **App Context**: 'smartcrm'
- **Role**: 'regular_user'
- **Email Features**:
  - Core CRM notifications
  - Basic feature updates
  - Standard welcome emails
  - Essential system emails only

## How to Configure Email Routing in Supabase

### Step 1: Update Supabase Auth Templates

1. **Go to**: https://supabase.com/dashboard/project/YOUR_PROJECT_REF/auth/templates

2. **Create Role-Based Templates:**

   **For Super Admins:**
   ```html
   <h2>Welcome to SmartCRM Admin</h2>
   <p>You now have full administrative access to SmartCRM.</p>
   <p>Access your admin dashboard and manage users.</p>
   ```

   **For WL Users:**
   ```html
   <h2>Welcome to SmartCRM Premium</h2>
   <p>You have access to all CRM features plus AI tools.</p>
   <p>Explore advanced features and AI automation.</p>
   ```

   **For Regular Users:**
   ```html
   <h2>Welcome to SmartCRM</h2>
   <p>Get started with core CRM features.</p>
   <p>Manage contacts, deals, and communications.</p>
   ```

### Step 2: Configure Metadata-Based Routing

Update your Supabase settings to use user metadata for email routing:

1. **Auth Settings** → **URL Configuration**
2. **Site URL**: https://smart-crm.videoremix.io
3. **Custom SMTP**: Configure with role-aware templates

### Step 3: Database Trigger for Email Routing

```sql
-- Function to set email template based on user role
CREATE OR REPLACE FUNCTION set_user_email_routing()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
  user_role text;
BEGIN
  user_email := NEW.email;
  
  -- Determine role based on email
  IF user_email IN ('dean@videoremix.io', 'victor@videoremix.io', 'samuel@videoremix.io') THEN
    user_role := 'super_admin';
    NEW.raw_user_meta_data := jsonb_set(
      COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
      '{email_template_type}',
      '"admin"'
    );
  ELSIF NEW.raw_user_meta_data->>'role' = 'wl_user' THEN
    user_role := 'wl_user';
    NEW.raw_user_meta_data := jsonb_set(
      COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
      '{email_template_type}',
      '"premium"'
    );
  ELSE
    user_role := 'regular_user';
    NEW.raw_user_meta_data := jsonb_set(
      COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
      '{email_template_type}',
      '"basic"'
    );
  END IF;
  
  -- Set app context
  NEW.raw_user_meta_data := jsonb_set(
    NEW.raw_user_meta_data,
    '{app_context}',
    '"smartcrm"'
  );
  
  -- Set role
  NEW.raw_user_meta_data := jsonb_set(
    NEW.raw_user_meta_data,
    '{role}',
    to_jsonb(user_role)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_email_routing ON auth.users;
CREATE TRIGGER trigger_set_email_routing
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION set_user_email_routing();
```

## Email Template Variables by Role

### Super Admin Template Variables:
```javascript
{
  "user_role": "super_admin",
  "access_level": "Full Administrative Access",
  "dashboard_url": "https://smart-crm.videoremix.io/admin",
  "features": ["User Management", "System Settings", "All CRM Features", "AI Tools"]
}
```

### WL User Template Variables:
```javascript
{
  "user_role": "wl_user", 
  "access_level": "Premium CRM Access",
  "dashboard_url": "https://smart-crm.videoremix.io/dashboard",
  "features": ["Full CRM", "AI Tools", "Advanced Features", "Premium Support"]
}
```

### Regular User Template Variables:
```javascript
{
  "user_role": "regular_user",
  "access_level": "Core CRM Access", 
  "dashboard_url": "https://smart-crm.videoremix.io/dashboard",
  "features": ["Contacts", "Pipeline", "Calendar", "Communication", "CSV Import"]
}
```

## Webhook Configuration for Role-Based Emails

Set up a webhook endpoint to handle role-based email routing:

**Endpoint**: `https://smart-crm.videoremix.io/api/auth-webhook`

```typescript
// Webhook handler for role-based email routing
app.post('/api/auth-webhook', async (req, res) => {
  const { type, record } = req.body;
  
  if (type === 'INSERT' && record.table === 'auth.users') {
    const email = record.email;
    const role = record.raw_user_meta_data?.role;
    const templateType = record.raw_user_meta_data?.email_template_type;
    
    // Send appropriate welcome email based on role
    switch (role) {
      case 'super_admin':
        await sendAdminWelcomeEmail(email, {
          adminDashboard: true,
          userManagement: true
        });
        break;
        
      case 'wl_user':
        await sendPremiumWelcomeEmail(email, {
          aiTools: true,
          advancedFeatures: true
        });
        break;
        
      case 'regular_user':
        await sendBasicWelcomeEmail(email, {
          coreFeatures: true
        });
        break;
    }
  }
  
  res.json({ success: true });
});
```

## Testing Email Routing

### Test Super Admin Email:
```bash
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/auth/v1/signup" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-admin@videoremix.io",
    "password": "testpassword",
    "data": {
      "role": "super_admin",
      "app_context": "smartcrm"
    }
  }'
```

### Test WL User Email:
```bash
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/auth/v1/signup" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-wl@example.com",
    "password": "testpassword", 
    "data": {
      "role": "wl_user",
      "app_context": "smartcrm"
    }
  }'
```

### Test Regular User Email:
```bash
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/auth/v1/signup" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-regular@example.com",
    "password": "testpassword",
    "data": {
      "role": "regular_user", 
      "app_context": "smartcrm"
    }
  }'
```

## Current Status Summary

**✅ Role System**: 3-tier roles implemented
**✅ Email Mapping**: Super admins auto-assigned by email
**✅ Database Schema**: Supports role-based routing
**🔄 Email Templates**: Need to be configured in Supabase
**🔄 Webhook Setup**: Role-based email routing needs activation

## Next Steps

1. **Configure the database trigger** (run the SQL above)
2. **Set up role-based email templates** in Supabase
3. **Test email routing** with each role type
4. **Activate the webhook** for automated email handling

This ensures each user type gets appropriate email communications based on their role and access level!