var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};

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
var init_triggers = __esm({
  "packages/workflows/src/triggers/index.ts"() {
    "use strict";
  }
});

// packages/workflows/src/supabase.ts
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

// packages/workflows/src/security/ssrf.ts
import { lookup as dnsLookup } from "node:dns/promises";
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
async function assertPublicResolved(raw, lookup = defaultLookup) {
  const url2 = assertPublicHttps(raw);
  const host = url2.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) return url2;
  let addrs;
  try {
    addrs = await lookup(host);
  } catch {
    throw new Error(`Could not resolve host ${host}`);
  }
  if (!addrs.length || addrs.some((a) => isPrivateAddress(a.address))) {
    throw new Error("Webhook url must not target a private or local address");
  }
  return url2;
}
var defaultLookup;
var init_ssrf = __esm({
  "packages/workflows/src/security/ssrf.ts"() {
    "use strict";
    defaultLookup = (host) => dnsLookup(host, { all: true });
  }
});

// packages/workflows/src/actions/index.ts
var MAX_DELAY_MS;
var init_actions = __esm({
  "packages/workflows/src/actions/index.ts"() {
    "use strict";
    init_supabase();
    init_ssrf();
    MAX_DELAY_MS = 30 * 24 * 3600 * 1e3;
  }
});

// packages/workflows/src/engine/runner.ts
var init_runner = __esm({
  "packages/workflows/src/engine/runner.ts"() {
    "use strict";
    init_supabase();
    init_WorkflowEngine();
    init_triggers();
    init_actions();
    init_interpolate();
  }
});

// server/jobs/webhookDelivery.ts
import { createHmac } from "node:crypto";

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

// packages/workflows/src/index.ts
init_WorkflowEngine();
init_triggers();
init_actions();
init_runner();
init_interpolate();
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

// server/jobs/webhookDelivery.ts
var MAX_ATTEMPTS = 6;
var DELIVERY_TIMEOUT_MS = 1e4;
var BATCH_SIZE = 20;
var BASE_BACKOFF_MS = 3e4;
var MAX_BACKOFF_MS = 6 * 36e5;
var LEASE_MS = 12e4;
var RESPONSE_BODY_LIMIT = 1e3;
var TICK_BUDGET_MS = 22e3;
function signPayload(secret, timestamp, body) {
  return `sha256=${createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")}`;
}
function backoffMs(attempts) {
  return Math.min(BASE_BACKOFF_MS * 2 ** Math.max(0, attempts - 1), MAX_BACKOFF_MS);
}
async function attemptDelivery(delivery, webhook, deps = {}) {
  const doFetch = deps.fetch ?? fetch;
  const now = deps.now ?? (() => /* @__PURE__ */ new Date());
  let url2;
  try {
    url2 = await assertPublicResolved(webhook.url, deps.lookup);
  } catch (e) {
    return { ok: false, error: e?.message ?? "Blocked url" };
  }
  const body = JSON.stringify(delivery.payload);
  const timestamp = Math.floor(now().getTime() / 1e3);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);
  try {
    const res = await doFetch(url2.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "SmartCRM-Webhooks/1.0",
        "X-SmartCRM-Event": delivery.event,
        "X-SmartCRM-Delivery": delivery.id,
        "X-SmartCRM-Timestamp": String(timestamp),
        "X-SmartCRM-Signature": signPayload(webhook.secret, timestamp, body)
      },
      body,
      signal: controller.signal,
      redirect: "error"
    });
    const text = (await res.text().catch(() => "")).slice(0, RESPONSE_BODY_LIMIT);
    return res.ok ? { ok: true, status: res.status, body: text } : { ok: false, status: res.status, body: text, error: `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: e?.name === "AbortError" ? `Timed out after ${DELIVERY_TIMEOUT_MS}ms` : e?.message ?? "Request failed" };
  } finally {
    clearTimeout(timer);
  }
}
function nextState(outcome, attempts, now) {
  if (outcome.ok) {
    return { status: "success", attempts, response_status: outcome.status ?? null, response_body: outcome.body ?? null };
  }
  const base = { attempts, response_status: outcome.status ?? null, response_body: outcome.body ?? outcome.error ?? null };
  if (attempts >= MAX_ATTEMPTS) return { ...base, status: "failed" };
  return { ...base, status: "pending", next_attempt_at: new Date(now.getTime() + backoffMs(attempts)).toISOString() };
}
async function runDeliveryTick(db, deps = {}) {
  const now = (deps.now ?? (() => /* @__PURE__ */ new Date()))();
  const started = Date.now();
  const stats = { claimed: 0, delivered: 0, failed: 0, retrying: 0 };
  const { data: due, error } = await db.from("webhook_deliveries").select("id, webhook_id, event, payload, attempts, next_attempt_at").eq("status", "pending").lte("next_attempt_at", now.toISOString()).order("next_attempt_at", { ascending: true }).limit(BATCH_SIZE);
  if (error) throw new Error(error.message);
  for (const d of due || []) {
    if (Date.now() - started > TICK_BUDGET_MS) break;
    const { data: claimed } = await db.from("webhook_deliveries").update({ next_attempt_at: new Date(now.getTime() + LEASE_MS).toISOString() }).eq("id", d.id).eq("status", "pending").eq("next_attempt_at", d.next_attempt_at).select("id");
    if (!claimed || claimed.length === 0) continue;
    stats.claimed++;
    const { data: hook } = await db.from("webhooks").select("id, url, secret, active").eq("id", d.webhook_id).maybeSingle();
    const attempts = d.attempts + 1;
    if (!hook || !hook.active) {
      await db.from("webhook_deliveries").update({ status: "failed", attempts, response_body: "Webhook missing or disabled" }).eq("id", d.id);
      stats.failed++;
      continue;
    }
    const outcome = await attemptDelivery(d, hook, deps);
    const patch = nextState(outcome, attempts, now);
    await db.from("webhook_deliveries").update(patch).eq("id", d.id);
    if (patch.status === "success") stats.delivered++;
    else if (patch.status === "failed") stats.failed++;
    else stats.retrying++;
  }
  return stats;
}
async function handler() {
  if (!supabase2) {
    console.error("webhook-delivery: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured");
    return new Response("not configured", { status: 500 });
  }
  try {
    const stats = await runDeliveryTick(supabase2);
    return new Response(JSON.stringify(stats), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("webhook-delivery failed:", e?.message);
    return new Response("error", { status: 500 });
  }
}
var config = { schedule: "* * * * *" };
export {
  BATCH_SIZE,
  DELIVERY_TIMEOUT_MS,
  MAX_ATTEMPTS,
  attemptDelivery,
  backoffMs,
  config,
  handler as default,
  nextState,
  runDeliveryTick,
  signPayload
};
