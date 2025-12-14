import { lazy } from 'react';

// Lazy load page components for better performance
export const Dashboard = lazy(() => import('../pages/Dashboard'));
export const Contacts = lazy(() => import('../pages/Contacts'));
export const ContactsWithRemote = lazy(() => import('../pages/ContactsWithRemote'));
export const Pipeline = lazy(() => import('../pages/Pipeline'));
export const PipelineWithRemote = lazy(() => import('../pages/PipelineWithRemote'));
export const Analytics = lazy(() => import('../pages/Analytics'));
export const AnalyticsDashboard = lazy(() => import('../pages/AnalyticsDashboard'));
export const AITools = lazy(() => import('../pages/AITools'));
export const LiveDealAnalysis = lazy(() => import('../pages/LiveDealAnalysis'));
export const TasksNew = lazy(() => import('../pages/TasksNew'));
export const Appointments = lazy(() => import('../pages/Appointments'));
export const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
export const Settings = lazy(() => import('../pages/Settings'));
export const SignInPage = lazy(() => import('../pages/SignInPage'));
export const SignUpPage = lazy(() => import('../pages/SignUpPage'));

// Lazy load feature components
export const AiToolsFeaturePage = lazy(() => import('../src/AiToolsFeaturePage_1755720356980'));
export const CommunicationsFeaturePage = lazy(() => import('../src/CommunicationsFeaturePage_1755720312716'));
export const FunctionAssistantFeaturePage = lazy(() => import('../src/FunctionAssistantFeaturePage_1755720356986'));

// Lazy load remote components (with error boundaries)
export const RemotePipeline = lazy(() => import('../pages/RemotePipeline'));
export const RemoteContacts = lazy(() => import('../pages/ContactsWithRemote'));

// Loading component
import { Loader2 } from 'lucide-react';

export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex items-center space-x-2">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span>Loading...</span>
    </div>
  </div>
);

// Suspense wrapper for lazy components
import { Suspense } from 'react';

export const withSuspense = (Component: React.ComponentType<any>, fallback?: React.ReactNode) => {
  return (props: any) => (
    <Suspense fallback={fallback || <PageLoader />}>
      <Component {...props} />
    </Suspense>
  );
};

// Preload functions for critical routes
export const preloadDashboard = () => import('../pages/Dashboard');
export const preloadContacts = () => import('../pages/Contacts');
export const preloadPipeline = () => import('../pages/Pipeline');
export const preloadAnalytics = () => import('../pages/Analytics');

// Preload on app initialization for better UX
if (typeof window !== 'undefined') {
  // Preload critical routes after initial load
  setTimeout(() => {
    preloadDashboard();
    preloadContacts();
    preloadPipeline();
  }, 1000);
}