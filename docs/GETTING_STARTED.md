# Getting Started with SmartCRM

Get up and running with SmartCRM in under 5 minutes.

## Quick Start (5 Minutes)

### Step 1: Access SmartCRM

Navigate to your SmartCRM instance (e.g., `https://crm.yourdomain.com`) and sign in with your credentials.

### Step 2: Complete Initial Setup

After first login, you'll be guided through the onboarding flow:

1. **Connect Calendar** - Integrate Google Calendar or Outlook
2. **Add First Contact** - Import or create your first contact
3. **Configure Pipeline** - Set up your sales stages
4. **Invite Team** - Add team members to collaborate

## Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key (for AI features)

### Environment Setup

Create a `.env` file in the `client` directory:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENAI_API_KEY=sk-your-api-key
```

### Install Dependencies

```bash
cd client
npm install
```

### Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## Basic Configuration

### Tenant Settings

Navigate to **Settings > White Label** to configure:

- **Branding**: Logo, colors, custom favicon
- **Domain**: Custom subdomain or CNAME
- **Features**: Enable/disable AI tools, video calling

### User Preferences

Access via the user menu (top-right):

- **Theme**: Light/Dark mode toggle
- **Notifications**: Email and in-app preferences
- **AI Provider**: Choose between OpenAI models

### Pipeline Stages

Default stages are pre-configured:

1. Lead
2. Qualified
3. Proposal
4. Negotiation
5. Closed Won
6. Closed Lost

Customize via **Settings > Pipeline**.

## First Login

### Dashboard Overview

The main dashboard provides:

- **Executive Overview**: Key metrics and KPIs
- **Sales Pipeline**: Active deals by stage
- **Tasks**: Pending activities
- **Activity Feed**: Recent interactions

### Navigation

| Section   | Description                       |
| --------- | --------------------------------- |
| Dashboard | Main overview and metrics         |
| Contacts  | Contact management                |
| Deals     | Pipeline and opportunity tracking |
| Tasks     | Activity management               |
| AI Hub    | AI-powered tools and assistants   |
| Settings  | System configuration              |

## Next Steps

- [Features Overview](./FEATURES_OVERVIEW.md) - Explore all capabilities
- [API Reference](./API_REFERENCE.md) - Integrate via REST API
- [Video Tutorials](#) - Step-by-step guides (coming soon)

## Support

- **Email**: support@smartcrm.vip
- **Documentation**: https://docs.smartcrm.vip
- **Discord**: https://discord.gg/smartcrm
