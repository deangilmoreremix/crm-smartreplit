// src/App.tsx

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ThemeProvider } from './contexts/ThemeContext';
import { TenantProvider } from './contexts/TenantProvider';
import { WhitelabelProvider, useWhitelabel } from './contexts/WhitelabelContext';
import { CompanyProvider } from './contexts/CompanyContext';
import { AIToolsProvider } from './components/AIToolsProvider';
import { ModalsProvider } from './components/ModalsProvider';
import { EnhancedHelpProvider } from './contexts/EnhancedHelpContext';
import { VideoCallProvider } from './contexts/VideoCallContext';
import { NavigationProvider } from './contexts/NavigationContext';
import { DashboardLayoutProvider } from './contexts/DashboardLayoutContext';
import { AIProvider } from './contexts/AIContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RoleProvider } from './components/RoleBasedAccess';
import { NavbarPositionProvider, useNavbarPosition } from './contexts/NavbarPositionContext';
import { DemoDataProvider } from './contexts/DemoDataContext';
import Navbar from './components/Navbar';
import { EdgeZones } from './components/EdgeZones';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import RemoteAppRefreshManager from './components/RemoteAppRefreshManager';
import { universalDataSync } from './services/universalDataSync';
import { Toaster } from './components/ui/toaster';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Eager pages
import Dashboard from './pages/Dashboard';
import SystemOverview from './pages/SystemOverview';
import AutomationConfig from './pages/AutomationConfig';

// Lazy pages
const Tasks = lazy(() => import('./pages/Tasks'));
const TasksNew = lazy(() => import('./pages/TasksNew'));
const Communication = lazy(() => import('./pages/Communication'));
const Contacts = lazy(() => import('./pages/Contacts'));
const ContactsWithRemote = lazy(() => import('./pages/ContactsWithRemote'));
const SimpleContactsTest = lazy(() => import('./pages/SimpleContactsTest'));
const ContactsWorking = lazy(() => import('./pages/ContactsWorking'));
const PipelineWithRemote = lazy(() => import('./pages/PipelineWithRemote'));
const PipelinePage = lazy(() => import('./pages/PipelinePage'));
const AITools = lazy(() => import('./pages/AITools'));
const Analytics = lazy(() => import('./pages/AnalyticsDashboard'));
const AIIntegration = lazy(() => import('./pages/AIIntegration'));
const Settings = lazy(() => import('./pages/Settings'));
const TextMessages = lazy(() => import('./pages/TextMessages'));

// Authentication
const Login = lazy(() => import('./pages/Auth/Login'));
const SignInPage = lazy(() => import('./pages/SignInPage'));
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'));
const AuthConfirm = lazy(() => import('./pages/Auth/AuthConfirm'));
const DevBypassPage = lazy(() => import('./pages/DevBypassPage'));

// Comprehensive implementations
const PhoneSystem = lazy(() => import('./pages/PhoneSystem'));
const Invoicing = lazy(() => import('./pages/Invoicing'));
const ContentLibrary = lazy(() => import('./pages/ContentLibrary'));
const FormsAndSurveys = lazy(() => import('./pages/FormsAndSurveys'));
const VoiceProfiles = lazy(() => import('./pages/VoiceProfiles'));
const BusinessAnalysis = lazy(() => import('./pages/BusinessAnalysis'));
const Appointments = lazy(() => import('./pages/Appointments'));
const CommunicationHub = lazy(() => import('./pages/CommunicationHub'));
const RemotePipeline = lazy(() => import('./pages/RemotePipeline'));
const RemoteCalendar = lazy(() => import('./pages/RemoteCalendar'));
const DemoRecorder = lazy(() => import('./pages/DemoRecorder'));

// Sales pages
import WinRateIntelligence from './pages/WinRateIntelligence';
import AISalesForecast from './pages/AISalesForecast';
import LiveDealAnalysis from './pages/LiveDealAnalysis';
import CompetitorInsights from './pages/CompetitorInsights';
import RevenueIntelligence from './pages/RevenueIntelligence';
import PipelineIntelligence from './pages/PipelineIntelligence';
import DealRiskMonitor from './pages/DealRiskMonitor';
import SmartConversionInsights from './pages/SmartConversionInsights';
import PipelineHealthDashboard from './pages/PipelineHealthDashboard';
import SalesCycleAnalytics from './pages/SalesCycleAnalytics';

