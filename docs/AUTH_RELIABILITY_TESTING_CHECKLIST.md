# Authentication Reliability Testing Checklist

This document provides a comprehensive testing checklist for verifying Supabase authentication reliability in SmartCRM.

## Prerequisites

- [ ] Supabase project is configured and accessible
- [ ] Test user accounts available (at least 2)
- [ ] Multiple browsers or browser profiles for cross-tab testing
- [ ] Browser DevTools open (Application > Local Storage, Network tab)

---

## 1. Session Initialization Tests

### 1.1 Fresh Page Load

- [ ] Open app in new browser window
- [ ] Verify loading state shows briefly (no flicker)
- [ ] Verify session is established correctly
- [ ] Check `isSessionReady` becomes `true`
- [ ] Verify no console errors related to auth

### 1.2 Page Refresh on Public Page

- [ ] Navigate to landing page (`/`)
- [ ] Refresh the page (F5)
- [ ] Verify page loads without auth flash
- [ ] Verify no redirect to signin

### 1.3 Page Refresh on Protected Page

- [ ] Sign in as authenticated user
- [ ] Navigate to a protected route (e.g., `/dashboard`)
- [ ] Refresh the page (F5)
- [ ] Verify user stays on protected page
- [ ] Verify no redirect loop occurs
- [ ] Verify session is restored correctly

---

## 2. Protected Route Tests

### 2.1 Unauthenticated Access

- [ ] Sign out completely
- [ ] Attempt to navigate to `/dashboard`
- [ ] Verify redirect to `/signin`
- [ ] Verify intended destination is preserved in location state
- [ ] Sign in and verify redirect back to original destination

### 2.2 Authenticated Access

- [ ] Sign in as authenticated user
- [ ] Navigate to various protected routes
- [ ] Verify immediate access (no unnecessary loading)
- [ ] Verify no redirect flash

### 2.3 Feature-Gated Routes

- [ ] Sign in as user with limited tier
- [ ] Attempt to access feature-restricted route
- [ ] Verify redirect to `/upgrade` with correct state
- [ ] Verify feature name is included in state

### 2.4 Deep Link Access

- [ ] Copy URL of protected page (e.g., `/contacts/123`)
- [ ] Sign out
- [ ] Paste URL in new tab
- [ ] Verify redirect to signin with destination preserved
- [ ] Sign in and verify redirect to deep-linked page

---

## 3. Session Expiration Tests

### 3.1 Token Expiration

- [ ] Sign in and note the session expiry time
- [ ] Wait for session to approach expiry (or manually test with short expiry)
- [ ] Verify session refresh occurs automatically
- [ ] Verify user stays logged in
- [ ] Verify no interruption to user activity

### 3.2 Expired Session on Load

- [ ] Sign in and wait for session to fully expire
- [ ] Refresh the page
- [ ] Verify redirect to signin
- [ ] Verify appropriate message shown

---

## 4. Cross-Tab Synchronization Tests

### 4.1 Sign Out in Another Tab

- [ ] Open app in Tab A and sign in
- [ ] Open app in Tab B (should show authenticated)
- [ ] In Tab A, sign out
- [ ] Switch to Tab B
- [ ] Verify Tab B shows signed out state
- [ ] Attempt action in Tab B - should redirect to signin

### 4.2 Sign In in Another Tab

- [ ] Open app in Tab A (signed out)
- [ ] Open app in Tab B (signed out)
- [ ] In Tab A, sign in
- [ ] Switch to Tab B
- [ ] Refresh Tab B or interact
- [ ] Verify Tab B shows authenticated state

### 4.3 Session Sync on Focus

- [ ] Open app in Tab A and sign in
- [ ] Open app in Tab B
- [ ] Sign out in Tab A
- [ ] Focus Tab B (click on it)
- [ ] Verify Tab B updates to signed out state

---

## 5. Network Resilience Tests

### 5.1 Offline During Auth

- [ ] Open DevTools Network tab
- [ ] Set network to "Offline"
- [ ] Attempt to sign in
- [ ] Verify appropriate error message
- [ ] Restore network
- [ ] Verify sign in works

### 5.2 Offline During Session

- [ ] Sign in successfully
- [ ] Set network to "Offline"
- [ ] Navigate around the app
- [ ] Verify cached session allows access
- [ ] Restore network
- [ ] Verify session syncs correctly

### 5.3 Network Recovery

- [ ] Sign in
- [ ] Go offline
- [ ] Wait 30+ seconds
- [ ] Come back online
- [ ] Verify session refreshes automatically
- [ ] Verify no errors in console

---

## 6. Edge Cases

### 6.1 Multiple Rapid Refreshes

- [ ] Navigate to protected page
- [ ] Rapidly press F5 multiple times (5-10 times)
- [ ] Verify no redirect loops
- [ ] Verify session remains stable
- [ ] Verify no console errors

