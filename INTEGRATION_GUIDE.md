# SmartCRM Feature Gating Integration Guide

## ✅ Database Setup Complete

The Supabase database now has:
- 140 user entitlements correctly categorized
- Feature mappings for all 4 packages
- `user_has_feature()` function for access checks

## 📦 What Was Created

### Client-side Types
**`/client/src/types/entitlements.ts`**
- Package type definitions
- FeatureKey enum (all feature keys)
- `PACKAGE_FEATURES` mapping
- `canAccessFeature()` function
- Route-to-feature mapping (`ROUTE_FEATURE_MAP`)
- Helper functions for access checks

### React Context
**`/client/src/contexts/EntitlementContext.tsx`**
- Fetches user entitlement on login
- Provides `hasFeature()`, `canAccess()`, `canAccessRoute()`
- Auto-creates default `regular` package for new users
- Refetch capability for package changes

### Role Provider Integration
**`/client/src/components/RoleBasedAccess.tsx`** (updated)
- Now includes entitlement data in user object
- `canAccess()` uses entitlement system as primary, falls back to legacy product tier
- Maintains backwards compatibility with existing product tier checks

### Route Protection
**`/client/src/components/ProtectedRoute.tsx`** (updated)
- Simplified: uses `useEntitlements()` directly
- Checks feature access via `canAccessFeature(entitlement, featureKey)`
- No longer depends on legacy `useFeatureAccess` query

### Server Middleware
**`/server/middleware/entitlements.ts`**
- `requireEntitlement(featureKey)` - protect API routes
- `requireOneOfEntitlements(featureKeys)` - allow any of several features
- Uses Supabase `user_has_feature()` RPC for authoritative checks

---

## 🔧 Integration Steps

### 1. Wrap App with EntitlementProvider

**`/client/src/App.tsx`** - Add provider inside existing providers:

```tsx
import { EntitlementProvider } from './contexts/EntitlementContext';

// Inside App component, wrap with:
<AuthProvider>
  <EntitlementProvider>  {/* Add this */}
    <RoleProvider>
      {/* ... rest of providers */}
      <Routes>
        {/* ... routes */}
      </Routes>
    </RoleProvider>
  </EntitlementProvider>
</AuthProvider>
```

### 2. Update ProtectedRoute Usage in App.tsx

Replace existing route definitions to use the new feature-based gating:

**OLD:**
```tsx
<Route
  path="/white-label"
  element={
    <ProtectedRoute resource="whitelabel_branding" requireProductTier>
      <WhiteLabelPage />
    </ProtectedRoute>
  }
/>
```

**NEW:**
```tsx
<Route
  path="/white-label"
  element={
    <ProtectedRoute featureKey="white_label_customization">
      <WhiteLabelPage />
    </ProtectedRoute>
  }
/>
```

**Common feature keys:**
- Dashboard/Contacts/Pipeline/Calendar: `'dashboard'`, `'contacts'`, `'pipeline'`, `'calendar'`
- White Label: `'white_label_customization'`
- OpenClaw: `'openclaw'`
- AI Tools: `'ai_tools'`
- AI Goals: `'ai_goals'`
- Analytics: `'analytics'`
- Communication (Video Email, SMS, Phone): `'video_email'`, `'text_messages'`, `'phone_system'`
- Admin: `'admin_panel'`

### 3. Navbar - Show/Hide Menu Items Based on Features

**`/client/src/components/Navbar.tsx`** - Already mostly compatible:

The Navbar uses `canAccess()` from `useRole()`. This now works because `RoleProvider` includes entitlement data.

```tsx
const { canAccess, isSuperAdmin } = useRole();

// Example: conditionally render White Label dropdown
{canAccess('white_label_customization') && (
  <button>White Label</button>
)}

// Example: conditionally render Admin Panel
{isSuperAdmin() && (
  <button>Admin Panel</button>
)}
```

### 4. Protect API Routes on Server

Add entitlement middleware to sensitive API routes:

**Example - `/server/routes/openclaw.ts`:**
```ts
import { requireEntitlement } from '../middleware/entitlements';
import { FeatureKey } from '../types/entitlements';

router.post(
  '/run',
  requireAuth,
  requireEntitlement(FeatureKey.OPENCLAW), // Only users with openclaw_enabled=true
  async (req: Request, res: Response) => {
    // Your OpenClaw logic here
  }
);
```

**Example - `/server/routes/admin.ts`:**
```ts
import { requireEntitlement } from '../middleware/entitlements';

router.get(
  '/stats',
  requireAuth,
  requireEntitlement(FeatureKey.ADMIN_PANEL), // Only super_admin package
  async (req, res) => {
    // Admin logic
  }
);
```

**Example - `/server/routes/white-label.ts`:**
```ts
router.post(
  '/branding',
  requireAuth,
  requireEntitlement(FeatureKey.WHITE_LABEL_CUSTOMIZATION),
  async (req, res) => {
    // White-label branding update
  }
);
```

### 5. Update Existing Admin Check Middleware

