# Product Tier Testing Guide

## ✅ Test Users Created Successfully!

Three test users have been created in your Supabase database, each with a different product tier. You can now test the complete product tier access control system.

## 🔐 Test User Credentials

### 1. SmartCRM Base Tier
**Email:** `test-smartcrm@example.com`  
**Password:** `Test123!`  
**Product Tier:** `smartcrm`  

**Expected Access:**
- ✅ Dashboard
- ✅ Contacts
- ✅ Pipeline
- ✅ AI Calendar
- ✅ Communication
- ❌ AI Goals (tab hidden)
- ❌ AI Tools (dropdown hidden)

### 2. Sales Maximizer Tier
**Email:** `test-sales-maximizer@example.com`  
**Password:** `Test123!`  
**Product Tier:** `sales_maximizer`  

**Expected Access:**
- ✅ Dashboard
- ✅ Contacts
- ✅ Pipeline
- ✅ AI Calendar
- ✅ Communication
- ✅ AI Goals (tab visible and accessible)
- ❌ AI Tools (dropdown hidden)

### 3. AI Boost Unlimited Tier
**Email:** `test-ai-boost@example.com`  
**Password:** `Test123!`  
**Product Tier:** `ai_boost_unlimited`  

**Expected Access:**
- ✅ Dashboard
- ✅ Contacts
- ✅ Pipeline
- ✅ AI Calendar
- ✅ Communication
- ✅ AI Goals (tab visible and accessible)
- ✅ AI Tools (dropdown visible with all AI features)

## 📝 Testing Steps

### Step 1: Test SmartCRM Base Tier
1. Log out if currently logged in
2. Login with: `test-smartcrm@example.com` / `Test123!`
3. **Verify Navigation:**
   - Check that "AI Goals" tab is NOT visible in navigation
   - Check that "AI Tools" dropdown is NOT visible
4. **Try Direct URL Access:**
   - Navigate to `/ai-goals` - should redirect or show access denied
   - Navigate to `/ai-tools` - should redirect or show access denied
5. **✅ Expected Result:** User only sees base CRM features

### Step 2: Test Sales Maximizer Tier
1. Log out
2. Login with: `test-sales-maximizer@example.com` / `Test123!`
3. **Verify Navigation:**
   - Check that "AI Goals" tab IS visible in navigation
   - Click on "AI Goals" - should load successfully
   - Check that "AI Tools" dropdown is NOT visible
4. **Try Direct URL Access:**
   - Navigate to `/ai-goals` - should work
   - Navigate to `/ai-tools` - should redirect or show access denied
5. **✅ Expected Result:** User sees base CRM + AI Goals

### Step 3: Test AI Boost Unlimited Tier
1. Log out
2. Login with: `test-ai-boost@example.com` / `Test123!`
3. **Verify Navigation:**
   - Check that "AI Goals" tab IS visible
   - Check that "AI Tools" dropdown IS visible
   - Click through all AI Tools features
4. **Try Direct URL Access:**
   - Navigate to `/ai-goals` - should work
   - Navigate to `/ai-tools` - should work
5. **✅ Expected Result:** User sees all features

### Step 4: Test Admin Product Tier Management
1. Log in as super admin (dean@videoremix.io, victor@videoremix.io, or samuel@videoremix.io)
2. Navigate to Admin Panel → User Management
3. Find `test-smartcrm@example.com`
4. **Change Product Tier:**
   - Use dropdown to change from "SmartCRM" to "Sales Maximizer"
   - Save changes
5. **Verify Update:**
   - Log out and log back in as test-smartcrm@example.com
   - Check that AI Goals tab is now visible
   - This confirms product tier updates work correctly

## 🔍 What to Look For

### Navigation Filtering
- Navigation tabs should dynamically show/hide based on product tier
- Users should not see tabs for features they don't have access to

### Route Protection
- Direct URL access to restricted features should be blocked
- Users should be redirected or see an access denied message

### User Experience
- The access control should be seamless and clear
- No broken links or confusing error messages

## 🐛 Common Issues to Check

### Issue: All Features Visible Regardless of Tier
**Cause:** Product tier not loading correctly from profile  
**Fix:** Check browser console for errors, verify product_tier in database

### Issue: No Navigation Tabs Visible
**Cause:** Access control logic too restrictive  
**Fix:** Check RoleBasedAccess.tsx logic

### Issue: Product Tier Not Updating
**Cause:** Cache or metadata not syncing  
**Fix:** Clear browser cache, check database and auth metadata sync

## 📊 Database Verification

You can verify the product tiers in the database:

```sql
SELECT id, first_name, last_name, product_tier 
FROM profiles 
WHERE first_name LIKE 'test%@example.com';
```

## 🎯 Success Criteria

✅ **Test 1:** SmartCRM user sees only base features  
✅ **Test 2:** Sales Maximizer user sees base + AI Goals  
✅ **Test 3:** AI Boost user sees all features  
✅ **Test 4:** Admin can update user product tiers  
✅ **Test 5:** Product tier updates reflect immediately after re-login  
✅ **Test 6:** Direct URL access is properly restricted  

## 🔄 Next Steps After Testing

1. **If Tests Pass:**
   - Configure actual JVZoo product IDs in webhook
   - Set up JVZoo webhook URL in your JVZoo account
   - Test with real purchase flow

2. **If Tests Fail:**
   - Check browser console for errors
   - Verify database has correct product_tier values
   - Check that RoleBasedAccess component is imported correctly
   - Verify navigation filtering logic

## 📞 Support

If you encounter any issues during testing:
1. Check browser console for JavaScript errors
2. Check server logs for API errors
3. Verify product_tier in both profiles table and auth metadata
4. Ensure you've cleared browser cache after login
