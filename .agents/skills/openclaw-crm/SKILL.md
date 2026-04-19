# OpenClaw CRM Skills

This skill provides OpenClaw CRM integration for AI agents.

## Overview

OpenClaw CRM is an AI-first CRM with 40+ API endpoints that AI agents can use to:

- Search and manage contacts
- Handle deals and pipeline
- Schedule appointments
- Execute AI-powered workflows
- Control Module Federation apps

## Tools

The OpenClaw CRM skill provides these tool categories:

### Contact Management

- `search_contacts` - Search contacts by name, email, or company
- `get_contact_details` - Get detailed contact information
- `create_contact` - Create a new contact
- `update_contact` - Update contact information
- `delete_contact` - Delete a contact
- `search_contacts_advanced` - Advanced search with filters

### Deal/Pipeline Management

- `list_deals` - List all deals in the pipeline
- `create_deal` - Create a new deal
- `update_deal_stage` - Move deal to different stage
- `close_deal` - Close deal as won or lost
- `move_deal` - Drag & drop deal repositioning
- `analyze_deal` - AI-powered deal analysis

### Task Management

- `list_tasks` - List tasks for the user
- `create_task` - Create a new task
- `complete_task` - Mark task as completed
- `delete_task` - Delete a task

### Calendar & Appointments

- `list_appointments` - List appointments
- `create_appointment` - Schedule an appointment
- `cancel_appointment` - Cancel an appointment
- `get_calendar_ai_suggestions` - AI meeting scheduling advice
- `schedule_meeting_intelligence` - Smart meeting scheduler
- `get_meeting_summary` - AI-generated meeting summary

### AI Agents

- `list_agents` - List available AI agents
- `get_agent` - Get agent details
- `execute_agent` - Execute an AI agent task
- `get_agent_execution` - Check execution status
- `list_agent_executions` - List recent executions

### AI Features

- `analyze_lead_score` - AI lead scoring
- `enrich_contact` - AI contact enrichment
- `generate_personalization` - Personalization recommendations
- `run_ai_insights` - AI insights for entities
- `social_media_research` - Social media research
- `analyze_sentiment` - Sentiment analysis
- `generate_email_draft` - AI email drafting

### Navigation & Module Federation

- `navigate_to_app` - Navigate to CRM apps
- `open_remote_app` - Open remote Module Federation apps
- `get_module_federation_status` - Check remote app status
- `broadcast_to_modules` - Broadcast to all apps

## API Endpoints

### REST API

- Base URL: `/api/v1`
- Auth: Bearer token with `oc_sk_` prefix

### Key Endpoints

```
GET    /objects/:slug/records     - List records
POST   /objects/:slug/records     - Create record
GET    /objects/:slug/records/:id  - Get record
PATCH  /objects/:slug/records/:id  - Update record
DELETE /objects/:slug/records/:id  - Delete record
POST   /chat/completions          - AI chat
GET    /api-keys                  - Manage API keys
```

## Usage Examples

### Search Contacts

```
Tool: search_contacts
Parameters: { query: "John", limit: 10 }
```

### Create Deal

```
Tool: create_deal
Parameters: {
  name: "Enterprise Deal",
  value: 50000,
  stage: "proposal",
  contactId: "123"
}
```

### Execute AI Agent

```
Tool: execute_agent
Parameters: {
  agentId: "agent-123",
  task: "Analyze this lead and suggest outreach strategy",
  input: { contactId: "456" }
}
```

### Schedule Meeting

```
Tool: schedule_meeting_intelligence
Parameters: {
  title: "Q4 Planning Meeting",
  contactIds: ["123", "456"],
  duration: 60,
  context: "Quarterly business review"
}
```

## Response Format

All tools return JSON with:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Errors return:

```json
{
  "error": "Error description",
  "details": "More details"
}
```

## Integration

This skill integrates with:

- SmartCRM at `/api/openclaw`
- Module Federation apps (Contacts, Pipeline, Calendar, Analytics)
- AI agents for advanced workflows

## Best Practices

1. **Rate Limiting**: AI tools have rate limits (20/min)
2. **Caching**: Cache tool results when possible
3. **Error Handling**: Always handle API errors gracefully
4. **Streaming**: Use SSE streaming for long AI responses
