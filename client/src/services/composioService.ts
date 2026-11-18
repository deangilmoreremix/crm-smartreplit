import { Goal, ExecutionStep, GoalExecutionResult } from '../types/goals';
import { generateAI } from './aiGenerate';
// import { openAIService } from './openAIService';
// import { enhancedGeminiService } from './enhancedGeminiService';
// import { useApiStore } from '../store/apiStore';

interface AgentConfig {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  model: 'openai' | 'gemini';
  temperature: number;
}

interface ExecutionContext {
  goalId: string;
  userId?: string;
  crmData?: any;
  realMode: boolean;
  previousSteps?: ExecutionStep[];
}

class ComposioService {
  private agents: Map<string, AgentConfig> = new Map();
  private executionQueue: Map<string, ExecutionContext> = new Map();

  constructor() {
    this.initializeAgents();
  }

  private initializeAgents() {
    const agentConfigs: AgentConfig[] = [
      {
        id: 'lead-analyzer',
        name: 'Lead Analyzer',
        role: 'Analyzes and scores leads based on multiple data points',
        capabilities: ['lead scoring', 'qualification', 'data analysis'],
        model: 'openai',
        temperature: 0.3,
      },
      {
        id: 'content-creator',
        name: 'Content Creator',
        role: 'Generates personalized content and messaging',
        capabilities: ['email writing', 'personalization', 'content optimization'],
        model: 'gemini',
        temperature: 0.7,
      },
      {
        id: 'data-processor',
        name: 'Data Processor',
        role: 'Processes and analyzes large datasets',
        capabilities: ['data mining', 'pattern recognition', 'reporting'],
        model: 'openai',
        temperature: 0.2,
      },
      {
        id: 'automation-engineer',
        name: 'Automation Engineer',
        role: 'Designs and implements automated workflows',
        capabilities: ['workflow design', 'trigger setup', 'optimization'],
        model: 'gemini',
        temperature: 0.4,
      },
      {
        id: 'relationship-manager',
        name: 'Relationship Manager',
        role: 'Manages customer relationships and engagement',
        capabilities: ['engagement strategies', 'retention planning', 'loyalty programs'],
        model: 'openai',
        temperature: 0.6,
      },
      {
        id: 'campaign-manager',
        name: 'Campaign Manager',
        role: 'Orchestrates marketing campaigns and outreach',
        capabilities: ['campaign planning', 'audience targeting', 'optimization'],
        model: 'gemini',
        temperature: 0.5,
      },
      {
        id: 'analytics-specialist',
        name: 'Analytics Specialist',
        role: 'Provides deep insights and predictive analytics',
        capabilities: ['data visualization', 'predictive modeling', 'performance tracking'],
        model: 'openai',
        temperature: 0.3,
      },
    ];

    agentConfigs.forEach((config) => {
      this.agents.set(config.id, config);
    });
  }

  async executeGoal(
    goal: Goal,
    context: ExecutionContext,
    onProgress?: (step: ExecutionStep) => void
  ): Promise<GoalExecutionResult> {
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.executionQueue.set(executionId, context);

    const startTime = Date.now();
    const steps: ExecutionStep[] = [];
    const agentsUsed: string[] = [];
    const toolsUsed: string[] = [];

    try {
      // Create execution steps based on goal requirements
      const executionSteps = this.createExecutionPlan(goal);

      for (let i = 0; i < executionSteps.length; i++) {
        const step = executionSteps[i];

        if (onProgress) {
          onProgress({
            ...step,
            status: 'executing',
            progress: 0,
          });
        }

        // Execute step with appropriate agent
        const result = await this.executeStep(step, goal, context);

        steps.push({
          ...step,
          status: result.success ? 'completed' : 'failed',
          progress: 100,
          result: result.data,
          duration: result.duration,
          thinking: result.thinking,
          toolsUsed: result.toolsUsed,
        });

        agentsUsed.push(step.agent);
        toolsUsed.push(...result.toolsUsed);

        if (onProgress) {
          onProgress(steps[steps.length - 1]);
        }

      }

      const executionTime = Date.now() - startTime;

      return {
        goalId: goal.id,
        success: true,
        results: {
          steps,
          insights: this.generateInsights(goal, steps),
          recommendations: this.generateRecommendations(goal, steps),
        },
        executionTime,
        agentsUsed: Array.from(new Set(agentsUsed)),
        toolsUsed: Array.from(new Set(toolsUsed)),
        nextRecommendations: this.getNextRecommendations(goal),
        crmUpdates: context.realMode ? this.generateCrmUpdates(goal, steps) : [],
      };
    } catch (error) {
      console.error('Goal execution failed:', error);

      return {
        goalId: goal.id,
        success: false,
        results: { error: error instanceof Error ? error.message : String(error), steps },
        executionTime: Date.now() - startTime,
        agentsUsed: Array.from(new Set(agentsUsed)),
        toolsUsed: Array.from(new Set(toolsUsed)),
      };
    } finally {
      this.executionQueue.delete(executionId);
    }
  }

