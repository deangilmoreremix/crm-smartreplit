# Simple Supabase Webhook Setup Guide

## What You See vs What You Need to Do

### 1. **Webhook Type Section**
**What you see:** Dropdown with "HTTP Request" and "Supabase Edge Functions"  
**What to select:** HTTP Request ✅ (you already did this)

### 2. **Basic Configuration Section**
**What you see:**
- Method: POST ✅ (already correct)
- URL: Your Replit URL ✅ (already correct)
- Timeout: ${WEBHOOK_TIMEOUT:-5000}ms ✅ (already correct)

### 3. **Table and Events Section** (This is what you're missing!)
**What you'll see:** A section that asks:
- **"Table"**: Dropdown menu → Select `auth.users`
- **"Events"**: Checkboxes → Check only `INSERT`

### 4. **HTTP Headers Section**
**What you see:**
```
Content-type: application/json ✅ (already correct)
```

### 5. **Request Body Section** (This is the important part!)
**What you'll see:** A large text box labeled "Request Body" or "Payload"

**Copy and paste this exactly:**
```json
{
  "type": "INSERT",
  "record": {
    "id": "{{ .Record.id }}",
    "email": "{{ .Record.email }}",
    "raw_user_meta_data": {{ .Record.raw_user_meta_data }},
    "user_metadata": {{ .Record.user_metadata }}
  }
}
```

## Step-by-Step Checklist:

☐ **Step 1**: Webhook type = "HTTP Request"  
☐ **Step 2**: Method = "POST"  
☐ **Step 3**: URL = Your Replit URL  
☐ **Step 4**: Find "Table" dropdown → Select "auth.users"  
☐ **Step 5**: Find "Events" checkboxes → Check only "INSERT"  
☐ **Step 6**: Headers = "Content-type: application/json"  
☐ **Step 7**: Find "Request Body" text box → Paste the JSON above  
☐ **Step 8**: Click "Create" or "Save"

## What This Does:

When someone signs up for SmartCRM:
1. Supabase creates the user in `auth.users` table
2. This triggers the webhook (because we selected INSERT events)
3. Supabase sends the user data to your Replit app
4. Your app checks the `app_context` and routes them to SmartCRM email templates

That's it! The webhook will automatically handle routing SmartCRM users to SmartCRM-branded emails.