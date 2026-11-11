import React, { useState, useEffect, useRef } from 'react';
import { useDealStore } from '../store/dealStore';
import { useContactStore } from '../hooks/useContactStore';
import { useAIAssistant } from '../services/aiAssistantService';
import { useTaskStore } from '../store/taskStore';
import { useAppointmentStore } from '../store/appointmentStore';
import { useAITools } from './AIToolsProvider';
import { useTheme } from '../contexts/ThemeContext';
import { useWhitelabel } from '../contexts/WhitelabelContext';
import { useDashboardLayout } from '../contexts/DashboardLayoutContext';
import DraggableSection from './DraggableSection';
import DashboardLayoutControls from './DashboardLayoutControls';
import UnifiedActivityWidget from './dashboard/UnifiedActivityWidget';
import LayoutWidgetSettings from './dashboard/LayoutWidgetSettings';
import { LoadingSpinner } from './ui/LoadingSpinner';
import ModuleFederationPipeline from './ModuleFederationPipeline';
import { GatedWhiteLabelSection } from './RemoteWhiteLabelLoader';
import RemoteProductResearchLoader from './RemoteProductResearchLoader';
import ModuleFederationAnalytics from './ModuleFederationAnalytics';
import RemoteAIGoalsLoader from './RemoteAIGoalsLoader';
import AssistantStatusWidget from './ui/AssistantStatusWidget';
import AIConfigurationStatusWidget from './ui/AIConfigurationStatusWidget';
import AIProviderSettingsModal from './modals/AIProviderSettingsModal';
import { OnboardingWidget } from './OnboardingWidget';
import SectionErrorBoundary from './SectionErrorBoundary';
import { useAIConfiguration } from '../contexts/AIConfigurationContext';
import OpenClawStatusBanner from './OpenClawStatusBanner';
import { useAIApiKeys } from '../hooks/useAIApiKeys';
import AIApiKeySettings from './aiIntegration/AIApiKeySettings';

// Import section components
import ExecutiveOverviewSection from './sections/ExecutiveOverviewSection';
import AISmartFeaturesHub from './sections/AISmartFeaturesHub';
import SalesPipelineDealAnalytics from './sections/SalesPipelineDealAnalytics';
import CustomerLeadManagement from './sections/CustomerLeadManagement';
import ActivitiesCommunications from './sections/ActivitiesCommunications';
import ContactsSection from './sections/ContactsSection';
import TasksListSection from './sections/TasksListSection';
import IntegrationsSystem from './sections/IntegrationsSystem';

// Keep legacy components for backward compatibility
import MetricsCards from './dashboard/MetricsCards';
import InteractionHistory from './dashboard/InteractionHistory';
import TasksAndFunnel from './dashboard/TasksAndFunnel';
import CustomerProfile from './dashboard/CustomerProfile';
import RecentActivity from './dashboard/RecentActivity';
import DashboardHeader from './dashboard/DashboardHeader';
import ChartsSection from './dashboard/ChartsSection';
import ConnectedApps from './dashboard/ConnectedApps';
import AIInsightsPanel from './dashboard/AIInsightsPanel';
import NewLeadsSection from './dashboard/NewLeadsSection';
import KPICards from './dashboard/KPICards';
import QuickActions from './dashboard/QuickActions';
import AutomationsSection from './dashboard/AutomationsSection';

const OpenClawChatWidget = React.lazy(() =>
  import('./dashboard/OpenClawChatWidget').then((module) => ({
    default: module.OpenClawChatWidget,
  }))
);

// GPT-5 Enhanced Components
import GPT5AnalyticsPanel from './dashboard/GPT5AnalyticsPanel';
import GPT5DealIntelligence from './dashboard/GPT5DealIntelligence';
import GPT5SmartKPICards from './dashboard/GPT5SmartKPICards';
import GPT5EnhancedDashboard from './dashboard/GPT5EnhancedDashboard';

// Video call components
import PersistentVideoCallButton from './PersistentVideoCallButton';
import VideoCallPreviewWidget from './VideoCallPreviewWidget';
import VideoCallOverlay from './VideoCallOverlay';

// Per-section width (only compact/wide differ from the default full-width stack)
const SIZE_CLASS = { compact: 'max-w-3xl', normal: '', wide: 'lg:-mx-2 xl:-mx-4' } as const;

