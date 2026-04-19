# CRM Monorepo Integration Design Spec

## Overview

This design spec outlines the integration of 5 external CRM repositories into the crm-smartreplit monorepo to create a comprehensive, AI-powered CRM system. The integration follows a monorepo architecture using Turborepo for build orchestration.

## Current Integration Status

After codebase analysis, several repositories have partial integrations:

### Already Partially Integrated

- **Pipeline Deals**: `apps/pipeline/` - React app with AI services, deal management, probability calculations
- **AI Calendar**: `apps/calendar/` - React app with AI enrichment, contact management, appointment scheduling
- **OpenClaw CRM**: API routes and services integrated (`server/routes/openclaw.ts`, `client/src/services/openclawService.ts`)
- **Twenty CRM**: Added as git submodule - full CRM with objects, deals, AI features

### Not Yet Integrated

- **AI CRM Agents**: Repository exists but not integrated into monorepo
- **DenchClaw**: No integration found
- **Sales Outreach Automation**: General outreach features exist but not the specific LangGraph-based system
- **GTM Skills**: No integration found

## Project Decomposition

Updated to reflect current state - focus on completing partial integrations and adding missing ones:

### Sub-Project 1: Complete OpenClaw CRM Integration

**Status**: Partially integrated (API routes exist)
**Goal**: Fully integrate OpenClaw CRM's flexible object model, Kanban pipeline, and AI chat capabilities
**Key Features**: Custom objects, deals pipeline, table views, AI-powered CRM chat
**Tech**: Next.js, PostgreSQL (EAV schema)

### Sub-Project 2: Enhance Pipeline Deals App

**Status**: Partially implemented
**Goal**: Complete the pipeline deals functionality with full AI integration and unified UI
**Key Features**: Deal stages, AI scoring, probability calculations, bulk operations

### Sub-Project 3: Enhance AI Calendar App

**Status**: Partially implemented
**Goal**: Complete calendar with full AI scheduling, meeting prep, and contact integration
**Key Features**: Smart scheduling, AI enrichment, calendar sync

### Sub-Project 4: AI CRM Agents Integration

**Status**: Not integrated
**Goal**: Add autonomous AI agents for lead qualification, email intelligence, sales pipeline, customer success, meeting scheduling, and analytics
**Key Features**: 6 specialized agents with multi-agent workflows
**Tech**: Python FastAPI, LangChain, Redis, Celery

### Sub-Project 5: DenchClaw Framework Integration

**Status**: Not integrated
**Goal**: Integrate DenchClaw's OpenClaw-based productivity framework for CRM automation and outreach agents
**Key Features**: Local productivity tools, CRM automation workflows
**Tech**: TypeScript, OpenClaw Gateway

### Sub-Project 6: Sales Outreach Automation Integration

**Status**: Not integrated
**Goal**: Add automated lead research, qualification, and personalized outreach capabilities
**Key Features**: LinkedIn scraping, company analysis, CRM integration (HubSpot/Airtable), personalized emails/reports
**Tech**: Python, LangGraph, OpenAI, Google APIs

### Sub-Project 7: GTM Skills Integration

**Status**: Not integrated
**Goal**: Integrate comprehensive sales methodology prompts, agent workflows, and MCP server for AI-powered sales processes
**Key Features**: Role-based playbooks, industry templates, competitive intelligence, MCP server
**Tech**: Next.js, TypeScript, MCP protocol

## Overall Architecture

### Repository Structure

```
crm-smartreplit/
├── apps/                          # Deployable applications
│   ├── main-crm/                 # Main CRM application (enhanced from current client/)
│   ├── openclaw-crm/             # OpenClaw CRM app
│   ├── ai-agents-api/            # Python API for AI agents
│   ├── sales-outreach/           # Python sales automation service
│   └── gtm-portal/               # GTM skills portal
├── packages/                      # Shared packages
│   ├── ui/                       # Shared UI components (shadcn/ui)
│   ├── database/                 # Shared database schemas and migrations
│   ├── ai-services/              # Shared AI service integrations
│   ├── crm-shared/               # Common CRM types and utilities
│   ├── openclaw-integration/     # OpenClaw framework integration
│   └── gtm-mcp/                  # MCP server for GTM skills
├── tools/                        # Development tools
│   ├── scripts/                  # Build and deployment scripts
│   └── configs/                  # Shared configurations
└── docs/                         # Documentation
```

### Technology Stack

- **Build System**: Turborepo for monorepo management
- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Node.js (main), Python (AI services), PostgreSQL
- **Database**: Supabase (extended schema for multi-tenancy)
- **AI**: OpenAI, OpenRouter, LangChain, LangGraph
- **Deployment**: Netlify/Vercel for frontend, Railway/Render for Python services
- **Orchestration**: Docker Compose for local development

### Data Architecture

- **Unified Schema**: Extend current Supabase schema with EAV patterns for flexibility
- **Multi-tenancy**: Maintain existing tenant isolation
- **Shared Tables**: Common tables for users, organizations, contacts
- **Service-Specific Tables**: Separate schemas for AI agents, outreach data
- **Data Flow**: REST APIs between services, shared database for core CRM data

### AI Integration

- **Centralized AI Services**: Package for common AI operations (embeddings, chat, etc.)
- **Model Management**: Support multiple providers (OpenAI, Anthropic, Google)
- **Agent Orchestration**: LangChain/LangGraph for complex workflows
- **Local AI**: Integration with OpenClaw for local AI processing

### Authentication & Security

- **Unified Auth**: Extend Supabase auth for all services
- **API Keys**: Service-specific API keys for external integrations
- **Role-Based Access**: Maintain existing RBAC system
- **Data Privacy**: GDPR/HIPAA compliance for sensitive data

## Component Integration Strategy

### UI Integration

- **Shared Design System**: Use shadcn/ui components across all apps
- **Module Federation**: For runtime component sharing where needed
- **Responsive Design**: Mobile-first approach for all interfaces
- **Dark/Light Themes**: Consistent theming across applications

### API Integration

- **REST APIs**: Standard REST interfaces for service communication
- **GraphQL**: Consider for complex data requirements
- **Webhooks**: Event-driven communication between services
- **Message Queues**: Redis/Celery for async processing

### Deployment Strategy

- **Micro-Frontends**: Each app deployable independently
- **Shared Infrastructure**: Common database, auth, file storage
- **CI/CD**: GitHub Actions with Turborepo caching
- **Monitoring**: Centralized logging and error tracking

## Implementation Phases

### Phase 1: Infrastructure Setup

- Set up Turborepo configuration
- Create shared packages structure
- Migrate current app to apps/main-crm
- Establish database migration strategy

### Phase 2-6: Sub-Project Implementation

- Implement each sub-project in sequence
- Integration testing after each sub-project
- Update shared packages as needed

### Phase 7: Unified Testing & Optimization

- End-to-end integration tests
- Performance optimization
- Documentation updates

## Success Criteria

- All 5 repositories successfully integrated
- Unified user experience across all features
- Maintained multi-tenant isolation
- Scalable architecture for future additions
- Comprehensive test coverage
- Production-ready deployment

## Risk Mitigation

- **Incremental Integration**: Sub-projects allow for phased rollout
- **Backward Compatibility**: Maintain existing functionality
- **Testing Strategy**: Unit, integration, and E2E tests
- **Documentation**: Detailed integration guides for each sub-project

## Next Steps

After this spec approval, create implementation plans for each sub-project starting with Sub-Project 1: OpenClaw CRM Integration.
