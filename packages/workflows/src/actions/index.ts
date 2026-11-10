import { ActionExecutor, WorkflowContext } from '../engine/WorkflowEngine';
import { supabase } from '../supabase';
import { assertPublicHttps } from '../security/ssrf';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Tables workflows may write to, the owner column, and the columns they may set. */
const WRITABLE: Record<string, { table: string; owner: string; columns: string[] }> = {
  contact: {
    table: 'contacts',
    owner: 'profile_id',
    columns: [
      'first_name', 'last_name', 'email', 'phone', 'company', 'status', 'source', 'notes',
      'industry', 'address', 'city', 'state', 'zip_code', 'country',
    ],
  },
  deal: {
    table: 'deals',
    owner: 'profile_id',
    columns: [
      'title', 'value', 'stage', 'probability', 'description', 'status', 'contact_id',
      'expected_close_date',
    ],
  },
  task: {
    table: 'tasks',
    owner: 'profile_id',
    columns: [
      'title', 'description', 'status', 'priority', 'due_date', 'contact_id', 'deal_id',
      'assigned_to',
    ],
  },
  note: {
    table: 'notes',
    owner: 'profile_id',
    columns: ['title', 'content', 'type', 'contact_id'],
  },
};

const snake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

function resolveTarget(objectType: string) {
  const key = String(objectType).toLowerCase().replace(/s$/, '');
  const target = WRITABLE[key];
  if (!target) {
    throw new Error(
      `Unsupported objectType "${objectType}". Allowed: ${Object.keys(WRITABLE).join(', ')}`
    );
  }
  return target;
}

function requireUser(context: WorkflowContext): string {
  if (!context.userId) throw new Error('Workflow run has no user; cannot write records');
  return context.userId;
}

/** Keep only whitelisted columns (accepts camelCase or snake_case keys); rejects unknown ones. */
function pickColumns(target: { columns: string[] }, data: Record<string, unknown>) {
  const row: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    const col = snake(k);
    if (!target.columns.includes(col)) throw new Error(`Field "${k}" is not allowed`);
    row[col] = v;
  }
  return row;
}

async function insertRecord(
  context: WorkflowContext,
  objectType: string,
  data: Record<string, unknown>
) {
  const userId = requireUser(context);
  const target = resolveTarget(objectType);
  const row = { ...pickColumns(target, data), [target.owner]: userId };
  const { data: created, error } = await supabase
    .from(target.table)
    .insert(row)
    .select()
    .single();
  if (error) throw new Error(`Failed to create ${objectType}: ${error.message}`);
  return { recordId: created?.id, objectType, record: created };
}

// ---------------------------------------------------------------------------
// Email (SendGrid, same env contract as server/email-routing.ts)
// ---------------------------------------------------------------------------

export const sendEmailAction: ActionExecutor = async (_context, config) => {
  const { to, subject, body, from } = config as {
    to: string;
    subject: string;
    body: string;
    from?: string;
  };

  if (!to || !subject || !body) {
    return { success: false, error: 'Missing required email fields: to, subject, body' };
  }
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error('Email not configured: SENDGRID_API_KEY is not set');
  }

  const sgMail = (await import('@sendgrid/mail')).default;
  sgMail.setApiKey(apiKey);
  const [response] = await sgMail.send({
    to,
    from: from || process.env.FROM_EMAIL || 'noreply@smartcrm.vip',
    subject,
    text: body,
  });
  return {
    success: true,
    output: { messageId: response?.headers?.['x-message-id'], to, subject },
  };
};

// ---------------------------------------------------------------------------
// Record actions
// ---------------------------------------------------------------------------

export const updateFieldAction: ActionExecutor = async (context, config) => {
  const { objectType, recordId, field, value } = config as {
    objectType: string;
    recordId: string | number;
    field: string;
    value: unknown;
  };

  if (!objectType || !recordId || !field) {
    return { success: false, error: 'Missing required fields: objectType, recordId, field' };
  }
  const userId = requireUser(context);
  const target = resolveTarget(objectType);
  const patch = pickColumns(target, { [field]: value });

  const { data, error } = await supabase
    .from(target.table)
    .update(patch)
    .eq('id', recordId)
    .eq(target.owner, userId)
    .select('id');
  if (error) throw new Error(`Failed to update ${objectType}: ${error.message}`);
  if (!data || data.length === 0) throw new Error(`${objectType} ${recordId} not found`);

  return { success: true, output: { objectType, recordId, field, newValue: value } };
};

