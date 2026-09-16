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

export const contactCreatedTrigger: TriggerDetector = async (context) => {
  if (!context.triggerType || context.triggerType !== 'CONTACT_CREATED') {
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

export const dealStageChangedTrigger: TriggerDetector = async (context) => {
  if (!context.triggerType || context.triggerType !== 'DEAL_STAGE_CHANGED') {
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

export const emailSentTrigger: TriggerDetector = async (context) => {
  if (!context.triggerType || context.triggerType !== 'EMAIL_SENT') {
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

export const formSubmittedTrigger: TriggerDetector = async (context) => {
  if (!context.triggerType || context.triggerType !== 'FORM_SUBMITTED') {
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
  engine.registerTrigger('CONTACT_CREATED', contactCreatedTrigger);
  engine.registerTrigger('DEAL_STAGE_CHANGED', dealStageChangedTrigger);
  engine.registerTrigger('EMAIL_SENT', emailSentTrigger);
  engine.registerTrigger('FORM_SUBMITTED', formSubmittedTrigger);
};
