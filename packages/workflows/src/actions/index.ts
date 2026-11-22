import { ActionExecutor, ActionResult, WorkflowContext } from '../engine/WorkflowEngine';

// These actions validate their input but do not perform the operation yet. They used to log and
// report success, which made a workflow look like it had sent an email or created a record when
// nothing happened. They now fail with an explicit message until a real backend is connected.
const notImplemented = (action: string): ActionResult => ({
  success: false,
  error: `${action} is not implemented: the workflow engine has no backend for it yet, so nothing was done`,
});

export const sendEmailAction: ActionExecutor = async (context, config) => {
  const { to, subject, body, from } = config as {
    to: string;
    subject: string;
    body: string;
    from?: string;
  };

  if (!to || !subject || !body) {
    return { success: false, error: 'Missing required email fields: to, subject, body' };
  }

  return notImplemented('SEND_EMAIL');
};

export const updateFieldAction: ActionExecutor = async (context, config) => {
  const { objectType, recordId, field, value } = config as {
    objectType: string;
    recordId: string;
    field: string;
    value: unknown;
  };

  if (!objectType || !recordId || !field) {
    return { success: false, error: 'Missing required fields: objectType, recordId, field' };
  }

  return notImplemented('UPDATE_FIELD');
};

export const createRecordAction: ActionExecutor = async (context, config) => {
  const { objectType, data } = config as { objectType: string; data: Record<string, unknown> };

  if (!objectType || !data) {
    return { success: false, error: 'Missing required fields: objectType, data' };
  }

  return notImplemented('CREATE_RECORD');
};

export const createTaskAction: ActionExecutor = async (context, config) => {
  const { title, description, assigneeId, dueDate } = config as {
    title: string;
    description?: string;
    assigneeId?: string;
    dueDate?: string;
  };

  if (!title) {
    return { success: false, error: 'Missing required field: title' };
  }

  return notImplemented('CREATE_TASK');
};

export const createNoteAction: ActionExecutor = async (context, config) => {
  const { content, recordId, recordType } = config as {
    content: string;
    recordId: string;
    recordType?: string;
  };

  if (!content || !recordId) {
    return { success: false, error: 'Missing required fields: content, recordId' };
  }

  return notImplemented('CREATE_NOTE');
};

export const webhookAction: ActionExecutor = async (context, config) => {
  const { url, method, headers, body } = config as {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  };

  if (!url) {
    return { success: false, error: 'Missing required field: url' };
  }

  return notImplemented('WEBHOOK');
};

export const codeAction: ActionExecutor = async (context, config) => {
  const { code, language } = config as { code: string; language?: string };

  if (!code) {
    return { success: false, error: 'Missing required field: code' };
  }

  return notImplemented('CODE');
};

export const waitAction: ActionExecutor = async (context, config) => {
  const { duration, unit } = config as { duration: number; unit?: string };

  if (!duration) {
    return { success: false, error: 'Missing required field: duration' };
  }

  const ms =
    unit === 'minutes'
      ? duration * 60 * 1000
      : unit === 'hours'
        ? duration * 60 * 60 * 1000
        : duration;
  // A run cannot be paused for longer than this; reporting a longer wait as done would be false.
  if (ms > 1000) return notImplemented('WAIT longer than 1 second');
  await new Promise((resolve) => setTimeout(resolve, ms));

  return {
    success: true,
    output: { waited: duration, unit: unit || 'ms' },
  };
};

export const branchAction: ActionExecutor = async (context, config) => {
  const { condition, trueBranch, falseBranch } = config as {
    condition: Record<string, unknown>;
    trueBranch?: string[];
    falseBranch?: string[];
  };

  if (!condition) {
    return { success: false, error: 'Missing required field: condition' };
  }

  const { field, operator, value } = condition;
  const fieldValue = field.startsWith('context.')
    ? (context as unknown as Record<string, unknown>)[field.replace('context.', '')]
    : field;
  let result = false;

  switch (operator) {
    case 'equals':
      result = fieldValue === value;
      break;
    case 'not_equals':
      result = fieldValue !== value;
      break;
    case 'contains':
      result = String(fieldValue).includes(String(value));
      break;
    case 'greater_than':
      result = Number(fieldValue) > Number(value);
      break;
    case 'less_than':
      result = Number(fieldValue) < Number(value);
      break;
    default:
      result = false;
  }

  console.log(`[Workflow ${context.workflowId}] Branch evaluation: ${result ? 'TRUE' : 'FALSE'}`);
  return {
    success: true,
    output: { branchTaken: result ? 'true' : 'false', condition },
  };
};

export const sendSmsAction: ActionExecutor = async (context, config) => {
  const { to, message } = config as { to: string; message: string };

  if (!to || !message) {
    return { success: false, error: 'Missing required fields: to, message' };
  }

  return notImplemented('SEND_SMS');
};

export const createDealAction: ActionExecutor = async (context, config) => {
  const { title, amount, stage, contactId } = config as {
    title: string;
    amount?: number;
    stage?: string;
    contactId?: string;
  };

  if (!title) {
    return { success: false, error: 'Missing required field: title' };
  }

  return notImplemented('CREATE_DEAL');
};

export const createContactAction: ActionExecutor = async (context, config) => {
  const { email, firstName, lastName, company } = config as {
    email: string;
    firstName?: string;
    lastName?: string;
    company?: string;
  };

  if (!email) {
    return { success: false, error: 'Missing required field: email' };
  }

  return notImplemented('CREATE_CONTACT');
};

export const registerAllActions = (engine: {
  registerAction: (type: string, executor: ActionExecutor) => void;
}) => {
  engine.registerAction('SEND_EMAIL', sendEmailAction);
  engine.registerAction('UPDATE_FIELD', updateFieldAction);
  engine.registerAction('CREATE_RECORD', createRecordAction);
  engine.registerAction('CREATE_TASK', createTaskAction);
  engine.registerAction('CREATE_NOTE', createNoteAction);
  engine.registerAction('WEBHOOK', webhookAction);
  engine.registerAction('CODE', codeAction);
  engine.registerAction('WAIT', waitAction);
  engine.registerAction('BRANCH', branchAction);
  engine.registerAction('SEND_SMS', sendSmsAction);
  engine.registerAction('CREATE_DEAL', createDealAction);
  engine.registerAction('CREATE_CONTACT', createContactAction);
};
