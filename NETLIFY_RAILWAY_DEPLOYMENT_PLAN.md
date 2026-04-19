# SuperPowers Integration - Netlify + Railway Deployment Plan

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         NETLIFY                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Frontend (React SPA)                                    │   │
│  │  - Deployed to Netlify CDN                              │   │
│  │  - Served from *.netlify.app                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Netlify Functions (Node.js)                             │   │
│  │  - API Proxies → Railway Python Services                │   │
│  │  - Auth middleware                                      │   │
│  │  - Webhook handlers                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
            REST API calls (HTTPS)
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Railway       │  │   Railway       │  │   Railway       │
│   AI Agents     │  │   OpenClaw      │  │   Sales Outreach│
│   Port: 8000    │  │   Port: 8080    │  │   Port: 8001    │
│   Python/FastAPI│  │   Python/FastAPI│  │   Python/LangGraph│
└─────────────────┘  └─────────────────┘  └─────────────────┘

GTM Skills: Direct API calls from frontend to api.gtm-skills.com
DenchClaw: Runs locally on user's desktop
```

---

## Phase 1: Deploy Python Services to Railway

### 1.1 Deploy AI Agents Service

**Steps:**
1. Fork or clone ai-crm-agents repository
2. Connect repo to Railway
3. Configure environment variables:
   - OPENAI_API_KEY
   - DATABASE_URL
   - REDIS_URL (optional)
4. Set start command: uvicorn main:app --host 0.0.0.0 --port $PORT
5. Deploy

### 1.2 Deploy Sales Outreach Service

1. Clone sales-outreach-automation-langgraph
2. Connect to Railway
3. Configure API keys:
   - GOOGLE_GEMINI_API_KEY
   - SERPER_API_KEY
   - RAPIDAPI_KEY
4. Deploy

---

## Phase 2: Create Netlify Functions

### Directory Structure

netlify/
└── functions/
    ├── api/
    │   ├── ai-agents.js
    │   ├── openclaw.js
    │   └── sales-outreach.js
    └── _shared/

### netlify.toml

[build]
  command = "npm run build"
  publish = "server/public"

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

[env]
  RAILWAY_AI_AGENTS_URL = "https://ai-agents-production.up.railway.app"
  RAILWAY_SALES_OUTREACH_URL = "https://sales-outreach-production.up.railway.app"

---

## Phase 3: Frontend Configuration

### client/.env

VITE_AI_AGENTS_URL=/.netlify/functions/api/ai-agents
VITE_SALES_OUTREACH_URL=/.netlify/functions/api/sales-outreach
VITE_GTM_SKILLS_URL=https://api.gtm-skills.com

---

## Phase 4: Deploy Pipeline

### Railway Commands

npm install -g @railway/cli
railway login
cd ai-crm-agents && railway init
railway add variable OPENAI_API_KEY your-key
railway up

### Netlify Environment

netlify env:set RAILWAY_AI_AGENTS_URL "https://ai-agents-production.up.railway.app"
netlify env:set RAILWAY_SALES_OUTREACH_URL "https://sales-outreach-production.up.railway.app"

---

## Cost Estimation (Monthly)

| Service | Cost |
|---------|------|
| Netlify - Frontend | Free (100GB) |
| Netlify - Functions | Free (125k requests) |
| Railway - 3 services | Free (500hr each) |
| GTM Skills API | Free tier |

**Total: $0/month**

---

## Immediate Next Steps

1. Deploy AI Agents to Railway (30 min)
2. Create Netlify Functions (30 min)
3. Configure environment variables (10 min)
4. Test full integration (30 min)

**Total: ~2 hours to full integration**