### 6.2 Browser Back/Forward Navigation

- [ ] Sign in
- [ ] Navigate through several protected pages
- [ ] Use browser back button multiple times
- [ ] Use browser forward button
- [ ] Verify all pages load correctly
- [ ] Verify no auth state issues

### 6.3 Session Storage Corruption

- [ ] Sign in
- [ ] Open DevTools > Application > Local Storage
- [ ] Manually corrupt or delete auth tokens
- [ ] Refresh page
- [ ] Verify app handles gracefully (redirect to signin)

### 6.4 Concurrent Auth Requests

- [ ] Open multiple tabs to the signin page
- [ ] Sign in simultaneously in multiple tabs
- [ ] Verify only one session is created
- [ ] Verify all tabs show authenticated state

### 6.5 Sign Out with Pending Requests

- [ ] Sign in
- [ ] Trigger a long-running API request
- [ ] Immediately sign out
- [ ] Verify sign out completes
- [ ] Verify pending request doesn't cause issues

---

## 7. Loading State Tests

### 7.1 No Page Flicker

- [ ] Sign out
- [ ] Clear browser cache
- [ ] Open app
- [ ] Verify no white flash or loading flicker
- [ ] Verify smooth transition to landing/signin page

### 7.2 Loading Gate

- [ ] Sign in
- [ ] Navigate to protected route
- [ ] Verify loading spinner shows briefly while session validates
- [ ] Verify content appears smoothly after validation

### 7.3 Auth State Transitions

- [ ] Watch the auth state in React DevTools
- [ ] Sign in - verify `loading` → `isSessionReady` → `isAuthenticated` flow
- [ ] Sign out - verify reverse flow
- [ ] Verify no intermediate states cause UI issues

---

## 8. Error Handling Tests

### 8.1 Invalid Credentials

- [ ] Attempt sign in with wrong password
- [ ] Verify error message is displayed
- [ ] Verify form remains functional
- [ ] Verify no redirect loop

### 8.2 Supabase Unavailable

- [ ] Temporarily block supabase.co in hosts file or network
- [ ] Attempt to sign in
- [ ] Verify graceful error handling
- [ ] Verify app doesn't crash

### 8.3 Malformed Session

- [ ] Manually set invalid JSON in localStorage auth key
- [ ] Refresh page
- [ ] Verify app handles gracefully
- [ ] Verify redirect to signin

---

## 9. Performance Tests

### 9.1 Initial Load Time

- [ ] Clear all cache
- [ ] Open app and measure time to interactive
- [ ] Target: < 3 seconds on broadband
- [ ] Verify auth doesn't block initial render

### 9.2 Session Check Overhead

- [ ] Navigate between protected pages
- [ ] Measure time for each navigation
- [ ] Verify session check doesn't add noticeable delay
- [ ] Target: < 100ms for session validation

---

## 10. Mobile/Responsive Tests

### 10.1 Mobile Browser

- [ ] Test all above scenarios on mobile browser
- [ ] Verify touch interactions work with auth flows
- [ ] Verify mobile-specific session handling

### 10.2 Mobile App WebView (if applicable)

- [ ] Test auth in WebView environment
- [ ] Verify session persistence
- [ ] Verify deep links work correctly

---

## Test Results Template

| Test Category             | Pass | Fail | Notes |
| ------------------------- | ---- | ---- | ----- |
| 1. Session Initialization | ☐    | ☐    |       |
| 2. Protected Routes       | ☐    | ☐    |       |
| 3. Session Expiration     | ☐    | ☐    |       |
| 4. Cross-Tab Sync         | ☐    | ☐    |       |
| 5. Network Resilience     | ☐    | ☐    |       |
| 6. Edge Cases             | ☐    | ☐    |       |
| 7. Loading States         | ☐    | ☐    |       |
| 8. Error Handling         | ☐    | ☐    |       |
| 9. Performance            | ☐    | ☐    |       |
| 10. Mobile                | ☐    | ☐    |       |

**Tester:** **\*\***\_\_\_**\*\***
**Date:** **\*\***\_\_\_**\*\***
**Environment:** **\*\***\_\_\_**\*\***
**Browser(s):** **\*\***\_\_\_**\*\***

---

## Known Issues / Notes

Document any issues discovered during testing:

1.
2.
3.

---

## Quick Smoke Test (5 minutes)

For rapid verification after changes:

1. [ ] Sign in → Dashboard loads
2. [ ] Refresh on dashboard → Stays on dashboard
3. [ ] Sign out → Redirects to landing
4. [ ] Try protected route → Redirects to signin
5. [ ] Sign in → Redirects to intended destination
6. [ ] Open second tab, sign out in first → Second tab shows signed out
