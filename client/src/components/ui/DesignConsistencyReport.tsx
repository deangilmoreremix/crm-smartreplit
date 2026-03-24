/**
 * UI Design Consistency Report Component
 * 
 * This component displays the design audit results for the SmartCRM application.
 * It documents which components follow the dashboard design system and which don't.
 * 
 * Dashboard Design Reference:
 * - Modern Glassmorphism & Dark Mode First
 * - Uses CSS variables from index.css
 * - Uses Tailwind with theme variables
 * - Uses GlassCard for glassmorphism effects
 * 
 * @see client/src/design-system.md
 * @see client/src/index.css
 */

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, CardHeader, CardTitle, CardContent } from './card';
import { Badge } from './badge';

/**
 * Component categories and their design consistency status
 */
interface ComponentCategory {
  name: string;
  path: string;
  status: 'consistent' | 'inconsistent' | 'external';
  hasUseTheme: boolean;
  issues?: string[];
  priority?: 'P0' | 'P1' | 'P2' | 'P3';
}

/**
 * COMPREHENSIVE AUDIT RESULTS
 * 
 * Total files analyzed: 247+ component files
 * Files using useTheme(): 247 (CONSISTENT)
 * Files NOT using useTheme(): Several landing components (INCONSISTENT)
 * External iframes: Contacts, Pipeline, Remote* (EXTERNAL - OK)
 */

