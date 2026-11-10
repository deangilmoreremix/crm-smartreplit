import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  useDashboardLayoutStore,
  getVisibleSections,
  isSectionVisible as isVisibleIn,
  type SavedLayout,
  type SectionSize,
} from '../hooks/useDashboardLayoutStore';

export type { SavedLayout, SectionSize };

interface SectionConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  component: React.ReactNode;
  color: string;
}

interface DashboardLayoutContextType {
  sectionOrder: string[];
  setSectionOrder: (order: string[]) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  draggedItem: string | null;
  setDraggedItem: (item: string | null) => void;
  getSectionConfig: (id: string) => SectionConfig | undefined;
  reorderSections: (startIndex: number, endIndex: number) => void;
  resetToDefault: () => void;
  // Additive layout API
  hiddenSections: string[];
  visibleSections: string[];
  isSectionVisible: (id: string) => boolean;
  toggleSection: (id: string) => void;
  sectionSizes: Record<string, SectionSize>;
  setSectionSize: (id: string, size: SectionSize) => void;
  widgetSettings: Record<string, Record<string, unknown>>;
  setWidgetSettings: (id: string, patch: Record<string, unknown>) => void;
  savedLayouts: SavedLayout[];
  defaultLayoutId: string | null;
  saveLayoutAs: (name: string) => void;
  applyLayout: (layoutId: string) => void;
  renameLayout: (layoutId: string, name: string) => void;
  deleteLayout: (layoutId: string) => void;
  setDefaultLayout: (layoutId: string | null) => void;
  layoutLoading: boolean;
}

const DashboardLayoutContext = createContext<DashboardLayoutContextType | undefined>(undefined);

export const useDashboardLayout = () => {
  const context = useContext(DashboardLayoutContext);
  if (!context) {
    throw new Error('useDashboardLayout must be used within a DashboardLayoutProvider');
  }
  return context;
};

// Updated defaultSectionOrder with GPT-5 enhanced sections
// Note: kpi-cards, quick-actions, and metrics-cards are now part of executive-overview-section
export const defaultSectionOrder = [
  'gpt5-enhanced-dashboard',
  'gpt5-smart-kpi-section',
  'executive-overview-section',
  'automations-section',
  'openclaw-chat-section',
  'gpt5-analytics-section',
  'gpt5-deal-intelligence-section',
  'ai-smart-features-hub',
  'sales-pipeline-deal-analytics',
  'customer-lead-management',
  'activities-communications',
  'integrations-system',
  'contacts-section',
  'pipeline-section',
  'white-label-section',
  'product-research-section',
  'ai-analytics-section',
];

