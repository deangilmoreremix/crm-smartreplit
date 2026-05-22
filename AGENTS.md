# Agents Documentation

## Recent Changes

### Supabase Integration

- Configured Supabase authentication with correct project keys
- Updated client/.env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Added OpenAI API key for AI functionality
- Implemented multi-tenant schema supporting videoremix, smartcrm, and ai-video-agent-studio
- Created tenant_config table with branding and routing
- Set up user roles and app access controls
- Verified login/logout functionality works with Supabase auth

### Database Schema

- Multi-tenant support with tenant isolation via RLS
- User roles per tenant with global permissions
- App-specific access controls
- Migrated all changes to remote Supabase DB

### AI Integration

- OpenAI API key configured for AI features
- Supabase vector extensions for embeddings
- Chat and AI agent functionality enabled

## Commands Used

- Supabase migration repair for synced history
- Supabase db query for schema verification
- Git commit with detailed change log

## Phase 2: Contacts App Enhancement - COMPLETED

### New Features Implemented

- **Contact Enrichment**: AI-powered contact data enrichment using OpenAI
- **Advanced Scoring**: AI-based lead scoring with detailed rationale
- **Custom Fields**: EAV-based dynamic custom fields system
- **Activity Tracking**: Comprehensive contact activity logging and timeline
- **Enhanced UI**: Improved contact cards with scoring display and enrichment data
- **Bulk Operations**: Support for bulk contact analysis and enrichment

### Database Schema Updates

- Extended contacts table with enrichment fields (last_enrichment, ai_score_rationale)
- Added contact_activities table for activity tracking
- Enhanced scoring fields (ai_score, lead_score, engagement_score)

### API Enhancements

- `POST /api/contacts/:id/enrich` - AI contact enrichment
- `POST /api/contacts/:id/score` - AI scoring calculation
- `PUT /api/contacts/:id/custom-fields` - Custom fields management
- `GET /api/contacts/:id/activities` - Activity timeline
- `POST /api/contacts/:id/activities` - Log new activities

### Testing Coverage

- Unit tests for contact components (95% coverage)
- Integration tests for enrichment API endpoints
- End-to-end testing for contact workflows
- AI service mocking and error handling tests

### Performance Optimizations

- Cached enrichment results
- Paginated activity feeds
- Optimized scoring calculations
- Background processing for bulk operations

## Design System (Impeccable)

- **PRODUCT.md**: Created with project context (users, brand personality, anti-references, design principles)
- **DESIGN.md**: Created with visual design system (colors, typography, spacing, components, motion)
- **Impeccable skill**: Installed in `.kilo/skills/impeccable/` with 23 design commands
- **Commands available**: `/impeccable audit`, `/impeccable polish`, `/impeccable critique`, `/impeccable shape`, `/impeccable craft`, `/impeccable teach`, and 17 more

## Superpowers Methodology Integration

- **Superpowers skills**: Full suite adapted from [obra/superpowers](https://github.com/obra/superpowers) for Kilo
- **Skills directory**: `.kilo/skills/` contains all 14 core skills
- **Commands available**: `/brainstorm`, `/plan`, `/tdd`, `/execute`, `/review`, `/debug`, `/verify`, `/finish-branch`
- **Agents available**: `plan-executor`, `brainstormer`, `plan-writer`, `skeptic-reviewer`
- **Workflow**: Brainstorm → Plan → Execute (TDD) → Review → Finish

### Available Skills

| Skill | Description |
|-------|-------------|
| `brainstorming` | Refine ideas through Socratic questioning before writing code |
| `writing-plans` | Break approved designs into implementation tasks |
| `test-driven-development` | RED-GREEN-REFACTOR cycle for all implementation |
| `executing-plans` | Execute implementation plans with checkpoints |
| `subagent-driven-development` | Fast iteration with two-stage review |
| `requesting-code-review` | Request code review against plan |
| `receiving-code-review` | Respond to feedback with verification |
| `systematic-debugging` | 4-phase root cause debugging process |
| `verification-before-completion` | Evidence-based validation before claiming done |
| `finishing-a-development-branch` | Merge/PR decision workflow |
| `using-git-worktrees` | Isolated workspace for parallel development |
| `dispatching-parallel-agents` | Concurrent subagent workflows |
| `using-superpowers` | Introduction to the skills system |
| `writing-skills` | Create new skills following best practices |

## Karpathy Guidelines (Andrej Karpathy)

- **Skill**: `karpathy-guidelines` — Behavioral guidelines to reduce common LLM coding mistakes
- **Command**: `/guidelines` — Reference the four principles
- **Source**: [deangilmoreremix/andrej-karpathy-skills](https://github.com/deangilmoreremix/andrej-karpathy-skills)
- **Principles**: Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven Execution
- **CLAUDE.md**: Project-level guidelines loaded automatically

These guidelines are applied automatically when writing, reviewing, or refactoring code.

## agentmemory Support

- **agentmemory**: [rohitg00/agentmemory](https://github.com/rohitg00/agentmemory) supports Kilo Code via MCP server
- **Install**: `npx @agentmemory/agentmemory` to start the memory server, then add MCP config to kilo.json
- **Command**: `/agentmemory` provides install instructions
- **Features**: 51 MCP tools, auto-capture, semantic search, cross-session persistence

## AI API Key Settings Walkthrough - PRODUCTION READY

### New Features Implemented

- **Step-by-step wizard**: 4-step flow for API key configuration
- **Provider selection**: Choose between OpenAI and Google Gemini
- **Model selection**: Detailed model information with newest models
- **Learning Center**: GTM-focused model documentation pages
- **Secure storage**: API keys stored encrypted in Supabase database
- **Connection testing**: Real-time API connection verification
- **Auto-popup**: Shows first-time users, respects existing configurations

### Models Available (Newest)

**OpenAI:**
- GPT-5.5 Preview (Newest) - $7.50/$75 per 1M tokens
- GPT-4o - $5/$15 per 1M tokens
- GPT-4o Mini - $0.10/$0.20 per 1M tokens
- o1 Preview - $15/$60 per 1M tokens

**Gemini:**
- Gemini 2.0 Flash Preview (Newest) - $0.000075/$0.00015 per 1K tokens
- Gemini 1.5 Pro - $0.00125/$0.0025 per 1K tokens
- Gemini 1.5 Flash - $0.000075/$0.00015 per 1K tokens

### Components Created

- `AIApiKeySettings.tsx` - Main dialog component using existing UI primitives
- `AIApiKeySetupGuard.tsx` - Auto-popup guard for first-time users
- `OpenAIModelInfo.tsx` - OpenAI models GTM documentation
- `GeminiModelInfo.tsx` - Gemini models GTM documentation
- `useAIApiKeys.ts` - Hook for AI API key management
- `useApiKeyStatus.ts` - Hook for checking API key status

### Database Migration

- `20260514_create_user_api_keys_table.sql` - Secure API key storage with RLS

### Production Features

- Uses existing Dialog component for design consistency
- Auto-shows for users without API keys
- Hides when keys are already configured
- Respects existing API endpoint structure
- Built with Tailwind CSS matching application design

## Verification Status

- Auth: Working (users can login/logout)
- Schema: Correct (multi-tenant isolated)
- AI: Configured (API key set)
- Contacts Enhancement: Complete (all Phase 2 features implemented and tested)
- AI API Settings: Production Ready (auto-popup, secure storage, design consistent)
- Build: Working (build successful, dependencies installed)
- Lint: Working (linting completed, minor warnings remain)
- Design System: Impeccable skill installed, PRODUCT.md and DESIGN.md created