  private createExecutionPlan(goal: Goal): ExecutionStep[] {
    return goal.agentsRequired.map((agent, index) => ({
      id: `step-${index + 1}`,
      name: `${agent} Analysis`,
      status: 'pending',
      progress: 0,
      agent: agent,
      thinking: '',
      toolsUsed: [],
      crmImpact: '',
    }));
  }

  private async executeStep(
    step: ExecutionStep,
    goal: Goal,
    context: ExecutionContext
  ): Promise<{
    success: boolean;
    data: any;
    duration: number;
    thinking: string;
    toolsUsed: string[];
  }> {
    const startTime = Date.now();

    // Get agent configuration
    const agentId = step.agent.toLowerCase().replace(/\s+/g, '-');
    const agent = this.agents.get(agentId);

    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    try {
      let result: any;
      let thinking: string;

      // Every agent step is a real OpenAI call (Responses API via the server, user's own key)
      result = await this.executeWithAI(step, goal, context, agent);
      thinking = result.reasoning;

      return {
        success: true,
        data: result,
        duration: Date.now() - startTime,
        thinking,
        toolsUsed: [], // no external tools are executed
      };
    } catch (error) {
      return {
        success: false,
        data: { error: error instanceof Error ? error.message : String(error) },
        duration: Date.now() - startTime,
        thinking: `Error in ${step.agent}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        toolsUsed: [],
      };
    }
  }

  private async executeWithAI(
    step: ExecutionStep,
    goal: Goal,
    context: ExecutionContext,
    agent: AgentConfig
  ): Promise<{ analysis: string; reasoning: string; insights: string[]; recommendations: string[] }> {
    const result = await generateAI({
      system: `You are the "${agent.name}" agent of a CRM. Capabilities: ${agent.capabilities.join(', ')}.`,
      prompt: `Goal: ${goal.title} (${goal.category}). ${goal.description || ''}
Step: ${step.name}.
Success metrics: ${(goal.successMetrics || []).join(', ')}.
Context: ${JSON.stringify(context).slice(0, 4000)}
Analyse this step for the goal and give concrete insights and recommendations.`,
      schemaName: 'agent_step',
      schema: {
        type: 'object',
        properties: {
          analysis: { type: 'string' },
          reasoning: { type: 'string' },
          insights: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } },
        },
        required: ['analysis', 'reasoning', 'insights', 'recommendations'],
        additionalProperties: false,
      },
    });
    if (!result.data) throw new Error('The AI response was not valid JSON');
    return result.data;
  }

  private generateInsights(goal: Goal, steps: ExecutionStep[]): string[] {
    const completed = steps.filter((s) => s.status === 'completed');
    return [
      `Goal execution completed with ${completed.length}/${steps.length} successful steps`,
      ...completed.flatMap((s) => (s.result?.insights as string[]) || []),
    ];
  }

  private generateRecommendations(_goal: Goal, steps: ExecutionStep[]): string[] {
    return steps
      .filter((s) => s.status === 'completed')
      .flatMap((s) => (s.result?.recommendations as string[]) || []);
  }

  private getNextRecommendations(_goal: Goal): string[] {
    // Previously random goal ids; there is no recommendation source for follow-up goals
    return [];
  }

  private generateCrmUpdates(goal: Goal, steps: ExecutionStep[]): any[] {
    if (!steps.some((s) => s.status === 'completed')) return [];

    return [
      {
        type: 'goal_execution',
        entity: goal.category,
        action: 'update',
        data: {
          goalId: goal.id,
          status: 'completed',
          results: steps.length,
          timestamp: new Date().toISOString(),
        },
      },
    ];
  }

  // Public methods for agent management
  getAvailableAgents(): AgentConfig[] {
    return Array.from(this.agents.values());
  }

  getAgentByName(name: string): AgentConfig | undefined {
    const agentId = name.toLowerCase().replace(/\s+/g, '-');
    return this.agents.get(agentId);
  }

  getExecutionStatus(executionId: string): ExecutionContext | undefined {
    return this.executionQueue.get(executionId);
  }
}

export const composioService = new ComposioService();
export default composioService;
