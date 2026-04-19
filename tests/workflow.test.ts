import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

interface TriggerCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in';
  value: any;
}

interface TriggerAction {
  type: 'send_email' | 'update_field' | 'create_task' | 'webhook' | 'score_update';
  config: Record<string, any>;
}

interface WorkflowTrigger {
  id: string;
  name: string;
  enabled: boolean;
  conditions: TriggerCondition[];
  conditionLogic: 'and' | 'or';
  actions: TriggerAction[];
  lastTriggered?: Date;
}

function evaluateCondition(condition: TriggerCondition, context: Record<string, any>): boolean {
  const fieldValue = context[condition.field];

  if (fieldValue === undefined || fieldValue === null) {
    return false;
  }

  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;
    case 'not_equals':
      return fieldValue !== condition.value;
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
    case 'gt':
      return Number(fieldValue) > Number(condition.value);
    case 'lt':
      return Number(fieldValue) < Number(condition.value);
    case 'gte':
      return Number(fieldValue) >= Number(condition.value);
    case 'lte':
      return Number(fieldValue) <= Number(condition.value);
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(fieldValue);
    case 'not_in':
      return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
    default:
      return false;
  }
}

function evaluateConditions(
  conditions: TriggerCondition[],
  logic: 'and' | 'or',
  context: Record<string, any>
): boolean {
  if (conditions.length === 0) {
    return true;
  }

  if (logic === 'and') {
    return conditions.every((condition) => evaluateCondition(condition, context));
  } else {
    return conditions.some((condition) => evaluateCondition(condition, context));
  }
}

function evaluateTrigger(trigger: WorkflowTrigger, context: Record<string, any>): boolean {
  if (!trigger.enabled) {
    return false;
  }

  const conditionsMet = evaluateConditions(trigger.conditions, trigger.conditionLogic, context);

  return conditionsMet;
}

function matchConditions(
  conditions: TriggerCondition[],
  logic: 'and' | 'or',
  context: Record<string, any>
): { matched: boolean; matchedConditions: string[]; unmetConditions: string[] } {
  const matchedConditions: string[] = [];
  const unmetConditions: string[] = [];

  for (const condition of conditions) {
    const result = evaluateCondition(condition, context);
    const conditionStr = `${condition.field} ${condition.operator} ${JSON.stringify(condition.value)}`;

    if (result) {
      matchedConditions.push(conditionStr);
    } else {
      unmetConditions.push(conditionStr);
    }
  }

  let matched: boolean;
  if (logic === 'and') {
    matched = unmetConditions.length === 0;
  } else {
    matched = matchedConditions.length > 0;
  }

  return { matched, matchedConditions, unmetConditions };
}

