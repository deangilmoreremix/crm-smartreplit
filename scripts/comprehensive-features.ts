import { db } from '../server/db';
import { features } from '../shared/schema';

/**
 * COMPLETE SmartCRM Feature Catalog
 * Every single feature, tool, and module with proper hierarchical structure
 * Sourced from: Navbar.tsx, App.tsx, Remote Loaders, Module Federation components
 */

export interface FeatureDefinition {
  featureKey: string;
  name: string;
  description: string;
  category: string;
  parentKey?: string; // Will be resolved to parentId
  deliveryType: 'native' | 'module_federation' | 'iframe';
  isEnabled: boolean;
}

export const ALL_FEATURES: FeatureDefinition[] = [
  // ===== CORE CRM FEATURES =====
  {
    featureKey: 'core_crm',
    name: 'Core CRM',
    description: 'Essential CRM functionality',
    category: 'core_crm',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'dashboard',
    name: 'Dashboard',
    description: 'Main CRM dashboard with KPIs',
    category: 'core_crm',
    parentKey: 'core_crm',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'contacts',
    name: 'Contacts',
    description: 'Contact management system',
    category: 'core_crm',
    parentKey: 'core_crm',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'pipeline',
    name: 'Pipeline',
    description: 'Sales pipeline and deal tracking',
    category: 'core_crm',
    parentKey: 'core_crm',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'calendar',
    name: 'Calendar',
    description: 'Calendar and scheduling',
    category: 'core_crm',
    parentKey: 'core_crm',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'tasks',
    name: 'Tasks',
    description: 'Task management and tracking',
    category: 'core_crm',
    parentKey: 'core_crm',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'tasks_board',
    name: 'Task Board',
    description: 'Kanban-style task board',
    category: 'core_crm',
    parentKey: 'tasks',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'tasks_calendar',
    name: 'Task Calendar',
    description: 'Calendar view for tasks',
    category: 'core_crm',
    parentKey: 'tasks',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'tasks_analytics',
    name: 'Task Analytics',
    description: 'Task performance analytics',
    category: 'core_crm',
    parentKey: 'tasks',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'tasks_activity_feed',
    name: 'Activity Feed',
    description: 'Task activity timeline',
    category: 'core_crm',
    parentKey: 'tasks',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'appointments',
    name: 'Appointments',
    description: 'Appointment scheduling and management',
    category: 'core_crm',
    parentKey: 'core_crm',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'analytics',
    name: 'Analytics',
    description: 'Business analytics and reporting',
    category: 'core_crm',
    parentKey: 'core_crm',
    deliveryType: 'native',
    isEnabled: true,
  },

  // ===== SALES INTELLIGENCE =====
  {
    featureKey: 'sales_intelligence',
    name: 'Sales Intelligence',
    description: 'Advanced sales analytics and insights',
    category: 'sales_intelligence',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'pipeline_intelligence',
    name: 'Pipeline Intelligence',
    description: 'Deep pipeline analytics',
    category: 'sales_intelligence',
    parentKey: 'sales_intelligence',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'deal_risk_monitor',
    name: 'Deal Risk Monitor',
    description: 'Monitor at-risk deals',
    category: 'sales_intelligence',
    parentKey: 'sales_intelligence',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'conversion_insights',
    name: 'Conversion Insights',
    description: 'Conversion rate analytics',
    category: 'sales_intelligence',
    parentKey: 'sales_intelligence',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'pipeline_health',
    name: 'Pipeline Health Dashboard',
    description: 'Overall pipeline health metrics',
    category: 'sales_intelligence',
    parentKey: 'sales_intelligence',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'sales_cycle_analytics',
    name: 'Sales Cycle Analytics',
    description: 'Analyze sales cycle duration',
    category: 'sales_intelligence',
    parentKey: 'sales_intelligence',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'win_rate_analysis',
    name: 'Win Rate Intelligence',
    description: 'Win/loss rate analysis',
    category: 'sales_intelligence',
    parentKey: 'sales_intelligence',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'revenue_intelligence',
    name: 'Revenue Intelligence',
    description: 'Revenue forecasting and analysis',
    category: 'sales_intelligence',
    parentKey: 'sales_intelligence',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'competitor_insights',
    name: 'Competitor Insights',
    description: 'Competitive intelligence',
    category: 'sales_intelligence',
    parentKey: 'sales_intelligence',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'live_deal_analysis',
    name: 'Live Deal Analysis',
    description: 'Real-time deal insights',
    category: 'sales_intelligence',
    parentKey: 'sales_intelligence',
    deliveryType: 'native',
    isEnabled: true,
  },

  // ===== AI FEATURES - PARENT =====
  {
    featureKey: 'ai_features',
    name: 'AI Features',
    description: 'Artificial intelligence powered features',
    category: 'ai_features',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_goals',
    name: 'AI Goals',
    description: 'AI-powered goal setting and tracking with 58+ pre-configured goals',
    category: 'ai_features',
    parentKey: 'ai_features',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_tools',
    name: 'AI Tools Suite',
    description: 'Comprehensive AI productivity tools',
    category: 'ai_features',
    parentKey: 'ai_features',
    deliveryType: 'native',
    isEnabled: true,
  },

  // AI Tools - Core AI Tools Category
  {
    featureKey: 'ai_email_analysis',
    name: 'Email Analysis',
    description: 'AI-powered email analysis',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_meeting_summary',
    name: 'Meeting Summarizer',
    description: 'Auto-generate meeting summaries',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_proposal_generator',
    name: 'Proposal Generator',
    description: 'Create professional proposals',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_call_script_generator',
    name: 'Call Script Generator',
    description: 'Generate sales call scripts',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_subject_optimizer',
    name: 'Subject Line Optimizer',
    description: 'Generate compelling subject lines',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_competitor_analysis',
    name: 'Competitor Analysis',
    description: 'Analyze competitors',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_market_trends',
    name: 'Market Trends',
    description: 'Market intelligence and trends',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_sales_insights',
    name: 'Sales Insights',
    description: 'Sales performance insights',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_sales_forecast',
    name: 'AI Sales Forecast',
    description: 'Predictive sales forecasting',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },

  // AI Tools - Communication
  {
    featureKey: 'ai_email_composer',
    name: 'Email Composer',
    description: 'AI email writing assistant',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_objection_handler',
    name: 'Objection Handler',
    description: 'Handle sales objections',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_email_response',
    name: 'Email Response Generator',
    description: 'Generate email responses',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_voice_tone_optimizer',
    name: 'Voice Tone Optimizer',
    description: 'Optimize communication tone',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },

  // AI Tools - Customer & Content
  {
    featureKey: 'ai_customer_persona',
    name: 'Customer Persona Builder',
    description: 'Build customer personas',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_visual_content_generator',
    name: 'Visual Content Generator',
    description: 'Generate visual content',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_meeting_agenda',
    name: 'Meeting Agenda Generator',
    description: 'Create meeting agendas',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },

  // AI Tools - Advanced Features
  {
    featureKey: 'ai_assistant_chat',
    name: 'AI Assistant',
    description: 'Conversational AI assistant',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_vision_analyzer',
    name: 'Vision Analyzer',
    description: 'AI image/document analysis',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_image_generator',
    name: 'Image Generator',
    description: 'AI image creation',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_smart_search_realtime',
    name: 'Smart Search Realtime',
    description: 'Intelligent real-time semantic search',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_function_assistant',
    name: 'Function Assistant',
    description: 'Code generation assistant',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },

  // AI Tools - Real-time Features
  {
    featureKey: 'ai_streaming_chat',
    name: 'Streaming Chat',
    description: 'Real-time AI chat streaming',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_form_validation',
    name: 'AI Form Validation',
    description: 'Intelligent form validation',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_live_deal_analysis',
    name: 'Live Deal Analysis',
    description: 'Real-time deal insights',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_instant_response',
    name: 'Instant Response',
    description: 'Instant AI responses',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_realtime_email_composer',
    name: 'Real-time Email Composer',
    description: 'Live email composition',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_voice_analysis_realtime',
    name: 'Voice Analysis Real-time',
    description: 'Real-time voice analysis',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },

  // AI Tools - Reasoning Generators
  {
    featureKey: 'ai_reasoning_email',
    name: 'Reasoning Email',
    description: 'Advanced reasoning email generation',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_reasoning_proposal',
    name: 'Reasoning Proposal',
    description: 'Advanced reasoning proposals',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_reasoning_script',
    name: 'Reasoning Script',
    description: 'Advanced reasoning call scripts',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_reasoning_objection',
    name: 'Reasoning Objection',
    description: 'Advanced reasoning objection handling',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_reasoning_social',
    name: 'Reasoning Social',
    description: 'Advanced reasoning social posts',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },

  // AI Tools - Analysis & Intelligence
  {
    featureKey: 'ai_sentiment_analysis',
    name: 'Sentiment Analysis',
    description: 'Analyze customer sentiment',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_churn_prediction',
    name: 'Churn Prediction',
    description: 'Predict customer churn risk',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },

  // AI Tools - Automation
  {
    featureKey: 'ai_task_automation',
    name: 'Task Automation',
    description: 'Automate repetitive tasks',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_smart_prioritization',
    name: 'Smart Prioritization',
    description: 'AI task prioritization',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_workflow_builder',
    name: 'Workflow Builder',
    description: 'Build automated workflows',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'ai_deadline_optimizer',
    name: 'Deadline Optimizer',
    description: 'Optimize task deadlines',
    category: 'ai_features',
    parentKey: 'ai_tools',
    deliveryType: 'native',
    isEnabled: true,
  },

  // ===== COMMUNICATION & REVENUE TOOLS =====
  {
    featureKey: 'communication',
    name: 'Communication Hub',
    description: 'Unified communication platform',
    category: 'communication',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'video_email',
    name: 'Video Email',
    description: 'Send personalized video emails',
    category: 'communication',
    parentKey: 'communication',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'sms_automation',
    name: 'SMS Automation',
    description: 'Automated text messaging',
    category: 'communication',
    parentKey: 'communication',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'voip_phone',
    name: 'VoIP Phone System',
    description: 'Professional calling system',
    category: 'communication',
    parentKey: 'communication',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'phone_system',
    name: 'Phone System Dashboard',
    description: 'Phone system management',
    category: 'communication',
    parentKey: 'communication',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'invoicing',
    name: 'Invoicing & Billing',
    description: 'Invoice and payment management',
    category: 'communication',
    parentKey: 'communication',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'lead_automation',
    name: 'Lead Automation',
    description: 'Automated lead nurturing workflows',
    category: 'communication',
    parentKey: 'communication',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'circle_prospecting',
    name: 'Circle Prospecting',
    description: 'Geo-targeted prospecting',
    category: 'communication',
    parentKey: 'communication',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'forms_surveys',
    name: 'Forms & Surveys',
    description: 'Create and manage forms',
    category: 'communication',
    parentKey: 'communication',
    deliveryType: 'native',
    isEnabled: true,
  },

  // ===== REMOTE APPS / MODULE FEDERATION =====
  {
    featureKey: 'remote_apps',
    name: 'Remote Apps',
    description: 'External integrated applications',
    category: 'remote_apps',
    deliveryType: 'module_federation',
    isEnabled: true,
  },

  // External Connected Apps (iframe)
  {
    featureKey: 'remote_funnelcraft',
    name: 'FunnelCraft AI',
    description: 'AI-powered funnel building',
    category: 'remote_apps',
    parentKey: 'remote_apps',
    deliveryType: 'iframe',
    isEnabled: true,
  },
  {
    featureKey: 'remote_smartcrm_closer',
    name: 'SmartCRM Closer',
    description: 'Advanced sales closing tools',
    category: 'remote_apps',
    parentKey: 'remote_apps',
    deliveryType: 'iframe',
    isEnabled: true,
  },
  {
    featureKey: 'remote_content_ai',
    name: 'ContentAI',
    description: 'AI content generation platform',
    category: 'remote_apps',
    parentKey: 'remote_apps',
    deliveryType: 'iframe',
    isEnabled: true,
  },

  // Module Federation Apps
  {
    featureKey: 'remote_pipeline',
    name: 'Remote Pipeline Module',
    description: 'Module federation pipeline',
    category: 'remote_apps',
    parentKey: 'remote_apps',
    deliveryType: 'module_federation',
    isEnabled: true,
  },
  {
    featureKey: 'remote_contacts',
    name: 'Remote Contacts Module',
    description: 'Module federation contacts',
    category: 'remote_apps',
    parentKey: 'remote_apps',
    deliveryType: 'module_federation',
    isEnabled: true,
  },
  {
    featureKey: 'remote_calendar',
    name: 'Remote Calendar Module',
    description: 'Module federation calendar',
    category: 'remote_apps',
    parentKey: 'remote_apps',
    deliveryType: 'module_federation',
    isEnabled: true,
  },
  {
    featureKey: 'remote_analytics',
    name: 'AI Analytics Dashboard',
    description: 'Remote analytics module',
    category: 'remote_apps',
    parentKey: 'remote_apps',
    deliveryType: 'module_federation',
    isEnabled: true,
  },
  {
    featureKey: 'remote_product_research',
    name: 'Product Research',
    description: 'Product research tools',
    category: 'remote_apps',
    parentKey: 'remote_apps',
    deliveryType: 'module_federation',
    isEnabled: true,
  },
  {
    featureKey: 'remote_business_intel',
    name: 'Business Intelligence',
    description: 'Remote business intelligence',
    category: 'remote_apps',
    parentKey: 'remote_apps',
    deliveryType: 'module_federation',
    isEnabled: true,
  },
  {
    featureKey: 'remote_ai_goals',
    name: 'Remote AI Goals',
    description: 'Remote AI goals module',
    category: 'remote_apps',
    parentKey: 'remote_apps',
    deliveryType: 'module_federation',
    isEnabled: true,
  },
  {
    featureKey: 'remote_ai_analytics',
    name: 'Remote AI Analytics',
    description: 'Remote AI analytics module',
    category: 'remote_apps',
    parentKey: 'remote_apps',
    deliveryType: 'module_federation',
    isEnabled: true,
  },
  {
    featureKey: 'remote_white_label',
    name: 'Remote White Label',
    description: 'Remote white label module',
    category: 'remote_apps',
    parentKey: 'remote_apps',
    deliveryType: 'module_federation',
    isEnabled: true,
  },

  // ===== WHITE LABEL & PARTNER =====
  {
    featureKey: 'white_label',
    name: 'White Label Suite',
    description: 'White label customization features',
    category: 'white_label',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'white_label_customization',
    name: 'White Label Customization',
    description: 'Brand customization tools',
    category: 'white_label',
    parentKey: 'white_label',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'white_label_management',
    name: 'WL Management Dashboard',
    description: 'Manage white label settings',
    category: 'white_label',
    parentKey: 'white_label',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'revenue_sharing',
    name: 'Revenue Sharing',
    description: 'Revenue sharing system',
    category: 'white_label',
    parentKey: 'white_label',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'package_builder',
    name: 'Package Builder',
    description: 'Build custom packages',
    category: 'white_label',
    parentKey: 'white_label',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'partner_dashboard',
    name: 'Partner Dashboard',
    description: 'Partner management interface',
    category: 'white_label',
    parentKey: 'white_label',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'partner_onboarding',
    name: 'Partner Onboarding',
    description: 'Onboard new partners',
    category: 'white_label',
    parentKey: 'white_label',
    deliveryType: 'native',
    isEnabled: true,
  },

  // ===== ADMIN & GOVERNANCE =====
  {
    featureKey: 'admin',
    name: 'Admin Features',
    description: 'Administrative functions',
    category: 'admin',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'admin_dashboard',
    name: 'Admin Dashboard',
    description: 'Administrative overview',
    category: 'admin',
    parentKey: 'admin',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'user_management',
    name: 'User Management',
    description: 'Manage system users',
    category: 'admin',
    parentKey: 'admin',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'bulk_import',
    name: 'Bulk Import',
    description: 'Bulk user import',
    category: 'admin',
    parentKey: 'admin',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'feature_management',
    name: 'Feature Management',
    description: 'Manage system features',
    category: 'admin',
    parentKey: 'admin',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'admin_analytics',
    name: 'Admin Analytics',
    description: 'System-wide analytics',
    category: 'admin',
    parentKey: 'admin',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'admin_settings',
    name: 'Admin Settings',
    description: 'System configuration',
    category: 'admin',
    parentKey: 'admin',
    deliveryType: 'native',
    isEnabled: true,
  },

  // ===== CONTENT & BUSINESS TOOLS =====
  {
    featureKey: 'content_tools',
    name: 'Content Tools',
    description: 'Content creation and management',
    category: 'business_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'content_library',
    name: 'Content Library',
    description: 'Manage content assets',
    category: 'business_tools',
    parentKey: 'content_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'voice_profiles',
    name: 'Voice Profiles',
    description: 'Voice synthesis profiles',
    category: 'business_tools',
    parentKey: 'content_tools',
    deliveryType: 'native',
    isEnabled: true,
  },
  {
    featureKey: 'business_analysis',
    name: 'Business Analysis',
    description: 'Business intelligence tools',
    category: 'business_tools',
    parentKey: 'content_tools',
    deliveryType: 'native',
    isEnabled: true,
  },

  // ===== SMART AUTOMATIONS =====
  {
    featureKey: 'automations',
    name: 'Smart Automations',
    description: 'Pre-built automation workflows (16 automations across 4 categories)',
    category: 'advanced',
    deliveryType: 'native',
    isEnabled: true,
  },
];

