# OpenAI Recovery Manifest

This manifest documents all AI-related recovered features for the future OpenAI modernization phase.

**DO NOT START OPENAI MODERNIZATION YET.** This manifest is input for the next phase after canonical reconciliation is complete.

## Recovered AI Features

### VoiceAnalysisRealtime

- **Feature**: Real-time voice analysis with sentiment detection
- **Source Branch**: `ae82425` (Initial commit)
- **Source SHA**: `ae82425`
- **Files**: `client/src/components/aiTools/VoiceAnalysisRealtime.tsx` (647 lines)
- **Historical Behavior**: Record voice, live sentiment analysis, transcript generation, audio playback
- **Current Behavior**: UI card exists but component is missing; references in AITools.tsx, EnhancedAITools.tsx, AIToolsProvider.tsx
- **Useful Code to Preserve**: Voice recording flow, sentiment analysis UX, audio playback visualization
- **Outdated Architecture**: Depends on `useGemini` hook and Gemini API
- **Database Dependencies**: None (client-side only historically)
- **UI Dependencies**: Framer Motion, Lucide icons, Web Audio API
- **Recommendation**: Rebuild against OpenAI Realtime API; preserve UX flow

### AI Agents (Session A)

- **Feature**: AI agent orchestration and management
- **Source Branch**: `session/agent_543a3a7c`
- **Files**: Various AI agent components and services
- **Historical Behavior**: Agent creation, orchestration, workflow integration
- **Current Behavior**: Partially implemented in current main
- **Useful Code to Preserve**: Agent orchestration concepts, workflow integration patterns
- **Outdated Architecture**: May depend on obsolete AI service layers
- **Database Dependencies**: Agent configurations, execution logs
- **UI Dependencies**: Agent management UI, workflow builder
- **Recommendation**: Port orchestration concepts; rebuild against OpenAI Responses API

### AI Agents (Session B)

- **Feature**: AI agent orchestration, SuperPowers hub
- **Source Branch**: `session/agent_6c4ede7c`
- **Files**: `ai-agents/`, `gtm-skills/`, `dench/`, SuperPowers hub
- **Historical Behavior**: Agent orchestration, skill management, GTM workflows
- **Current Behavior**: Not present in main
- **Useful Code to Preserve**: Agent orchestration patterns, skill registry concept
- **Outdated Architecture**: Custom AI orchestration layer
- **Database Dependencies**: Agent configs, skill definitions, execution history
- **UI Dependencies**: SuperPowers hub UI, agent workflow builder
- **Recommendation**: Evaluate for architecture patterns; rebuild against OpenAI

### Agent Workflow

- **Feature**: Workflow automation with AI actions
- **Source Branch**: `session/agent_543a3a7c`
- **Files**: `packages/workflows/`
- **Historical Behavior**: Workflow definitions, triggers, actions, scheduling
- **Current Behavior**: Partially implemented in main
- **Useful Code to Preserve**: Workflow engine core, trigger/action patterns
- **Outdated Architecture**: AI-dependent actions may need updates
- **Database Dependencies**: Workflows, runs, logs tables
- **UI Dependencies**: Workflow builder, monitor dashboard
- **Recommendation**: Port non-AI workflow features now; defer AI actions to OpenAI phase

### Function Assistant

- **Feature**: AI function calling assistant
- **Source Branch**: `session/agent_543a3a7c`
- **Files**: Various function assistant components
- **Historical Behavior**: Function discovery, calling, parameter validation
- **Current Behavior**: May be partially implemented
- **Useful Code to Preserve**: Function schema definitions, calling patterns
- **Outdated Architecture**: May use deprecated function calling APIs
- **Database Dependencies**: Function definitions, call logs
- **UI Dependencies**: Function browser, parameter forms
- **Recommendation**: Rebuild against OpenAI Functions/Responses API

### AI Assistant

- **Feature**: General AI chat assistant
- **Source Branch**: Multiple
- **Files**: Chat components, AI context providers
- **Historical Behavior**: Chat interface, context management, response streaming
- **Current Behavior**: Implemented in main
- **Useful Code to Preserve**: Chat UX patterns, context management
- **Outdated Architecture**: May use old OpenAI models or Gemini
- **Database Dependencies**: Chat history, context storage
- **UI Dependencies**: Chat UI, message components
- **Recommendation**: Modernize to latest OpenAI models; preserve UX

### SmartAIControls

- **Feature**: AI controls for bulk operations
- **Source Branch**: `recovery/stash-migration-2026-07-13`
- **Files**: `client/src/components/ai/SmartAIControls.tsx`, tests
- **Historical Behavior**: Bulk enrichment, batch analysis, scoring
- **Current Behavior**: Component exists; tests recovered
- **Useful Code to Preserve**: Bulk operation UI, progress tracking
- **Outdated Architecture**: Depends on `aiIntegrationStore`
- **Database Dependencies**: Contact enrichment, scoring data
- **UI Dependencies**: Progress bars, bulk action buttons
- **Recommendation**: Preserve for later; update AI backend

### Business Analysis

