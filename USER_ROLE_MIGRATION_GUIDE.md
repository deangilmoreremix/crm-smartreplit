# User Role Migration Guide

## Overview
Your CRM now has a new 3-tier role system with proper user management. This guide helps you migrate existing users and understand the new system.

## New Role Structure

### **Super Admin** 
- **Who**: dean@videoremix.io, victor@videoremix.io, samuel@videoremix.io only
- **Access**: Full platform access including user management
- **Auto-Assignment**: Automatically assigned based on email address

### **WL Users** 
- **Who**: All current users (except super admins)
- **Access**: Complete CRM features + AI tools + advanced features
- **No Access**: User management and admin dashboard

### **Regular Users**
- **Who**: New users going forward (default for new invites)
- **Access**: Core CRM only (Dashboard, Contacts, Pipeline, Calendar, Communication)
- **Includes**: CSV import capabilities

## How to Migrate Your Users

### **Step 1: Access User Management**
1. Login as a super admin (dean@, victor@, or samuel@)
2. Navigate to **User Management** page
3. Click the **"Role Migration"** button

### **Step 2: Run Migration**
1. Click **"Run Role Migration"** 
   - Updates all existing users to correct roles
   - Super admins assigned by email
   - All other existing users become WL Users

2. Click **"Sync Metadata"**
   - Syncs role data with Supabase Auth
   - Ensures email templates work correctly
   - Updates user metadata for consistency

### **Step 3: Invite New Users**
When inviting new users:
- **Regular Users**: Default option, core CRM access
- **WL Users**: Full CRM features, select when needed
- **Super Admin**: Only assign to trusted administrators

## API Changes

### **User Invite API**
```javascript
// Updated invite endpoint validates roles
POST /api/users/invite
{
  "email": "user@example.com",
  "role": "regular_user", // or "wl_user" or "super_admin"
  "firstName": "First",
  "lastName": "Last"
}
```

### **Role Update API**
```javascript
// Updated role update with validation
PATCH /api/users/{userId}/role
{
  "role": "wl_user" // validates against allowed roles
}
```

## Email Template Routing

Users now get appropriate email templates based on their role:
- **All users**: SmartCRM branded templates
- **App context**: Automatically set to 'smartcrm'
- **Metadata sync**: Ensures consistency between database and auth

## Verification Steps

1. **Check role assignment**: Verify super admins have correct access
2. **Test invites**: Invite a new regular user and confirm limited access
3. **Verify email templates**: New users should get SmartCRM branded emails
4. **Test navigation**: WL users should see AI tools, regular users should not

## Troubleshooting

### **Migration Issues**
- Check server logs for detailed error messages
- Ensure Supabase connection is working
- Verify environment variables are set

### **Role Access Issues**
- Clear browser cache and re-login
- Check that migration completed successfully
- Verify user exists in both database and Supabase Auth

### **Email Template Issues**
- Run metadata sync again
- Check Supabase Auth dashboard for user metadata
- Verify webhook configuration

## Command Line Migration (Alternative)

If you prefer running migrations directly:

```bash
# Run role migration
npm run tsx server/migrate-user-roles.ts

# Sync Supabase metadata  
npm run tsx server/update-supabase-users.ts
```

## Support

For issues with migration:
1. Check the Role Migration panel for detailed status
2. Review server logs in the workflow console
3. Contact support with specific error messages