// Updated sectionConfigs with GPT-5 enhanced sections
export const sectionConfigs: Record<string, SectionConfig> = {
  // GPT-5 Enhanced Sections
  'gpt5-enhanced-dashboard': {
    id: 'gpt5-enhanced-dashboard',
    title: 'GPT-5 Enhanced Dashboard',
    description: 'Complete GPT-5 powered business intelligence suite',
    icon: 'Brain',
    component: null,
    color: 'from-indigo-600 to-purple-600',
  },
  'gpt5-smart-kpi-section': {
    id: 'gpt5-smart-kpi-section',
    title: 'GPT-5 Smart KPI Analysis',
    description: 'Expert-level performance metrics with AI insights',
    icon: 'BarChart3',
    component: null,
    color: 'from-blue-600 to-indigo-600',
  },
  'gpt5-analytics-section': {
    id: 'gpt5-analytics-section',
    title: 'GPT-5 Advanced Analytics',
    description: 'Multimodal business intelligence and forecasting',
    icon: 'TrendingUp',
    component: null,
    color: 'from-purple-600 to-pink-600',
  },
  'gpt5-deal-intelligence-section': {
    id: 'gpt5-deal-intelligence-section',
    title: 'GPT-5 Deal Intelligence',
    description: 'Expert deal analysis and win probability scoring',
    icon: 'Target',
    component: null,
    color: 'from-green-600 to-teal-600',
  },

  // Unified tasks + appointments + activity (hidden by default, see DEFAULT_HIDDEN_SECTIONS)
  'unified-activity': {
    id: 'unified-activity',
    title: 'Unified Activity',
    description: 'Tasks, appointments and recent activity in one timeline',
    icon: 'CheckSquare',
    component: null,
    color: 'from-sky-500 to-blue-600',
  },

  // New main sections
  'executive-overview-section': {
    id: 'executive-overview-section',
    title: 'Executive Overview',
    description: 'High-level dashboard with KPIs and quick actions',
    icon: 'BarChart3',
    component: null,
    color: 'from-blue-500 to-green-500',
  },
  'ai-smart-features-hub': {
    id: 'ai-smart-features-hub',
    title: 'AI Smart Features Hub',
    description: 'AI-powered insights and tools for enhanced productivity',
    icon: 'Brain',
    component: null,
    color: 'from-purple-500 to-indigo-500',
  },
  'sales-pipeline-deal-analytics': {
    id: 'sales-pipeline-deal-analytics',
    title: 'Sales Pipeline & Analytics',
    description: 'Comprehensive pipeline management and performance metrics',
    icon: 'BarChart3',
    component: null,
    color: 'from-green-500 to-emerald-500',
  },
  'customer-lead-management': {
    id: 'customer-lead-management',
    title: 'Customer & Lead Management',
    description: 'Contact profiles and lead nurturing tools',
    icon: 'Users',
    component: null,
    color: 'from-blue-500 to-cyan-500',
  },
  'activities-communications': {
    id: 'activities-communications',
    title: 'Activities & Communications',
    description: 'Task management and communication tracking',
    icon: 'CheckSquare',
    component: null,
    color: 'from-orange-500 to-red-500',
  },
  'integrations-system': {
    id: 'integrations-system',
    title: 'Integrations & System',
    description: 'Connected apps and system settings',
    icon: 'Grid3X3',
    component: null,
    color: 'from-gray-500 to-gray-700',
  },

  // Original sections (kept for backward compatibility)
  'kpi-cards-section': {
    id: 'kpi-cards-section',
    title: 'Key Performance Indicators',
    description: 'High-level business metrics overview',
    icon: 'BarChart3',
    component: null,
    color: 'from-blue-500 to-green-500',
  },
  'quick-actions-section': {
    id: 'quick-actions-section',
    title: 'Quick Actions',
    description: 'Fast access to common tasks',
    icon: 'Zap',
    component: null,
    color: 'from-green-500 to-teal-500',
  },
  'automations-section': {
    id: 'automations-section',
    title: 'Automations',
    description: 'Set it and forget it - automated workflows',
    icon: 'Repeat',
    component: null,
    color: 'from-violet-500 to-purple-500',
  },
  'openclaw-chat-section': {
    id: 'openclaw-chat-section',
    title: 'OpenClaw AI Assistant',
    description: 'AI-powered CRM assistant for insights and recommendations',
    icon: 'Bot',
    component: null,
    color: 'from-blue-500 to-indigo-500',
  },
  'ai-insights-section': {
    id: 'ai-insights-section',
    title: 'AI Pipeline Intelligence',
    description: 'AI-powered analysis and recommendations',
    icon: 'Brain',
    component: null,
    color: 'from-purple-500 to-indigo-500',
  },
  'metrics-cards-section': {
    id: 'metrics-cards-section',
    title: 'Key Performance Metrics',
    description: 'Overview of critical business metrics',
    icon: 'BarChart3',
    component: null,
    color: 'from-green-500 to-blue-500',
  },
  'pipeline-section': {
    id: 'pipeline-section',
    title: 'Pipeline & Deal Analytics',
    description: 'Comprehensive deal performance and pipeline health',
    icon: 'BarChart3',
    component: null,
    color: 'from-green-500 to-emerald-500',
  },
  'contacts-section': {
    id: 'contacts-section',
    title: 'Contacts & Leads Management',
    description: 'Manage and nurture your prospect relationships',
    icon: 'Users',
    component: null,
    color: 'from-blue-500 to-cyan-500',
  },
  'interaction-history-section': {
    id: 'interaction-history-section',
    title: 'Interaction History',
    description: 'Recent contact interactions and communications',
    icon: 'MessageSquare',
    component: null,
    color: 'from-purple-500 to-blue-500',
  },
  'tasks-section': {
    id: 'tasks-section',
    title: 'Tasks & Activities',
    description: 'Manage your daily activities and appointments',
    icon: 'CheckSquare',
    component: null,
    color: 'from-orange-500 to-red-500',
  },
  'customer-profile-section': {
    id: 'customer-profile-section',
    title: 'Customer Profile',
    description: 'Detailed customer information and insights',
    icon: 'User',
    component: null,
    color: 'from-blue-500 to-indigo-500',
  },
  'recent-activity-section': {
    id: 'recent-activity-section',
    title: 'Recent Activity',
    description: 'Latest actions and events in your CRM',
    icon: 'Clock',
    component: null,
    color: 'from-gray-500 to-gray-600',
  },
  'tasks-and-funnel-section': {
    id: 'tasks-and-funnel-section',
    title: 'Tasks & Sales Funnel',
    description: 'Task management and sales pipeline visualization',
    icon: 'Target',
    component: null,
    color: 'from-amber-500 to-orange-500',
  },
  'apps-section': {
    id: 'apps-section',
    title: 'Connected Apps & Integrations',
    description: 'Access your entire business toolkit',
    icon: 'Grid3X3',
    component: null,
    color: 'from-purple-500 to-indigo-500',
  },
  'charts-section': {
    id: 'charts-section',
    title: 'Sales Charts & Analytics',
    description: 'Visualization of key sales metrics',
    icon: 'BarChart3',
    component: null,
    color: 'from-blue-500 to-teal-500',
  },
  'analytics-section': {
    id: 'analytics-section',
    title: 'Comprehensive Analytics',
    description: 'Detailed charts and performance metrics',
    icon: 'BarChart3',
    component: null,
    color: 'from-indigo-500 to-purple-500',
  },
  'white-label-section': {
    id: 'white-label-section',
    title: 'White Label Suite',
    description: 'Comprehensive white label solutions and customization tools',
    icon: 'Palette',
    component: null,
    color: 'from-indigo-500 to-purple-500',
  },
  'product-research-section': {
    id: 'product-research-section',
    title: 'Product Research',
    description: 'Advanced product research and market analysis tools',
    icon: 'Search',
    component: null,
    color: 'from-teal-500 to-cyan-500',
  },
  'ai-analytics-section': {
    id: 'ai-analytics-section',
    title: 'AI Analytics Dashboard',
    description: 'Advanced AI-powered analytics and insights',
    icon: 'BarChart3',
    component: null,
    color: 'from-emerald-500 to-green-500',
  },
};

