# Commit: Remove unused prototypes and enhance AI routes with GPT-5.2 fallback

## Summary
This commit removes unused mobile/video prototype code and consolidates AI endpoints with GPT-5.2 support and automatic fallback.

## Changes

### Removed (Cleanup)
- **mobile/**: Entire React Native/Expo mobile app prototype (26 files)
  - White label CRM mobile implementation
  - React Navigation with tab navigator
  - Auth, Theme, and Whitelabel contexts
  - Dashboard, Contacts, Deals, Settings screens
- **my-video/**: Remotion video composition prototype (8 files)
  - Video generation setup

### Modified
- **server/routes.ts**: 
  - Removed duplicate AI endpoints (/api/openai/status, /api/respond, /api/stream)
  - Endpoints now consolidated in server/routes/ai.ts
- **server/routes/ai.ts**:
  - Enhanced GPT-5.2 detection with automatic fallback to gpt-4o-mini
  - Added version field to status response
  - Added capabilities array based on available models
  - Fixed hardcoded model names that would fail if GPT-5.2 unavailable
  - Added tool calling support for business analysis

## Technical Details

### GPT-5.2 Enhancement
- Status endpoint now tests GPT-5.2 first, falls back to gpt-4o-mini
- Added `gpt5_2Available` flag to response
- Added `version` field indicating which model is available
- Capabilities array shows available features

### Fallback Logic
- `/api/respond`: Tries GPT-5.2, catches error and retries with gpt-4o-mini
- `/api/stream`: Same fallback pattern for streaming responses
- Tool call continuation uses gpt-4o-mini as safe fallback

### Breaking Changes
- None - endpoints remain backward compatible
- Fallback ensures functionality even without GPT-5.2 access

## Files Changed
- 35 files total
- 26,000+ lines removed (cleanup)
- ~600 lines modified/added (AI enhancements)
