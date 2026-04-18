# Direct Password Reset Design

## Overview

Transform the current email-based password reset flow to allow users to change their password directly on the platform without email verification or being logged in. Users can enter their email and new password to reset immediately.

## Requirements

- No email sending or verification required
- Users can reset password without being logged in
- Maintain password strength requirements
- Provide clear error messages for invalid inputs
- Ensure security through server-side validation

## Architecture

- **Backend**: New API endpoint `/api/auth/reset-password-direct` using Supabase admin client
- **Frontend**: Modified reset password page with direct form input
- **Security**: Server-side only admin operations with service role key

## Components

### Backend API Endpoint

- **Route**: `POST /api/auth/reset-password-direct`
- **Input**: `{ email: string, newPassword: string }`
- **Validation**:
  - Email format validation
  - Password strength (8+ chars, mixed case, numbers)
- **Process**:
  1. Find user by email using `supabase.auth.admin.listUsers()`
  2. Extract user ID from matching user
  3. Update password using `supabase.auth.admin.updateUserById(id, { password: newPassword })`
- **Output**: Success/error JSON response

### Frontend Form

- **Page**: `/auth/reset-password`
- **Fields**:
  - Email input (required)
  - New password input with strength indicator (required)
  - Submit button
- **Behavior**:
  - Client-side password validation
  - API call on submit
  - Success: Redirect to login with message
  - Error: Display error message

### Supabase Integration

- Admin client initialized with service role key
- Operations performed server-side only
- User lookup via email from auth.users table
- Password update invalidates existing sessions

## Data Flow

1. User accesses `/auth/reset-password`
2. User fills email and new password
3. Form submits to `/api/auth/reset-password-direct`
4. Backend validates input
5. Backend finds user by email
6. Backend updates password
7. Frontend redirects to login on success

## Error Handling

- **User not found**: "No account found with this email"
- **Invalid password**: Specific validation messages
- **Server error**: "Something went wrong, please try again"
- **Rate limiting**: Not implemented (approach 1)

## Security Considerations

- Admin operations logged for audit trail
- Password strength enforced
- No email verification (as per requirements)
- Service role key protected server-side

## Testing

- **Unit Tests**: API endpoint with mocked Supabase client
- **Integration Tests**: Frontend form submission
- **E2E Tests**: Complete reset flow verification

## Implementation Notes

- Maintains compatibility with existing token-based flow if needed
- Uses existing Supabase configuration
- Follows project's coding conventions and patterns