const useOptionalUserId = (): string | null => {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useAuth().user?.id ?? null;
  } catch {
    // Provider rendered outside AuthProvider (e.g. tests): localStorage only.
    return null;
  }
};

export const DashboardLayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const userId = useOptionalUserId();
  const { state, dispatch, loading } = useDashboardLayoutStore(userId, defaultSectionOrder);

  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const getSectionConfig = (id: string): SectionConfig | undefined => {
    return sectionConfigs[id];
  };

  const setSectionOrder = useCallback(
    (order: string[]) => dispatch({ type: 'setOrder', order }),
    [dispatch]
  );

  const reorderSections = (startIndex: number, endIndex: number) => {
    const newOrder = Array.from(state.sectionOrder);
    const [removed] = newOrder.splice(startIndex, 1);
    newOrder.splice(endIndex, 0, removed);
    setSectionOrder(newOrder);
  };

  const resetToDefault = () => {
    dispatch({ type: 'reset', defaultOrder: defaultSectionOrder });
  };

  const newId = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `layout-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const value = useMemo<DashboardLayoutContextType>(
    () => ({
      sectionOrder: state.sectionOrder,
      setSectionOrder,
      isDragging,
      setIsDragging,
      draggedItem,
      setDraggedItem,
      getSectionConfig,
      reorderSections,
      resetToDefault,
      hiddenSections: state.hiddenSections,
      visibleSections: getVisibleSections(state),
      isSectionVisible: (id) => isVisibleIn(state, id),
      toggleSection: (id) => dispatch({ type: 'toggle', id }),
      sectionSizes: state.sectionSizes,
      setSectionSize: (id, size) => dispatch({ type: 'setSize', id, size }),
      widgetSettings: state.widgetSettings,
      setWidgetSettings: (id, patch) => dispatch({ type: 'widgetSettings', id, patch }),
      savedLayouts: state.savedLayouts,
      defaultLayoutId: state.defaultLayoutId,
      saveLayoutAs: (name) => dispatch({ type: 'saveAs', name, layoutId: newId() }),
      applyLayout: (layoutId) => dispatch({ type: 'apply', layoutId }),
      renameLayout: (layoutId, name) => dispatch({ type: 'rename', layoutId, name }),
      deleteLayout: (layoutId) => dispatch({ type: 'delete', layoutId }),
      setDefaultLayout: (layoutId) => dispatch({ type: 'setDefault', layoutId }),
      layoutLoading: loading,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, isDragging, draggedItem, loading]
  );

  return <DashboardLayoutContext.Provider value={value}>{children}</DashboardLayoutContext.Provider>;
};
