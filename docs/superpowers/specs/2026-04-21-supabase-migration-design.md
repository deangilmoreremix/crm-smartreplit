# Supabase Migration Design - Remove Neon, Use Supabase Database

## Date

2026-04-21

## Problem Statement

The application currently uses Neon PostgreSQL for database operations while using Supabase for authentication. The user wants to consolidate to use only Supabase for both database and auth, removing all Neon dependencies.

## Current State

- Database connection uses `@neondatabase/serverless` with `drizzle-orm/neon-serverless`
- WebSocket configuration for Neon connections
- Supabase used only for authentication and some API operations
- Mixed environment with both Neon and Supabase credentials

## Proposed Solution

### Database Connection Architecture

Replace the current Neon-specific database setup with a standard PostgreSQL connection that works with Supabase:

- Change `server/db.ts` imports from `@neondatabase/serverless` and `drizzle-orm/neon-serverless` to `postgres` and `drizzle-orm/postgres-js`
- Remove the `neonConfig.webSocketConstructor = ws;` configuration
- Keep the existing `Pool` and `drizzle` initialization logic but use the Supabase PostgreSQL connection string

### Environment Variables Configuration

Update environment variables to use the new Supabase credentials:

- Set `DATABASE_URL` to: `postgresql://postgres:VideoRemix2026@db.bzxohkrxcwodllketcpz.supabase.co:5432/postgres`
- Update client environment with the new publishable key (changing from VITE_SUPABASE_ANON_KEY to VITE_SUPABASE_PUBLISHABLE_KEY if needed)
- Add server-side environment variables for SUPABASE_SERVICE_ROLE_KEY: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eG9oa3J4Y3dvZGxsa2V0Y3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg2NjM4NSwiZXhwIjoyMDg5NDQyMzg1fQ.S5HmTONnamT169WYF0riSphXij-Mwtk7D3pphfSrCFE`

### Dependencies Management

- Remove `@neondatabase/serverless` package
- Remove `ws` package (only used for Neon WebSocket connections)
- Install `@supabase/ssr` if server-side rendering support is needed
- Ensure `postgres` and `drizzle-orm` remain for database operations

### Build and Deployment Updates

- Rebuild Netlify functions to remove Neon dependencies from bundled code
- Verify that all database operations continue working with the new connection
- Test that Supabase auth integration remains functional

## Success Criteria

- No Neon dependencies remain in the codebase
- Database operations work with Supabase PostgreSQL
- Supabase auth continues to function
- All existing features maintain functionality
- Netlify functions deploy successfully without Neon code

## Risks

- Database connection might require adjustments for Supabase-specific configurations
- Potential breaking changes if any code relied on Neon-specific features
- Environment variable mismatches during deployment

## Implementation Plan

Will be created after design approval using writing-plans skill.
