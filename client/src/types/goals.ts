import { LucideIcon } from 'lucide-react';

export interface Goal {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  agentsRequired: string[];
  toolsNeeded: string[];
  estimatedSetupTime: string;
  businessImpact: string;
  complexity: 'Simple' | 'Intermediate' | 'Advanced';
  realWorldExample: string;
  successMetrics: string[];
  prerequisite: string[];
  prerequisites?: string[]; // Alias for prerequisite for compatibility
  roi: string;
  // Additional properties for comprehensive design
  estimatedTime?: string; // Alias for estimatedSetupTime
  revenueImpact?: string; // Additional revenue impact field
  expectedRoi?: string; // Alias for roi
  difficulty?: 'Simple' | 'Intermediate' | 'Advanced'; // Alias for complexity
  implementationNotes?: string[]; // Implementation guidance
  technicalRequirements?: string[]; // Technical requirements
  aiModels?: string[]; // AI models used
  recommendedFor?: ('contact' | 'deal' | 'company')[];
  toolMapping?: string;
}

export interface GoalCategory {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  totalGoals: number;
}

export interface GoalProgress {
  goalId: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  progress: number;
  steps: ExecutionStep[];
  startTime: Date;
  endTime?: Date;
  results?: any;
}

export interface ExecutionStep {
  id: string;
  name: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  progress: number;
  agent: string;
  duration?: number;
  result?: any;
  thinking?: string;
  toolsUsed?: string[];
  crmImpact?: string;
}

export interface AgentGoalMapping {
  goalId: string;
  agents: {
    primary: string;
    secondary: string[];
  };
  executionOrder: string[];
  dependencies: Record<string, string[]>;
}

export interface AIGoalContext {
  type: 'contact' | 'deal' | 'company';
  name?: string;
  title?: string;
  id?: string;
}

export interface GoalExecutionResult {
  goalId: string;
  success: boolean;
  results: any;
  executionTime: number;
  agentsUsed: string[];
  toolsUsed: string[];
  nextRecommendations?: string[];
  crmUpdates?: any[];
}