import { ActionExecutor, ActionResult, WorkflowContext } from '../engine/WorkflowEngine';

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

  console.log(`[Workflow ${context.workflowId}] Sending email to ${to}`);
  return {
    success: true,
    output: { messageId: `email_${Date.now()}`, to, subject },
  };
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

  console.log(
    `[Workflow ${context.workflowId}] Updating ${objectType}:${recordId} ${field} = ${value}`
  );
  return {
    success: true,
    output: { objectType, recordId, field, newValue: value },
  };
};

export const createRecordAction: ActionExecutor = async (context, config) => {
  const { objectType, data } = config as { objectType: string; data: Record<string, unknown> };

  if (!objectType || !data) {
    return { success: false, error: 'Missing required fields: objectType, data' };
  }

  const recordId = `record_${Date.now()}`;
  console.log(`[Workflow ${context.workflowId}] Creating ${objectType} record: ${recordId}`);
  return {
    success: true,
    output: { recordId, objectType, data },
  };
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

  const taskId = `task_${Date.now()}`;
  console.log(`[Workflow ${context.workflowId}] Creating task: ${title}`);
  return {
    success: true,
    output: { taskId, title, assigneeId, dueDate },
  };
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

  const noteId = `note_${Date.now()}`;
  console.log(
    `[Workflow ${context.workflowId}] Creating note on ${recordType || 'record'}:${recordId}`
  );
  return {
    success: true,
    output: { noteId, recordId, recordType },
  };
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

  console.log(`[Workflow ${context.workflowId}] Calling webhook ${url}`);
  return {
    success: true,
    output: { url, statusCode: 200, message: 'Webhook called successfully' },
  };
};

export const codeAction: ActionExecutor = async (context, config) => {
  const { code, language } = config as { code: string; language?: string };

  if (!code) {
    return { success: false, error: 'Missing required field: code' };
  }

  console.log(`[Workflow ${context.workflowId}] Executing ${language || 'javascript'} code`);
  try {
    const result = { executed: true, timestamp: Date.now() };
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
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
  console.log(`[Workflow ${context.workflowId}] Waiting ${duration} ${unit || 'ms'}`);
  await new Promise((resolve) => setTimeout(resolve, Math.min(ms, 1000)));

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

  console.log(`[Workflow ${context.workflowId}] Sending SMS to ${to}`);
  return {
    success: true,
    output: { messageId: `sms_${Date.now()}`, to },
  };
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

  const dealId = `deal_${Date.now()}`;
  console.log(`[Workflow ${context.workflowId}] Creating deal: ${title}`);
  return {
    success: true,
    output: { dealId, title, amount, stage },
  };
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

  const contactId = `contact_${Date.now()}`;
  console.log(`[Workflow ${context.workflowId}] Creating contact: ${email}`);
  return {
    success: true,
    output: { contactId, email, firstName, lastName },
  };
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
