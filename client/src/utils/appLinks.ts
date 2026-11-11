/**
 * Single source of truth for internal app paths that navigation surfaces (Navbar, CommandMenu,
 * GlobalShortcuts, onboarding, dashboard sections) link to. Every value must resolve to a <Route>
 * in App.tsx (or a route fragment in client/src/routes); client/src/utils/__tests__/appRoutes.test.ts
 * enforces that. `:param` segments are route params.
 */
export const APP_ROUTES = {
  dashboard: '/dashboard',
  contacts: '/contacts',
  contactsNew: '/contacts/new', // redirects to /contacts?new=1
  contactsDuplicates: '/contacts/duplicates',
  contactsRelationships: '/contacts/relationships',
  contactDetail: '/contacts/:id',
  companies: '/companies',
  companyDetail: '/companies/:id',
  pipeline: '/pipeline',
  deals: '/deals', // redirects to /pipeline
  dealDetail: '/deals/:id',
  tasks: '/tasks',
  tasksNew: '/tasks/new', // redirects to /tasks?new=1
  taskDetail: '/tasks/:id', // redirects to /tasks?id=:id
  calendar: '/calendar',
  appointments: '/appointments',
  appointmentsNew: '/appointments/new', // redirects to /appointments?new=1
  appointmentDetail: '/appointments/:id', // redirects to /appointments?id=:id
  interactionDetail: '/interactions/:id', // redirects to /contacts/:id
  workflows: '/workflows',
  analytics: '/analytics',
  analyticsDashboard: '/analytics-dashboard', // redirects to /analytics
  analyticsDeals: '/analytics/deals',
  analyticsContacts: '/analytics/contacts',
  analyticsRemote: '/analytics-remote',
  aiGoals: '/ai-goals',
  aiTools: '/ai-tools',
  assistants: '/assistants',
  gtmPromptHub: '/gtm-prompt-hub',
  agency: '/agency',
  openclaw: '/openclaw',
  voiceProfiles: '/voice-profiles',
  whiteLabel: '/white-label',
  whiteLabelDomains: '/white-label/domains',
  whiteLabelManagement: '/white-label-management',
  revenueSharing: '/revenue-sharing',
  packageBuilder: '/package-builder',
  partnerDashboard: '/partner-dashboard',
  partnerOnboarding: '/partner-onboarding',
  settings: '/settings',
  settingsApiKeys: '/settings/api-keys',
  settingsDataModel: '/settings/data-model',
  settingsRoles: '/settings/roles',
  settingsTeam: '/settings/team',
  settingsWebhooks: '/settings/webhooks',
  settingsApiKeysPublic: '/settings/api-keys-public',
  settingsApiDocs: '/settings/api-docs',
  profile: '/profile',
  help: '/help',
  upgrade: '/upgrade',
  admin: '/admin',
  communicationHub: '/communication-hub',
  videoEmail: '/video-email',
  textMessages: '/text-messages',
  phoneSystem: '/phone-system',
  invoicing: '/invoicing',
  leadAutomation: '/lead-automation',
  circleProspecting: '/circle-prospecting',
  forms: '/forms',
  businessAnalysis: '/business-analysis',
  contentLibrary: '/content-library',
  pipelineIntelligence: '/pipeline-intelligence',
  dealRiskMonitor: '/deal-risk-monitor',
  smartConversionInsights: '/smart-conversion-insights',
  pipelineHealthDashboard: '/pipeline-health-dashboard',
  salesCycleAnalytics: '/sales-cycle-analytics',
  winRateIntelligence: '/win-rate-intelligence',
  aiSalesForecast: '/ai-sales-forecast',
  liveDealAnalysis: '/live-deal-analysis',
  competitorInsights: '/competitor-insights',
  revenueIntelligence: '/revenue-intelligence',
} as const;

export type AppRouteKey = keyof typeof APP_ROUTES;