export const createRecordAction: ActionExecutor = async (context, config) => {
  const { objectType, data } = config as { objectType: string; data: Record<string, unknown> };
  if (!objectType || !data) {
    return { success: false, error: 'Missing required fields: objectType, data' };
  }
  const { recordId, record } = await insertRecord(context, objectType, data);
  return { success: true, output: { recordId, objectType, data: record } };
};

export const createTaskAction: ActionExecutor = async (context, config) => {
  const { title, description, assigneeId, dueDate } = config as {
    title: string;
    description?: string;
    assigneeId?: string;
    dueDate?: string;
  };
  if (!title) return { success: false, error: 'Missing required field: title' };

  const data: Record<string, unknown> = { title };
  if (description) data.description = description;
  if (assigneeId) data.assigned_to = assigneeId;
  if (dueDate) data.due_date = dueDate;
  if (context.recordId && context.variables.objectType === 'contacts') {
    data.contact_id = Number(context.recordId);
  }
  const { recordId } = await insertRecord(context, 'task', data);
  return { success: true, output: { taskId: recordId, title, assigneeId, dueDate } };
};

export const createNoteAction: ActionExecutor = async (context, config) => {
  const { content, recordId, recordType } = config as {
    content: string;
    recordId: string | number;
    recordType?: string;
  };
  if (!content || !recordId) {
    return { success: false, error: 'Missing required fields: content, recordId' };
  }
  if (recordType && recordType.toLowerCase().replace(/s$/, '') !== 'contact') {
    throw new Error('Notes can only be attached to contacts');
  }
  const { recordId: noteId } = await insertRecord(context, 'note', {
    content,
    contact_id: Number(recordId),
  });
  return { success: true, output: { noteId, recordId, recordType: recordType || 'contact' } };
};

export const createDealAction: ActionExecutor = async (context, config) => {
  const { title, amount, stage, contactId } = config as {
    title: string;
    amount?: number;
    stage?: string;
    contactId?: number;
  };
  if (!title) return { success: false, error: 'Missing required field: title' };

  const data: Record<string, unknown> = { title, stage: stage || 'lead' };
  if (amount !== undefined) data.value = amount;
  if (contactId !== undefined) data.contact_id = contactId;
  const { recordId } = await insertRecord(context, 'deal', data);
  return { success: true, output: { dealId: recordId, title, amount, stage: data.stage } };
};

export const createContactAction: ActionExecutor = async (context, config) => {
  const { email, firstName, lastName, company } = config as {
    email: string;
    firstName?: string;
    lastName?: string;
    company?: string;
  };
  if (!email) return { success: false, error: 'Missing required field: email' };

  const { recordId } = await insertRecord(context, 'contact', {
    email,
    first_name: firstName || '',
    last_name: lastName || '',
    ...(company ? { company } : {}),
  });
  return { success: true, output: { contactId: recordId, email, firstName, lastName } };
};

// ---------------------------------------------------------------------------
// Webhook
// ---------------------------------------------------------------------------

const WEBHOOK_TIMEOUT_MS = 10_000;

const FORBIDDEN_HEADERS = new Set(['host', 'content-length', 'connection', 'transfer-encoding']);

function safeHeaders(headers: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!headers || typeof headers !== 'object') return out;
  for (const [k, v] of Object.entries(headers as Record<string, unknown>)) {
    if (FORBIDDEN_HEADERS.has(k.toLowerCase())) continue;
    if (typeof v !== 'string' && typeof v !== 'number') continue;
    const val = String(v);
    if (/[\r\n]/.test(k) || /[\r\n]/.test(val)) throw new Error(`Invalid header "${k}"`);
    out[k] = val;
  }
  return out;
}

