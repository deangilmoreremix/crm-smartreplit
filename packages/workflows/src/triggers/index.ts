import { TriggerDetector, WorkflowContext } from '../engine/WorkflowEngine';

export const recordCreatedTrigger: TriggerDetector = async (context) => {
  if (!context.triggerType || context.triggerType !== 'RECORD_CREATED') {
    return { triggered: false };
  }
  return {
    triggered: true,
    context: {
      ...context,
      timestamp: context.timestamp || new Date(),
    },
  };
};

export const recordUpdatedTrigger: TriggerDetector = async (context) => {
  if (!context.triggerType || context.triggerType !== 'RECORD_UPDATED') {
    return { triggered: false };
  }
  return {
    triggered: true,
    context: {
      ...context,
      timestamp: context.timestamp || new Date(),
    },
  };
};

export const recordDeletedTrigger: TriggerDetector = async (context) => {
  if (!context.triggerType || context.triggerType !== 'RECORD_DELETED') {
    return { triggered: false };
  }
  return {
    triggered: true,
    context: {
      ...context,
      timestamp: context.timestamp || new Date(),
    },
  };
};

export const manualTrigger: TriggerDetector = async (context) => {
  if (!context.triggerType || context.triggerType !== 'MANUAL') {
    return { triggered: false };
  }
  return {
    triggered: true,
    context: {
      ...context,
      timestamp: context.timestamp || new Date(),
    },
  };
};

export const scheduledTrigger: TriggerDetector = async (context) => {
  if (!context.triggerType || context.triggerType !== 'SCHEDULED') {
    return { triggered: false };
  }
  return {
    triggered: true,
    context: {
      ...context,
      timestamp: context.timestamp || new Date(),
    },
  };
};

export const webhookTrigger: TriggerDetector = async (context) => {
  if (!context.triggerType || context.triggerType !== 'WEBHOOK') {
    return { triggered: false };
  }
  return {
    triggered: true,
    context: {
      ...context,
      timestamp: context.timestamp || new Date(),
    },
  };
};

export const aiCompletedTrigger: TriggerDetector = async (context) => {
  if (!context.triggerType || context.triggerType !== 'AI_COMPLETED') {
    return { triggered: false };
  }
  return {
    triggered: true,
    context: {
      ...context,
      timestamp: context.timestamp || new Date(),
    },
  };
};

export const registerAllTriggers = (engine: {
  registerTrigger: (type: string, detector: TriggerDetector) => void;
}) => {
  engine.registerTrigger('RECORD_CREATED', recordCreatedTrigger);
  engine.registerTrigger('RECORD_UPDATED', recordUpdatedTrigger);
  engine.registerTrigger('RECORD_DELETED', recordDeletedTrigger);
  engine.registerTrigger('MANUAL', manualTrigger);
  engine.registerTrigger('SCHEDULED', scheduledTrigger);
  engine.registerTrigger('WEBHOOK', webhookTrigger);
  engine.registerTrigger('AI_COMPLETED', aiCompletedTrigger);
};
