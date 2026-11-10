var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// packages/workflows/src/supabase.ts
var supabase_exports = {};
__export(supabase_exports, {
  supabase: () => supabase
});
import { createClient } from "@supabase/supabase-js";
var url, key, supabase;
var init_supabase = __esm({
  "packages/workflows/src/supabase.ts"() {
    "use strict";
    url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "http://localhost:54321";
    key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "missing-key";
    supabase = createClient(url, key);
  }
});

// packages/workflows/src/engine/interpolate.ts
function getPath(obj, path) {
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter((p) => p !== "");
  let cur = obj;
  for (const part of parts) {
    if (BLOCKED.has(part)) return void 0;
    if (cur === null || cur === void 0 || typeof cur !== "object") return void 0;
    if (!Object.prototype.hasOwnProperty.call(cur, part)) return void 0;
    cur = cur[part];
  }
  return cur;
}
function stringify(v, opts) {
  if (v === void 0 || v === null) return "";
  const s = typeof v === "string" ? v : typeof v === "object" ? JSON.stringify(v) : String(v);
  return opts.escapeJson ? jsonEscape(s) : s;
}
function interpolateString(template, scope, opts = {}) {
  const whole = template.match(/^\s*\{\{\s*([^{}]*?)\s*\}\}\s*$/);
  if (whole && EXPR.test(whole[1]) && !opts.escapeJson) {
    return getPath(scope, whole[1]);
  }
  return template.replace(TOKEN, (match, esc, expr) => {
    if (esc) return match.slice(1);
    if (!EXPR.test(expr)) return match;
    return stringify(getPath(scope, expr), opts);
  });
}
function interpolate(value, scope, opts = {}, depth = 0) {
  if (depth > MAX_DEPTH) throw new Error("Template structure is too deeply nested");
  if (typeof value === "string") return interpolateString(value, scope, opts);
  if (Array.isArray(value)) return value.map((v) => interpolate(v, scope, opts, depth + 1));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (BLOCKED.has(k)) continue;
      out[k] = opts.skipKeys?.includes(k) ? v : interpolate(v, scope, opts, depth + 1);
    }
    return out;
  }
  return value;
}
var BLOCKED, EXPR, TOKEN, MAX_DEPTH, jsonEscape;
var init_interpolate = __esm({
  "packages/workflows/src/engine/interpolate.ts"() {
    "use strict";
    BLOCKED = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"]);
    EXPR = /^[A-Za-z_][\w-]*(?:\.[\w-]+|\[\d+\])*$/;
    TOKEN = /(\\)?\{\{\s*([^{}]*?)\s*\}\}/g;
    MAX_DEPTH = 20;
    jsonEscape = (s) => JSON.stringify(s).slice(1, -1);
  }
});

