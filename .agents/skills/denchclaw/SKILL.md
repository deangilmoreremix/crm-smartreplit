# DenchClaw Skills

This skill provides DenchClaw integration - the local OpenClaw Framework.

## Overview

DenchClaw is a managed OpenClaw Framework that runs locally and provides:

- Local OpenClaw Gateway (port 19001)
- Web UI (port 3100)
- AI agent workspace
- Pre-bundled skills for CRM automation

## What is DenchClaw?

DenchClaw is a fork of OpenClaw that provides:

- **Easy Setup**: One-command installation
- **Local Gateway**: Runs on your Mac/computer
- **Skills System**: Pre-bundled AI agent capabilities
- **Desktop App**: Full-featured desktop application

## Commands

### Gateway Management

```bash
# Start DenchClaw
npx denchclaw start

# Restart
npx denchclaw restart

# Stop
npx denchclaw stop

# Update
npx denchclaw update
```

### Profile Commands

```bash
# Use dench profile
openclaw --profile dench <command>

# Restart gateway
openclaw --profile dench gateway restart

# List devices
openclaw --profile dench devices list

# Approve device
openclaw --profile dench devices approve --latest
```

## Port Configuration

| Service | Default Port | Description       |
| ------- | ------------ | ----------------- |
| Gateway | 19001        | OpenClaw API      |
| Web UI  | 3100         | Browser interface |

### Changing Ports

```bash
# Change gateway port
openclaw --profile dench config set gateway.port 19002

# Update SmartCRM
OPENCLAW_API_URL=http://localhost:19002
```

## Skills

DenchClaw includes these skill categories:

### 1. CRM Skills (`skills/crm/`)

Contact, deal, and task management automation

### 2. App Builder (`skills/app-builder/`)

Build custom applications

### 3. Composio Apps (`skills/composio-apps/`)

Third-party integrations

### 4. GStack (`skills/gstack/`)

Google Workspace integration

### 5. Dench Integrations (`skills/dench-integrations/`)

Dench platform capabilities

## Integration with SmartCRM

SmartCRM connects to DenchClaw Gateway:

```env
OPENCLAW_API_URL=http://localhost:19001
OPENCLAW_API_KEY=your_api_key
```

### Authentication

DenchClaw uses API keys with `oc_sk_` prefix:

1. Generate from DenchClaw Settings > API
2. Set in SmartCRM environment

## Troubleshooting

### Pairing Required Error

```bash
# List pending requests
openclaw --profile dench devices list

# Approve
openclaw --profile dench devices approve --latest
```

### Gateway Connection Failed

1. Check if DenchClaw is running: `npx denchclaw status`
2. Restart gateway: `npx denchclaw restart`
3. Check port: `lsof -i :19001`

### Web UI Not Loading

```bash
# Restart web server
npx denchclaw restart

# Or use update
npx denchclaw update
```

## Daemonless Mode

For containers/Docker without systemd:

```bash
export DENCHCLAW_DAEMONLESS=1

# Start gateway manually
openclaw --profile dench gateway --port 19001
```

Or use `--skip-daemon-install`:

```bash
npx denchclaw --skip-daemon-install
```

## Production Use

For production deployment:

1. **Host DenchClaw Gateway** on a server with static IP
2. **Configure SSL** (reverse proxy with nginx/Caddy)
3. **Set up authentication** (API keys, OAuth)
4. **Update SmartCRM**:
   ```env
   OPENCLAW_API_URL=https://your-gateway.com
   OPENCLAW_API_KEY=production_key
   ```

## Resources

- **DenchClaw Website**: https://denchclaw.com
- **Documentation**: https://docs.openclaw.ai
- **Discord**: https://discord.gg/PDFXNVQj9n
- **GitHub**: https://github.com/DenchHQ/DenchClaw
