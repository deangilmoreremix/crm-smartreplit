import { GoalCategory, Goal } from '../types/goals';
import { 
  Target, 
  Mail, 
  Users, 
  Zap, 
  BarChart3, 
  FileText,
  TrendingUp,
  MessageSquare
} from 'lucide-react';

export const GOAL_CATEGORIES: GoalCategory[] = [
  {
    id: 'sales',
    name: 'Sales',
    description: 'Lead generation, qualification, and conversion optimization',
    icon: Target,
    color: 'blue',
    totalGoals: 15
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Campaign automation, audience targeting, and brand building',
    icon: TrendingUp,
    color: 'purple',
    totalGoals: 12
  },
  {
    id: 'relationship',
    name: 'Relationship',
    description: 'Customer engagement, retention, and loyalty building',
    icon: Users,
    color: 'green',
    totalGoals: 10
  },
  {
    id: 'automation',
    name: 'Automation',
    description: 'Workflow optimization and process automation',
    icon: Zap,
    color: 'yellow',
    totalGoals: 8
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Data analysis, reporting, and predictive insights',
    icon: BarChart3,
    color: 'indigo',
    totalGoals: 7
  },
  {
    id: 'content',
    name: 'Content',
    description: 'Content creation, optimization, and distribution',
    icon: FileText,
    color: 'pink',
    totalGoals: 6
  }
];

export const PRIORITY_MAPPING = {
  'High': {
    color: 'red',
    weight: 3,
    urgency: 'immediate'
  },
  'Medium': {
    color: 'yellow',
    weight: 2,
    urgency: 'soon'
  },
  'Low': {
    color: 'green',
    weight: 1,
    urgency: 'later'
  }
};

export const COMPLEXITY_MAPPING = {
  'Simple': {
    color: 'green',
    difficulty: 1,
    timeMultiplier: 1,
    agentsRequired: 1-2
  },
  'Intermediate': {
    color: 'yellow',
    difficulty: 2,
    timeMultiplier: 1.5,
    agentsRequired: 2-4
  },
  'Advanced': {
    color: 'red',
    difficulty: 3,
    timeMultiplier: 2,
    agentsRequired: 4-6
  }
};

export const AGENT_SPECIALIZATIONS = {
  'Lead Analyzer': ['lead scoring', 'qualification', 'prospect research'],
  'Content Creator': ['email writing', 'content generation', 'personalization'],
  'Data Processor': ['data analysis', 'pattern recognition', 'reporting'],
  'Automation Engineer': ['workflow creation', 'trigger setup', 'process optimization'],
  'Relationship Manager': ['customer engagement', 'retention strategies', 'loyalty programs'],
  'Campaign Manager': ['marketing automation', 'audience targeting', 'campaign optimization'],
  'Analytics Specialist': ['data visualization', 'predictive modeling', 'performance tracking'],
  'Social Media Manager': ['content scheduling', 'engagement tracking', 'brand monitoring']
};

export const TOOL_CATEGORIES = {
  'CRM Integration': ['Salesforce', 'HubSpot', 'Pipedrive', 'Monday.com'],
  'Email Marketing': ['Mailchimp', 'SendGrid', 'ConvertKit', 'Constant Contact'],
  'Social Media': ['Hootsuite', 'Buffer', 'Sprout Social', 'Later'],
  'Analytics': ['Google Analytics', 'Mixpanel', 'Amplitude', 'Hotjar'],
  'Communication': ['Slack', 'Discord', 'Microsoft Teams', 'Zoom'],
  'Content': ['Canva', 'Adobe Creative Suite', 'Figma', 'Notion']
};

export const ROI_BENCHMARKS = {
  'lead-generation': {
    averageROI: '250-400%',
    timeframe: '3-6 months',
    keyMetrics: ['cost per lead', 'conversion rate', 'lead quality score']
  },
  'email-marketing': {
    averageROI: '180-300%',
    timeframe: '2-4 months',
    keyMetrics: ['open rate', 'click rate', 'conversion rate']
  },
  'automation': {
    averageROI: '300-500%',
    timeframe: '1-3 months',
    keyMetrics: ['time saved', 'error reduction', 'efficiency gain']
  },
  'analytics': {
    averageROI: '200-350%',
    timeframe: '4-8 months',
    keyMetrics: ['insight quality', 'decision speed', 'accuracy improvement']
  }
};