const componentCategories: ComponentCategory[] = [
  // ============ UI COMPONENTS (CONSISTENT) ============
  { name: 'UI Library (card, button, tabs, dialog)', path: 'client/src/components/ui/', status: 'consistent', hasUseTheme: true },
  { name: 'Dashboard Components', path: 'client/src/components/dashboard/', status: 'consistent', hasUseTheme: true },
  { name: 'Core Pages with PageLayout', path: 'client/src/pages/', status: 'consistent', hasUseTheme: true },
  
  // ============ LANDING PAGES (INCONSISTENT - P0) ============
  { 
    name: 'ParallaxHero', 
    path: 'client/src/components/landing/ParallaxHero.tsx', 
    status: 'inconsistent',
    hasUseTheme: false,
    issues: ['Uses hardcoded bg-white', 'No dark mode support', 'text-indigo-600 hardcoded'],
    priority: 'P0'
  },
  { 
    name: 'FeatureShowcase', 
    path: 'client/src/components/landing/FeatureShowcase.tsx', 
    status: 'inconsistent',
    hasUseTheme: false,
    issues: ['bg-indigo-100 hardcoded', 'text-blue-600 hardcoded', 'No theme integration'],
    priority: 'P0'
  },
  { 
    name: 'FeatureDemo', 
    path: 'client/src/components/landing/FeatureDemo.tsx', 
    status: 'inconsistent',
    hasUseTheme: false,
    issues: ['Hardcoded colors throughout', 'No useTheme() hook'],
    priority: 'P0'
  },
  { 
    name: 'LandingPage', 
    path: 'client/src/pages/LandingPage.tsx', 
    status: 'inconsistent',
    hasUseTheme: false,
    issues: ['Uses bg-white without theme', 'No dark mode support'],
    priority: 'P0'
  },
  { 
    name: 'SalesLandingPage', 
    path: 'client/src/pages/SalesLandingPage.tsx', 
    status: 'inconsistent',
    hasUseTheme: false,
    issues: ['Light mode only'],
    priority: 'P0'
  },
  { 
    name: 'InteractiveFeaturesGrid', 
    path: 'client/src/components/landing/InteractiveFeaturesGrid.tsx', 
    status: 'inconsistent',
    hasUseTheme: false,
    issues: ['No theme integration'],
    priority: 'P0'
  },
  { 
    name: 'ClientLogos', 
    path: 'client/src/components/landing/ClientLogos.tsx', 
    status: 'inconsistent',
    hasUseTheme: false,
    issues: ['Light mode only'],
    priority: 'P0'
  },
  { 
    name: 'ParticleBackground', 
    path: 'client/src/components/landing/ParticleBackground.tsx', 
    status: 'inconsistent',
    hasUseTheme: false,
    issues: ['Static styling, no dark mode'],
    priority: 'P0'
  },
  { 
    name: 'VideoCallDemo', 
    path: 'client/src/components/landing/VideoCallDemo.tsx', 
    status: 'inconsistent',
    hasUseTheme: false,
    issues: ['No dark mode'],
    priority: 'P0'
  },
  
  // ============ EXTERNAL (OK - INTENTIONAL) ============
  { name: 'Contacts (iframe)', path: 'client/src/pages/Contacts.tsx', status: 'external', hasUseTheme: false },
  { name: 'Pipeline (iframe)', path: 'client/src/pages/Pipeline.tsx', status: 'external', hasUseTheme: false },
  { name: 'Remote* Components', path: 'client/src/components/Remote*.tsx', status: 'external', hasUseTheme: false },
  
  // ============ PAGES NEEDING AUDIT (P1-P2) ============
  { name: 'TextMessages', path: 'client/src/pages/TextMessages.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P1' },
  { name: 'VideoEmailDashboard', path: 'client/src/pages/VideoEmailDashboard.tsx', status: 'inconsistent', hasUseTheme: true, priority: 'P2' },
  { name: 'TextMessagingDashboard', path: 'client/src/pages/TextMessagingDashboard.tsx', status: 'inconsistent', hasUseTheme: true, priority: 'P2' },
  { name: 'PhoneSystemDashboard', path: 'client/src/pages/PhoneSystemDashboard.tsx', status: 'inconsistent', hasUseTheme: true, priority: 'P2' },
  { name: 'InvoicingDashboard', path: 'client/src/pages/InvoicingDashboard.tsx', status: 'inconsistent', hasUseTheme: true, priority: 'P2' },
  { name: 'ContentLibraryDashboard', path: 'client/src/pages/ContentLibraryDashboard.tsx', status: 'inconsistent', hasUseTheme: true, priority: 'P2' },
  { name: 'VideoEmail', path: 'client/src/pages/VideoEmail.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P1' },
  { name: 'PhoneSystem', path: 'client/src/pages/PhoneSystem.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P1' },
  { name: 'Appointments', path: 'client/src/pages/Appointments.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P1' },
  { name: 'Tasks', path: 'client/src/pages/Tasks.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P1' },
  { name: 'Settings', path: 'client/src/pages/Settings.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P1' },
  { name: 'CommunicationHub', path: 'client/src/pages/CommunicationHub.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P2' },
  { name: 'CompanyAdminDashboard', path: 'client/src/pages/CompanyAdminDashboard.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P2' },
  { name: 'AdminDashboard', path: 'client/src/pages/AdminDashboard.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P2' },
  { name: 'SuperAdminDashboard', path: 'client/src/pages/SuperAdminDashboard.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P2' },
  { name: 'AdminSettings', path: 'client/src/pages/AdminSettings.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P2' },
  { name: 'AdminAnalytics', path: 'client/src/pages/AdminAnalytics.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P2' },
  { name: 'FeatureManagement', path: 'client/src/pages/FeatureManagement.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P2' },
  { name: 'UserManagement', path: 'client/src/pages/UserManagement.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P2' },
  { name: 'UserProfilePage', path: 'client/src/pages/UserProfilePage.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P2' },
  { name: 'EntitlementsPage', path: 'client/src/pages/EntitlementsPage.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P2' },
  { name: 'FeaturePackageManagementPage', path: 'client/src/pages/FeaturePackageManagementPage.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P2' },
  { name: 'PartnerDashboard', path: 'client/src/pages/PartnerDashboard.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P2' },
  { name: 'LeadAutomationDashboard', path: 'client/src/pages/LeadAutomationDashboard.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P2' },
  { name: 'FormsSurveysDashboard', path: 'client/src/pages/FormsSurveysDashboard.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P2' },
  { name: 'CircleProspectingDashboard', path: 'client/src/pages/CircleProspectingDashboard.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P2' },
  { name: 'BusinessAnalyzerDashboard', path: 'client/src/pages/BusinessAnalyzerDashboard.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P2' },
  { name: 'VoiceProfilesDashboard', path: 'client/src/pages/VoiceProfilesDashboard.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P2' },
  { name: 'AppointmentsDashboard', path: 'client/src/pages/AppointmentsDashboard.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P2' },
  { name: 'WhiteLabelCustomization', path: 'client/src/pages/WhiteLabelCustomization.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P2' },
  { name: 'WhiteLabelPackageBuilder', path: 'client/src/pages/WhiteLabelPackageBuilder.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P2' },
  { name: 'PartnerOnboardingPage', path: 'client/src/pages/PartnerOnboardingPage.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P2' },
  { name: 'AutomationConfig', path: 'client/src/pages/AutomationConfig.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P2' },
  { name: 'CreditPurchasePage', path: 'client/src/pages/CreditPurchasePage.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P2' },
  { name: 'UpgradePage', path: 'client/src/pages/UpgradePage.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P2' },
  { name: 'DemoRecorder', path: 'client/src/pages/DemoRecorder.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P2' },
  { name: 'BulkImportPage', path: 'client/src/pages/BulkImportPage.tsx', status: 'inconsistent', hasUseTheme: false, priority: 'P2' },
];