describe('Workflow Trigger Evaluation', () => {
  describe('evaluateCondition', () => {
    it('should evaluate equals operator correctly', () => {
      const condition: TriggerCondition = {
        field: 'status',
        operator: 'equals',
        value: 'hot',
      };

      expect(evaluateCondition(condition, { status: 'hot' })).toBe(true);
      expect(evaluateCondition(condition, { status: 'cold' })).toBe(false);
      expect(evaluateCondition(condition, { status: 'HOT' })).toBe(false);
    });

    it('should evaluate not_equals operator correctly', () => {
      const condition: TriggerCondition = {
        field: 'status',
        operator: 'not_equals',
        value: 'cold',
      };

      expect(evaluateCondition(condition, { status: 'hot' })).toBe(true);
      expect(evaluateCondition(condition, { status: 'cold' })).toBe(false);
    });

    it('should evaluate contains operator correctly', () => {
      const condition: TriggerCondition = {
        field: 'email',
        operator: 'contains',
        value: '@gmail.com',
      };

      expect(evaluateCondition(condition, { email: 'user@gmail.com' })).toBe(true);
      expect(evaluateCondition(condition, { email: 'user@yahoo.com' })).toBe(false);
      expect(evaluateCondition(condition, { email: 'USER@GMAIL.COM' })).toBe(true);
    });

    it('should evaluate gt operator correctly', () => {
      const condition: TriggerCondition = {
        field: 'score',
        operator: 'gt',
        value: 50,
      };

      expect(evaluateCondition(condition, { score: 75 })).toBe(true);
      expect(evaluateCondition(condition, { score: 50 })).toBe(false);
      expect(evaluateCondition(condition, { score: 25 })).toBe(false);
    });

    it('should evaluate lt operator correctly', () => {
      const condition: TriggerCondition = {
        field: 'engagement',
        operator: 'lt',
        value: 30,
      };

      expect(evaluateCondition(condition, { engagement: 20 })).toBe(true);
      expect(evaluateCondition(condition, { engagement: 30 })).toBe(false);
      expect(evaluateCondition(condition, { engagement: 50 })).toBe(false);
    });

    it('should evaluate gte operator correctly', () => {
      const condition: TriggerCondition = {
        field: 'score',
        operator: 'gte',
        value: 80,
      };

      expect(evaluateCondition(condition, { score: 80 })).toBe(true);
      expect(evaluateCondition(condition, { score: 100 })).toBe(true);
      expect(evaluateCondition(condition, { score: 79 })).toBe(false);
    });

    it('should evaluate lte operator correctly', () => {
      const condition: TriggerCondition = {
        field: 'priority',
        operator: 'lte',
        value: 2,
      };

      expect(evaluateCondition(condition, { priority: 1 })).toBe(true);
      expect(evaluateCondition(condition, { priority: 2 })).toBe(true);
      expect(evaluateCondition(condition, { priority: 3 })).toBe(false);
    });

    it('should evaluate in operator correctly', () => {
      const condition: TriggerCondition = {
        field: 'status',
        operator: 'in',
        value: ['hot', 'warm', 'medium'],
      };

      expect(evaluateCondition(condition, { status: 'hot' })).toBe(true);
      expect(evaluateCondition(condition, { status: 'warm' })).toBe(true);
      expect(evaluateCondition(condition, { status: 'cold' })).toBe(false);
    });

    it('should evaluate not_in operator correctly', () => {
      const condition: TriggerCondition = {
        field: 'role',
        operator: 'not_in',
        value: ['admin', 'super_admin'],
      };

      expect(evaluateCondition(condition, { role: 'user' })).toBe(true);
      expect(evaluateCondition(condition, { role: 'admin' })).toBe(false);
    });

    it('should return false for undefined field values', () => {
      const condition: TriggerCondition = {
        field: 'missing',
        operator: 'equals',
        value: 'test',
      };

      expect(evaluateCondition(condition, {})).toBe(false);
    });

    it('should handle numeric string comparisons', () => {
      const condition: TriggerCondition = {
        field: 'count',
        operator: 'gt',
        value: 10,
      };

      expect(evaluateCondition(condition, { count: '15' })).toBe(true);
      expect(evaluateCondition(condition, { count: '5' })).toBe(false);
    });
  });

  describe('evaluateConditions', () => {
    it('should evaluate AND logic correctly', () => {
      const conditions: TriggerCondition[] = [
        { field: 'status', operator: 'equals', value: 'hot' },
        { field: 'score', operator: 'gt', value: 50 },
      ];

      expect(evaluateConditions(conditions, 'and', { status: 'hot', score: 75 })).toBe(true);
      expect(evaluateConditions(conditions, 'and', { status: 'hot', score: 25 })).toBe(false);
      expect(evaluateConditions(conditions, 'and', { status: 'cold', score: 75 })).toBe(false);
    });

    it('should evaluate OR logic correctly', () => {
      const conditions: TriggerCondition[] = [
        { field: 'status', operator: 'equals', value: 'hot' },
        { field: 'status', operator: 'equals', value: 'warm' },
      ];

      expect(evaluateConditions(conditions, 'or', { status: 'hot' })).toBe(true);
      expect(evaluateConditions(conditions, 'or', { status: 'warm' })).toBe(true);
      expect(evaluateConditions(conditions, 'or', { status: 'cold' })).toBe(false);
    });

    it('should return true for empty conditions', () => {
      expect(evaluateConditions([], 'and', {})).toBe(true);
      expect(evaluateConditions([], 'or', {})).toBe(true);
    });
  });

  describe('evaluateTrigger', () => {
    const baseTrigger: WorkflowTrigger = {
      id: 'trigger-1',
      name: 'Hot Lead Notification',
      enabled: true,
      conditions: [
        { field: 'status', operator: 'equals', value: 'hot' },
        { field: 'score', operator: 'gt', value: 70 },
      ],
      conditionLogic: 'and',
      actions: [{ type: 'send_email', config: { template: 'hot-lead' } }],
    };

    it('should trigger when all conditions are met', () => {
      const context = { status: 'hot', score: 85 };
      expect(evaluateTrigger(baseTrigger, context)).toBe(true);
    });

    it('should not trigger when conditions are not met', () => {
      const context = { status: 'hot', score: 50 };
      expect(evaluateTrigger(baseTrigger, context)).toBe(false);
    });

    it('should not trigger for disabled triggers', () => {
      const disabledTrigger = { ...baseTrigger, enabled: false };
      const context = { status: 'hot', score: 85 };
      expect(evaluateTrigger(disabledTrigger, context)).toBe(false);
    });

    it('should handle triggers with no conditions', () => {
      const noConditionTrigger = { ...baseTrigger, conditions: [] };
      expect(evaluateTrigger(noConditionTrigger, {})).toBe(true);
    });

    it('should update lastTriggered when triggered', () => {
      const trigger = { ...baseTrigger };
      const context = { status: 'hot', score: 85 };

      if (evaluateTrigger(trigger, context)) {
        trigger.lastTriggered = new Date();
        expect(trigger.lastTriggered).toBeDefined();
      }
    });
  });

  describe('matchConditions', () => {
    it('should report matched and unmet conditions for AND logic', () => {
      const conditions: TriggerCondition[] = [
        { field: 'status', operator: 'equals', value: 'hot' },
        { field: 'score', operator: 'gt', value: 50 },
        { field: 'company', operator: 'contains', value: 'Tech' },
      ];

      const context = { status: 'hot', score: 75, company: 'TechCorp' };
      const result = matchConditions(conditions, 'and', context);

      expect(result.matched).toBe(true);
      expect(result.matchedConditions.length).toBe(3);
      expect(result.unmetConditions.length).toBe(0);
    });

    it('should report partial matches for AND logic', () => {
      const conditions: TriggerCondition[] = [
        { field: 'status', operator: 'equals', value: 'hot' },
        { field: 'score', operator: 'gt', value: 50 },
      ];

      const context = { status: 'hot', score: 25 };
      const result = matchConditions(conditions, 'and', context);

      expect(result.matched).toBe(false);
      expect(result.matchedConditions.length).toBe(1);
      expect(result.unmetConditions.length).toBe(1);
    });

    it('should report matches for OR logic with partial matches', () => {
      const conditions: TriggerCondition[] = [
        { field: 'status', operator: 'equals', value: 'hot' },
        { field: 'status', operator: 'equals', value: 'warm' },
      ];

      const context = { status: 'hot' };
      const result = matchConditions(conditions, 'or', context);

      expect(result.matched).toBe(true);
      expect(result.matchedConditions.length).toBe(1);
      expect(result.unmetConditions.length).toBe(1);
    });

    it('should not match for OR logic with no matches', () => {
      const conditions: TriggerCondition[] = [
        { field: 'status', operator: 'equals', value: 'hot' },
        { field: 'status', operator: 'equals', value: 'warm' },
      ];

      const context = { status: 'cold' };
      const result = matchConditions(conditions, 'or', context);

      expect(result.matched).toBe(false);
      expect(result.matchedConditions.length).toBe(0);
      expect(result.unmetConditions.length).toBe(2);
    });
  });

  describe('Complex Workflow Scenarios', () => {
    it('should handle multi-stage lead scoring workflow', () => {
      const leadScoringTrigger: WorkflowTrigger = {
        id: 'lead-scoring',
        name: 'Lead Scoring Workflow',
        enabled: true,
        conditions: [
          { field: 'engagementScore', operator: 'gte', value: 80 },
          { field: 'companySize', operator: 'in', value: ['enterprise', 'mid-market'] },
        ],
        conditionLogic: 'and',
        actions: [
          { type: 'score_update', config: { field: 'leadScore', value: 100 } },
          { type: 'create_task', config: { type: 'follow_up', priority: 'high' } },
        ],
      };

      const highEngagementContext = {
        engagementScore: 90,
        companySize: 'enterprise',
      };

      expect(evaluateTrigger(leadScoringTrigger, highEngagementContext)).toBe(true);

      const lowEngagementContext = {
        engagementScore: 50,
        companySize: 'enterprise',
      };

      expect(evaluateTrigger(leadScoringTrigger, lowEngagementContext)).toBe(false);
    });

    it('should handle activity-based triggers', () => {
      const activityTrigger: WorkflowTrigger = {
        id: 'activity-trigger',
        name: 'Email Opened Notification',
        enabled: true,
        conditions: [
          { field: 'lastActivityType', operator: 'equals', value: 'email_opened' },
          { field: 'daysSinceContact', operator: 'lte', value: 3 },
        ],
        conditionLogic: 'and',
        actions: [{ type: 'webhook', config: { url: 'https://api.example.com/notify' } }],
      };

      const recentEmailOpen = {
        lastActivityType: 'email_opened',
        daysSinceContact: 1,
      };

      expect(evaluateTrigger(activityTrigger, recentEmailOpen)).toBe(true);

      const oldEmailOpen = {
        lastActivityType: 'email_opened',
        daysSinceContact: 10,
      };

      expect(evaluateTrigger(activityTrigger, oldEmailOpen)).toBe(false);
    });

    it('should handle tag-based segmentation', () => {
      const tagTrigger: WorkflowTrigger = {
        id: 'tag-trigger',
        name: 'VIP Tag Workflow',
        enabled: true,
        conditions: [
          { field: 'tags', operator: 'in', value: ['vip', 'enterprise', 'decision-maker'] },
        ],
        conditionLogic: 'or',
        actions: [{ type: 'update_field', config: { field: 'priority', value: 'high' } }],
      };

      expect(evaluateTrigger(tagTrigger, { tags: 'vip' })).toBe(true);
      expect(evaluateTrigger(tagTrigger, { tags: 'enterprise' })).toBe(true);
      expect(evaluateTrigger(tagTrigger, { tags: 'prospect' })).toBe(false);
    });

    it('should handle time-based triggers', () => {
      const timeTrigger: WorkflowTrigger = {
        id: 'time-trigger',
        name: 'Re-engagement Workflow',
        enabled: true,
        conditions: [
          { field: 'daysSinceContact', operator: 'gt', value: 30 },
          { field: 'engagementScore', operator: 'gte', value: 40 },
          { field: 'status', operator: 'not_equals', value: 'churned' },
        ],
        conditionLogic: 'and',
        actions: [{ type: 'create_task', config: { type: 're-engagement', priority: 'medium' } }],
      };

      const staleHighEngagement = {
        daysSinceContact: 45,
        engagementScore: 60,
        status: 'active',
      };

      expect(evaluateTrigger(timeTrigger, staleHighEngagement)).toBe(true);
    });
  });
});