// Communication pages
import ActivityAnalytics from './pages/ActivityAnalytics';
import ResponseIntelligence from './pages/ResponseIntelligence';
import ChannelSyncHub from './pages/ChannelSyncHub';
import SmartEmailOptimizer from './pages/SmartEmailOptimizer';
import SentimentMonitor from './pages/SentimentMonitor';
import CommPerformance from './pages/CommPerformance';

// Remote embed pages
const BusinessIntelPage = lazy(() => import('./pages/BusinessIntelPage'));
const WLPage = lazy(() => import('./pages/WLPage'));
const IntelPage = lazy(() => import('./pages/IntelPage'));

// White-label management components
import CompanyAdminDashboard from './pages/CompanyAdminDashboard';
const WhiteLabelManagementDashboard = lazy(() => import('./pages/WhiteLabelManagementDashboard'));
const WhiteLabelPackageBuilder = lazy(() => import('./pages/WhiteLabelPackageBuilder'));
const RevenueSharingPage = lazy(() => import('./pages/RevenueSharingPage'));
const PartnerDashboard = lazy(() => import('./pages/PartnerDashboard'));
const PartnerOnboardingPage = lazy(() => import('./pages/PartnerOnboardingPage'));

// Communication Apps
const AppointmentsDashboard = lazy(() => import('./pages/AppointmentsDashboard'));
const VideoEmailDashboard = lazy(() => import('./pages/VideoEmailDashboard'));
const TextMessagingDashboard = lazy(() => import('./pages/TextMessagingDashboard'));
const PhoneSystemDashboard = lazy(() => import('./pages/PhoneSystemDashboard'));
const InvoicingDashboard = lazy(() => import('./pages/InvoicingDashboard'));
const LeadAutomationDashboard = lazy(() => import('./pages/LeadAutomationDashboard'));
const CircleProspectingDashboard = lazy(() => import('./pages/CircleProspectingDashboard'));
const FormsSurveysDashboard = lazy(() => import('./pages/FormsSurveysDashboard'));
const BusinessAnalyzerDashboard = lazy(() => import('./pages/BusinessAnalyzerDashboard'));
const ContentLibraryDashboard = lazy(() => import('./pages/ContentLibraryDashboard'));
const VoiceProfilesDashboard = lazy(() => import('./pages/VoiceProfilesDashboard'));

// Connected Apps Remote Pages
const FunnelCraftPage = lazy(() => import('./pages/FunnelCraftPage'));
const SmartCRMPage = lazy(() => import('./pages/SmartCRMPage'));
const ContentAIPage = lazy(() => import('./pages/ContentAIPage'));
const AnalyticsRemotePage = lazy(() => import('./pages/AnalyticsRemotePage'));

// User Account Management
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));

// Demo Pages for Sales
const DashboardDemo = lazy(() => import('./pages/demos/DashboardDemo'));
const ContactsDemo = lazy(() => import('./pages/demos/ContactsDemo'));
const PipelineDemo = lazy(() => import('./pages/demos/PipelineDemo'));
const CommunicationDemo = lazy(() => import('./pages/demos/CommunicationDemo'));
const CalendarDemo = lazy(() => import('./pages/demos/CalendarDemo'));
const AIGoalsDemo = lazy(() => import('./pages/demos/AIGoalsDemo'));
const AIToolsDemo = lazy(() => import('./pages/demos/AIToolsDemo'));
const PhoneSystemDemo = lazy(() => import('./pages/demos/PhoneSystemDemo'));
const VideoEmailDemo = lazy(() => import('./pages/demos/VideoEmailDemo'));
const InvoicingDemo = lazy(() => import('./pages/demos/InvoicingDemo'));
const ContentLibraryDemo = lazy(() => import('./pages/demos/ContentLibraryDemo'));
const FormsSurveysDemo = lazy(() => import('./pages/demos/FormsSurveysDemo'));
const AppointmentsDemo = lazy(() => import('./pages/demos/AppointmentsDemo'));
const AnalyticsDemo = lazy(() => import('./pages/demos/AnalyticsDemo'));