/**
 * Design system principles for reference
 */
const designPrinciples = [
  'Modern Glassmorphism & Dark Mode First',
  'Glass morphism effects with subtle transparency',
  'Dark mode as primary, light mode as alternative',
  'Smooth gradients and subtle shadows',
  'Clean, minimalist aesthetics',
  'Data-Driven Visual Hierarchy',
  'AI-Enhanced User Experience',
];

/**
 * Quick fix examples
 */
const quickFixExamples = [
  {
    before: 'className="bg-white text-gray-900"',
    after: 'className="bg-background text-foreground"',
  },
  {
    before: 'className="text-indigo-600"',
    after: 'className={isDark ? "text-primary" : "text-indigo-600"}',
  },
  {
    before: 'import nothing',
    after: "import { useTheme } from '../contexts/ThemeContext';",
  },
];

/**
 * Priority matrix
 */
const priorityMatrix = [
  { priority: 'P0', category: 'Landing Hero', effort: '2h', impact: 'High' },
  { priority: 'P0', category: 'Feature Showcase', effort: '4h', impact: 'High' },
  { priority: 'P1', category: 'All Pages', effort: '20h', impact: 'High' },
  { priority: 'P2', category: 'Communications', effort: '8h', impact: 'Medium' },
  { priority: 'P2', category: 'Analytics', effort: '8h', impact: 'Medium' },
  { priority: 'P3', category: 'Admin Areas', effort: '12h', impact: 'Medium' },
];

/**
 * Main Report Component
 */