// packages/workflows/src/engine/WorkflowEngine.ts
function evaluateCondition(condition, scope, variables) {
  if (Array.isArray(condition.all)) {
    return condition.all.every((c) => evaluateCondition(c, scope, variables));
  }
  if (Array.isArray(condition.any)) {
    return condition.any.some((c) => evaluateCondition(c, scope, variables));
  }
  const { field, operator, value } = condition;
  const root = String(field ?? "").split(/[.[]/)[0];
  const fieldValue = Object.prototype.hasOwnProperty.call(scope, root) ? getPath(scope, String(field)) : getPath(variables, String(field));
  switch (operator) {
    case "equals":
      return fieldValue === value || fieldValue != null && value != null && String(fieldValue) === String(value);
    case "not_equals":
      return !(fieldValue === value || fieldValue != null && value != null && String(fieldValue) === String(value));
    case "contains":
      return Array.isArray(fieldValue) ? fieldValue.map(String).includes(String(value)) : String(fieldValue ?? "").includes(String(value));
    case "not_contains":
      return !String(fieldValue ?? "").includes(String(value));
    case "starts_with":
      return String(fieldValue ?? "").startsWith(String(value));
    case "ends_with":
      return String(fieldValue ?? "").endsWith(String(value));
    case "greater_than":
      return Number(fieldValue) > Number(value);
    case "less_than":
      return Number(fieldValue) < Number(value);
    case "gte":
      return Number(fieldValue) >= Number(value);
    case "lte":
      return Number(fieldValue) <= Number(value);
    case "in":
      return Array.isArray(value) && value.map(String).includes(String(fieldValue));
    case "exists":
      return fieldValue !== void 0 && fieldValue !== null;
    case "not_exists":
      return fieldValue === void 0 || fieldValue === null;
    case "is_empty":
      return fieldValue === void 0 || fieldValue === null || fieldValue === "" || Array.isArray(fieldValue) && fieldValue.length === 0;
    default:
      return true;
  }
}
var MAX_ITERATIONS, MAX_NESTING, MAX_STEP_EXECUTIONS, NESTED_KEYS, FLOW_ACTIONS, WorkflowEngine, workflowEngine;
var init_WorkflowEngine = __esm({
  "packages/workflows/src/engine/WorkflowEngine.ts"() {
    "use strict";
    init_interpolate();
    MAX_ITERATIONS = 100;
    MAX_NESTING = 3;
    MAX_STEP_EXECUTIONS = 500;
    NESTED_KEYS = ["steps", "then", "else"];
    FLOW_ACTIONS = /* @__PURE__ */ new Set(["IF_ELSE", "FILTER", "ITERATOR"]);
    WorkflowEngine = class {
      triggers = /* @__PURE__ */ new Map();
      actions = /* @__PURE__ */ new Map();
      registerTrigger(type, detector) {
        this.triggers.set(type, detector);
      }
      registerAction(type, executor) {
        this.actions.set(type, executor);
      }
      async evaluateTrigger(triggerType, context) {
        const detector = this.triggers.get(triggerType);
        if (!detector) {
          return { triggered: false };
        }
        return detector(context);
      }
      async executeAction(actionType, context, config2) {
        const executor = this.actions.get(actionType) ?? this.actions.get(String(actionType).toUpperCase());
        if (!executor) {
          return { success: false, error: `Unknown action type: ${actionType}` };
        }
        const startTime = Date.now();
        try {
          const result = await executor(context, config2);
          return {
            ...result,
            duration: Date.now() - startTime
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            duration: Date.now() - startTime
          };
        }
      }
      scopeFor(context, state, extra = {}) {
        const vars = context.variables || {};
        return {
          trigger: vars,
          record: vars.record && typeof vars.record === "object" ? vars.record : vars,
          steps: state.stepsOut,
          run: { id: context.runId, workflowId: context.workflowId },
          ...extra
        };
      }
      interpolateConfig(step, scope) {
        const type = String(step.actionType).toUpperCase();
        const cfg = { ...step.configuration || {} };
        const out = {};
        const jsonBody = (type === "HTTP_REQUEST" || type === "WEBHOOK") && typeof cfg.body === "string" && /^\s*[{[]/.test(cfg.body);
        for (const [k, v] of Object.entries(cfg)) {
          if (NESTED_KEYS.includes(k)) out[k] = v;
          else out[k] = interpolate(v, scope, k === "body" && jsonBody ? { escapeJson: true } : {});
        }
        return out;
      }
      async runSteps(steps, context, state, depth, extraScope, keyPrefix, startIndex = 0) {
        for (let i = startIndex; i < steps.length; i++) {
          const step = steps[i];
          const key2 = `${keyPrefix}${step.id}`;
          if (++state.executions > MAX_STEP_EXECUTIONS) {
            state.results[key2] = { success: false, error: `Step execution limit (${MAX_STEP_EXECUTIONS}) exceeded` };
            state.failed = true;
            return;
          }
          const scope = this.scopeFor(context, state, extraScope);
          if (step.condition && !evaluateCondition(step.condition, scope, context.variables)) {
            state.results[key2] = { success: true, output: "Skipped: condition not met" };
            continue;
          }
          const type = String(step.actionType).toUpperCase();
          let result;
          let config2;
          try {
            config2 = this.interpolateConfig(step, scope);
          } catch (e) {
            result = { success: false, error: e instanceof Error ? e.message : String(e) };
            state.results[key2] = result;
            state.failed = true;
            return;
          }
          if (FLOW_ACTIONS.has(type)) {
            const started = Date.now();
            try {
              result = await this.runFlowAction(type, step, config2, context, state, depth, extraScope, key2);
            } catch (e) {
              result = { success: false, error: e instanceof Error ? e.message : String(e) };
            }
            result.duration = Date.now() - started;
            state.results[key2] = result;
            if (!result.success) {
              state.failed = true;
              return;
            }
            state.stepsOut[step.id] = { output: result.output };
            if (state.filtered || state.failed) return;
            continue;
          }
          result = await this.executeAction(step.actionType, context, config2);
          state.results[key2] = result;
          if (result.success && result.wait) {
            if (depth > 0) {
              state.results[key2] = {
                success: false,
                error: "Pausing steps (long delay, wait_for_event, form) are only allowed at the top level"
              };
              state.failed = true;
              return;
            }
            state.wait = { ...result.wait, stepId: step.id };
            return;
          }
          if (result.success) state.stepsOut[step.id] = { output: result.output };
          if (!result.success && step.actionType !== "CODE") {
            state.failed = true;
            return;
          }
        }
      }
      async runFlowAction(type, step, config2, context, state, depth, extraScope, key2) {
        const scope = this.scopeFor(context, state, extraScope);
        const sortNested = (raw) => (Array.isArray(raw) ? raw : []).map((s, idx) => ({ ...s, order: s.order ?? idx, configuration: s.configuration || {} })).sort((a, b) => a.order - b.order);
        if (type === "FILTER") {
          const condition = config2.condition;
          if (!condition) return { success: false, error: "Missing required field: condition" };
          const pass = evaluateCondition(condition, scope, context.variables);
          if (!pass) state.filtered = true;
          return { success: true, output: { passed: pass } };
        }
        if (depth + 1 > MAX_NESTING) {
          return { success: false, error: `Nesting deeper than ${MAX_NESTING} levels is not allowed` };
        }
        if (type === "IF_ELSE") {
          const condition = config2.condition;
          if (!condition) return { success: false, error: "Missing required field: condition" };
          const taken = evaluateCondition(condition, scope, context.variables);
          await this.runSteps(
            sortNested(taken ? config2.then : config2.else),
            context,
            state,
            depth + 1,
            extraScope,
            `${key2}.${taken ? "then" : "else"}.`
          );
          if (state.failed) return { success: false, error: "A step inside the branch failed", output: { branch: taken } };
          return { success: true, output: { branch: taken ? "then" : "else" } };
        }
        const items = config2.items;
        if (!Array.isArray(items)) {
          return { success: false, error: 'ITERATOR "items" must resolve to an array' };
        }
        if (items.length > MAX_ITERATIONS) {
          return { success: false, error: `ITERATOR exceeds the ${MAX_ITERATIONS} item limit (${items.length})` };
        }
        const nested = sortNested(config2.steps);
        const iterations = [];
        for (let idx = 0; idx < items.length; idx++) {
          const before = { ...state.stepsOut };
          await this.runSteps(
            nested,
            context,
            state,
            depth + 1,
            { ...extraScope, item: items[idx], index: idx },
            `${key2}[${idx}].`
          );
          if (state.failed) {
            return { success: false, error: `Iteration ${idx} failed` };
          }
          iterations.push(
            Object.fromEntries(Object.entries(state.stepsOut).filter(([k]) => !(k in before) || before[k] !== state.stepsOut[k]))
          );
          if (state.filtered) state.filtered = false;
        }
        return { success: true, output: { count: items.length, iterations } };
      }
      async executeWorkflow(steps, context, options = {}) {
        const sorted = [...steps].sort((a, b) => a.order - b.order);
        const state = {
          results: { ...options.priorResults || {} },
          stepsOut: {},
          executions: 0,
          filtered: false,
          failed: false
        };
        for (const [id, r] of Object.entries(state.results)) {
          if (r.success) state.stepsOut[id] = { output: r.output };
        }
        let start = 0;
        if (options.resumeFromStepId) {
          const idx = sorted.findIndex((s) => s.id === options.resumeFromStepId);
          if (idx < 0) throw new Error(`Cannot resume: step ${options.resumeFromStepId} no longer exists`);
          state.results[options.resumeFromStepId] = { success: true, output: options.resumeOutput };
          state.stepsOut[options.resumeFromStepId] = { output: options.resumeOutput };
          start = idx + 1;
        }
        await this.runSteps(sorted, context, state, 0, {}, "", start);
        const allSuccessful = Object.values(state.results).every((r) => r.success);
        const status = state.wait ? "waiting" : state.filtered ? "filtered" : allSuccessful && !state.failed ? "completed" : "failed";
        return {
          success: status !== "failed",
          results: state.results,
          status,
          ...state.wait ? { wait: state.wait } : {}
        };
      }
      getRegisteredTriggers() {
        return Array.from(this.triggers.keys());
      }
      getRegisteredActions() {
        return Array.from(this.actions.keys());
      }
    };
    workflowEngine = new WorkflowEngine();
  }
});

// packages/workflows/src/triggers/index.ts
var recordCreatedTrigger, recordUpdatedTrigger, recordDeletedTrigger, manualTrigger, scheduledTrigger, webhookTrigger, aiCompletedTrigger, registerAllTriggers;
var init_triggers = __esm({
  "packages/workflows/src/triggers/index.ts"() {
    "use strict";
    recordCreatedTrigger = async (context) => {
      if (!context.triggerType || context.triggerType !== "RECORD_CREATED") {
        return { triggered: false };
      }
      return {
        triggered: true,
        context: {
          ...context,
          timestamp: context.timestamp || /* @__PURE__ */ new Date()
        }
      };
    };
    recordUpdatedTrigger = async (context) => {
      if (!context.triggerType || context.triggerType !== "RECORD_UPDATED") {
        return { triggered: false };
      }
      return {
        triggered: true,
        context: {
          ...context,
          timestamp: context.timestamp || /* @__PURE__ */ new Date()
        }
      };
    };
    recordDeletedTrigger = async (context) => {
      if (!context.triggerType || context.triggerType !== "RECORD_DELETED") {
        return { triggered: false };
      }
      return {
        triggered: true,
        context: {
          ...context,
          timestamp: context.timestamp || /* @__PURE__ */ new Date()
        }
      };
    };
    manualTrigger = async (context) => {
      if (!context.triggerType || context.triggerType !== "MANUAL") {
        return { triggered: false };
      }
      return {
        triggered: true,
        context: {
          ...context,
          timestamp: context.timestamp || /* @__PURE__ */ new Date()
        }
      };
    };
    scheduledTrigger = async (context) => {
      if (!context.triggerType || context.triggerType !== "SCHEDULED") {
        return { triggered: false };
      }
      return {
        triggered: true,
        context: {
          ...context,
          timestamp: context.timestamp || /* @__PURE__ */ new Date()
        }
      };
    };
    webhookTrigger = async (context) => {
      if (!context.triggerType || context.triggerType !== "WEBHOOK") {
        return { triggered: false };
      }
      return {
        triggered: true,
        context: {
          ...context,
          timestamp: context.timestamp || /* @__PURE__ */ new Date()
        }
      };
    };
    aiCompletedTrigger = async (context) => {
      if (!context.triggerType || context.triggerType !== "AI_COMPLETED") {
        return { triggered: false };
      }
      return {
        triggered: true,
        context: {
          ...context,
          timestamp: context.timestamp || /* @__PURE__ */ new Date()
        }
      };
    };
    registerAllTriggers = (engine) => {
      engine.registerTrigger("RECORD_CREATED", recordCreatedTrigger);
      engine.registerTrigger("RECORD_UPDATED", recordUpdatedTrigger);
      engine.registerTrigger("RECORD_DELETED", recordDeletedTrigger);
      engine.registerTrigger("MANUAL", manualTrigger);
      engine.registerTrigger("SCHEDULED", scheduledTrigger);
      engine.registerTrigger("WEBHOOK", webhookTrigger);
      engine.registerTrigger("AI_COMPLETED", aiCompletedTrigger);
    };
  }
});

// packages/workflows/src/security/ssrf.ts
import { isIP } from "node:net";
function isPrivateAddress(address) {
  let ip = address.trim().toLowerCase().replace(/^\[|\]$/g, "");
  const zone = ip.indexOf("%");
  if (zone >= 0) ip = ip.slice(0, zone);
  const mapped = ip.match(/^::ffff:(.+)$/);
  if (mapped) {
    const rest = mapped[1];
    if (isIP(rest) === 4) return isPrivateAddress(rest);
    const hex = rest.match(/^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (hex) {
      const hi = parseInt(hex[1], 16);
      const lo = parseInt(hex[2], 16);
      return isPrivateAddress(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
    }
    return true;
  }
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || a === 100 && b >= 64 && b <= 127 || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 || a === 192 && b === 168 || a === 192 && b === 0 || a === 198 && (b === 18 || b === 19) || a >= 224;
  }
  if (isIP(ip) === 6) {
    return ip === "::" || ip === "::1" || /^fe[89ab]/.test(ip) || /^f[cd]/.test(ip) || /^ff/.test(ip) || /^64:ff9b:/.test(ip);
  }
  return false;
}
function assertPublicHttps(raw) {
  let url2;
  try {
    url2 = new URL(raw);
  } catch {
    throw new Error(`Invalid webhook url: ${raw}`);
  }
  if (url2.protocol !== "https:") throw new Error("Webhook url must use https");
  const host = url2.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local") || isPrivateAddress(host)) {
    throw new Error("Webhook url must not target a private or local address");
  }
  return url2;
}
var init_ssrf = __esm({
  "packages/workflows/src/security/ssrf.ts"() {
    "use strict";
  }
});

// packages/workflows/src/actions/index.ts
function resolveTarget(objectType) {
  const key2 = String(objectType).toLowerCase().replace(/s$/, "");
  const target = WRITABLE[key2];
  if (!target) {
    throw new Error(
      `Unsupported objectType "${objectType}". Allowed: ${Object.keys(WRITABLE).join(", ")}`
    );
  }
  return target;
}
function requireUser(context) {
  if (!context.userId) throw new Error("Workflow run has no user; cannot write records");
  return context.userId;
}
function pickColumns(target, data) {
  const row = {};
  for (const [k, v] of Object.entries(data)) {
    const col = snake(k);
    if (!target.columns.includes(col)) throw new Error(`Field "${k}" is not allowed`);
    row[col] = v;
  }
  return row;
}
async function insertRecord(context, objectType, data) {
  const userId = requireUser(context);
  const target = resolveTarget(objectType);
  const row = { ...pickColumns(target, data), [target.owner]: userId };
  const { data: created, error } = await supabase.from(target.table).insert(row).select().single();
  if (error) throw new Error(`Failed to create ${objectType}: ${error.message}`);
  return { recordId: created?.id, objectType, record: created };
}
function safeHeaders(headers) {
  const out = {};
  if (!headers || typeof headers !== "object") return out;
  for (const [k, v] of Object.entries(headers)) {
    if (FORBIDDEN_HEADERS.has(k.toLowerCase())) continue;
    if (typeof v !== "string" && typeof v !== "number") continue;
    const val = String(v);
    if (/[\r\n]/.test(k) || /[\r\n]/.test(val)) throw new Error(`Invalid header "${k}"`);
    out[k] = val;
  }
  return out;
}
function getPath2(obj, path) {
  return path.split(".").reduce((acc, key2) => {
    if (acc && typeof acc === "object" && key2 in acc) return acc[key2];
    return void 0;
  }, obj);
}
var WRITABLE, snake, sendEmailAction, updateFieldAction, createRecordAction, createTaskAction, createNoteAction, createDealAction, createContactAction, WEBHOOK_TIMEOUT_MS, FORBIDDEN_HEADERS, httpRequest, webhookAction, httpRequestAction, MAX_WAIT_MS, waitAction, branchAction, aiAction, MAX_DELAY_MS, unitMs, delayAction, waitForEventAction, formAction, aiAgentAction, sendSmsAction, codeAction, registerAllActions;
var init_actions = __esm({
  "packages/workflows/src/actions/index.ts"() {
    "use strict";
    init_supabase();
    init_ssrf();
    WRITABLE = {
      contact: {
        table: "contacts",
        owner: "profile_id",
        columns: [
          "first_name",
          "last_name",
          "email",
          "phone",
          "company",
          "status",
          "source",
          "notes",
          "industry",
          "address",
          "city",
          "state",
          "zip_code",
          "country"
        ]
      },
      deal: {
        table: "deals",
        owner: "profile_id",
        columns: [
          "title",
          "value",
          "stage",
          "probability",
          "description",
          "status",
          "contact_id",
          "expected_close_date"
        ]
      },
      task: {
        table: "tasks",
        owner: "profile_id",
        columns: [
          "title",
          "description",
          "status",
          "priority",
          "due_date",
          "contact_id",
          "deal_id",
          "assigned_to"
        ]
      },
      note: {
        table: "notes",
        owner: "profile_id",
        columns: ["title", "content", "type", "contact_id"]
      }
    };
    snake = (s) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    sendEmailAction = async (_context, config2) => {
      const { to, subject, body, from } = config2;
      if (!to || !subject || !body) {
        return { success: false, error: "Missing required email fields: to, subject, body" };
      }
      const apiKey = process.env.SENDGRID_API_KEY;
      if (!apiKey) {
        throw new Error("Email not configured: SENDGRID_API_KEY is not set");
      }
      const sgMail = (await import("@sendgrid/mail")).default;
      sgMail.setApiKey(apiKey);
      const [response] = await sgMail.send({
        to,
        from: from || process.env.FROM_EMAIL || "noreply@smartcrm.vip",
        subject,
        text: body
      });
      return {
        success: true,
        output: { messageId: response?.headers?.["x-message-id"], to, subject }
      };
    };
    updateFieldAction = async (context, config2) => {
      const { objectType, recordId, field, value } = config2;
      if (!objectType || !recordId || !field) {
        return { success: false, error: "Missing required fields: objectType, recordId, field" };
      }
      const userId = requireUser(context);
      const target = resolveTarget(objectType);
      const patch = pickColumns(target, { [field]: value });
      const { data, error } = await supabase.from(target.table).update(patch).eq("id", recordId).eq(target.owner, userId).select("id");
      if (error) throw new Error(`Failed to update ${objectType}: ${error.message}`);
      if (!data || data.length === 0) throw new Error(`${objectType} ${recordId} not found`);
      return { success: true, output: { objectType, recordId, field, newValue: value } };
    };
    createRecordAction = async (context, config2) => {
      const { objectType, data } = config2;
      if (!objectType || !data) {
        return { success: false, error: "Missing required fields: objectType, data" };
      }
      const { recordId, record } = await insertRecord(context, objectType, data);
      return { success: true, output: { recordId, objectType, data: record } };
    };
    createTaskAction = async (context, config2) => {
      const { title, description, assigneeId, dueDate } = config2;
      if (!title) return { success: false, error: "Missing required field: title" };
      const data = { title };
      if (description) data.description = description;
      if (assigneeId) data.assigned_to = assigneeId;
      if (dueDate) data.due_date = dueDate;
      if (context.recordId && context.variables.objectType === "contacts") {
        data.contact_id = Number(context.recordId);
      }
      const { recordId } = await insertRecord(context, "task", data);
      return { success: true, output: { taskId: recordId, title, assigneeId, dueDate } };
    };
    createNoteAction = async (context, config2) => {
      const { content, recordId, recordType } = config2;
      if (!content || !recordId) {
        return { success: false, error: "Missing required fields: content, recordId" };
      }
      if (recordType && recordType.toLowerCase().replace(/s$/, "") !== "contact") {
        throw new Error("Notes can only be attached to contacts");
      }
      const { recordId: noteId } = await insertRecord(context, "note", {
        content,
        contact_id: Number(recordId)
      });
      return { success: true, output: { noteId, recordId, recordType: recordType || "contact" } };
    };
    createDealAction = async (context, config2) => {
      const { title, amount, stage, contactId } = config2;
      if (!title) return { success: false, error: "Missing required field: title" };
      const data = { title, stage: stage || "lead" };
      if (amount !== void 0) data.value = amount;
      if (contactId !== void 0) data.contact_id = contactId;
      const { recordId } = await insertRecord(context, "deal", data);
      return { success: true, output: { dealId: recordId, title, amount, stage: data.stage } };
    };
    createContactAction = async (context, config2) => {
      const { email, firstName, lastName, company } = config2;
      if (!email) return { success: false, error: "Missing required field: email" };
      const { recordId } = await insertRecord(context, "contact", {
        email,
        first_name: firstName || "",
        last_name: lastName || "",
        ...company ? { company } : {}
      });
      return { success: true, output: { contactId: recordId, email, firstName, lastName } };
    };
    WEBHOOK_TIMEOUT_MS = 1e4;
    FORBIDDEN_HEADERS = /* @__PURE__ */ new Set(["host", "content-length", "connection", "transfer-encoding"]);
    httpRequest = async (_context, config2) => {
      const { url: url2, method, headers, body } = config2;
      if (!url2) return { success: false, error: "Missing required field: url" };
      const target = assertPublicHttps(url2);
      const verb = (method || "POST").toUpperCase();
      const hasBody = body !== void 0 && verb !== "GET" && verb !== "HEAD";
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);
      try {
        const res = await fetch(target.toString(), {
          method: verb,
          headers: {
            ...hasBody && typeof body !== "string" ? { "Content-Type": "application/json" } : {},
            ...safeHeaders(headers)
          },
          body: hasBody ? typeof body === "string" ? body : JSON.stringify(body) : void 0,
          signal: controller.signal,
          redirect: "error"
        });
        const text = (await res.text()).slice(0, 2e3);
        if (!res.ok) throw new Error(`Webhook responded ${res.status}: ${text.slice(0, 200)}`);
        return { success: true, output: { url: url2, statusCode: res.status, body: text } };
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw new Error(`Webhook timed out after ${WEBHOOK_TIMEOUT_MS}ms`);
        }
        throw error;
      } finally {
        clearTimeout(timer);
      }
    };
    webhookAction = httpRequest;
    httpRequestAction = httpRequest;
    MAX_WAIT_MS = 2e4;
    waitAction = async (_context, config2) => {
      const { duration, unit } = config2;
      if (!duration) return { success: false, error: "Missing required field: duration" };
      const factor = unit === "hours" ? 36e5 : unit === "minutes" ? 6e4 : unit === "seconds" ? 1e3 : 1;
      const ms = Number(duration) * factor;
      if (!Number.isFinite(ms) || ms < 0) throw new Error("Invalid wait duration");
      if (ms > MAX_WAIT_MS) {
        throw new Error(`Wait of ${ms}ms exceeds the ${MAX_WAIT_MS}ms in-process limit`);
      }
      await new Promise((resolve) => setTimeout(resolve, ms));
      return { success: true, output: { waited: duration, unit: unit || "ms" } };
    };
    branchAction = async (context, config2) => {
      const { condition } = config2;
      if (!condition) return { success: false, error: "Missing required field: condition" };
      const { field, operator, value } = condition;
      const fieldValue = getPath2(context.variables, String(field));
      let result = false;
      switch (operator) {
        case "equals":
          result = fieldValue === value;
          break;
        case "not_equals":
          result = fieldValue !== value;
          break;
        case "contains":
          result = String(fieldValue).includes(String(value));
          break;
        case "greater_than":
          result = Number(fieldValue) > Number(value);
          break;
        case "less_than":
          result = Number(fieldValue) < Number(value);
          break;
        default:
          result = false;
      }
      return { success: true, output: { branchTaken: result ? "true" : "false", condition } };
    };
    aiAction = async (_context, config2) => {
      const { prompt, input, instructions, maxOutputTokens, model } = config2;
      const text = prompt || input;
      if (!text) return { success: false, error: "Missing required field: prompt" };
      const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_FALLBACK;
      if (!apiKey) throw new Error("OpenAI not configured: OPENAI_API_KEY is not set");
      const body = {
        model: model || process.env.OPENAI_MODEL_FAST || "gpt-6-luna",
        input: text,
        max_output_tokens: Math.max(16, Math.min(Number(maxOutputTokens) || 500, 4e3)),
        store: false
      };
      if (instructions) body.instructions = instructions;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3e4);
      try {
        const res = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify(body),
          signal: controller.signal
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(`OpenAI request failed (${res.status}): ${json?.error?.message || "unknown error"}`);
        }
        const output = json.output_text ?? (json.output || []).flatMap((o) => o?.content || []).map((c) => c?.text || "").join("");
        return { success: true, output: { text: output, responseId: json.id, model: json.model } };
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw new Error("OpenAI request timed out");
        }
        throw error;
      } finally {
        clearTimeout(timer);
      }
    };
    MAX_DELAY_MS = 30 * 24 * 3600 * 1e3;
    unitMs = (unit) => unit === "days" ? 864e5 : unit === "hours" ? 36e5 : unit === "minutes" ? 6e4 : unit === "seconds" ? 1e3 : 1;
    delayAction = async (_context, config2) => {
      const { duration, unit } = config2;
      if (duration === void 0 || duration === null) {
        return { success: false, error: "Missing required field: duration" };
      }
      const ms = Number(duration) * unitMs(unit);
      if (!Number.isFinite(ms) || ms < 0) throw new Error("Invalid delay duration");
      if (ms > MAX_DELAY_MS) throw new Error("Delay exceeds the 30 day maximum");
      if (ms <= MAX_WAIT_MS) {
        await new Promise((resolve) => setTimeout(resolve, ms));
        return { success: true, output: { delayedMs: ms, paused: false } };
      }
      return {
        success: true,
        output: { delayedMs: ms, paused: true },
        wait: { kind: "delay", resumeAt: new Date(Date.now() + ms).toISOString() }
      };
    };
    waitForEventAction = async (_context, config2) => {
      const { event, objectType, name, match, timeoutMinutes } = config2;
      let eventKey;
      if (name) eventKey = `custom:${String(name)}`;
      else if (event) eventKey = `${String(event).toUpperCase()}:${objectType ? String(objectType) : "*"}`;
      else return { success: false, error: "Missing required field: event (or name)" };
      const timeout = Number(timeoutMinutes);
      const resumeAt = Number.isFinite(timeout) && timeout > 0 ? new Date(Date.now() + Math.min(timeout * 6e4, MAX_DELAY_MS)).toISOString() : void 0;
      return {
        success: true,
        output: { waitingFor: eventKey },
        wait: { kind: "event", eventKey, match: match && typeof match === "object" ? match : void 0, resumeAt }
      };
    };
    formAction = async (_context, config2) => {
      const { title, fields } = config2;
      if (!Array.isArray(fields) || fields.length === 0 || fields.length > 50) {
        return { success: false, error: "form requires 1-50 fields" };
      }
      const clean = fields.map((f) => {
        if (!f || typeof f.name !== "string" || !/^[A-Za-z_][\w]{0,63}$/.test(f.name)) {
          throw new Error("Every form field needs a simple name");
        }
        return { name: f.name, label: f.label ? String(f.label) : void 0, type: f.type ? String(f.type) : "text", required: !!f.required };
      });
      return { success: true, output: { awaitingForm: true }, wait: { kind: "form", form: { title, fields: clean } } };
    };
    aiAgentAction = async (context, config2) => {
      const { tools, jsonOutput, ...rest } = config2;
      if (tools !== void 0 && tools !== null && tools !== "none" && !(Array.isArray(tools) && tools.length === 0)) {
        throw new Error('AI_AGENT tools are not supported yet (use tools: "none")');
      }
      const result = await aiAction(context, rest);
      if (!result.success || !jsonOutput) return result;
      const text = String(result.output?.text ?? "");
      try {
        return { ...result, output: { ...result.output, json: JSON.parse(text) } };
      } catch {
        throw new Error("AI_AGENT reply was not valid JSON");
      }
    };
    sendSmsAction = async (_context, config2) => {
      const { to, message } = config2;
      if (!to || !message) return { success: false, error: "Missing required fields: to, message" };
      throw new Error("SMS not configured: no SMS provider is available");
    };
    codeAction = async (_context, config2) => {
      const { code } = config2;
      if (!code) return { success: false, error: "Missing required field: code" };
      throw new Error("CODE action is not supported: arbitrary code execution is disabled");
    };
    registerAllActions = (engine) => {
      engine.registerAction("SEND_EMAIL", sendEmailAction);
      engine.registerAction("UPDATE_FIELD", updateFieldAction);
      engine.registerAction("CREATE_RECORD", createRecordAction);
      engine.registerAction("CREATE_TASK", createTaskAction);
      engine.registerAction("CREATE_NOTE", createNoteAction);
      engine.registerAction("WEBHOOK", webhookAction);
      engine.registerAction("CODE", codeAction);
      engine.registerAction("WAIT", waitAction);
      engine.registerAction("BRANCH", branchAction);
      engine.registerAction("SEND_SMS", sendSmsAction);
      engine.registerAction("CREATE_DEAL", createDealAction);
      engine.registerAction("CREATE_CONTACT", createContactAction);
      engine.registerAction("AI", aiAction);
      engine.registerAction("HTTP_REQUEST", httpRequestAction);
      engine.registerAction("DELAY", delayAction);
      engine.registerAction("WAIT_FOR_EVENT", waitForEventAction);
      engine.registerAction("FORM", formAction);
      engine.registerAction("AI_AGENT", aiAgentAction);
    };
  }
});