// Memo Dashboard component to prevent unnecessary re-renders
const Dashboard: React.FC = React.memo(() => {
  const { deals, fetchDeals, isLoading, error: dealsError } = useDealStore();

  const { contacts, fetchContacts, isLoading: contactsLoading } = useContactStore();

  const { tasks } = useTaskStore();
  const { appointments, fetchAppointments } = useAppointmentStore();
  const { openTool } = useAITools();
  const { isDark } = useTheme();
  const { config } = useWhitelabel();
  const { visibleSections: sectionOrder, sectionSizes } = useDashboardLayout();

  const ai = useAIAssistant();

  // Prevent repeated data fetching by using a ref to track initialization
  const initializedRef = useRef(false);
  const [dismissedDealsError, setDismissedDealsError] = React.useState<string | null>(null);
  const [showOpenClawBanner, setShowOpenClawBanner] = React.useState(true);
  const [showOpenClawSettings, setShowOpenClawSettings] = React.useState(false);
  const { showAIProviderModal, setShowAIProviderModal } = useAIConfiguration();
  const { apiConfig: openclawConfig } = useAIApiKeys();
  const hasOpenClawKey = Boolean(openclawConfig?.openclaw?.apiKey?.trim());

  useEffect(() => {
    // Render immediately; load data in the background (sections show their own loading states)
    fetchDeals().catch((error: unknown) => console.warn('Failed to fetch deals:', error));

    const contactsTimer = window.setTimeout(() => {
      Promise.resolve(fetchContacts()).catch((error: unknown) =>
        console.warn('Failed to fetch contacts:', error)
      );
    }, 100);

    const appointmentsTimer = window.setTimeout(() => {
      Promise.resolve(fetchAppointments()).catch((error: unknown) =>
        console.warn('Failed to fetch appointments:', error)
      );
    }, 200);

    // Refresh every 5 minutes; cleanup clears it so StrictMode's second effect run re-creates it
    const intervalId = window.setInterval(() => {
      fetchDeals().catch((error: unknown) => console.warn('Periodic deals refresh failed:', error));
      Promise.resolve(fetchContacts()).catch((error: unknown) =>
        console.warn('Periodic contacts refresh failed:', error)
      );
    }, 300000);

    return () => {
      window.clearTimeout(contactsTimer);
      window.clearTimeout(appointmentsTimer);
      window.clearInterval(intervalId);
    };
  }, []);

  // Render section content based on section ID
  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      // Check if section component exists before rendering
      case 'executive-overview-section':
        return typeof ExecutiveOverviewSection === 'function' ? (
          <ExecutiveOverviewSection />
        ) : (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Executive Overview
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Dashboard content loading...</p>
          </div>
        );

      case 'ai-smart-features-hub':
        return typeof AISmartFeaturesHub === 'function' ? (
          <AISmartFeaturesHub />
        ) : (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              AI Smart Features Hub
            </h3>
            <p className="text-gray-600 dark:text-gray-400">AI tools and features loading...</p>
          </div>
        );

      case 'sales-pipeline-deal-analytics':
        return typeof SalesPipelineDealAnalytics === 'function' ? (
          <SalesPipelineDealAnalytics />
        ) : null;

      case 'customer-lead-management':
        return typeof CustomerLeadManagement === 'function' ? <CustomerLeadManagement /> : null;

      case 'activities-communications':
        return typeof ActivitiesCommunications === 'function' ? <ActivitiesCommunications /> : null;

      case 'integrations-system':
        return typeof IntegrationsSystem === 'function' ? <IntegrationsSystem /> : null;

      // Legacy sections - REMOVED to prevent duplicate rendering
      // These components are now included in ExecutiveOverviewSection
      // If you need them standalone, re-enable them but remove from ExecutiveOverviewSection
      case 'metrics-cards-section':
      case 'kpi-cards-section':
      case 'quick-actions-section':
        // These are now part of executive-overview-section - don't render twice
        return null;

      case 'gpt5-smart-kpi-section':
        return <GPT5SmartKPICards />;

      case 'automations-section':
        return <AutomationsSection />;

      case 'ai-insights-section':
        return <AIInsightsPanel />;

      case 'openclaw-chat-section':
        return (
          <React.Suspense
            fallback={
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  OpenClaw AI Assistant
                </h3>
                <LoadingSpinner message="Loading AI assistant..." size="sm" />
              </div>
            }
          >
            <OpenClawChatWidget />
          </React.Suspense>
        );

      case 'gpt5-analytics-section':
        return <GPT5AnalyticsPanel />;

      case 'gpt5-deal-intelligence-section':
        return <GPT5DealIntelligence />;

      case 'gpt5-enhanced-dashboard':
        return <GPT5EnhancedDashboard />;

      case 'gpt5-feature-status':
        return React.createElement(() => (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              GPT-5 Features
            </h3>
            <p className="text-gray-600 dark:text-gray-400">AI features loading...</p>
          </div>
        ));

      case 'interaction-history-section':
        return <InteractionHistory />;

      case 'customer-profile-section':
        return <CustomerProfile />;

      case 'recent-activity-section':
        return (
          <div data-testid="recent-activity">
            <RecentActivity />
          </div>
        );

      case 'tasks-and-funnel-section':
        return (
          <div data-testid="tasks-and-funnel">
            <TasksAndFunnel />
          </div>
        );

      case 'unified-activity':
        return <UnifiedActivityWidget />;

      case 'charts-section':
      case 'analytics-section':
        return (
          <>
            <LayoutWidgetSettings
              sectionId={sectionId}
              metrics={[
                { value: 'performance', label: 'Performance' },
                { value: 'pipeline', label: 'Pipeline' },
                { value: 'breakdown', label: 'Breakdown' },
              ]}
            />
            <ChartsSection sectionId={sectionId} />
          </>
        );

      case 'apps-section':
        return <ConnectedApps />;

      case 'contacts-section':
        return (
          <ContactsSection />
        );

      case 'pipeline-section':
        return (
          <React.Suspense
            fallback={
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Pipeline
                </h3>
                <LoadingSpinner message="Loading pipeline..." size="lg" />
              </div>
            }
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
              style={{ minHeight: '600px', height: 'calc(100vh - 200px)' }}
            >
              <ModuleFederationPipeline showHeader={true} />
            </div>
          </React.Suspense>
        );

      case 'tasks-section':
        return (
          <TasksListSection />
        );

      case 'white-label-section':
        return (
          <React.Suspense
            fallback={
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  White Label
                </h3>
                <LoadingSpinner message="Loading white label..." size="lg" />
              </div>
            }
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
              style={{ minHeight: '600px', height: 'calc(100vh - 200px)' }}
            >
              <GatedWhiteLabelSection showHeader={true} />
            </div>
          </React.Suspense>
        );

      case 'product-research-section':
        return (
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
            style={{ minHeight: '600px', height: 'calc(100vh - 200px)' }}
          >
            <RemoteProductResearchLoader showHeader={true} />
          </div>
        );

      case 'ai-analytics-section':
        return (
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
            style={{ minHeight: '600px', height: 'calc(100vh - 200px)' }}
          >
            <ModuleFederationAnalytics showHeader={true} />
          </div>
        );

      case 'ai-goals-section':
        return (
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
            style={{ minHeight: '600px', height: 'calc(100vh - 200px)' }}
          >
            <RemoteAIGoalsLoader showHeader={true} />
          </div>
        );

      default:
        // Show fallback content instead of null
        return (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {sectionId
                .split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Loading dashboard content...</p>
          </div>
        );
    }
  };

  return (
    <main
      className={`w-full h-full overflow-y-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      {/* Dashboard Header - Always visible */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Welcome to {config.companyName || 'SmartCRM'}
        </p>
      </div>

      {dealsError && dealsError !== dismissedDealsError && (
        <div
          role="alert"
          data-testid="deals-error-banner"
          className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200"
        >
          <span>{dealsError}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fetchDeals().catch(() => undefined)}
              className="text-sm underline"
            >
              Retry
            </button>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setDismissedDealsError(dealsError)}
              className="text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Onboarding Widget - Show for new users */}
      <OnboardingWidget />

      {/* OpenClaw Status Banner - Show if no API key */}
      {!hasOpenClawKey && showOpenClawBanner && (
        <OpenClawStatusBanner
          onSetupClick={() => {
            // Open the unified AIApiKeySettings directly with OpenClaw pre-selected
            setShowOpenClawSettings(true);
          }}
          onDismiss={() => setShowOpenClawBanner(false)}
          className="mb-6"
        />
      )}

      {/* Dashboard Layout Controls - RESTORED */}
      <DashboardLayoutControls />

      {/* Draggable Sections - RESTORED with error boundary */}
      <div className="space-y-8 pb-20">
        {sectionOrder && sectionOrder.length > 0 ? (
          sectionOrder.map((sectionId, index) => {
            return (
              <DraggableSection key={sectionId} sectionId={sectionId} index={index}>
                <div id={sectionId} className={SIZE_CLASS[sectionSizes[sectionId] ?? 'normal']}>
                  <SectionErrorBoundary name={sectionId}>
                    {renderSectionContent(sectionId)}
                  </SectionErrorBoundary>
                </div>
              </DraggableSection>
            );
          })
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-xl border border-blue-200 dark:border-blue-800">
            <h3 className="text-blue-800 dark:text-blue-200 font-semibold mb-2">
              Dashboard Loading
            </h3>
            <p className="text-blue-600 dark:text-blue-400">
              No dashboard sections available. Please check the dashboard layout configuration.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reload Dashboard
            </button>
          </div>
        )}
      </div>

      {/* Video Call Components */}
      <PersistentVideoCallButton />
      <VideoCallPreviewWidget />
      <VideoCallOverlay />

      {/* AI Provider Settings Modal */}
      <AIProviderSettingsModal
        isOpen={showAIProviderModal}
        onClose={() => setShowAIProviderModal(false)}
        onKeyConfigured={() => {
          setShowAIProviderModal(false);
        }}
      />

      {/* OpenClaw Setup - unified AI key settings with OpenClaw pre-selected */}
      <AIApiKeySettings
        open={showOpenClawSettings}
        onOpenChange={setShowOpenClawSettings}
        preferOpenClawOnOpen={true}
      />
    </main>
  );
});

export default Dashboard;
