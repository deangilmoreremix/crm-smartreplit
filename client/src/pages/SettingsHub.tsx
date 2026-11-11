import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  Key,
  Database,
  Shield,
  Users,
  Webhook,
  BookOpen,
  Palette,
  Globe,
  User,
  Settings as SettingsIcon,
  type LucideIcon,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { EntitlementContext } from '../contexts/EntitlementContext';
import { canAccessFeature, FeatureKey } from '../types/entitlements';
import { APP_ROUTES } from '../utils/appLinks';
import { SampleDataSettingsCard } from '../components/RestoreSampleData';

interface SettingsCard {
  title: string;
  description: string;
  to: string;
  icon: LucideIcon;
}

// Workspace settings pages are open to every signed-in user (the server enforces team roles),
// mirroring the Navbar's Settings menu.
const WORKSPACE_CARDS: SettingsCard[] = [
  { title: 'Profile', description: 'Your name, contact details and avatar.', to: APP_ROUTES.profile, icon: User },
  { title: 'AI API Keys', description: 'Bring your own provider keys for AI features.', to: APP_ROUTES.settingsApiKeys, icon: Key },
  { title: 'Data Model', description: 'Customize objects and fields.', to: APP_ROUTES.settingsDataModel, icon: Database },
  { title: 'Roles', description: 'Control what each role can see and do.', to: APP_ROUTES.settingsRoles, icon: Shield },
  { title: 'Team', description: 'Invite and manage teammates.', to: APP_ROUTES.settingsTeam, icon: Users },
  { title: 'Webhooks', description: 'Send CRM events to other systems.', to: APP_ROUTES.settingsWebhooks, icon: Webhook },
  { title: 'Public API Keys', description: 'Create keys for the public REST API.', to: APP_ROUTES.settingsApiKeysPublic, icon: Key },
  { title: 'API Docs', description: 'Reference for the public REST API.', to: APP_ROUTES.settingsApiDocs, icon: BookOpen },
];

const WHITE_LABEL_CARDS: SettingsCard[] = [
  { title: 'White-Label Customization', description: 'Brand the app with your logo and colors.', to: APP_ROUTES.whiteLabel, icon: Palette },
  { title: 'Custom Domains', description: 'Serve the app from your own domain.', to: APP_ROUTES.whiteLabelDomains, icon: Globe },
];

const ADMIN_CARD: SettingsCard = {
  title: 'Admin Panel',
  description: 'Platform administration: users, features and bulk import.',
  to: APP_ROUTES.admin,
  icon: SettingsIcon,
};

const SettingsHub: React.FC = () => {
  const { isDark } = useTheme();
  const entitlement = useContext(EntitlementContext)?.entitlement ?? null;

  // Same checks the Navbar uses: /admin only for super_admin, white-label pages by feature entitlement.
  const isAdmin = entitlement?.package === 'super_admin';
  const hasWhiteLabel = canAccessFeature(entitlement, FeatureKey.WHITE_LABEL_CUSTOMIZATION);

  const cards = [
    ...WORKSPACE_CARDS,
    ...(hasWhiteLabel ? WHITE_LABEL_CARDS : []),
    ...(isAdmin ? [ADMIN_CARD] : []),
  ];

  return (
    <div className={`min-h-screen pt-24 px-6 pb-12 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Manage your workspace, integrations and account.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="settings-hub-grid">
          {cards.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className={`block rounded-xl border p-4 transition-colors ${
                isDark
                  ? 'bg-gray-800 border-gray-700 hover:border-indigo-500'
                  : 'bg-white border-gray-200 hover:border-indigo-500'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <card.icon className="h-5 w-5 text-indigo-500" />
                <span className="font-semibold">{card.title}</span>
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{card.description}</p>
            </Link>
          ))}
        </div>

        {/* SAMPLE-DATA-CONTROL-SLOT */}
        <section data-testid="sample-data-control-slot" className="mt-10">
          <SampleDataSettingsCard />
        </section>
      </div>
    </div>
  );
};

export default SettingsHub;