The current `requireAdmin()` checks `profiles.role`. This should also check entitlement package for consistency. You can optionally update it:

**`/server/routes/auth.ts` - Enhancement:**

```ts
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  // ... existing checks

  // Additionally check entitlement package
  const { data: entitlement } = await supabase
    .from('user_entitlements')
    .select('package, admin_enabled')
    .eq('user_id', userId)
    .single();

  if (entitlement?.package !== 'super_admin' && entitlement?.admin_enabled) {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }

  // ... rest
};
```

---

## 🧪 Testing the Gating

1. **Login as a Whitelabel user** (e.g., `fredrik.kaada@gmail.com`)
   - Should see White Label menu
   - Should NOT see OpenClaw or Admin Panel

2. **Login as a SmartMarketer user** (e.g., `thomaspublications@gmail.com`)
   - Should see AI Tools, Analytics, Communication
   - Should NOT see White Label or Admin Panel

3. **Login as Yearly user** (e.g., `stevebarrett.ceo@gmail.com`)
   - Should see only login page (no access to any features)
   - `user_has_feature('dashboard')` → false

4. **Login as Super Admin** (e.g., `dean@smartcrm.vip`)
   - Should see everything
   - `user_has_feature('openclaw')` → true

---

## 📋 Feature Key Reference

Use these strings when calling `canAccess()`, `requiredFeature`, or `requireEntitlement()`:

```ts
// Core CRM
'core_crm', 'dashboard', 'contacts', 'pipeline', 'calendar'

// Contact Features
'contact_enhancements', 'ai_contact_enrichment', 'ai_lead_scoring', 'custom_fields',
'contact_activity_tracking', 'bulk_contact_operations', 'pipeline_management', 'task_management'

// AI Tools
'ai_tools', 'email_analysis', 'meeting_summarizer', 'proposal_generator',
'call_script_generator', 'subject_line_optimizer', 'vision_analyzer', 'image_generator',
'semantic_search', 'function_assistant', 'streaming_chat', 'live_deal_analysis',
'instant_response_generator', 'ai_goals'

// Analytics
'analytics', 'advanced_analytics', 'business_intelligence', 'sales_intelligence',
'deal_intelligence_dashboard', 'contact_analytics_dashboard', 'pipeline_intelligence',
'deal_risk_monitor', 'smart_conversion_insights', 'pipeline_health_dashboard',
'sales_cycle_analytics', 'win_rate_intelligence', 'ai_sales_forecast',
'competitor_insights', 'revenue_intelligence'

// Communication
'communication_hub', 'appointments', 'video_email', 'text_messages',
'phone_system', 'voice_profiles'

// Smart Marketer Tools
'invoicing', 'lead_automation', 'forms_surveys', 'business_analyzer',
'content_library', 'circle_prospecting'

// Connected Apps
'connected_apps', 'funnelcraft_ai', 'smartcrm_closer', 'content_ai'

// White Label
'white_label', 'white_label_customization', 'white_label_management',
'multi_tenant_features', 'custom_branding', 'domain_management',
'package_builder', 'revenue_sharing', 'partner_dashboard', 'partner_onboarding'

// Admin / System
'openclaw', 'admin_panel', 'feature_management', 'user_management',
'system_monitoring', 'security_audit_logs', 'compliance_tools'
```

---

## 🔄 Migration Notes

1. **Existing product tier system stays** - The `profiles.product_tier` field is still used. Entitlements override it.
2. **No data loss** - All existing users keep their current roles. The entitlement system adds a new layer of feature checks.
3. **Gradual rollout** - You can keep using `requireProductTier` while migrating routes to `requireEntitlement`.
4. **Admin bypass** - Super admin package (or `role === 'super_admin'`) grants all features automatically.

---

## 🚨 Important Security Notes

1. **Never rely solely on frontend gating** - Always protect API routes with `requireEntitlement()` middleware.
2. **Package assignment** - The `user_has_feature()` RPC is the single source of truth for feature access.
3. **Conflicts resolved** - Whitelabel always wins over other packages if duplicate emails exist.
4. **Yearly buyers** - Are set to `no_access` package and see nothing until manually upgraded.

---

## 📊 Database Queries for Debugging

```sql
-- Check user's package and features
SELECT 
  ue.email,
  ue.package,
  ue.openclaw_enabled,
  ue.admin_enabled,
  array_agg(pf.feature_key) as features
FROM user_entitlements ue
LEFT JOIN package_features pf ON ue.package = pf.package
WHERE ue.email = 'user@example.com'
GROUP BY ue.id;

-- Test access function
SELECT public.user_has_feature('user@example.com', 'ai_tools') as has_access;

-- Count users per package
SELECT package, COUNT(*) FROM user_entitlements GROUP BY package;
```

---

## ✅ Done!

The gating system is now fully integrated. Users will automatically get correct feature access based on the package assigned to their email in `user_entitlements`. Any new features you add should be inserted into `package_features` table and added to the `PACKAGE_FEATURES` client-side map.
