# Twenty CRM Features Integration Design

## Overview

This design outlines the comprehensive integration of Twenty CRM features across the 4 mono-repos (contacts, pipeline, ai-agents, ai-analytics) with centralized white-label management from the main crm-smartreplit app.

## Architecture Decisions

### 1. Centralized White-Label Management

- **Location**: Main app (`crm-smartreplit`) hosts the white-label configuration UI
- **Propagation**: Settings sync to all mono-repos via REST API calls
- **Storage**: `tenant_configs` table in shared schema
- **Features**: Custom domains, SSL certificates, logo upload, color themes, email branding

### 2. Shared Package Architecture

- **@smartcrm/workflows**: Cross-repo workflow automation engine
- **@smartcrm/whitelabel**: Branding utilities and theme management
- **@smartcrm/agents**: AI agent router and tool registry
- **@smartcrm/events**: Event bus for cross-repo communication

### 3. Feature Distribution Strategy

Each mono-repo receives Twenty features appropriate to its domain while maintaining independence.

## Feature Mapping

### Contacts Mono-Repo (contacts.smartcrm.vip)

**Domain**: Contact management and relationship building

**Twenty Features to Add**:

- Custom Objects & Metadata (Companies as objects)
- Activity Timeline with auto-logging
- Advanced Views (Table/Kanban/Calendar)
- AI Contact Enrichment & Lead Scoring
- Custom Fields (17 field types)
- Bulk Operations & Contact Merging

**Integration Points**:

- Extend existing contact_activities table
- Add objectMetadata tables
- Integrate with existing AI enrichment API

### Pipeline Mono-Repo (pipeline.smartcrm.vip)

**Domain**: Deal management and sales process

**Twenty Features to Add**:

- Deal Health Indicators & Win Probability
- Pipeline Analytics & Revenue Forecasting
- Deal Timeline & Activity Tracking
- Advanced Kanban (custom columns, grouping)
- Deal Templates system
- Bulk Deal Actions

**Integration Points**:

- Extend existing deals table with health scores
- Build on existing Kanban implementation
- Add forecasting algorithms

### AI-Agents Mono-Repo (ai-agents.smartcrm.vip)

**Domain**: AI agent management and automation

**Twenty Features to Add**:

- Unified Agent Router (OpenClaw + Agency agents)
- Agent Marketplace (147 categorized agents)
- Conversation Memory & Action Approvals
- Tool Registry (40+ CRM tools)
- Voice Input & Chat Export
- Agent Analytics & Usage Tracking

**Integration Points**:

- Clone and integrate OpenClaw chat service
- Extract Agency agents submodule
- Build tool execution engine

### AI-Analytics Mono-Repo (ai-analytics.smartcrm.vip)

**Domain**: Business intelligence and reporting

**Twenty Features to Add**:

- Dashboard Builder (drag-drop canvas)
- 10 Widget Types (charts, metrics, tables, maps)
- Real-time WebSocket Updates
- Dashboard Sharing & PDF Export
- Advanced Filtering & Drill-down
- Predictive Analytics

**Integration Points**:

- Build on existing analytics components
- Add widget library system
- Implement real-time subscriptions

## Cross-Cutting Features (All Mono-Repos)

### Workflow Automation Engine

- **Triggers**: created, updated, deleted, manual, scheduled, webhook, ai_completed
- **Actions**: email, update, create, task, note, webhook, code, wait, branch, iterate
- **Storage**: workflows, workflow_runs, workflow_logs tables
- **Execution**: Centralized workflow engine in shared package

### White-Label System

- **Branding**: Logo, colors, favicon, custom CSS
- **Domains**: Custom domain setup with SSL auto-generation
- **Email**: Branded email templates and SMTP configuration
- **Management**: Centralized UI in main app with API propagation

### Event Bus & Communication

- **Global Search**: Cross-repo search functionality
- **Notifications**: Bell icon with real-time updates
- **Command Palette**: Cmd+K style navigation

## Implementation Phases

### Phase 1: Foundation (2 weeks)

- Clone Twenty as submodule in all repos
- Create shared @smartcrm/\* packages
- Set up mono-repo with pnpm workspaces
- Establish API contracts for cross-repo communication

### Phase 2: Workflow Engine (3 weeks)

- Build workflow schema and engine
- Implement trigger detectors
- Create action executors
- Add workflow builder UI
- Deploy to all 5 repos (4 mono-repos + main)

### Phase 3: White-Label System (2 weeks)

- Enhance existing white-label UI with Twenty features
- Implement domain validation and SSL
- Build branding context and theme injection
- Create API endpoints for settings propagation

### Phase 4: Contacts Enhancement (3 weeks)

- Port activity timeline components
- Add custom objects and 17 field types
- Implement advanced views
- Add AI enrichment enhancements

### Phase 5: Pipeline Enhancement (3 weeks)

- Add deal health and win probability
- Implement pipeline analytics
- Enhance Kanban with custom features
- Add deal templates and bulk operations

### Phase 6: AI-Agents Enhancement (4 weeks)

- Integrate OpenClaw and Agency agents
- Build unified agent router
- Implement conversation memory
- Add tool registry and approvals

### Phase 7: AI-Analytics Enhancement (3 weeks)

- Create dashboard builder
- Implement widget library
- Add real-time updates
- Build sharing and export features

### Phase 8: Integration & Polish (2 weeks)

- Implement cross-repo event bus
- Add global search
- Build notification center
- Final testing and documentation

## Success Metrics

### Functional Metrics

- All Twenty features implemented across appropriate mono-repos
- White-label settings propagate correctly to all subdomains
- Workflow automation works across repo boundaries
- Existing functionality remains intact

### Technical Metrics

- Shared packages reduce code duplication by 60%
- API response times under 200ms
- Test coverage maintained above 85%
- Bundle sizes increase by less than 25%

### User Experience Metrics

- White-label setup time reduced from hours to minutes
- Feature discoverability improved via command palette
- Cross-repo workflows eliminate manual data entry
- Real-time updates provide immediate feedback

## Risk Mitigation

### Technical Risks

- **Mono-repo Complexity**: Shared packages with clear boundaries
- **Performance Impact**: Lazy loading and code splitting
- **Data Consistency**: Eventual consistency with conflict resolution
- **SSL/Domain Issues**: Automated certificate management with fallbacks

### Business Risks

- **Deployment Complexity**: Incremental rollout with feature flags
- **User Training**: Contextual help and progressive disclosure
- **Backward Compatibility**: Comprehensive migration scripts
- **Cost Management**: Usage-based billing for new features

## Dependencies

### External Dependencies

- OpenAI API (existing integration)
- Supabase (existing backend)
- Stripe (existing billing)
- SendGrid (existing email)

### Internal Dependencies

- Existing shared schema tables
- Current authentication system
- Existing API patterns
- Current deployment infrastructure

This design provides a comprehensive roadmap for integrating Twenty CRM features while maintaining your existing architecture and enhancing white-label capabilities.
