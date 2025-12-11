# Multi-Tenant Email Solution for SmartCRM

## Problem
Your database is shared across multiple apps, but you need SmartCRM users to receive only SmartCRM-branded emails, not emails from other applications.

## Solution Overview
A comprehensive multi-tenant email system that:
1. **Tracks app context** during user registration
2. **Routes users to correct email templates** based on their app origin
3. **Isolates email branding** per application
4. **Provides fallback mechanisms** for edge cases

## Implementation Steps

### 1. Database Schema Updates ✅

Added to `profiles` table:
```sql
- app_context: text (default: 'smartcrm') 
- email_template_set: text (default: 'smartcrm')
```

This tracks which app each user came from and controls their email template routing.

### 2. Registration Updates ✅

Updated signup process to include app context:
```typescript
// In client/src/lib/supabase.ts
signUp: async (email: string, password: string, options?: any) => {
  return await client.auth.signUp({ 
    email, 
    password,
    options: {
      data: {
        app_context: 'smartcrm',
        email_template_set: 'smartcrm',
        ...options?.data
      }
    }
  })
}
```

### 3. Email Routing System ✅

Created `server/email-routing.ts` with:
- **App configurations** for each application
- **Template routing logic** based on user metadata
- **Validation functions** for app contexts
- **Webhook handlers** for Supabase auth events

## Supabase Configuration

### Option A: Multiple Email Template Sets (Recommended)

**Create separate template sets in Supabase:**

1. **SmartCRM Templates:**
   - Set name: "SmartCRM"
   - Upload your custom templates
   - Configure for users with `app_context = 'smartcrm'`

2. **Other App Templates:**
   - Set name: "OtherApp"
   - Upload their custom templates  
   - Configure for users with `app_context = 'otherapp'`

### Option B: Database Trigger Approach

Create a PostgreSQL function that runs after user creation:

```sql
-- Create function to set email template based on app context
CREATE OR REPLACE FUNCTION set_user_email_template()
RETURNS TRIGGER AS $$
BEGIN
  -- Update auth.users metadata based on app context
  IF NEW.raw_user_meta_data->>'app_context' = 'smartcrm' THEN
    NEW.email_template_set = 'smartcrm_templates';
  ELSIF NEW.raw_user_meta_data->>'app_context' = 'otherapp' THEN
    NEW.email_template_set = 'otherapp_templates';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_set_email_template
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION set_user_email_template();
```

### Option C: Webhook-Based Routing

Set up Supabase webhooks to route emails:

1. **Go to**: Supabase Dashboard → Database → Webhooks
2. **Create webhook** for `auth.users` table
3. **Endpoint**: Your server endpoint that handles routing
4. **Events**: INSERT (user creation)

Example webhook handler:
```typescript
app.post('/auth-webhook', (req, res) => {
  const { type, record } = req.body;
  
  if (type === 'INSERT' && record.table === 'auth.users') {
    const appContext = record.raw_user_meta_data?.app_context || 'smartcrm';
    
    // Route to appropriate email service
    if (appContext === 'smartcrm') {
      // Send SmartCRM welcome email
      sendSmartCRMWelcomeEmail(record.email);
    } else {
      // Route to other app's email system
      routeToAppEmailSystem(appContext, record);
    }
  }
  
  res.json({ success: true });
});
```

## Implementation Choice Recommendation

**For immediate implementation, I recommend Option A:**

### Steps:
1. **Create SmartCRM Email Templates in Supabase**
   - Upload the 5 custom templates I created
   - Name the template set "SmartCRM"

2. **Configure Template Routing**
   - Set default template set to "SmartCRM" 
   - Add logic to use different sets for different apps

3. **Update Signup URLs**
   ```typescript
   // SmartCRM signup URL
   https://yourapp.com/signup?app=smartcrm
   
   // Other app signup URL  
   https://yourapp.com/signup?app=otherapp
   ```

4. **Add App Context to Registration**
   ```typescript
   // In SignUpPage.tsx
   const urlParams = new URLSearchParams(window.location.search);
   const appContext = urlParams.get('app') || 'smartcrm';
   
   // Pass to signup
   await signUp(email, password, { 
     data: { app_context: appContext }
   });
   ```

## Benefits

✅ **Complete Isolation**: SmartCRM users only get SmartCRM emails
✅ **Scalable**: Easy to add new apps and email templates  
✅ **Fallback Safe**: Defaults to SmartCRM if app context missing
✅ **Audit Trail**: Track which app each user came from
✅ **Flexible**: Support multiple email template sets
✅ **Professional**: Each app maintains its own branding

## Testing

Test the system by:
1. **SmartCRM Signup**: `yourapp.com/signup?app=smartcrm`
2. **Other App Signup**: `yourapp.com/signup?app=otherapp`  
3. **Check Emails**: Verify correct branding is sent
4. **Database Check**: Confirm `app_context` is properly stored

This ensures your SmartCRM users will only receive beautifully branded SmartCRM emails, while other apps maintain their own email identity.

## Next Steps

Would you like me to:
1. **Implement the URL parameter routing** in your signup page?
2. **Create the Supabase webhook handler** for email routing?
3. **Set up the database triggers** for automatic template assignment?
4. **Help configure multiple template sets** in your Supabase dashboard?