- **Feature**: AI-powered business analysis
- **Source Branch**: Various recovery sources
- **Files**: `businessAnalysis.ts` and related
- **Historical Behavior**: Business metrics analysis, insights generation
- **Current Behavior**: Not present in main
- **Useful Code to Preserve**: Analysis frameworks, metric calculations
- **Outdated Architecture**: May depend on Drizzle ORM
- **Database Dependencies**: Business metrics tables
- **UI Dependencies**: Analysis dashboards, charts
- **Recommendation**: Port to Supabase; defer AI analysis to OpenAI phase

### Voice Profiles

- **Feature**: Voice profile management
- **Source Branch**: Various recovery sources
- **Files**: `voiceProfiles.ts` and related
- **Historical Behavior**: Voice profile creation, management, analysis
- **Current Behavior**: Partially implemented (VoiceProfiles page exists)
- **Useful Code to Preserve**: Voice profile schema, management UI
- **Outdated Architecture**: May depend on Drizzle ORM
- **Database Dependencies**: Voice profiles tables
- **UI Dependencies**: Voice profile cards, settings
- **Recommendation**: Port to Supabase; integrate with Voice Analysis

### SuperPowers

- **Feature**: SuperPowers hub for AI capabilities
- **Source Branch**: `session/agent_6c4ede7c`
- **Files**: SuperPowers hub components
- **Historical Behavior**: AI capability management, activation
- **Current Behavior**: Not present in main
- **Useful Code to Preserve**: Capability registry, activation flow
- **Outdated Architecture**: Custom AI capability system
- **Database Dependencies**: Capability configurations
- **UI Dependencies**: SuperPowers hub UI
- **Recommendation**: Evaluate for architecture patterns; rebuild against OpenAI

### GTM Skills

- **Feature**: Go-to-market skill templates and workflows
- **Source Branch**: `session/agent_6c4ede7c`
- **Files**: `gtm-skills/` package
- **Historical Behavior**: Skill templates, GTM workflows, prompt management
- **Current Behavior**: Not present in main
- **Useful Code to Preserve**: Skill templates, workflow definitions
- **Outdated Architecture**: May depend on custom AI orchestration
- **Database Dependencies**: Skill definitions, workflow configs
- **UI Dependencies**: Skill browser, workflow builder
- **Recommendation**: Port skill templates; rebuild execution against OpenAI

### Image Generation

- **Feature**: AI image generation
- **Source Branch**: Various recovery sources
- **Files**: Image generation components and services
- **Historical Behavior**: Image creation from prompts, editing, variation
- **Current Behavior**: May be partially implemented
- **Useful Code to Preserve**: Image generation UX, prompt templates
- **Outdated Architecture**: May use deprecated image APIs
- **Database Dependencies**: Generated images, prompts
- **UI Dependencies**: Image gallery, generation forms
- **Recommendation**: Modernize to DALL-E 3 or GPT-4 Vision

### Proposal Generation

- **Feature**: AI proposal generation
- **Source Branch**: Various recovery sources
- **Files**: Proposal generator components
- **Historical Behavior**: Proposal creation from templates, AI enhancement
- **Current Behavior**: May be partially implemented
- **Useful Code to Preserve**: Proposal templates, generation flow
- **Outdated Architecture**: May use old AI generation APIs
- **Database Dependencies**: Proposal templates, generated proposals
- **UI Dependencies**: Proposal editor, preview
- **Recommendation**: Modernize to latest OpenAI models

### Semantic Search

- **Feature**: Semantic search across CRM data
- **Source Branch**: Various recovery sources
- **Files**: Semantic search components and services
- **Historical Behavior**: Vector-based search, embeddings, relevance ranking
- **Current Behavior**: Supabase vector extensions configured
- **Useful Code to Preserve**: Search UX, embedding patterns
- **Outdated Architecture**: May use deprecated vector services
- **Database Dependencies**: Vector tables, embeddings
- **UI Dependencies**: Search interface, results display
- **Recommendation**: Port to Supabase pgvector; rebuild against OpenAI embeddings

## Summary

| Feature | Priority | Effort | Dependencies | Recommendation |
|---------|----------|--------|--------------|----------------|
| VoiceAnalysisRealtime | High | High | OpenAI Realtime API | Rebuild for OpenAI |
| AI Agents (Session A) | Medium | High | OpenAI Responses API | Port concepts, rebuild |
| AI Agents (Session B) | Medium | High | OpenAI Responses API | Evaluate patterns |
| Agent Workflow | Medium | Medium | Workflow engine | Port non-AI parts now |
| Function Assistant | Medium | Medium | OpenAI Functions | Rebuild for OpenAI |
| AI Assistant | High | Low | OpenAI API | Modernize models |
| SmartAIControls | Medium | Low | AI integration store | Update backend |
| Business Analysis | Low | High | Supabase migration | Port to Supabase first |
| Voice Profiles | Medium | Medium | Supabase migration | Port to Supabase |
| SuperPowers | Low | High | AI orchestration | Evaluate patterns |
| GTM Skills | Low | Medium | AI orchestration | Port templates |
| Image Generation | Medium | Medium | DALL-E 3 | Modernize API |
| Proposal Generation | Medium | Low | OpenAI API | Modernize models |
| Semantic Search | Medium | Medium | pgvector, OpenAI | Port to Supabase |

## Next Steps

1. Complete canonical reconciliation (non-AI features)
2. Review this manifest
3. Prioritize features for OpenAI modernization phase
4. Create detailed implementation plans for each feature
5. Begin OpenAI modernization phase