const httpRequest: ActionExecutor = async (_context, config) => {
  const { url, method, headers, body } = config as {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  };
  if (!url) return { success: false, error: 'Missing required field: url' };

  const target = assertPublicHttps(url);
  const verb = (method || 'POST').toUpperCase();
  const hasBody = body !== undefined && verb !== 'GET' && verb !== 'HEAD';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);
  try {
    const res = await fetch(target.toString(), {
      method: verb,
      headers: {
        ...(hasBody && typeof body !== 'string' ? { 'Content-Type': 'application/json' } : {}),
        ...safeHeaders(headers),
      },
      body: hasBody ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
      redirect: 'error',
    });
    const text = (await res.text()).slice(0, 2000);
    if (!res.ok) throw new Error(`Webhook responded ${res.status}: ${text.slice(0, 200)}`);
    return { success: true, output: { url, statusCode: res.status, body: text } };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Webhook timed out after ${WEBHOOK_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

export const webhookAction: ActionExecutor = httpRequest;
export const httpRequestAction: ActionExecutor = httpRequest;

// ---------------------------------------------------------------------------
// Wait (bounded: runs happen inside a request/function, so long delays are rejected)
// ---------------------------------------------------------------------------

export const MAX_WAIT_MS = 20_000;

export const waitAction: ActionExecutor = async (_context, config) => {
  const { duration, unit } = config as { duration: number; unit?: string };
  if (!duration) return { success: false, error: 'Missing required field: duration' };

  const factor =
    unit === 'hours' ? 3_600_000 : unit === 'minutes' ? 60_000 : unit === 'seconds' ? 1000 : 1;
  const ms = Number(duration) * factor;
  if (!Number.isFinite(ms) || ms < 0) throw new Error('Invalid wait duration');
  if (ms > MAX_WAIT_MS) {
    throw new Error(`Wait of ${ms}ms exceeds the ${MAX_WAIT_MS}ms in-process limit`);
  }
  await new Promise((resolve) => setTimeout(resolve, ms));
  return { success: true, output: { waited: duration, unit: unit || 'ms' } };
};

// ---------------------------------------------------------------------------
// Branch (evaluates a condition against run variables)
// ---------------------------------------------------------------------------

function getPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

export const branchAction: ActionExecutor = async (context, config) => {
  const { condition } = config as { condition: Record<string, unknown> };
  if (!condition) return { success: false, error: 'Missing required field: condition' };

  const { field, operator, value } = condition as { field: string; operator: string; value: unknown };
  const fieldValue = getPath(context.variables, String(field));
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
  return { success: true, output: { branchTaken: result ? 'true' : 'false', condition } };
};

// ---------------------------------------------------------------------------
// AI (OpenAI Responses API; mirrors the minimal request shape of server/services/openaiClient.ts)
// ---------------------------------------------------------------------------

export const aiAction: ActionExecutor = async (_context, config) => {
  const { prompt, input, instructions, maxOutputTokens, model } = config as {
    prompt?: string;
    input?: string;
    instructions?: string;
    maxOutputTokens?: number;
    model?: string;
  };
  const text = prompt || input;
  if (!text) return { success: false, error: 'Missing required field: prompt' };

  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_FALLBACK;
  if (!apiKey) throw new Error('OpenAI not configured: OPENAI_API_KEY is not set');

  const body: Record<string, unknown> = {
    model: model || process.env.OPENAI_MODEL_FAST || 'gpt-6-luna',
    input: text,
    max_output_tokens: Math.max(16, Math.min(Number(maxOutputTokens) || 500, 4000)),
    store: false,
  };
  if (instructions) body.instructions = instructions;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`OpenAI request failed (${res.status}): ${json?.error?.message || 'unknown error'}`);
    }
    const output: string =
      json.output_text ??
      (json.output || [])
        .flatMap((o: any) => o?.content || [])
        .map((c: any) => c?.text || '')
        .join('');
    return { success: true, output: { text: output, responseId: json.id, model: json.model } };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('OpenAI request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};


// ---------------------------------------------------------------------------
// Delay / wait_for_event / form: pausing actions (the runner persists workflow_run_waits)
// ---------------------------------------------------------------------------

const MAX_DELAY_MS = 30 * 24 * 3600 * 1000;
const unitMs = (unit?: string) =>
  unit === 'days' ? 86_400_000 : unit === 'hours' ? 3_600_000 : unit === 'minutes' ? 60_000 : unit === 'seconds' ? 1000 : 1;

/** <= 20s sleeps inline; longer delays pause the run and the scheduler resumes it. */
export const delayAction: ActionExecutor = async (_context, config) => {
  const { duration, unit } = config as { duration: number; unit?: string };
  if (duration === undefined || duration === null) {
    return { success: false, error: 'Missing required field: duration' };
  }
  const ms = Number(duration) * unitMs(unit);
  if (!Number.isFinite(ms) || ms < 0) throw new Error('Invalid delay duration');
  if (ms > MAX_DELAY_MS) throw new Error('Delay exceeds the 30 day maximum');
  if (ms <= MAX_WAIT_MS) {
    await new Promise((resolve) => setTimeout(resolve, ms));
    return { success: true, output: { delayedMs: ms, paused: false } };
  }
  return {
    success: true,
    output: { delayedMs: ms, paused: true },
    wait: { kind: 'delay', resumeAt: new Date(Date.now() + ms).toISOString() },
  };
};

/** config: { event: 'RECORD_CREATED'|..., objectType?: 'contacts', name?: 'custom event', match?: {field: value}, timeoutMinutes? } */
export const waitForEventAction: ActionExecutor = async (_context, config) => {
  const { event, objectType, name, match, timeoutMinutes } = config as {
    event?: string;
    objectType?: string;
    name?: string;
    match?: Record<string, unknown>;
    timeoutMinutes?: number;
  };
  let eventKey: string;
  if (name) eventKey = `custom:${String(name)}`;
  else if (event) eventKey = `${String(event).toUpperCase()}:${objectType ? String(objectType) : '*'}`;
  else return { success: false, error: 'Missing required field: event (or name)' };

  const timeout = Number(timeoutMinutes);
  const resumeAt =
    Number.isFinite(timeout) && timeout > 0
      ? new Date(Date.now() + Math.min(timeout * 60_000, MAX_DELAY_MS)).toISOString()
      : undefined;
  return {
    success: true,
    output: { waitingFor: eventKey },
    wait: { kind: 'event', eventKey, match: match && typeof match === 'object' ? match : undefined, resumeAt },
  };
};

/** config: { title?, fields: [{name,label?,type?,required?}] } - run pauses until POST /api/workflows/runs/:id/resume */
export const formAction: ActionExecutor = async (_context, config) => {
  const { title, fields } = config as { title?: string; fields?: unknown };
  if (!Array.isArray(fields) || fields.length === 0 || fields.length > 50) {
    return { success: false, error: 'form requires 1-50 fields' };
  }
  const clean = fields.map((f: any) => {
    if (!f || typeof f.name !== 'string' || !/^[A-Za-z_][\w]{0,63}$/.test(f.name)) {
      throw new Error('Every form field needs a simple name');
    }
    return { name: f.name, label: f.label ? String(f.label) : undefined, type: f.type ? String(f.type) : 'text', required: !!f.required };
  });
  return { success: true, output: { awaitingForm: true }, wait: { kind: 'form', form: { title, fields: clean } } };
};

/** Validates submitted form values against the declared fields (used by the resume route). */
export function validateFormSubmission(
  form: { fields: Array<{ name: string; required?: boolean; type?: string }> },
  data: unknown
): { ok: true; values: Record<string, unknown> } | { ok: false; error: string } {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, error: 'data must be an object' };
  const input = data as Record<string, unknown>;
  const values: Record<string, unknown> = {};
  for (const f of form.fields) {
    const v = input[f.name];
    if (f.required && (v === undefined || v === null || v === '')) return { ok: false, error: `Field "${f.name}" is required` };
    if (v === undefined) continue;
    if (typeof v === 'object' && v !== null) return { ok: false, error: `Field "${f.name}" must be a scalar` };
    if (typeof v === 'string' && v.length > 10_000) return { ok: false, error: `Field "${f.name}" is too long` };
    values[f.name] = v;
  }
  return { ok: true, values };
}

/** AI agent (no tools): single OpenAI Responses call; optional JSON parsing of the reply. */
export const aiAgentAction: ActionExecutor = async (context, config) => {
  const { tools, jsonOutput, ...rest } = config as Record<string, unknown> & { tools?: unknown; jsonOutput?: boolean };
  if (tools !== undefined && tools !== null && tools !== 'none' && !(Array.isArray(tools) && tools.length === 0)) {
    throw new Error('AI_AGENT tools are not supported yet (use tools: "none")');
  }
  const result = await aiAction(context, rest);
  if (!result.success || !jsonOutput) return result;
  const text = String((result.output as any)?.text ?? '');
  try {
    return { ...result, output: { ...(result.output as object), json: JSON.parse(text) } };
  } catch {
    throw new Error('AI_AGENT reply was not valid JSON');
  }
};

// ---------------------------------------------------------------------------
// Unsupported (no provider in the stack / unsafe) - fail loudly rather than fake success
// ---------------------------------------------------------------------------

export const sendSmsAction: ActionExecutor = async (_context, config) => {
  const { to, message } = config as { to: string; message: string };
  if (!to || !message) return { success: false, error: 'Missing required fields: to, message' };
  throw new Error('SMS not configured: no SMS provider is available');
};

export const codeAction: ActionExecutor = async (_context, config) => {
  const { code } = config as { code: string };
  if (!code) return { success: false, error: 'Missing required field: code' };
  throw new Error('CODE action is not supported: arbitrary code execution is disabled');
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
  engine.registerAction('AI', aiAction);
  engine.registerAction('HTTP_REQUEST', httpRequestAction);
  engine.registerAction('DELAY', delayAction);
  engine.registerAction('WAIT_FOR_EVENT', waitForEventAction);
  engine.registerAction('FORM', formAction);
  engine.registerAction('AI_AGENT', aiAgentAction);
};