// packages/workflows/src/engine/runner.ts
var runner_exports = {};
__export(runner_exports, {
  loadSteps: () => loadSteps,
  resumeDueWaits: () => resumeDueWaits,
  resumeWait: () => resumeWait,
  resumeWaitersForEvent: () => resumeWaitersForEvent,
  resumeWaitersForKeys: () => resumeWaitersForKeys,
  runWorkflow: () => runWorkflow
});
function ensureRegistered() {
  if (registered) return;
  registerAllTriggers(workflowEngine);
  registerAllActions(workflowEngine);
  registered = true;
}
async function loadSteps(workflowId, versionId) {
  if (versionId) {
    const { data: version, error: error2 } = await supabase.from("workflow_versions").select("id, graph").eq("id", versionId).eq("workflow_id", workflowId).maybeSingle();
    if (error2) throw new Error(error2.message);
    if (!version) throw new Error("Workflow version not found");
    const steps = Array.isArray(version.graph?.steps) ? version.graph.steps : [];
    return {
      versionId: version.id,
      steps: steps.map((s, i) => ({
        id: String(s.id ?? `s${i}`),
        actionType: s.actionType ?? s.action_type,
        configuration: s.configuration ?? s.config ?? {},
        order: s.order ?? s.order_index ?? i + 1,
        condition: s.condition || void 0
      }))
    };
  }
  const { data: actions, error } = await supabase.from("workflow_actions").select("*").eq("workflow_id", workflowId).order("order_index");
  if (error) throw new Error(error.message);
  return { steps: rowsToSteps(actions || []), versionId: null };
}
async function finish(runId, outcome, snapshotBase) {
  const results = outcome.results;
  const patch = { result: results, error: null };
  if (outcome.status === "waiting" && outcome.wait) {
    const w = outcome.wait;
    const { error: waitError } = await supabase.from("workflow_run_waits").insert({
      run_id: runId,
      kind: w.kind,
      step_id: w.stepId,
      resume_at: "resumeAt" in w && w.resumeAt ? w.resumeAt : null,
      event_key: w.kind === "event" ? w.eventKey : null,
      payload: {
        ...snapshotBase,
        results,
        match: w.kind === "event" ? w.match : void 0,
        form: w.kind === "form" ? w.form : void 0
      }
    });
    if (!waitError) {
      patch.status = "waiting";
    } else {
      patch.status = "failed";
      patch.error = `Could not pause run: ${waitError.message}`;
      patch.finished_at = (/* @__PURE__ */ new Date()).toISOString();
    }
  } else if (outcome.status === "failed") {
    patch.status = "failed";
    patch.error = Object.values(results).find((r) => !r.success)?.error || "A workflow step failed";
    patch.finished_at = (/* @__PURE__ */ new Date()).toISOString();
  } else {
    patch.status = "completed";
    patch.finished_at = (/* @__PURE__ */ new Date()).toISOString();
  }
  const { data } = await supabase.from("workflow_runs").update(patch).eq("id", runId).select().single();
  return data;
}
async function runWorkflow(opts) {
  ensureRegistered();
  const { workflowId, userId, triggerType, triggerData = {}, recordId } = opts;
  const { data: workflow, error: wfError } = await supabase.from("workflows").select("*").eq("id", workflowId).eq("user_id", userId).maybeSingle();
  if (wfError) throw new Error(wfError.message);
  if (!workflow) throw new Error("Workflow not found");
  const { steps, versionId } = await loadSteps(workflowId, workflow.active_version_id);
  const { data: run, error: runError } = await supabase.from("workflow_runs").insert({ workflow_id: workflowId, status: "running", trigger_data: triggerData }).select().single();
  if (runError || !run) throw new Error(runError?.message || "Failed to create run");
  let status = "failed";
  let error = null;
  try {
    const outcome = await workflowEngine.executeWorkflow(steps, {
      workflowId,
      runId: run.id,
      triggerType,
      recordId,
      userId,
      timestamp: /* @__PURE__ */ new Date(),
      variables: triggerData
    });
    const finished = await finish(run.id, outcome, {
      userId,
      triggerType,
      recordId,
      variables: triggerData,
      versionId
    });
    if (finished) return finished;
    status = outcome.status === "failed" ? "failed" : "completed";
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  const { data: failed } = await supabase.from("workflow_runs").update({ status, error, finished_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", run.id).select().single();
  return failed || { ...run, status, error };
}
async function resumeWait(waitId, output) {
  ensureRegistered();
  const { data: claimed, error: claimError } = await supabase.from("workflow_run_waits").update({ resolved_at: (/* @__PURE__ */ new Date()).toISOString(), resume_payload: output ?? null }).eq("id", waitId).is("resolved_at", null).select().maybeSingle();
  if (claimError) throw new Error(claimError.message);
  if (!claimed) return null;
  const snap = claimed.payload;
  const { data: run } = await supabase.from("workflow_runs").select("*").eq("id", claimed.run_id).maybeSingle();
  if (!run || run.status !== "waiting") return run ?? null;
  await supabase.from("workflow_runs").update({ status: "running" }).eq("id", run.id);
  try {
    const { steps } = await loadSteps(run.workflow_id, snap.versionId);
    const outcome = await workflowEngine.executeWorkflow(
      steps,
      {
        workflowId: run.workflow_id,
        runId: run.id,
        triggerType: snap.triggerType,
        recordId: snap.recordId,
        userId: snap.userId,
        timestamp: /* @__PURE__ */ new Date(),
        variables: snap.variables
      },
      { resumeFromStepId: claimed.step_id, priorResults: snap.results, resumeOutput: output }
    );
    return await finish(run.id, outcome, {
      userId: snap.userId,
      triggerType: snap.triggerType,
      recordId: snap.recordId,
      variables: snap.variables,
      versionId: snap.versionId
    });
  } catch (e) {
    const { data } = await supabase.from("workflow_runs").update({
      status: "failed",
      error: e instanceof Error ? e.message : String(e),
      finished_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", run.id).select().single();
    return data;
  }
}
async function resumeDueWaits(limit = 20) {
  const { data: due, error } = await supabase.from("workflow_run_waits").select("id, kind").is("resolved_at", null).not("resume_at", "is", null).lte("resume_at", (/* @__PURE__ */ new Date()).toISOString()).limit(limit);
  if (error) throw new Error(error.message);
  let n = 0;
  for (const w of due || []) {
    try {
      const out = w.kind === "event" ? { timedOut: true } : { resumed: true };
      if (await resumeWait(w.id, out)) n++;
    } catch (e) {
      console.error(`Failed to resume wait ${w.id}:`, e);
    }
  }
  return n;
}
async function resumeWaitersForEvent(userId, type, objectType, data = {}) {
  const keys = [`${type}:*`, ...objectType ? [`${type}:${objectType}`] : []];
  return resumeWaitersForKeys(userId, keys, data);
}
async function resumeWaitersForKeys(userId, keys, data = {}) {
  const { data: waits, error } = await supabase.from("workflow_run_waits").select("id, payload").is("resolved_at", null).in("event_key", keys).limit(100);
  if (error) {
    console.error("Error loading event waits:", error.message);
    return 0;
  }
  let n = 0;
  for (const w of waits || []) {
    const snap = w.payload;
    if (snap?.userId !== userId) continue;
    const match = snap.match || {};
    const ok = Object.entries(match).every(([k, v]) => String(getPath(data, k)) === String(v));
    if (!ok) continue;
    try {
      if (await resumeWait(w.id, { event: data })) n++;
    } catch (e) {
      console.error(`Failed to resume wait ${w.id}:`, e);
    }
  }
  return n;
}
var registered, rowsToSteps;
var init_runner = __esm({
  "packages/workflows/src/engine/runner.ts"() {
    "use strict";
    init_supabase();
    init_WorkflowEngine();
    init_triggers();
    init_actions();
    init_interpolate();
    registered = false;
    rowsToSteps = (actions) => (actions || []).map((a) => ({
      id: a.id,
      actionType: a.action_type,
      configuration: a.config || {},
      order: a.order_index,
      condition: a.condition || void 0
    }));
  }
});

// packages/workflows/src/events/emitter.ts
var WorkflowEventEmitter = class {
  handlers = /* @__PURE__ */ new Map();
  on(eventType, handler2) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, /* @__PURE__ */ new Set());
    }
    this.handlers.get(eventType).add(handler2);
  }
  off(eventType, handler2) {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler2);
    }
  }
  async emit(event) {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      await Promise.all(
        Array.from(handlers).map(
          (handler2) => handler2(event).catch((error) => {
            console.error(`Error in workflow event handler for ${event.type}:`, error);
          })
        )
      );
    }
  }
  clear() {
    this.handlers.clear();
  }
};
var workflowEventEmitter = new WorkflowEventEmitter();
async function triggerWorkflowsForEvent(event) {
  const [{ supabase: supabase3 }, { runWorkflow: runWorkflow2, resumeWaitersForEvent: resumeWaitersForEvent2 }] = await Promise.all([
    Promise.resolve().then(() => (init_supabase(), supabase_exports)),
    Promise.resolve().then(() => (init_runner(), runner_exports))
  ]);
  if (event.type !== "MANUAL" && event.type !== "SCHEDULED" && event.type !== "WEBHOOK") {
    await resumeWaitersForEvent2(event.userId, event.type, event.objectType, {
      ...event.data || {},
      objectType: event.objectType,
      recordId: event.recordId
    }).catch((e) => console.error("Error resuming event waiters:", e));
  }
  const { data: workflows, error } = await supabase3.from("workflows").select("id, trigger_config").eq("trigger_type", event.type).eq("enabled", true).eq("user_id", event.userId);
  if (error) {
    console.error("Error fetching workflows for event:", error);
    return;
  }
  for (const workflow of workflows || []) {
    const wanted = workflow.trigger_config?.objectType;
    if (wanted && event.objectType && wanted !== event.objectType) continue;
    try {
      await runWorkflow2({
        workflowId: workflow.id,
        userId: event.userId,
        triggerType: event.type,
        recordId: event.recordId,
        triggerData: { ...event.data || {}, objectType: event.objectType, recordId: event.recordId }
      });
    } catch (e) {
      console.error(`Workflow ${workflow.id} failed to run:`, e);
    }
  }
}