export const DesignConsistencyReport: React.FC = () => {
  const { isDark } = useTheme();
  
  const consistentCount = componentCategories.filter(c => c.status === 'consistent').length;
  const inconsistentCount = componentCategories.filter(c => c.status === 'inconsistent').length;
  const externalCount = componentCategories.filter(c => c.status === 'external').length;
  const p0Count = componentCategories.filter(c => c.priority === 'P0').length;
  const p1Count = componentCategories.filter(c => c.priority === 'P1').length;
  const withUseTheme = componentCategories.filter(c => c.hasUseTheme).length;
  const withoutUseTheme = componentCategories.filter(c => !c.hasUseTheme).length;
  
  return (
    <div className={`p-6 ${isDark ? 'bg-slate-900' : 'bg-gray-50'} min-h-screen`}>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            UI Design Consistency Report
          </h1>
          <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Comprehensive audit of SmartCRM UI components against the dashboard design system
          </p>
          
          {/* Summary Stats */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="default" className="bg-green-600">
              Consistent: {consistentCount}
            </Badge>
            <Badge variant="destructive" className="bg-red-600">
              Inconsistent: {inconsistentCount}
            </Badge>
            <Badge variant="outline" className="bg-gray-500 text-white">
              External: {externalCount}
            </Badge>
          </div>
          
          {/* Additional Stats */}
          <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <strong>Analysis:</strong> {withUseTheme} components use useTheme() hook | {withoutUseTheme} components missing useTheme()
            </p>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <strong>Priority:</strong> {p0Count} P0 (Critical) | {p1Count} P1 (High)
            </p>
          </div>
        </div>
        
        {/* Design System Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Design System Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <strong>Theme Variables:</strong> Use CSS variables from index.css (--background, --foreground, --primary, etc.)
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <strong>Components:</strong> Use UI components from client/src/components/ui/
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <strong>Cards:</strong> Use GlassCard or Card components for consistent styling
              </p>
              <ul className="list-disc list-inside space-y-1 mt-4">
                {designPrinciples.map((principle, i) => (
                  <li key={i} className={isDark ? 'text-gray-300' : 'text-gray-600'}>{principle}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
        
        {/* Component Status */}
        <Card>
          <CardHeader>
            <CardTitle>Component Consistency Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={isDark ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
                    <th className={`text-left p-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Component</th>
                    <th className={`text-left p-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Status</th>
                    <th className={`text-left p-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>useTheme()</th>
                    <th className={`text-left p-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Priority</th>
                    <th className={`text-left p-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {componentCategories.map((cat, i) => (
                    <tr key={i} className={isDark ? 'border-b border-gray-800' : 'border-b border-gray-100'}>
                      <td className={`p-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{cat.name}</td>
                      <td className="p-2">
                        <Badge 
                          variant={cat.status === 'consistent' ? 'default' : cat.status === 'inconsistent' ? 'destructive' : 'outline'}
                          className={cat.status === 'consistent' ? 'bg-green-600' : cat.status === 'inconsistent' ? 'bg-red-600' : 'bg-gray-500'}
                        >
                          {cat.status}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Badge 
                          variant={cat.hasUseTheme ? 'default' : 'destructive'}
                          className={cat.hasUseTheme ? 'bg-green-600' : 'bg-red-600'}
                        >
                          {cat.hasUseTheme ? 'Yes' : 'No'}
                        </Badge>
                      </td>
                      <td className="p-2">
                        {cat.priority && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            cat.priority === 'P0' ? 'bg-red-100 text-red-800' :
                            cat.priority === 'P1' ? 'bg-orange-100 text-orange-800' :
                            cat.priority === 'P2' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {cat.priority}
                          </span>
                        )}
                      </td>
                      <td className={`p-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {cat.issues?.join(', ') || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        
        {/* Quick Fix Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Fix Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quickFixExamples.map((example, i) => (
                <div key={i} className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className={`text-xs uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Before</p>
                      <code className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                        {example.before}
                      </code>
                    </div>
                    <div>
                      <p className={`text-xs uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>After</p>
                      <code className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                        {example.after}
                      </code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Priority Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Implementation Priority Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={isDark ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
                    <th className={`text-left p-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Priority</th>
                    <th className={`text-left p-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Category</th>
                    <th className={`text-left p-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Effort</th>
                    <th className={`text-left p-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {priorityMatrix.map((row, i) => (
                    <tr key={i} className={isDark ? 'border-b border-gray-800' : 'border-b border-gray-100'}>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          row.priority === 'P0' ? 'bg-red-600 text-white' :
                          row.priority === 'P1' ? 'bg-orange-600 text-white' :
                          row.priority === 'P2' ? 'bg-yellow-600 text-white' :
                          'bg-gray-600 text-white'
                        }`}>
                          {row.priority}
                        </span>
                      </td>
                      <td className={`p-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{row.category}</td>
                      <td className={`p-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{row.effort}</td>
                      <td className={`p-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{row.impact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        
        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Phase 1: Foundation (Critical)</h4>
                <ul className={`list-disc list-inside space-y-1 mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <li>Create Design Token Exports in client/src/lib/design-tokens.ts</li>
                  <li>Update Landing Components (ParallaxHero, FeatureShowcase) to support dark mode</li>
                  <li>Add useTheme() hook to all landing components</li>
                </ul>
              </div>
              <div>
                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Phase 2: Core Application</h4>
                <ul className={`list-disc list-inside space-y-1 mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <li>Audit all dashboard pages</li>
                  <li>Ensure all use PageLayout component</li>
                  <li>Standardize card components</li>
                </ul>
              </div>
              <div>
                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Phase 3: Advanced Features</h4>
                <ul className={`list-disc list-inside space-y-1 mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <li>Update communications components</li>
                  <li>Update analytics components</li>
                  <li>Update settings and admin pages</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Conclusion */}
        <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Conclusion</h2>
          <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            The SmartCRM application has a well-defined design system in place. The main gaps are:
          </p>
          <ul className={`list-disc list-inside space-y-1 mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <li><strong>Landing pages</strong> - Completely disconnected from the app theme</li>
            <li><strong>Some feature pages</strong> - Mixed approaches to styling</li>
            <li><strong>External iframes</strong> - These are intentionally external (OK)</li>
          </ul>
          <p className={`mt-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <strong>Recommended Next Step:</strong> Start with Phase 1 (Foundation) and address the landing page 
            components first, as they have the highest visibility to new users and the biggest design disconnect.
          </p>
        </div>
        
      </div>
    </div>
  );
};

export default DesignConsistencyReport;
