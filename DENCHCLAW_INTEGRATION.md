# DenchClaw Integration with SmartCRM

# ====================================

DenchClaw is a desktop application that runs an OpenClaw Gateway. This guide explains how to integrate it with SmartCRM.

## What is DenchClaw?

DenchClaw is a managed OpenClaw Framework that provides:

- Local OpenClaw Gateway (port 19001)
- Web UI (port 3100)
- AI agent workspace
- Skills system for CRM automation

## Installation

```bash
# Install DenchClaw globally
npm install -g denchclaw

# Or use npx
npx denchclaw@latest
```

## DenchClaw Setup

After installation, DenchClaw will:

1. Create gateway at `~/.openclaw-dench` (separate from default `~/.openclaw`)
2. Configure for port 19001 (gateway) and 3100 (web UI)
3. Set up the workspace directory

## SmartCRM Integration

SmartCRM can connect to DenchClaw Gateway via:

```env
# In SmartCRM .env
OPENCLAW_API_URL=http://localhost:19001
OPENCLAW_API_KEY=your_dench_api_key
```

### Key Commands

```bash
# Start DenchClaw
npx denchclaw start

# Restart gateway
npx denchclaw restart

# Update DenchClaw
npx denchclaw update

# Use profile-specific commands
openclaw --profile dench gateway restart
openclaw --profile dench devices list
```

## Port Configuration

If ports 19001 or 3100 are in use:

```bash
# Change gateway port
openclaw --profile dench config set gateway.port 19002

# Update SmartCRM
OPENCLAW_API_URL=http://localhost:19002
```

## Skills System

DenchClaw uses skills for AI agent capabilities. The CRM skills are in:

- `skills/crm/` - CRM-specific skills

### Available Skills

1. **CRM Skills** - Contact, deal, task management
2. **App Builder** - Build new apps
3. **Composio Apps** - Third-party integrations
4. **GStack** - Google Workspace integration
5. **Dench Integrations** - Dench platform integrations

## Production Deployment

For production:

1. **Host DenchClaw Gateway** on a server (not local desktop)
2. **Configure SSL/TLS**
3. **Set up authentication**
4. **Update SmartCRM environment**:
   ```env
   OPENCLAW_API_URL=https://your-dench-gateway.com
   OPENCLAW_API_KEY=production_key
   ```

## Troubleshooting

### Pairing Required

```bash
# List pending devices
openclaw --profile dench devices list

# Approve device
openclaw --profile dench devices approve --latest
```

### Gateway Not Starting

```bash
# Check port conflicts
lsof -i :19001
lsof -i :3100

# Restart with verbose
openclaw --profile dench gateway --port 19001 -v
```

## OpenClaw vs DenchClaw

| Feature   | OpenClaw       | DenchClaw              |
| --------- | -------------- | ---------------------- |
| Gateway   | Standalone     | Bundled desktop app    |
| Setup     | Manual         | Automated installer    |
| Skills    | Manual install | Pre-bundled            |
| Updates   | Manual         | `npx denchclaw update` |
| Local dev | Requires setup | One-command setup      |
