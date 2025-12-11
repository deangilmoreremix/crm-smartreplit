import React, { createContext, useContext, useState, useEffect } from 'react';

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
const defaultSectionOrder = [
  'gpt5-enhanced-dashboard',
  'gpt5-smart-kpi-section',
  'executive-overview-section',
  'automations-section',
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
  'ai-analytics-section'
];

// Updated sectionConfigs with GPT-5 enhanced sections
const sectionConfigs: Record<string, SectionConfig> = {
  // GPT-5 Enhanced Sections
  'gpt5-enhanced-dashboard': {
    id: 'gpt5-enhanced-dashboard',
    title: 'GPT-5 Enhanced Dashboard',
    description: 'Complete GPT-5 powered business intelligence suite',
    icon: 'Brain',
    component: null,
    color: 'from-indigo-600 to-purple-600'
  },
  'gpt5-smart-kpi-section': {
    id: 'gpt5-smart-kpi-section',
    title: 'GPT-5 Smart KPI Analysis',
    description: 'Expert-level performance metrics with AI insights',
    icon: 'BarChart3',
    component: null,
    color: 'from-blue-600 to-indigo-600'
  },
  'gpt5-analytics-section': {
    id: 'gpt5-analytics-section',
    title: 'GPT-5 Advanced Analytics',
    description: 'Multimodal business intelligence and forecasting',
    icon: 'TrendingUp',
    component: null,
    color: 'from-purple-600 to-pink-600'
  },
  'gpt5-deal-intelligence-section': {
    id: 'gpt5-deal-intelligence-section',
    title: 'GPT-5 Deal Intelligence',
    description: 'Expert deal analysis and win probability scoring',
    icon: 'Target',
    component: null,
    color: 'from-green-600 to-teal-600'
  },
  
  // New main sections
  'executive-overview-section': {
    id: 'executive-overview-section',
    title: 'Executive Overview',
    description: 'High-level dashboard with KPIs and quick actions',
    icon: 'BarChart3',
    component: null,
    color: 'from-blue-500 to-green-500'
  },
  'ai-smart-features-hub': {
    id: 'ai-smart-features-hub',
    title: 'AI Smart Features Hub',
    description: 'AI-powered insights and tools for enhanced productivity',
    icon: 'Brain',
    component: null,
    color: 'from-purple-500 to-indigo-500'
  },
  'sales-pipeline-deal-analytics': {
    id: 'sales-pipeline-deal-analytics',
    title: 'Sales Pipeline & Analytics',
    description: 'Comprehensive pipeline management and performance metrics',
    icon: 'BarChart3',
    component: null,
    color: 'from-green-500 to-emerald-500'
  },
  'customer-lead-management': {
    id: 'customer-lead-management',
    title: 'Customer & Lead Management',
    description: 'Contact profiles and lead nurturing tools',
    icon: 'Users',
    component: null,
    color: 'from-blue-500 to-cyan-500'
  },
  'activities-communications': {
    id: 'activities-communications',
    title: 'Activities & Communications',
    description: 'Task management and communication tracking',
    icon: 'CheckSquare',
    component: null,
    color: 'from-orange-500 to-red-500'
  },
  'integrations-system': {
    id: 'integrations-system',
    title: 'Integrations & System',
    description: 'Connected apps and system settings',
    icon: 'Grid3X3',
    component: null,
    color: 'from-gray-500 to-gray-700'
  },
  
  // Original sections (kept for backward compatibility)
  'kpi-cards-section': {
    id: 'kpi-cards-section',
    title: 'Key Performance Indicators',
    description: 'High-level business metrics overview',
    icon: 'BarChart3',
    component: null,
    color: 'from-blue-500 to-green-500'
  },
  'quick-actions-section': {
    id: 'quick-actions-section',
    title: 'Quick Actions',
    description: 'Fast access to common tasks',
    icon: 'Zap',
    component: null,
    color: 'from-green-500 to-teal-500'
  },
  'automations-section': {
    id: 'automations-section',
    title: 'Automations',
    description: 'Set it and forget it - automated workflows',
    icon: 'Repeat',
    component: null,
    color: 'from-violet-500 to-purple-500'
  },
  'ai-insights-section': {
    id: 'ai-insights-section',
    title: 'AI Pipeline Intelligence',
    description: 'AI-powered analysis and recommendations',
    icon: 'Brain',
    component: null,
    color: 'from-purple-500 to-indigo-500'
  },
  'metrics-cards-section': {
    id: 'metrics-cards-section',
    title: 'Key Performance Metrics',
    description: 'Overview of critical business metrics',
    icon: 'BarChart3',
    component: null,
    color: 'from-green-500 to-blue-500'
  },
  'pipeline-section': {
    id: 'pipeline-section',
    title: 'Pipeline & Deal Analytics',
    description: 'Comprehensive deal performance and pipeline health',
    icon: 'BarChart3',
    component: null,
    color: 'from-green-500 to-emerald-500'
  },
  'contacts-section': {
    id: 'contacts-section',
    title: 'Contacts & Leads Management',
    description: 'Manage and nurture your prospect relationships',
    icon: 'Users',
    component: null,
    color: 'from-blue-500 to-cyan-500'
  },
  'interaction-history-section': {
    id: 'interaction-history-section',
    title: 'Interaction History',
    description: 'Recent contact interactions and communications',
    icon: 'MessageSquare',
    component: null,
    color: 'from-purple-500 to-blue-500'
  },
  'tasks-section': {
    id: 'tasks-section',
    title: 'Tasks & Activities',
    description: 'Manage your daily activities and appointments',
    icon: 'CheckSquare',
    component: null,
    color: 'from-orange-500 to-red-500'
  },
  'customer-profile-section': {
    id: 'customer-profile-section',
    title: 'Customer Profile',
    description: 'Detailed customer information and insights',
    icon: 'User',
    component: null,
    color: 'from-blue-500 to-indigo-500'
  },
  'recent-activity-section': {
    id: 'recent-activity-section',
    title: 'Recent Activity',
    description: 'Latest actions and events in your CRM',
    icon: 'Clock',
    component: null,
    color: 'from-gray-500 to-gray-600'
  },
  'tasks-and-funnel-section': {
    id: 'tasks-and-funnel-section',
    title: 'Tasks & Sales Funnel',
    description: 'Task management and sales pipeline visualization',
    icon: 'Target',
    component: null,
    color: 'from-amber-500 to-orange-500'
  },
  'apps-section': {
    id: 'apps-section',
    title: 'Connected Apps & Integrations',
    description: 'Access your entire business toolkit',
    icon: 'Grid3X3',
    component: null,
    color: 'from-purple-500 to-indigo-500'
  },
  'charts-section': {
    id: 'charts-section',
    title: 'Sales Charts & Analytics',
    description: 'Visualization of key sales metrics',
    icon: 'BarChart3',
    component: null,
    color: 'from-blue-500 to-teal-500'
  },
  'analytics-section': {
    id: 'analytics-section',
    title: 'Comprehensive Analytics',
    description: 'Detailed charts and performance metrics',
    icon: 'BarChart3',
    component: null,
    color: 'from-indigo-500 to-purple-500'
  },
  'white-label-section': {
    id: 'white-label-section',
    title: 'White Label Suite',
    description: 'Comprehensive white label solutions and customization tools',
    icon: 'Palette',
    component: null,
    color: 'from-indigo-500 to-purple-500'
  },
  'product-research-section': {
    id: 'product-research-section',
    title: 'Product Research',
    description: 'Advanced product research and market analysis tools',
    icon: 'Search',
    component: null,
    color: 'from-teal-500 to-cyan-500'
  },
  'ai-analytics-section': {
    id: 'ai-analytics-section',
    title: 'AI Analytics Dashboard',
    description: 'Advanced AI-powered analytics and insights',
    icon: 'BarChart3',
    component: null,
    color: 'from-emerald-500 to-green-500'
  }
};

