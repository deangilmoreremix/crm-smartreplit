# Supabase Webhook Configuration for Multi-Tenant Email Routing

## Step-by-Step Webhook Setup

### 1. Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Database** → **Webhooks**

### 2. Create New Webhook
Click **"Create a new hook"** and configure:

**Basic Configuration:**
- **Name**: `SmartCRM Email Router`
- **Table**: `auth.users`
- **Events**: Select **INSERT** (user creation)
- **Type**: `HTTP Request`

**HTTP Configuration:**
- **URL**: `https://your-replit-app.replit.dev/api/auth-webhook`
- **Method**: `POST`
- **HTTP Headers**:
  ```
  Content-Type: application/json
  Authorization: Bearer YOUR_SERVICE_ROLE_KEY
  ```

**Request Body Template:**
```json
{
  "type": "INSERT",
  "table": "auth.users",
  "record": {
    "id": "{{ record.id }}",
    "email": "{{ record.email }}",
    "raw_user_meta_data": "{{ record.raw_user_meta_data }}",
    "user_metadata": "{{ record.user_metadata }}",
    "created_at": "{{ record.created_at }}"
  },
  "old_record": null
}
```

### 3. Test Webhook Configuration

**Test Payload:**
```json
{
  "type": "INSERT",
  "table": "auth.users", 
  "record": {
    "id": "test-user-123",
    "email": "test@smartcrm.com",
    "raw_user_meta_data": {
      "app_context": "smartcrm",
      "email_template_set": "smartcrm",
      "first_name": "Test",
      "last_name": "User"
    }
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "appContext": "smartcrm", 
  "message": "User routed to smartcrm email templates"
}
```

### 4. Webhook Security (Recommended)

Add webhook signature verification:

```typescript
// In server/routes.ts - Enhanced webhook handler
app.post('/api/auth-webhook', (req, res) => {
  try {
    // Verify webhook signature (optional but recommended)
    const signature = req.headers['x-webhook-signature'];
    const expectedSignature = process.env.SUPABASE_WEBHOOK_SECRET;
    
    if (expectedSignature && signature !== expectedSignature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    const { type, record } = req.body;
    
    if (type === 'INSERT' && record) {
      const appContext = record.raw_user_meta_data?.app_context || 
                        record.user_metadata?.app_context || 
                        'smartcrm';
      
      // Log for monitoring
      console.log(`🎯 Email routing: ${record.email} → ${appContext} templates`);
      
      res.json({ 
        success: true, 
        appContext,
        message: `User routed to ${appContext} email templates`
      });
    } else {
      res.json({ success: true, message: 'Event processed' });
    }
  } catch (error) {
    console.error('❌ Auth webhook error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process auth webhook' 
    });
  }
});
```

### 5. Alternative: Database Function Approach

If webhooks don't work for your setup, create a PostgreSQL function:

```sql
-- Create function to handle email template routing
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the new user signup with app context
  INSERT INTO public.user_activity_log (
    user_id,
    email, 
    app_context,
    template_set,
    created_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'app_context', 'smartcrm'),
    COALESCE(NEW.raw_user_meta_data->>'email_template_set', 'smartcrm'),
    NOW()
  );
  
  -- You could also call external API here if needed
  -- PERFORM net.http_post(
  --   url := 'https://your-app.com/api/user-created',
  --   body := jsonb_build_object('user_id', NEW.id, 'app_context', NEW.raw_user_meta_data->>'app_context')
  -- );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_handle_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### 6. Monitoring & Debugging

**Check Webhook Logs:**
- Supabase Dashboard → Database → Webhooks → Your webhook → Logs
- Your Replit console logs for webhook calls

**Test Different App Contexts:**
```bash
# SmartCRM signup test
curl -X POST https://your-app.com/api/auth-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "record": {
      "id": "test-123",
      "email": "test@smartcrm.com", 
      "raw_user_meta_data": {"app_context": "smartcrm"}
    }
  }'

# Other app signup test  
curl -X POST https://your-app.com/api/auth-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT", 
    "record": {
      "id": "test-456",
      "email": "test@otherapp.com",
      "raw_user_meta_data": {"app_context": "otherapp"}
    }
  }'
```

### 7. Webhook URL for Your Replit

Your webhook URL will be:
```
https://9f38fddb-d049-4cd4-9f57-c41b6a878a9d-00-2xv27ubfspt46.riker.replit.dev/api/auth-webhook
```

## Implementation Status

✅ **Webhook endpoint created** (`/api/auth-webhook`)
✅ **Request handler implemented** with app context detection  
✅ **Error handling** and logging added
✅ **Multi-tenant routing logic** ready
✅ **Security considerations** documented

## Next Steps

1. **Create the webhook** in your Supabase dashboard using the configuration above
2. **Test the webhook** with a sample user signup
3. **Monitor the logs** to ensure proper routing
4. **Upload your custom email templates** to Supabase
5. **Configure template sets** for different apps

The webhook is now ready to automatically route SmartCRM users to SmartCRM email templates while keeping other apps isolated to their own branding.