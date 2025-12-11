import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Goal, GoalProgress, ExecutionStep, GoalExecutionResult, AIGoalContext } from '../types/goals';
import { AI_GOALS } from '../data/aiGoals';
import { composioService } from '../services/composioService';

interface GoalFilter {
  categories: string[];
  priorities: string[];
  complexities: string[];
  searchTerm: string;
  showCompleted: boolean;
}

interface GoalState {
  // Core data
  goals: Goal[];
  activeExecutions: Map<string, GoalProgress>;
  completedGoals: Set<string>;
  favoriteGoals: Set<string>;
  
  // Context and filtering
  currentContext: AIGoalContext | null;
  filter: GoalFilter;
  
  // UI state
  selectedGoal: Goal | null;
  isExecutionModalOpen: boolean;
  realMode: boolean;
  
  // Statistics
  stats: {
    totalExecutions: number;
    successfulExecutions: number;
    averageExecutionTime: number;
    totalTimeSaved: number;
    estimatedROI: number;
  };
  
  // Actions - Goal Management
  loadGoals: () => void;
  selectGoal: (goal: Goal) => void;
  clearSelection: () => void;
  toggleFavorite: (goalId: string) => void;
  
  // Actions - Execution
  executeGoal: (goal: Goal, context?: AIGoalContext) => Promise<GoalExecutionResult>;
  cancelExecution: (goalId: string) => void;
  retryExecution: (goalId: string) => Promise<GoalExecutionResult>;
  
  // Actions - Modal
  openExecutionModal: (goal: Goal) => void;
  closeExecutionModal: () => void;
  
  // Actions - Context
  setContext: (context: AIGoalContext | null) => void;
  clearContext: () => void;
  
  // Actions - Filtering
  updateFilter: (updates: Partial<GoalFilter>) => void;
  resetFilter: () => void;
  getFilteredGoals: () => Goal[];
  
  // Actions - Mode
  setRealMode: (enabled: boolean) => void;
  toggleMode: () => void;
  
  // Actions - Statistics
  updateStats: (executionResult: GoalExecutionResult) => void;
  resetStats: () => void;
  
  // Actions - Progress
  updateExecutionProgress: (goalId: string, step: ExecutionStep) => void;
  completeExecution: (goalId: string, result: GoalExecutionResult) => void;
}

const defaultFilter: GoalFilter = {
  categories: [],
  priorities: [],
  complexities: [],
  searchTerm: '',
  showCompleted: true
};

const defaultStats = {
  totalExecutions: 0,
  successfulExecutions: 0,
  averageExecutionTime: 0,
  totalTimeSaved: 0,
  estimatedROI: 0
};