// Import AssistantsDashboard component
const AssistantsDashboard = lazy(() => import('./pages/AssistantsDashboard'));

// Added lazy import for IframeOverlapChecker
const IframeOverlapChecker = lazy(() => import('./pages/IframeOverlapChecker'));

// Authentication imports
import FormPublic from './pages/FormPublic';
import UnauthorizedPage from './pages/UnauthorizedPage';
import UserManagement from './pages/UserManagement';
import DemoDashboard from './pages/DemoDashboard';
import PartnerManagementPage from './pages/PartnerManagementPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import LeadCapture from './pages/LeadCapture';
import AIGoalsPage from './pages/AIGoals/AIGoalsPage';
const AIGoalsWithRemote = lazy(() => import('./pages/AIGoalsWithRemote'));
import GoalCardDemo from './pages/GoalCardDemo';
import ContactDetail from './pages/ContactDetail';

// Bulk import page
const BulkImportPage = lazy(() => import('./pages/BulkImportPage'));
// Admin Dashboard page
import AdminDashboard from './pages/AdminDashboard';
import AdminLayout from './components/AdminLayout';
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));

// Feature Management page
import FeatureManagement from './pages/FeatureManagement';

// Entitlements management page
const EntitlementsPage = lazy(() => import('./pages/EntitlementsPage'));

// Upgrade page for paywall
import UpgradePage from './pages/UpgradePage';

// Credit purchase page
const CreditPurchasePage = lazy(() => import('./pages/CreditPurchasePage'));

// Feature pages
import AiAssistantFeaturePage from './pages/landing/FeaturePage/AiAssistantFeaturePage';
import AiToolsFeaturePage from './pages/landing/FeaturePage/AiToolsFeaturePage';
import CommunicationsFeaturePage from './pages/landing/FeaturePage/CommunicationsFeaturePage';
import ContactsFeaturePage from './pages/landing/FeaturePage/ContactsFeaturePage';
import FunctionAssistantFeaturePage from './pages/landing/FeaturePage/FunctionAssistantFeaturePage';
import ImageGeneratorFeaturePage from './pages/landing/FeaturePage/ImageGeneratorFeaturePage';
import PipelineFeaturePage from './pages/landing/FeaturePage/PipelineFeaturePage';
import SemanticSearchFeaturePage from './pages/landing/FeaturePage/SemanticSearchFeaturePage';
import VisionAnalyzerFeaturePage from './pages/landing/FeaturePage/VisionAnalyzerFeaturePage';

// Additional whitelabel imports
import LinkRedirect from './components/shared/LinkRedirect';
const WhiteLabelCustomization = lazy(() => import('./pages/WhiteLabelCustomization'));

// Landing page import
import LandingPage from './pages/LandingPage';

// Dashboard embed import
import DashboardEmbed from './pages/DashboardEmbed';

import './styles/design-system.css';
// ElevenLabs widgets removed to prevent performance issues
// import VoiceAgentWidget from './components/VoiceAgentWidget';
// import ElevenLabsIframeWidget from './components/ElevenLabsIframeWidget';

// Reusable placeholder
const PlaceholderPage = ({ title, description }: { title: string; description?: string }) => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{title}</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">{description || 'This page is coming soon...'}</p>
      </div>
    </div>
  </div>
);

// Loading screen component
const AuthLoadingScreen = () => {
  // Use whitelabel config for loading screen
  const { config } = useWhitelabel();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading {config.companyName || 'Smart CRM'}</h2>
        <p className="text-gray-600">Please wait while we initialize your session...</p>
      </div>
    </div>
  );
};

// Removed conflicting useDarkMode - now using unified ThemeContext