// packages/workflows/src/index.ts
init_WorkflowEngine();
init_triggers();
init_actions();
init_runner();
init_interpolate();

// packages/workflows/src/engine/cron.ts
var ALIASES = {
  "@hourly": "0 * * * *",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@weekly": "0 0 * * 0",
  "@monthly": "0 0 1 * *",
  "@yearly": "0 0 1 1 *"
};
function parseField(field, min, max, name) {
  const out = /* @__PURE__ */ new Set();
  for (const part of field.split(",")) {
    const m = part.match(/^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/);
    if (!m) throw new Error(`Invalid cron ${name} field: "${field}"`);
    const step = m[2] ? Number(m[2]) : 1;
    if (step < 1) throw new Error(`Invalid cron ${name} step`);
    let lo = min;
    let hi = max;
    if (m[1] !== "*") {
      const [a, b] = m[1].split("-").map(Number);
      lo = a;
      hi = b ?? (m[2] ? max : a);
    }
    if (lo < min || hi > max || lo > hi) throw new Error(`Cron ${name} out of range: "${part}"`);
    for (let v = lo; v <= hi; v += step) out.add(v);
  }
  return out;
}
function parseCron(expr) {
  const normalized = ALIASES[expr.trim().toLowerCase()] ?? expr.trim();
  const f = normalized.split(/\s+/);
  if (f.length !== 5) throw new Error("Cron expression must have 5 fields");
  const dow = parseField(f[4], 0, 7, "day-of-week");
  if (dow.has(7)) {
    dow.delete(7);
    dow.add(0);
  }
  return {
    minute: parseField(f[0], 0, 59, "minute"),
    hour: parseField(f[1], 0, 23, "hour"),
    dom: parseField(f[2], 1, 31, "day-of-month"),
    month: parseField(f[3], 1, 12, "month"),
    dow,
    domAny: f[2] === "*",
    dowAny: f[4] === "*"
  };
}
function nextCronRun(expr, after = /* @__PURE__ */ new Date()) {
  const c = parseCron(expr);
  const d = new Date(after.getTime());
  d.setUTCSeconds(0, 0);
  d.setUTCMinutes(d.getUTCMinutes() + 1);
  const limit = after.getTime() + 5 * 366 * 24 * 3600 * 1e3;
  while (d.getTime() <= limit) {
    if (!c.month.has(d.getUTCMonth() + 1)) {
      d.setUTCMonth(d.getUTCMonth() + 1, 1);
      d.setUTCHours(0, 0, 0, 0);
      continue;
    }
    const domOk = c.dom.has(d.getUTCDate());
    const dowOk = c.dow.has(d.getUTCDay());
    const dayOk = c.domAny || c.dowAny ? domOk && dowOk : domOk || dowOk;
    if (!dayOk) {
      d.setUTCDate(d.getUTCDate() + 1);
      d.setUTCHours(0, 0, 0, 0);
      continue;
    }
    if (!c.hour.has(d.getUTCHours())) {
      d.setUTCHours(d.getUTCHours() + 1, 0, 0, 0);
      continue;
    }
    if (!c.minute.has(d.getUTCMinutes())) {
      d.setUTCMinutes(d.getUTCMinutes() + 1, 0, 0);
      continue;
    }
    return d;
  }
  return null;
}