export const useGoalStore = create<GoalState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        goals: [],
        activeExecutions: new Map(),
        completedGoals: new Set(),
        favoriteGoals: new Set(),
        currentContext: null,
        filter: defaultFilter,
        selectedGoal: null,
        isExecutionModalOpen: false,
        realMode: false,
        stats: defaultStats,

        // Goal Management
        loadGoals: () => {
          set({
            goals: AI_GOALS.map(aiGoal => ({
              ...aiGoal,
              name: aiGoal.title
            }))
          }, false, 'loadGoals');
        },

        selectGoal: (goal: Goal) => {
          set({ selectedGoal: goal }, false, 'selectGoal');
        },

        clearSelection: () => {
          set({ selectedGoal: null }, false, 'clearSelection');
        },

        toggleFavorite: (goalId: string) => {
          const { favoriteGoals } = get();
          const newFavorites = new Set(favoriteGoals);
          
          if (newFavorites.has(goalId)) {
            newFavorites.delete(goalId);
          } else {
            newFavorites.add(goalId);
          }
          
          set({ favoriteGoals: newFavorites }, false, 'toggleFavorite');
        },

        // Execution
        executeGoal: async (goal: Goal, context?: AIGoalContext) => {
          const { realMode, currentContext, activeExecutions } = get();
          const executionContext = context || currentContext;
          
          // Initialize progress tracking
          const progress: GoalProgress = {
            goalId: goal.id,
            status: 'executing',
            progress: 0,
            steps: [],
            startTime: new Date()
          };
          
          const newActiveExecutions = new Map(activeExecutions);
          newActiveExecutions.set(goal.id, progress);
          
          set({ 
            activeExecutions: newActiveExecutions,
            selectedGoal: goal 
          }, false, 'startExecution');

          try {
            const result = await composioService.executeGoal(
              goal,
              {
                goalId: goal.id,
                realMode,
                crmData: executionContext
              },
              (step: ExecutionStep) => {
                get().updateExecutionProgress(goal.id, step);
              }
            );

            get().completeExecution(goal.id, result);
            get().updateStats(result);
            
            return result;
          } catch (error) {
            console.error('Goal execution failed:', error);
            
            const errorResult: GoalExecutionResult = {
              goalId: goal.id,
              success: false,
              results: { error: error instanceof Error ? error.message : 'Unknown error' },
              executionTime: Date.now() - progress.startTime.getTime(),
              agentsUsed: [],
              toolsUsed: []
            };
            
            get().completeExecution(goal.id, errorResult);
            return errorResult;
          }
        },

        cancelExecution: (goalId: string) => {
          const { activeExecutions } = get();
          const newActiveExecutions = new Map(activeExecutions);
          newActiveExecutions.delete(goalId);
          
          set({ activeExecutions: newActiveExecutions }, false, 'cancelExecution');
        },

        retryExecution: async (goalId: string) => {
          const { goals } = get();
          const goal = goals.find(g => g.id === goalId);
          
          if (!goal) {
            throw new Error(`Goal not found: ${goalId}`);
          }
          
          return get().executeGoal(goal);
        },

        // Modal Management
        openExecutionModal: (goal: Goal) => {
          set({ 
            selectedGoal: goal, 
            isExecutionModalOpen: true 
          }, false, 'openExecutionModal');
        },

        closeExecutionModal: () => {
          set({ 
            isExecutionModalOpen: false,
            selectedGoal: null 
          }, false, 'closeExecutionModal');
        },

        // Context Management
        setContext: (context: AIGoalContext | null) => {
          set({ currentContext: context }, false, 'setContext');
        },

        clearContext: () => {
          set({ currentContext: null }, false, 'clearContext');
        },

        // Filtering
        updateFilter: (updates: Partial<GoalFilter>) => {
          const { filter } = get();
          set({ 
            filter: { ...filter, ...updates } 
          }, false, 'updateFilter');
        },

        resetFilter: () => {
          set({ filter: defaultFilter }, false, 'resetFilter');
        },

        getFilteredGoals: () => {
          const { goals, filter, completedGoals } = get();
          
          return goals.filter(goal => {
            // Category filter
            if (filter.categories.length > 0 && !filter.categories.includes(goal.category)) {
              return false;
            }
            
            // Priority filter
            if (filter.priorities.length > 0 && !filter.priorities.includes(goal.priority)) {
              return false;
            }
            
            // Complexity filter
            if (filter.complexities.length > 0 && !filter.complexities.includes(goal.complexity)) {
              return false;
            }
            
            // Search term filter
            if (filter.searchTerm) {
              const searchLower = filter.searchTerm.toLowerCase();
              const matchesSearch = 
                goal.title.toLowerCase().includes(searchLower) ||
                goal.description.toLowerCase().includes(searchLower) ||
                goal.category.toLowerCase().includes(searchLower);
              
              if (!matchesSearch) return false;
            }
            
            // Completed filter
            if (!filter.showCompleted && completedGoals.has(goal.id)) {
              return false;
            }
            
            return true;
          });
        },

        // Mode Management
        setRealMode: (enabled: boolean) => {
          set({ realMode: enabled }, false, 'setRealMode');
        },

        toggleMode: () => {
          const { realMode } = get();
          set({ realMode: !realMode }, false, 'toggleMode');
        },

        // Statistics
        updateStats: (executionResult: GoalExecutionResult) => {
          const { stats } = get();
          const newStats = {
            totalExecutions: stats.totalExecutions + 1,
            successfulExecutions: stats.successfulExecutions + (executionResult.success ? 1 : 0),
            averageExecutionTime: (stats.averageExecutionTime * stats.totalExecutions + executionResult.executionTime) / (stats.totalExecutions + 1),
            totalTimeSaved: stats.totalTimeSaved + (executionResult.success ? 3600000 : 0), // 1 hour saved per successful execution
            estimatedROI: stats.estimatedROI + (executionResult.success ? 25000 : 0) // $25k ROI per successful execution
          };
          
          set({ stats: newStats }, false, 'updateStats');
        },

        resetStats: () => {
          set({ stats: defaultStats }, false, 'resetStats');
        },

        // Progress Management
        updateExecutionProgress: (goalId: string, step: ExecutionStep) => {
          const { activeExecutions } = get();
          const progress = activeExecutions.get(goalId);
          
          if (!progress) return;
          
          const existingStepIndex = progress.steps.findIndex(s => s.id === step.id);
          const newSteps = [...progress.steps];
          
          if (existingStepIndex >= 0) {
            newSteps[existingStepIndex] = step;
          } else {
            newSteps.push(step);
          }
          
          const updatedProgress: GoalProgress = {
            ...progress,
            steps: newSteps,
            progress: (newSteps.filter(s => s.status === 'completed').length / newSteps.length) * 100
          };
          
          const newActiveExecutions = new Map(activeExecutions);
          newActiveExecutions.set(goalId, updatedProgress);
          
          set({ activeExecutions: newActiveExecutions }, false, 'updateExecutionProgress');
        },

        completeExecution: (goalId: string, result: GoalExecutionResult) => {
          const { activeExecutions, completedGoals } = get();
          const progress = activeExecutions.get(goalId);
          
          if (!progress) return;
          
          const finalProgress: GoalProgress = {
            ...progress,
            status: result.success ? 'completed' : 'failed',
            progress: 100,
            endTime: new Date(),
            results: result.results
          };
          
          const newActiveExecutions = new Map(activeExecutions);
          newActiveExecutions.delete(goalId);
          
          const newCompletedGoals = new Set(completedGoals);
          if (result.success) {
            newCompletedGoals.add(goalId);
          }
          
          set({ 
            activeExecutions: newActiveExecutions,
            completedGoals: newCompletedGoals
          }, false, 'completeExecution');
        }
      }),
      {
        name: 'goal-store',
        partialize: (state) => ({
          favoriteGoals: Array.from(state.favoriteGoals),
          completedGoals: Array.from(state.completedGoals),
          stats: state.stats,
          realMode: state.realMode,
          filter: state.filter
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Convert arrays back to Sets
            state.favoriteGoals = new Set(Array.isArray(state.favoriteGoals) ? state.favoriteGoals : []);
            state.completedGoals = new Set(Array.isArray(state.completedGoals) ? state.completedGoals : []);
            state.activeExecutions = new Map();
            
            // Load goals on rehydration
            state.loadGoals();
          }
        }
      }
    ),
    { name: 'goal-store' }
  )
);

// Initialize goals on first load
if (typeof window !== 'undefined') {
  useGoalStore.getState().loadGoals();
}