# Supabase Email/Password Authentication Guide

This document provides documentation for the email/password authentication system in SmartCRM.

## Overview

Simple and focused authentication using Supabase with email and password only:
- Sign up with email/password
- Login with email/password
- Password recovery
- User profile updates

## Files

- `client/src/services/authService.ts` - Client-side authentication service
- `client/src/components/ui/AuthForm.tsx` - Authentication UI component

## Usage

### Sign Up

```typescript
import { signUpWithEmail } from '../services/authService';

const { data, error } = await signUpWithEmail('user@example.com', 'password123');

if (error) {
  console.error('Sign up failed:', error.message);
} else {
  console.log('Check email to confirm account');
}
```

### Login

```typescript
import { signInWithEmail } from '../services/authService';

const { data, error } = await signInWithEmail('user@example.com', 'password123');

if (error) {
  console.error('Login failed:', error.message);
} else {
  console.log('Logged in successfully!');
}
```

### Password Reset

```typescript
import { resetPasswordForEmail } from '../services/authService';

await resetPasswordForEmail('user@example.com');
// User receives email with reset link
```

### Update Password (after reset)

```typescript
import { updateUser } from '../services/authService';

await updateUser({ password: 'new-password' });
```

### Logout

```typescript
import { signOut } from '../services/authService';

await signOut();
```

### Get Current User

```typescript
import { getCurrentUser } from '../services/authService';

const { data: { user } } = await getCurrentUser();
console.log(user);
```

## Using the AuthForm Component

```tsx
import { AuthForm } from '../components/ui/AuthForm';

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <AuthForm 
        onSuccess={(user) => navigate('/dashboard')}
        redirectAfterLogin="/dashboard"
      />
    </div>
  );
}
```

## Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Features

✅ Email/Password Sign Up  
✅ Email/Password Login  
✅ Password Recovery  
✅ Update Email/Password  
✅ Get Current User  
✅ Session Management  
✅ Auth State Listeners  