// packages/workflows/src/index.ts
init_ssrf();
init_actions();
init_WorkflowEngine();

// server/supabase.ts
import { createClient as createClient2 } from "@supabase/supabase-js";
var supabaseUrl = process.env.SUPABASE_URL || "";
var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("Supabase server configuration missing. Some features may not work.");
}
var supabase2 = supabaseUrl && supabaseServiceKey ? createClient2(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}) : null;

// server/jobs/workflowScheduler.ts
var TICK_BUDGET_MS = 22e3;
var QUEUE_GRACE_MS = 1e4;
var MAX_DUE_PER_TICK = 25;
var MAX_EVENTS_PER_TICK = 50;
function computeNextRun(cron, from) {
  try {
    return nextCronRun(cron, from)?.toISOString() ?? null;
  } catch {
    return null;
  }
}
async function runSchedulerTick(deps) {
  const { db } = deps;
  const clock = deps.now ?? (() => /* @__PURE__ */ new Date());
  const run = deps.runWorkflow ?? runWorkflow;
  const resume = deps.resumeDueWaits ?? resumeDueWaits;
  const trigger = deps.triggerWorkflowsForEvent ?? triggerWorkflowsForEvent;
  const started = Date.now();
  const outOfTime = () => Date.now() - started > (deps.budgetMs ?? TICK_BUDGET_MS);
  const stats = { initialized: 0, scheduledRuns: 0, resumedWaits: 0, drainedEvents: 0, errors: [] };
  const now = clock();
  try {
    const { data: fresh } = await db.from("workflows").select("id, schedule_cron").eq("enabled", true).not("schedule_cron", "is", null).is("next_run_at", null).limit(50);
    for (const w of fresh || []) {
      const next = computeNextRun(w.schedule_cron, now);
      if (!next) continue;
      await db.from("workflows").update({ next_run_at: next }).eq("id", w.id).is("next_run_at", null);
      stats.initialized++;
    }
  } catch (e) {
    stats.errors.push(`init: ${e?.message ?? e}`);
  }
  try {
    const { data: due, error } = await db.from("workflows").select("id, user_id, schedule_cron, next_run_at").eq("enabled", true).not("schedule_cron", "is", null).lte("next_run_at", now.toISOString()).order("next_run_at", { ascending: true }).limit(MAX_DUE_PER_TICK);
    if (error) throw new Error(error.message);
    for (const w of due || []) {
      if (outOfTime()) break;
      const next = computeNextRun(w.schedule_cron, now);
      const { data: claimed } = await db.from("workflows").update({ next_run_at: next }).eq("id", w.id).eq("next_run_at", w.next_run_at).select("id");
      if (!claimed || claimed.length === 0) continue;
      if (!next) {
        stats.errors.push(`workflow ${w.id}: invalid or non-firing cron "${w.schedule_cron}"`);
        continue;
      }
      try {
        await run({
          workflowId: w.id,
          userId: w.user_id,
          triggerType: "SCHEDULED",
          triggerData: { scheduledFor: w.next_run_at, cron: w.schedule_cron }
        });
        stats.scheduledRuns++;
      } catch (e) {
        stats.errors.push(`workflow ${w.id}: ${e?.message ?? e}`);
      }
    }
  } catch (e) {
    stats.errors.push(`due: ${e?.message ?? e}`);
  }
  if (!outOfTime()) {
    try {
      stats.resumedWaits = await resume(20);
    } catch (e) {
      stats.errors.push(`waits: ${e?.message ?? e}`);
    }
  }
  try {
    const cutoff = new Date(now.getTime() - QUEUE_GRACE_MS).toISOString();
    const { data: events } = await db.from("workflow_event_queue").select("id, user_id, event_type, object_type, record_id, data").eq("status", "pending").lte("created_at", cutoff).order("created_at", { ascending: true }).limit(MAX_EVENTS_PER_TICK);
    for (const ev of events || []) {
      if (outOfTime()) break;
      const { data: claimed } = await db.from("workflow_event_queue").update({ status: "processing" }).eq("id", ev.id).eq("status", "pending").select("id");
      if (!claimed || claimed.length === 0) continue;
      try {
        await trigger({
          type: ev.event_type,
          tenantId: ev.user_id,
          userId: ev.user_id,
          objectType: ev.object_type,
          recordId: ev.record_id ?? void 0,
          data: ev.data ?? {},
          timestamp: /* @__PURE__ */ new Date()
        });
        await db.from("workflow_event_queue").update({ status: "done", processed_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", ev.id);
        stats.drainedEvents++;
      } catch (e) {
        await db.from("workflow_event_queue").update({ status: "failed", error: String(e?.message ?? e).slice(0, 500), processed_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", ev.id);
        stats.errors.push(`event ${ev.id}: ${e?.message ?? e}`);
      }
    }
  } catch (e) {
    stats.errors.push(`queue: ${e?.message ?? e}`);
  }
  if (now.getUTCMinutes() === 0) {
    const day = new Date(now.getTime() - 24 * 36e5).toISOString();
    const week = new Date(now.getTime() - 7 * 24 * 36e5).toISOString();
    await Promise.allSettled([
      db.from("workflow_hook_usage").delete().lt("window_start", day),
      db.from("api_key_usage").delete().lt("window_start", day),
      db.from("workflow_event_queue").delete().in("status", ["done", "skipped"]).lt("created_at", week)
    ]);
  }
  return stats;
}
async function handler() {
  if (!supabase2) {
    console.error("workflow-scheduler: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured");
    return new Response("not configured", { status: 500 });
  }
  const stats = await runSchedulerTick({ db: supabase2 });
  if (stats.errors.length) console.error("workflow-scheduler errors:", stats.errors);
  return new Response(JSON.stringify(stats), { headers: { "Content-Type": "application/json" } });
}
var config = { schedule: "* * * * *" };
export {
  MAX_DUE_PER_TICK,
  MAX_EVENTS_PER_TICK,
  QUEUE_GRACE_MS,
  TICK_BUDGET_MS,
  computeNextRun,
  config,
  handler as default,
  runSchedulerTick
};