/**
 * Seed all features with proper parent-child relationships
 */
async function seedComprehensiveFeatures() {
  console.log('🌱 Seeding COMPLETE feature catalog...');
  console.log(`📊 Total features to seed: ${ALL_FEATURES.length}`);

  try {
    // First pass: Insert all parent features (no parentKey)
    const parents = ALL_FEATURES.filter(f => !f.parentKey);
    console.log(`\n👨 Inserting ${parents.length} parent features...`);
    
    for (const feature of parents) {
      const { parentKey, ...featureData } = feature;
      await db.insert(features).values(featureData).onConflictDoNothing();
      console.log(`  ✓ ${feature.name}`);
    }

    // Get all features to build parentId map
    const allFeatures = await db.select().from(features);
    const featureMap = new Map(allFeatures.map(f => [f.featureKey, f.id]));

    // Second pass: Insert child features with parentId
    const children = ALL_FEATURES.filter(f => f.parentKey);
    console.log(`\n👶 Inserting ${children.length} child features with parentId...`);
    
    for (const feature of children) {
      const { parentKey, ...featureData } = feature;
      const parentId = parentKey ? featureMap.get(parentKey) : null;
      
      await db.insert(features).values({
        ...featureData,
        parentId,
      }).onConflictDoNothing();
      
      console.log(`  ✓ ${feature.name} (parent: ${parentKey})`);
    }

    console.log(`\n✅ Successfully seeded ${ALL_FEATURES.length} features!`);
    console.log('\n📈 Feature Breakdown:');
    console.log(`   Core CRM: ${ALL_FEATURES.filter(f => f.category === 'core_crm').length}`);
    console.log(`   Sales Intelligence: ${ALL_FEATURES.filter(f => f.category === 'sales_intelligence').length}`);
    console.log(`   AI Features: ${ALL_FEATURES.filter(f => f.category === 'ai_features').length}`);
    console.log(`   Communication: ${ALL_FEATURES.filter(f => f.category === 'communication').length}`);
    console.log(`   Remote Apps: ${ALL_FEATURES.filter(f => f.category === 'remote_apps').length}`);
    console.log(`   White Label: ${ALL_FEATURES.filter(f => f.category === 'white_label').length}`);
    console.log(`   Admin: ${ALL_FEATURES.filter(f => f.category === 'admin').length}`);
    console.log(`   Business Tools: ${ALL_FEATURES.filter(f => f.category === 'business_tools').length}`);
    console.log(`   Advanced: ${ALL_FEATURES.filter(f => f.category === 'advanced').length}`);
  } catch (error) {
    console.error('❌ Error seeding features:', error);
    throw error;
  }
}

export { seedComprehensiveFeatures };

// Run the seed when executed directly
seedComprehensiveFeatures()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
