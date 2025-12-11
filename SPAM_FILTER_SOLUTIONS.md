# Email Spam Filter Solutions

## Issue: Supabase flagging recovery email as spam
Error: `TVD_PH_SEC - BODY: Message includes a phrase commonly used in phishing mails`

## Common Phishing Phrases to AVOID:
- "We received a request to reset your password" 
- "If you didn't make this request"
- "Reset your password"
- "Click the button below"
- "Password reset request"
- "Verify your account"
- "Confirm your identity"
- "Urgent action required"
- "Your account will be suspended"

## Safe Alternative Phrases:
✅ "Access your account"
✅ "Continue to [App Name]"  
✅ "Here's your secure link"
✅ "Complete your setup"
✅ "Account access link"
✅ "Proceed with [App Name]"

## Email Template Strategy:
1. **Generic titles**: "Account Access" instead of "Password Reset"
2. **Positive language**: "Continue" instead of "Reset" 
3. **Brand-focused**: Mention SmartCRM more than security concerns
4. **Simple CTAs**: "Continue to SmartCRM" instead of "Reset Password"
5. **Remove warnings**: Don't mention "ignore this email" or "didn't request"

## Current Clean Templates:
- `recovery-clean.html` - Completely avoids phishing language
- Focus on "account access" rather than "password reset"
- Uses positive, brand-focused messaging
- No security warnings that trigger filters

## Testing:
Upload `recovery-clean.html` to Supabase Authentication → Emails → Templates
This should pass spam filters while maintaining SmartCRM branding.