# SmartCRM AI Coding Guidelines

## Architecture Overview

SmartCRM is a full-stack AI-powered sales and marketing platform built with:
- **Frontend**: React 18 + TypeScript + Vite, Tailwind CSS, Zustand stores, React Query
- **Backend**: Express server + Supabase Edge Functions (Deno runtime, built to netlify/functions)
- **Database**: PostgreSQL with Drizzle ORM, Row Level Security (RLS)
- **AI**: OpenAI GPT-4o, Google Gemini 2.5 Pro integrations
- **Deployment**: Netlify (functions + static hosting)
- **Multi-tenancy**: Product tiers, white-label customization, partner management

## Core Patterns & Conventions

### API Communication
- **Primary**: Use Supabase client calling Edge Functions (`/functions/v1/{name}`)
- **Fallback**: Express routes on `/api/*` with session auth
- **Real-time**: Supabase subscriptions for live updates
- **Example**: `supabase.functions.invoke('contacts', { body: params })`

### Database Access
- **Schema**: Shared types in `shared/schema.ts` (Drizzle ORM)
- **Queries**: Direct Supabase client for edge functions, Drizzle for Express routes
- **Migrations**: `npm run db:push` (Drizzle Kit)
- **RLS**: Always enabled, profile-based data isolation

### State Management
- **Global**: Zustand stores (`stores/` directory)
- **Server state**: React Query for API data
- **Local**: React useState/useReducer for component state
- **Real-time sync**: Supabase subscriptions update stores

### Component Architecture
- **UI Library**: Custom components in `components/ui/` (Radix UI based)
- **Design**: Glassmorphism, dark-mode-first, Tailwind CSS
- **Patterns**: Compound components, render props, custom hooks
- **Remote apps**: Module federation for micro-frontends (`RemoteContactsLoader.tsx`)

### AI Integration
- **Services**: Dedicated services in `services/` (OpenAI, Gemini, custom agents)
- **Streaming**: Real-time responses with WebSockets/Edge Functions
- **Caching**: AI responses cached in Supabase storage
- **Rate limiting**: Built-in quota management per user tier

### Authentication & Security
- **Auth**: Supabase Auth (JWT tokens)
- **Sessions**: Express sessions for server-side routes
- **Permissions**: Product tier checks, role-based access (`RoleBasedAccess.tsx`)
- **Data isolation**: Profile-based RLS policies

## Development Workflows

### Local Development
```bash
npm run dev          # Start dev server (tsx)
npm run build        # Full production build
npm run build:client # Frontend only
npm run build:functions  # Edge functions only (esbuild to netlify/functions)
```

### Database Operations
```bash
npm run db:push      # Apply migrations (Drizzle Kit)
# Schema changes: Edit shared/schema.ts, run db:push
```

### Deployment
- **Frontend**: Netlify auto-deploys from main branch
- **Functions**: Manual deploy via Supabase dashboard or CLI
- **Environment**: Separate .env files for dev/prod

### Testing
- **Unit**: Vitest for components and utilities
- **E2E**: Playwright for critical user flows
- **API**: Custom test runners for edge functions
- **Run**: `npm test` or specific test files

## Code Organization

### File Structure
```
client/src/
├── components/     # Reusable UI components
├── pages/         # Route components
├── services/      # API and external service integrations
├── stores/        # Zustand state management
├── hooks/         # Custom React hooks
├── utils/         # Utility functions
├── types/         # TypeScript type definitions
└── lib/           # Third-party library configurations

server/            # Express backend
netlify/functions/ # Built Edge Functions (Deno)
shared/           # Shared types and schemas
```

### Naming Conventions
- **Components**: PascalCase, descriptive names (`ContactCard`, `DealKanbanBoard`)
- **Services**: camelCase with Service suffix (`contactApiService`)
- **Types**: PascalCase interfaces, camelCase properties
- **Files**: kebab-case for components, camelCase for utilities

### Error Handling
- **API calls**: Try/catch with user-friendly error messages
- **Validation**: Zod schemas for input validation
- **Logging**: Centralized logger service with different levels
- **Boundaries**: Error boundaries for React components

## Key Integration Points

### External Services
- **Email**: SendGrid for transactional emails
- **Payments**: Stripe webhooks for subscriptions
- **VoIP**: Custom integration for voice calls
- **Storage**: Supabase Storage for files/images
- **Webhooks**: Multiple providers (JVZoo, PayPal, Zaxaa, Stripe)

### Cross-Component Communication
- **Events**: Custom event system for loose coupling (`unifiedEventSystem.ts`)
- **BroadcastChannel**: Cross-tab communication (`broadcastChannelManager.ts`)
- **WebSockets**: Real-time features via Supabase
- **Shared workers**: Background processing

### Multi-Tenancy Features
- **White-labeling**: Dynamic branding and customization (`white-label/` functions)
- **Product tiers**: Feature gating based on subscription (`productTiers` enum)
- **Partner management**: Revenue sharing and attribution (`partners/` functions)
- **User roles**: Granular permissions system (`userRoles` enum)

## Performance Considerations

### Optimization Patterns
- **Lazy loading**: Route-based and component code splitting
- **Caching**: React Query for API responses, custom cache service
- **Images**: Cloud storage with optimization
- **Bundle**: Tree shaking, external dependencies

### Monitoring
- **Health checks**: Dedicated endpoints and services (`health/` function)
- **Error tracking**: Comprehensive logging and alerting
- **Performance**: Real-time metrics and analytics
- **Usage**: AI credit tracking and quota management

## Common Patterns

### Data Fetching
```typescript
// React Query pattern
const { data, isLoading } = useQuery({
  queryKey: ['contacts', filters],
  queryFn: () => contactApiService.getContacts(filters)
});
```

### Component Structure
```tsx
// Compound component pattern
const ContactCard = ({ contact, onClick }) => (
  <Card onClick={onClick}>
    <ContactHeader contact={contact} />
    <ContactDetails contact={contact} />
  </Card>
);
```

### Service Layer
```typescript
// Service with error handling
class ContactService {
  async getContacts() {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*');
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to fetch contacts', error);
      throw new Error('Unable to load contacts');
    }
  }
}
```

### AI Integration
```typescript
// Streaming AI response
const response = await openaiService.streamCompletion({
  prompt: userInput,
  onChunk: (chunk) => updateUI(chunk)
});
```

### Admin Access Pattern
```typescript
// Check admin privileges
if (response.status === 401 || response.status === 403) {
  setError('Access denied. Admin privileges required.');
  navigate('/dashboard');
  return;
}
```

Remember: This codebase emphasizes AI-powered features, real-time collaboration, and scalable multi-tenant architecture. Always consider the user experience impact of changes, especially around AI features and data privacy.</content>
<parameter name="filePath">/workspaces/crm-smartreplit/.github/copilot-instructions.md