function App() {
  // Initialize universal data sync
  useEffect(() => {
    // Starting Universal Data Sync System
    universalDataSync.initialize();

    return () => {
      universalDataSync.destroy();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <DemoDataProvider>
            <TenantProvider>
              <WhitelabelProvider>
              <CompanyProvider>
                <AIToolsProvider>
                  <ModalsProvider>
                    <EnhancedHelpProvider>
                      <VideoCallProvider>
                        <NavigationProvider>
                          <DashboardLayoutProvider>
                            <AIProvider>
                              <RoleProvider>
                                <NavbarPositionProvider>
                                  <AppContent />
                                </NavbarPositionProvider>
                              </RoleProvider>
                            </AIProvider>
                          </DashboardLayoutProvider>
                        </NavigationProvider>
                      </VideoCallProvider>
                    </EnhancedHelpProvider>
                  </ModalsProvider>
                </AIToolsProvider>
                </CompanyProvider>
            </WhitelabelProvider>
            </TenantProvider>
          </DemoDataProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// AppContent component with all the routing logic
function AppContent() {
  const { user, loading } = useAuth();
  const { setPosition } = useNavbarPosition();

  // Handle navbar drag end
  const handleNavbarDragEnd = (result: DropResult) => {
    const { destination, source } = result;

    if (!destination) return;

    // If dropped on an edge zone, snap to that position
    if (destination.droppableId.includes('-edge')) {
      const position = destination.droppableId.split('-')[0] as 'top' | 'left' | 'right' | 'bottom';
      setPosition(position);
    }
  };

  if (loading) {
    return <AuthLoadingScreen />;
  }

  return (
    <DragDropContext onDragEnd={handleNavbarDragEnd}>
      <div className="min-h-screen">
        <EdgeZones />
        <LinkRedirect />
        <RemoteAppRefreshManager />
        <Suspense fallback={<LoadingSpinner message="Loading page..." size="lg" />}>
        <Routes>
          {/* Landing page as root - no navbar */}
          <Route path="/" element={<LandingPage />} />

          {/* Dashboard embed - no navbar */}
          <Route path="/dashboard-embed" element={<DashboardEmbed />} />

          {/* Auth pages */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/auth/recovery" element={<ForgotPassword />} />
          <Route path="/auth/confirm" element={<AuthConfirm />} />
          <Route path="/auth/callback" element={<AuthConfirm />} />
          <Route path="/dev-bypass" element={<DevBypassPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/voice-profiles" element={<VoiceProfiles />} />
          
          {/* Automation Configuration */}
          <Route path="/automations/:id" element={
            <ProtectedRoute>
              <Navbar />
              <AutomationConfig />
            </ProtectedRoute>
          } />
          
          {/* Upgrade/Paywall Page */}
          <Route path="/upgrade" element={<UpgradePage />} />

          {/* Credit Purchase Page */}
          <Route
            path="/buy-credits"
            element={
              <ProtectedRoute>
                <Navbar />
                <CreditPurchasePage />
              </ProtectedRoute>
            }
          />
          
          {/* Demo Dashboard - Public access for sales page embedding */}
          <Route path="/demo-dashboard" element={<DemoDashboard />} />
          
          {/* Demo Recorder - Record and generate GIFs/videos */}
          <Route
            path="/demo-recorder"
            element={
              <ProtectedRoute>
                <Navbar />
                <DemoRecorder />
              </ProtectedRoute>
            }
          />
          
          {/* Public Demo Pages - No authentication required */}
          <Route path="/demo/contacts" element={<ContactsDemo />} />
          <Route path="/demo/pipeline" element={<PipelineDemo />} />
          <Route path="/demo/communication" element={<CommunicationDemo />} />
          <Route path="/demo/calendar" element={<CalendarDemo />} />
          <Route path="/demo/ai-goals" element={<AIGoalsDemo />} />
          <Route path="/demo/ai-tools" element={<AIToolsDemo />} />
          <Route path="/demo/phone-system" element={<PhoneSystemDemo />} />
          <Route path="/demo/video-email" element={<VideoEmailDemo />} />
          <Route path="/demo/invoicing" element={<InvoicingDemo />} />
          <Route path="/demo/content-library" element={<ContentLibraryDemo />} />
          <Route path="/demo/forms-surveys" element={<FormsSurveysDemo />} />
          <Route path="/demo/appointments" element={<AppointmentsDemo />} />
          <Route path="/demo/analytics" element={<AnalyticsDemo />} />

          {/* Core pages */}
          <Route
            path="/system-overview"
            element={
              <ProtectedRoute>
                <Navbar />
                <SystemOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Navbar />
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Navbar />
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-integration"
            element={
              <ProtectedRoute>
                <Navbar />
                <AIIntegration />
              </ProtectedRoute>
            }
          />

          {/* White Label Customization */}
          <Route
            path="/white-label"
            element={
              <ProtectedRoute>
                <Navbar />
                <WhiteLabelCustomization />
              </ProtectedRoute>
            }
          />
          
          {/* White Label Management Routes */}
          <Route
            path="/white-label-management"
            element={
              <ProtectedRoute>
                <Navbar />
                <WhiteLabelManagementDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/package-builder"
            element={
              <ProtectedRoute>
                <Navbar />
                <WhiteLabelPackageBuilder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/revenue-sharing"
            element={
              <ProtectedRoute>
                <Navbar />
                <RevenueSharingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partner-dashboard"
            element={
              <ProtectedRoute>
                <Navbar />
                <PartnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partner-onboarding"
            element={
              <ProtectedRoute>
                <Navbar />
                <PartnerOnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* AI Goals - Requires Sales Maximizer or higher */}
          <Route
            path="/ai-goals"
            element={
              <ProtectedRoute resource="ai_goals">
                <Navbar />
                <AIGoalsWithRemote />
              </ProtectedRoute>
            }
          />

          {/* AI Tools - Requires AI Boost Unlimited */}
          <Route
            path="/ai-tools"
            element={
              <ProtectedRoute resource="ai_tools">
                <Navbar />
                <AITools />
              </ProtectedRoute>
            }
          />

          {/* AI Assistants */}
          <Route
            path="/assistants"
            element={
              <ProtectedRoute>
                <Navbar />
                <AssistantsDashboard />
              </ProtectedRoute>
            }
          />

          {/* Tasks */}
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <Navbar />
                <TasksNew />
              </ProtectedRoute>
            }
          />

          {/* Calendar - Remote Calendar Moderation */}
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <Navbar />
                <RemoteCalendar />
              </ProtectedRoute>
            }
          />

          {/* Communication Apps */}
          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <Navbar />
                <Appointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments-dashboard"
            element={
              <ProtectedRoute>
                <Navbar />
                <AppointmentsDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/video-email"
            element={
              <ProtectedRoute featureKey="video_email">
                <Navbar />
                <VideoEmailDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/text-messages"
            element={
              <ProtectedRoute featureKey="sms_automation">
                <Navbar />
                <TextMessagingDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/phone-system"
            element={
              <ProtectedRoute featureKey="voip_phone">
                <Navbar />
                <PhoneSystemDashboard />
              </ProtectedRoute>
            }
          />
          {/* Business Tools - Hidden from UI */}
          {/*
          <Route
            path="/invoicing"
            element={
              <ProtectedRoute featureKey="invoicing">
                <Navbar />
                <InvoicingDashboard />
              </ProtectedRoute>
            }
          />
          */}
          {/* Business Tools - Hidden from UI */}
          {/*
          <Route
            path="/lead-automation"
            element={
              <ProtectedRoute featureKey="lead_automation">
                <Navbar />
                <LeadAutomationDashboard />
              </ProtectedRoute>
            }
          />
          */}
          {/* Business Tools - Hidden from UI */}
          {/*
          <Route
            path="/circle-prospecting"
            element={
              <ProtectedRoute featureKey="circle_prospecting">
                <Navbar />
                <CircleProspectingDashboard />
              </ProtectedRoute>
            }
          />
          */}
          {/* Business Tools - Hidden from UI */}
          {/*
          <Route
            path="/forms"
            element={
              <ProtectedRoute featureKey="forms_surveys">
                <Navbar />
                <FormsSurveysDashboard />
              </ProtectedRoute>
            }
          />
          */}
          {/* Business Tools - Hidden from UI */}
          {/*
          <Route
            path="/business-analysis"
            element={
              <ProtectedRoute featureKey="business_analysis">
                <Navbar />
                <BusinessAnalyzerDashboard />
              </ProtectedRoute>
            }
          />
          */}
          {/* Business Tools - Hidden from UI */}
          {/*
          <Route
            path="/content-library"
            element={
              <ProtectedRoute featureKey="content_library">
                <Navbar />
                <ContentLibraryDashboard />
              </ProtectedRoute>
            }
          />
          */}
          <Route
            path="/voice-profiles"
            element={
              <ProtectedRoute featureKey="voice_profiles">
                <Navbar />
                <VoiceProfilesDashboard />
              </ProtectedRoute>
            }
          />

          {/* Communication */}
          <Route
            path="/communication"
            element={
              <ProtectedRoute>
                <Navbar />
                <Communication />
              </ProtectedRoute>
            }
          />

          {/* Analytics Remote Routes */}
          <Route
            path="/analytics-remote"
            element={
              <ProtectedRoute>
                <Navbar />
                <AnalyticsRemotePage />
              </ProtectedRoute>
            }
          />

          {/* Communication and CRM Tools */}
          <Route
            path="/appointments-basic"
            element={
              <ProtectedRoute>
                <Navbar />
                <Appointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/video-email-basic"
            element={
              <ProtectedRoute>
                <Navbar />
                <PlaceholderPage title="Video Email" description="Video email functionality coming soon..." />
              </ProtectedRoute>
            }
          />
          <Route
            path="/text-messages"
            element={
              <ProtectedRoute>
                <Navbar />
                <TextMessages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/phone-system"
            element={
              <ProtectedRoute>
                <Navbar />
                <PhoneSystem />
              </ProtectedRoute>
            }
          />
          {/* Business Tools - Hidden from UI */}
          {/*
          <Route
            path="/invoicing"
            element={
              <ProtectedRoute>
                <Navbar />
                <Invoicing />
              </ProtectedRoute>
            }
          />
          */}
          {/* Business Tools - Hidden from UI */}
          {/*
          <Route
            path="/lead-automation"
            element={
              <ProtectedRoute>
                <Navbar />
                <PlaceholderPage title="Lead Automation" description="AI-powered lead automation tools coming soon..." />
              </ProtectedRoute>
            }
          />
          */}
          {/* Business Tools - Hidden from UI */}
          {/*
          <Route
            path="/circle-prospecting"
            element={
              <ProtectedRoute>
                <Navbar />
                <PlaceholderPage title="Circle Prospecting" description="Circle prospecting tools coming soon..." />
              </ProtectedRoute>
            }
          />
          */}
          {/* Business Tools - Hidden from UI */}
          {/*
          <Route
            path="/forms"
            element={
              <ProtectedRoute>
                <Navbar />
                <FormsAndSurveys />
              </ProtectedRoute>
            }
          />
          */}
          {/* Business Tools - Hidden from UI */}
          {/*
          <Route
            path="/business-analysis"
            element={
              <ProtectedRoute>
                <Navbar />
                <BusinessAnalysis />
              </ProtectedRoute>
            }
          />
          */}
          {/* Business Tools - Hidden from UI */}
          {/*
          <Route
            path="/content-library"
            element={
              <ProtectedRoute>
                <Navbar />
                <ContentLibrary />
              </ProtectedRoute>
            }
          />
          */}
          <Route
            path="/voice-profiles"
            element={
              <ProtectedRoute>
                <Navbar />
                <VoiceProfiles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/communication-hub"
            element={
              <ProtectedRoute>
                <Navbar />
                <CommunicationHub />
              </ProtectedRoute>
            }
          />

          {/* Business Intelligence and Remote Apps */}
          <Route
            path="/business-intel"
            element={
              <ProtectedRoute>
                <Navbar />
                <BusinessIntelPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/intel"
            element={
              <ProtectedRoute>
                <Navbar />
                <IntelPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wl"
            element={
              <ProtectedRoute>
                <Navbar />
                <WLPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes - Nested */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="feature-management" element={<FeatureManagement />} />
            <Route path="bulk-import" element={<BulkImportPage />} />
          </Route>

          {/* Bulk Import Route - Protected alias for backwards compatibility */}
          <Route
            path="/bulk-import"
            element={
              <ProtectedRoute>
                <Navigate to="/admin/bulk-import" replace />
              </ProtectedRoute>
            }
          />

          {/* Feature Management Route - Protected alias for backwards compatibility */}
          <Route
            path="/feature-management"
            element={
              <ProtectedRoute>
                <Navigate to="/admin/feature-management" replace />
              </ProtectedRoute>
            }
          />

          {/* Sales Intelligence Routes */}
          <Route
            path="/pipeline-intelligence"
            element={
              <ProtectedRoute>
                <Navbar />
                <PipelineIntelligence />
              </ProtectedRoute>
            }
          />
          <Route
            path="/deal-risk-monitor"
            element={
              <ProtectedRoute>
                <Navbar />
                <DealRiskMonitor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/smart-conversion-insights"
            element={
              <ProtectedRoute>
                <Navbar />
                <SmartConversionInsights />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pipeline-health-dashboard"
            element={
              <ProtectedRoute>
                <Navbar />
                <PipelineHealthDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales-cycle-analytics"
            element={
              <ProtectedRoute>
                <Navbar />
                <SalesCycleAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/win-rate-intelligence"
            element={
              <ProtectedRoute>
                <Navbar />
                <WinRateIntelligence />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-sales-forecast"
            element={
              <ProtectedRoute>
                <Navbar />
                <AISalesForecast />
              </ProtectedRoute>
            }
          />
          <Route
            path="/live-deal-analysis"
            element={
              <ProtectedRoute>
                <Navbar />
                <LiveDealAnalysis />
              </ProtectedRoute>
            }
          />
          <Route
            path="/competitor-insights"
            element={
              <ProtectedRoute>
                <Navbar />
                <CompetitorInsights />
              </ProtectedRoute>
            }
          />
          <Route
            path="/revenue-intelligence"
            element={
              <ProtectedRoute>
                <Navbar />
                <RevenueIntelligence />
              </ProtectedRoute>
            }
          />

          {/* Contacts and Pipeline Routes */}
          <Route
            path="/contacts"
            element={
              <ProtectedRoute>
                <Navbar />
                <ContactsWorking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pipeline"
            element={
              <ProtectedRoute>
                <Navbar />
                <PipelinePage />
              </ProtectedRoute>
            }
          />

          {/* Feature showcase routes */}
          <Route path="/features/ai-tools" element={<AiToolsFeaturePage />} />
          <Route path="/features/contacts" element={<ContactsFeaturePage />} />
          <Route path="/features/pipeline" element={<PipelineFeaturePage />} />
          <Route path="/features/ai-assistant" element={<AiAssistantFeaturePage />} />
          <Route path="/features/vision-analyzer" element={<VisionAnalyzerFeaturePage />} />
          <Route path="/features/image-generator" element={<ImageGeneratorFeaturePage />} />
          <Route path="/features/function-assistant" element={<FunctionAssistantFeaturePage />} />
          <Route path="/features/speech-to-text" element={<SemanticSearchFeaturePage />} />

          {/* Remote App Routes */}
          <Route
            path="/funnelcraft-ai"
            element={
              <ProtectedRoute>
                <Navbar />
                <FunnelCraftPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/smartcrm-closer"
            element={
              <ProtectedRoute>
                <Navbar />
                <SmartCRMPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/content-ai"
            element={
              <ProtectedRoute>
                <Navbar />
                <ContentAIPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {/* Toaster for notifications */}
      <Toaster />

      {/* ElevenLabs widgets removed to prevent performance issues */}
    </div>
    </DragDropContext>
  );
}

export default App;