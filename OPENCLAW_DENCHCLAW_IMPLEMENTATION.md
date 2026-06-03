# OpenClaw & DenchClaw Implementation Guide

## Summary

OpenClaw and DenchClaw have been integrated into SmartCRM with the following components:

### ✅ Completed

1. **OpenClaw API Routes** (`server/routes/openclaw.ts`)
   - 70+ CRM tools for contacts, deals, tasks, calendar, AI
   - AI Agent execution support
   - Module Federation navigation
   - Health check endpoint

2. **OpenClaw Client Service** (`client/src/services/openclawService.ts`)
   - Chat interface with streaming
   - Tool execution
   - Navigation helpers

3. **OpenClaw UI Page** (`client/src/pages/OpenClawPage.tsx`)
   - Full chat interface
   - Tool browser
   - Navigation controls

4. **Skills System** (`.agents/skills/`)
   - `openclaw-crm/SKILL.md` - OpenClaw CRM tools documentation
   - `denchclaw/SKILL.md` - DenchClaw gateway documentation

5. **Workspace Configuration** (`pnpm-workspace.yaml`)
   - Monorepo package configuration

### 📋 Still Needed

## Setup Instructions

### Step 1: Clone OpenClaw CRM

```bash
cd openclaw-repo
./setup.sh
```

Or manually:

```bash
cd openclaw-repo
git clone https://github.com/deangilmoreremix/openclaw-crm.git .
pnpm install
cp .env.example apps/web/.env
# Edit apps/web/.env with DATABASE_URL
pnpm db:push
pnpm db:seed
pnpm dev
```

### Step 2: Configure Environment

In SmartCRM `.env`:

```env
OPENCLAW_API_URL=http://localhost:3001
OPENCLAW_API_KEY=your_openclaw_api_key
CRM_BASE_URL=http://localhost:3000
```

### Step 3: Start OpenClaw CRM

```bash
cd openclaw-repo
pnpm dev
```

OpenClaw CRM will be available at `http://localhost:3001`

### Step 4: Start SmartCRM

```bash
npm run dev
```

SmartCRM proxies OpenClaw requests at `/api/openclaw/*`

## OpenClaw Tools Available

### Contact Management (12 tools)

- search_contacts, get_contact_details, create_contact
- update_contact, delete_contact, search_contacts_advanced
- add_contact_tag, remove_contact_tag
- toggle_favorite, add_custom_field, remove_custom_field
- get_contact_engagement

### Deal/Pipeline Management (8 tools)

- list_deals, create_deal, update_deal_stage
- close_deal, move_deal
- analyze_deal, get_deal_analytics, get_deal_risks

### Task Management (4 tools)

- list_tasks, create_task, complete_task, delete_task

### Calendar/Appointments (3 tools)

- list_appointments, create_appointment, cancel_appointment

### AI Agents (5 tools)

- list_agents, get_agent, execute_agent
- get_agent_execution, list_agent_executions

### AI Calendar (3 tools)

- get_calendar_ai_suggestions
- schedule_meeting_intelligence
- get_meeting_summary

### AI Features (10 tools)

- analyze_lead_score, enrich_contact, generate_personalization
- run_ai_insights, social_media_research, analyze_sentiment
- generate_email_draft, bulk_analyze_contacts
- generate_image, generate_demo_script

### Navigation (5 tools)

- navigate_to_app, open_remote_app
- get_module_federation_status, broadcast_to_modules
- sync_shared_state

## DenchClaw Alternative

DenchClaw is an alternative that runs locally:

### Install DenchClaw

```bash
npx denchclaw@latest
```

### Configure DenchClaw

```env
# In SmartCRM .env
OPENCLAW_API_URL=http://localhost:19001
DENCHCLAW_GATEWAY_PORT=19001
DENCHCLAW_WEB_PORT=3100
```

### Use DenchClaw Commands

```bash
npx denchclaw start        # Start
npx denchclaw restart      # Restart
npx denchclaw stop         # Stop
npx denchclaw update       # Update

# Profile commands
openclaw --profile dench gateway restart
openclaw --profile dench devices list
```

## API Testing

### Test OpenClaw Connection

```bash
# Direct to OpenClaw CRM
curl http://localhost:3001/api/v1/health

# Through SmartCRM proxy
curl http://localhost:5000/api/openclaw/health

# Get tools
curl http://localhost:5000/api/openclaw/tools

# Execute a tool
curl -X POST http://localhost:5000/api/openclaw/execute \
  -H "Content-Type: application/json" \
  -d '{"tool":"search_contacts","parameters":{"query":"test"}}'
```

## Troubleshooting

### OpenClaw CRM not running

```bash
cd openclaw-repo
pnpm dev
```

### Connection refused

Check `OPENCLAW_API_URL` in `.env`:

```env
OPENCLAW_API_URL=http://localhost:3001
```

### Database errors

```bash
cd openclaw-repo
pnpm db:push
pnpm db:seed
```

### Port already in use

```bash
# Find process using port
lsof -i :3001

# Kill it
kill -9 <PID>
```

## Production Deployment

### OpenClaw CRM Production

1. Deploy OpenClaw CRM to a server
2. Configure PostgreSQL database
3. Set up SSL/TLS
4. Update SmartCRM environment:
   ```env
   OPENCLAW_API_URL=https://your-openclaw-crm.com
   OPENCLAW_API_KEY=production_key
   ```

### DenchClaw Production

1. Host DenchClaw Gateway on a server
2. Configure reverse proxy (nginx/Caddy)
3. Set up SSL
4. Update SmartCRM:
   ```env
   OPENCLAW_API_URL=https://your-dench-gateway.com
   OPENCLAW_API_KEY=production_key
   ```

## Module Federation Integration

OpenClaw can control these remote apps:

- **Contacts**: https://contacts.smartcrm.vip
- **Pipeline**: https://cheery-syrniki-b5b6ca.netlify.app
- **Calendar**: https://calendar.smartcrm.vip
- **Analytics**: https://ai-analytics.smartcrm.vip
- **Agency**: https://agency.smartcrm.vip
- **Research**: https://clever-syrniki-4df87f.netlify.app

Use `navigate_to_app` or `open_remote_app` tools to control them.
