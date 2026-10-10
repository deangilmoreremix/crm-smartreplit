import { TriggerDetector, WorkflowContext } from '../engine/WorkflowEngine';

/**
 * Trigger type comparison used by every detector below.
 *
 * The public `WorkflowTrigger` enum (packages/workflows/src/types.ts) exposes
 * lowercase values such as 'contact_created', while the engine registry and
 * persisted workflows may store uppercase values such as 'CONTACT_CREATED'.
 * Comparing case-insensitively keeps both spellings working so a workflow
 * built from the public enum is never silently left untriggered.
 */
function triggerMatches(triggerType: string | undefined, expected: string): boolean {
  return !!triggerType && triggerType.toUpperCase() === expected.toUpperCase();
}

export const recordCreatedTrigger: TriggerDetector = async (context) => {
  if (!triggerMatches(context.triggerType, 'RECORD_CREATED')) {
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
  if (!triggerMatches(context.triggerType, 'RECORD_UPDATED')) {
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
  if (!triggerMatches(context.triggerType, 'RECORD_DELETED')) {
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
  if (!triggerMatches(context.triggerType, 'MANUAL')) {
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
  if (!triggerMatches(context.triggerType, 'SCHEDULED')) {
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
  if (!triggerMatches(context.triggerType, 'WEBHOOK')) {
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
  if (!triggerMatches(context.triggerType, 'AI_COMPLETED')) {
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
  if (!triggerMatches(context.triggerType, 'CONTACT_CREATED')) {
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
  if (!triggerMatches(context.triggerType, 'DEAL_STAGE_CHANGED')) {
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
  if (!triggerMatches(context.triggerType, 'EMAIL_SENT')) {
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
  if (!triggerMatches(context.triggerType, 'FORM_SUBMITTED')) {
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
  const register = (type: string, detector: TriggerDetector) => {
    engine.registerTrigger(type, detector);
    engine.registerTrigger(type.toLowerCase(), detector);
  };

  register('RECORD_CREATED', recordCreatedTrigger);
  register('RECORD_UPDATED', recordUpdatedTrigger);
  register('RECORD_DELETED', recordDeletedTrigger);
  register('MANUAL', manualTrigger);
  register('SCHEDULED', scheduledTrigger);
  register('WEBHOOK', webhookTrigger);
  register('AI_COMPLETED', aiCompletedTrigger);
  register('CONTACT_CREATED', contactCreatedTrigger);
  register('DEAL_STAGE_CHANGED', dealStageChangedTrigger);
  register('EMAIL_SENT', emailSentTrigger);
  register('FORM_SUBMITTED', formSubmittedTrigger);
};