export const DashboardLayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
    // Ensure we always have sections loaded
    try {
      const saved = localStorage.getItem('dashboard-section-order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Migration: Add automations-section and quick-actions-section if missing
          let migrated = [...parsed];
          let needsMigration = false;
          
          // Add automations-section if missing (insert before quick-actions or after executive-overview)
          if (!migrated.includes('automations-section')) {
            const quickActionsIndex = migrated.indexOf('quick-actions-section');
            const executiveIndex = migrated.indexOf('executive-overview-section');
            
            if (quickActionsIndex !== -1) {
              // Insert before quick-actions
              migrated.splice(quickActionsIndex, 0, 'automations-section');
            } else if (executiveIndex !== -1) {
              // Insert after executive-overview
              migrated.splice(executiveIndex + 1, 0, 'automations-section');
            } else {
              // Add at the beginning if neither exists
              migrated.unshift('automations-section');
            }
            needsMigration = true;
          }
          
          // Add quick-actions-section if missing (insert after automations)
          if (!migrated.includes('quick-actions-section')) {
            const automationsIndex = migrated.indexOf('automations-section');
            if (automationsIndex !== -1) {
              // Insert after automations
              migrated.splice(automationsIndex + 1, 0, 'quick-actions-section');
            } else {
              // Add after automations was just added
              const newAutomationsIndex = migrated.indexOf('automations-section');
              if (newAutomationsIndex !== -1) {
                migrated.splice(newAutomationsIndex + 1, 0, 'quick-actions-section');
              }
            }
            needsMigration = true;
          }
          
          // Save migrated layout back to localStorage
          if (needsMigration) {
            console.log('Migrating dashboard layout to include automations and quick actions');
            localStorage.setItem('dashboard-section-order', JSON.stringify(migrated));
          }
          
          return migrated;
        }
      }
    } catch (error) {
      console.warn('Failed to load dashboard sections from localStorage:', error);
      localStorage.removeItem('dashboard-section-order');
    }

    return [...defaultSectionOrder];
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Save to localStorage whenever order changes
  useEffect(() => {
    localStorage.setItem('dashboard-section-order', JSON.stringify(sectionOrder));
  }, [sectionOrder]);

  const getSectionConfig = (id: string): SectionConfig | undefined => {
    return sectionConfigs[id];
  };

  const reorderSections = (startIndex: number, endIndex: number) => {
    const newOrder = Array.from(sectionOrder);
    const [removed] = newOrder.splice(startIndex, 1);
    newOrder.splice(endIndex, 0, removed);
    setSectionOrder(newOrder);
  };

  const resetToDefault = () => {
    setSectionOrder([...defaultSectionOrder]);
    localStorage.removeItem('dashboard-section-order');
  };

  return (
    <DashboardLayoutContext.Provider value={{
      sectionOrder,
      setSectionOrder,
      isDragging,
      setIsDragging,
      draggedItem,
      setDraggedItem,
      getSectionConfig,
      reorderSections,
      resetToDefault
    }}>
      {children}
    </DashboardLayoutContext.Provider>
  );
};