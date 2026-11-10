// server/jobs/aiJobs.ts
import { createClient } from "@supabase/supabase-js";

// server/services/openaiClient.ts
import OpenAI from "openai";

// shared/aiModels.ts
var MODEL_TIERS = {
  fast: "gpt-6-luna",
  default: "gpt-6.1-terra",
  deep: "gpt-6.1-sol",
  max: "gpt-6-astra"
};
var DEFAULT_MODEL = MODEL_TIERS.default;
var ENV_NAMES = {
  fast: "OPENAI_MODEL_FAST",
  default: "OPENAI_MODEL_DEFAULT",
  deep: "OPENAI_MODEL_DEEP",
  max: "OPENAI_MODEL_MAX"
};
var defaultEnv = () => typeof process !== "undefined" && process.env ? process.env : {};
function tierModel(tier = "default", env = defaultEnv()) {
  return env[ENV_NAMES[tier]]?.trim() || MODEL_TIERS[tier];
}
function resolveModel(tierOrModel, env = defaultEnv()) {
  if (!tierOrModel) return tierModel("default", env);
  if (tierOrModel in MODEL_TIERS) return tierModel(tierOrModel, env);
  return tierOrModel;
}
function modelSupportsNoReasoning(model) {
  return !/^gpt-6(\.1)?-(astra|sol)/.test(model) || model === "gpt-6-sol";
}
function normalizeEffort(model, effort) {
  if (!effort) return void 0;
  if (effort === "minimal") return "low";
  if (effort === "none" && !modelSupportsNoReasoning(model)) return "low";
  return effort;
}
var IMAGE_MODELS = {
  fast: "gpt-image-2.6-flare",
  // fast iteration
  quality: "gpt-image-2.6-sunburst"
  // detailed work / edit consistency
};
var DEFAULT_IMAGE_MODEL = IMAGE_MODELS.fast;
function imageModel(tierOrModel, env = defaultEnv()) {
  if (!tierOrModel) return env.OPENAI_IMAGE_MODEL_FAST?.trim() || IMAGE_MODELS.fast;
  if (tierOrModel === "fast") return env.OPENAI_IMAGE_MODEL_FAST?.trim() || IMAGE_MODELS.fast;
  if (tierOrModel === "quality") return env.OPENAI_IMAGE_MODEL_QUALITY?.trim() || IMAGE_MODELS.quality;
  return tierOrModel;
}

// server/services/openaiClient.ts
var REASONING_HEADROOM = 1024;
var MIN_OUTPUT_TOKENS = 16;
var cachedClient = null;
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_FALLBACK;
  if (!apiKey) return null;
  if (!cachedClient) cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}
function createUserClient(apiKey) {
  return new OpenAI({ apiKey });
}
function requireClient(opts) {
  const client = opts.client ?? getOpenAIClient();
  if (!client) throw new Error("OpenAI not configured");
  return client;
}
function toResponsesTool(tool) {
  if (tool?.type === "function" && tool.function) {
    const { name, description, parameters, strict } = tool.function;
    return {
      type: "function",
      name,
      description,
      parameters,
      ...strict !== void 0 ? { strict } : {}
    };
  }
  return tool;
}
function toResponsesToolChoice(choice) {
  if (choice && typeof choice === "object" && choice.type === "function" && choice.function?.name) {
    return { type: "function", name: choice.function.name };
  }
  return choice;
}
function buildRequest(opts) {
  const model = opts.model ? resolveModel(opts.model) : tierModel(opts.tier ?? "default");
  const effort = normalizeEffort(model, opts.effort);
  const body = { model, input: opts.input };
  if (opts.instructions) body.instructions = opts.instructions;
  if (effort) body.reasoning = { effort };
  if (opts.maxOutputTokens) {
    const requested = effort && effort !== "none" ? opts.maxOutputTokens + REASONING_HEADROOM : opts.maxOutputTokens;
    body.max_output_tokens = Math.max(MIN_OUTPUT_TOKENS, requested);
  }
  if (effort === "none") {
    if (opts.temperature !== void 0) body.temperature = opts.temperature;
    if (opts.topP !== void 0) body.top_p = opts.topP;
  }
  if (opts.json === true) {
    body.text = { format: { type: "json_object" } };
  } else if (opts.json) {
    body.text = {
      format: {
        type: "json_schema",
        name: opts.json.name,
        schema: opts.json.schema,
        strict: opts.json.strict ?? true
      }
    };
  }
  if (opts.tools?.length) {
    body.tools = opts.tools.map(toResponsesTool);
    if (opts.toolChoice !== void 0) body.tool_choice = toResponsesToolChoice(opts.toolChoice);
  }
  if (opts.previousResponseId) body.previous_response_id = opts.previousResponseId;
  body.store = opts.store ?? !!opts.previousResponseId;
  return body;
}
function outputText(response) {
  if (typeof response?.output_text === "string") return response.output_text;
  const parts = [];
  for (const item of response?.output ?? []) {
    if (item?.type !== "message") continue;
    for (const c of item.content ?? []) {
      if (c?.type === "output_text" && typeof c.text === "string") parts.push(c.text);
    }
  }
  return parts.join("");
}
function usageOf(response) {
  const u = response?.usage ?? {};
  const inputTokens = u.input_tokens ?? 0;
  const outputTokens = u.output_tokens ?? 0;
  return { inputTokens, outputTokens, totalTokens: u.total_tokens ?? inputTokens + outputTokens };
}
async function respond(opts) {
  const client = requireClient(opts);
  return client.responses.create(buildRequest(opts));
}
async function respondText(opts) {
  const response = await respond(opts);
  return { text: outputText(response), usage: usageOf(response), model: response.model ?? String(buildRequest(opts).model) };
}
async function respondJson(opts) {
  const { text, usage, model } = await respondText({ ...opts, json: opts.json ?? true });
  return { data: JSON.parse(text || "{}"), usage, model };
}

// server/services/openaiImages.ts
import { createHash } from "crypto";
var MAX_N = 10;
var MIME = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
  gif: "image/gif"
};
function hashSafetyIdentifier(userId) {
  return createHash("sha256").update(userId).digest("hex");
}
function common(opts) {
  const body = {
    model: opts.model ? imageModel(opts.model) : imageModel(opts.tier ?? "fast"),
    prompt: opts.prompt,
    n: Math.min(MAX_N, Math.max(1, Math.floor(opts.n ?? 1)))
  };
  if (opts.size) body.size = opts.size;
  if (opts.quality) body.quality = opts.quality;
  if (opts.complexity) body.complexity = opts.complexity;
  if (opts.outputFormat) body.output_format = opts.outputFormat;
  if (opts.outputFormat === "svg") body.n = 1;
  if (opts.userId) body.safety_identifier = hashSafetyIdentifier(opts.userId);
  return body;
}
function buildGenerateRequest(opts) {
  const body = common(opts);
  if (opts.background) body.background = opts.background;
  return body;
}
function parseImages(response, outputFormat) {
  const mimeType = MIME[outputFormat ?? "png"] ?? "image/png";
  const images = (response?.data ?? []).filter((d) => typeof d?.b64_json === "string" && d.b64_json.length > 0).map((d) => ({ b64: d.b64_json, mimeType }));
  if (!images.length) throw new Error("No image returned from OpenAI");
  return images;
}
function requireClient2(client) {
  const c = client ?? getOpenAIClient();
  if (!c) throw new Error("OpenAI not configured");
  return c;
}
async function generateImages(opts) {
  const client = requireClient2(opts.client);
  const response = await client.images.generate(buildGenerateRequest(opts));
  return parseImages(response, opts.outputFormat);
}

// server/jobs/aiJobs.ts
var AI_JOB_KINDS = ["bulk_lead_score", "image_generate_hq", "batch_respond"];
var IMAGE_BUCKET = "generated-images";
var JOB_CONCURRENCY = 3;
var MAX_CONTACTS = 200;
var MAX_PROMPTS = 100;
var defaultDeps = { respondJson, respondText, generateImages };
var cachedAdmin = null;
function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  return cachedAdmin ??= createClient(url, key, { auth: { persistSession: false } });
}
function validateJobInput(kind, input) {
  if (!AI_JOB_KINDS.includes(kind)) throw new Error(`Unknown job kind "${kind}"`);
  if (!input || typeof input !== "object") throw new Error("input must be an object");
  if (kind === "bulk_lead_score") {
    if (!Array.isArray(input.contacts) || !input.contacts.length) throw new Error("contacts must be a non-empty array");
    if (input.contacts.length > MAX_CONTACTS) throw new Error(`At most ${MAX_CONTACTS} contacts per job`);
    return { contacts: input.contacts };
  }
  if (kind === "batch_respond") {
    if (!Array.isArray(input.prompts) || !input.prompts.length) throw new Error("prompts must be a non-empty array");
    if (input.prompts.length > MAX_PROMPTS) throw new Error(`At most ${MAX_PROMPTS} prompts per job`);
    const prompts = input.prompts.map((p) => String(p?.prompt ?? p ?? ""));
    if (prompts.some((p) => !p.trim())) throw new Error("Every prompt must be non-empty");
    const maxOutputTokens = Number(input.maxOutputTokens) || 1e3;
    return { prompts, system: typeof input.system === "string" ? input.system : void 0, maxOutputTokens };
  }
  if (typeof input.prompt !== "string" || !input.prompt.trim()) throw new Error("prompt is required");
  const out = { prompt: input.prompt };
  for (const k of ["size", "quality", "complexity", "background", "outputFormat", "tier", "model"]) {
    if (typeof input[k] === "string") out[k] = input[k];
  }
  out.n = Math.min(4, Math.max(1, Math.floor(Number(input.n) || 1)));
  return out;
}
async function createAiJob(supabase, userId, kind, rawInput) {
  const input = validateJobInput(kind, rawInput);
  const { data, error } = await supabase.from("ai_jobs").insert({ user_id: userId, kind, input, status: "pending" }).select().single();
  if (error || !data) throw new Error(`Failed to create job: ${error?.message ?? "no row returned"}`);
  return data;
}
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}
var LEAD_SCORE_SYSTEM = "You are an expert sales analyst. Analyze the contact data and provide a lead score (0-100) with detailed rationale. Consider: engagement level, company fit, deal history, response patterns, and buying signals. Return JSON with: score (number), rationale (string), buyingSignals (array), riskFactors (array), recommendedActions (array), priority (hot/warm/cold).";
async function userClientFor(supabase, userId) {
  const { data } = await supabase.from("user_api_keys_openai").select("api_key").eq("user_id", userId).maybeSingle();
  return data?.api_key ? createUserClient(data.api_key) : void 0;
}
async function runBulkLeadScore(job, deps, client) {
  const contacts = job.input.contacts;
  const results = await mapLimit(contacts, JOB_CONCURRENCY, async (contact, index) => {
    try {
      const { data } = await deps.respondJson({
        tier: "fast",
        instructions: LEAD_SCORE_SYSTEM,
        input: `Analyze this contact for lead scoring: ${JSON.stringify(contact)}`,
        maxOutputTokens: 600,
        client
      });
      return { index, contactId: contact?.id ?? null, ok: true, data };
    } catch (e) {
      return { index, contactId: contact?.id ?? null, ok: false, error: e?.message ?? String(e) };
    }
  });
  const failed = results.filter((r) => !r.ok).length;
  if (failed === results.length) throw new Error(`All ${failed} lead scores failed: ${results[0].error}`);
  return { results, summary: { total: results.length, failed } };
}
async function runBatchRespond(job, deps, client) {
  const { prompts, system, maxOutputTokens } = job.input;
  const results = await mapLimit(prompts, JOB_CONCURRENCY, async (prompt, index) => {
    try {
      const { text } = await deps.respondText({
        tier: "default",
        instructions: system,
        input: prompt,
        maxOutputTokens,
        client
      });
      return { index, ok: true, text };
    } catch (e) {
      return { index, ok: false, error: e?.message ?? String(e) };
    }
  });
  const failed = results.filter((r) => !r.ok).length;
  if (failed === results.length) throw new Error(`All ${failed} prompts failed: ${results[0].error}`);
  return { results, summary: { total: results.length, failed } };
}
var EXT = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/gif": "gif"
};
async function runImageGenerate(job, deps, supabase, client) {
  const input = job.input;
  const images = await deps.generateImages({
    prompt: input.prompt,
    tier: input.tier ?? "quality",
    model: typeof input.model === "string" && input.model.startsWith("gpt-image-") ? input.model : void 0,
    size: input.size,
    quality: input.quality,
    complexity: input.complexity,
    background: input.background,
    outputFormat: input.outputFormat,
    n: input.n,
    userId: job.user_id,
    client
  });
  const urls = [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const path = `${job.user_id}/${job.id}-${i}.${EXT[img.mimeType] ?? "png"}`;
    const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, Buffer.from(img.b64, "base64"), { contentType: img.mimeType, upsert: true });
    if (error) throw new Error(`Image upload failed: ${error.message}`);
    urls.push(supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl);
  }
  return { images: urls.map((url, i) => ({ url, mimeType: images[i].mimeType })) };
}
async function update(supabase, id, patch) {
  const { error } = await supabase.from("ai_jobs").update({ ...patch, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id);
  if (error) throw new Error(`Failed to update job ${id}: ${error.message}`);
}
async function processAiJob(jobId, supabase = getAdminClient(), deps = defaultDeps) {
  const { data: job, error } = await supabase.from("ai_jobs").select("*").eq("id", jobId).single();
  if (error || !job) throw new Error(`Job ${jobId} not found`);
  const row = job;
  if (row.status !== "pending") return row.status;
  await update(supabase, jobId, { status: "running" });
  try {
    let result;
    const client = await userClientFor(supabase, row.user_id);
    if (row.kind === "bulk_lead_score") result = await runBulkLeadScore(row, deps, client);
    else if (row.kind === "batch_respond") result = await runBatchRespond(row, deps, client);
    else if (row.kind === "image_generate_hq") result = await runImageGenerate(row, deps, supabase, client);
    else throw new Error(`Unknown job kind "${row.kind}"`);
    await update(supabase, jobId, { status: "done", result, error: null });
    return "done";
  } catch (e) {
    await update(supabase, jobId, { status: "failed", error: e?.message ?? String(e) });
    return "failed";
  }
}
var handler = async (event) => {
  const secret = process.env.AI_JOBS_SECRET;
  const provided = event.headers?.["x-ai-jobs-secret"];
  if (!secret || provided !== secret) return { statusCode: 401, body: "Unauthorized" };
  let jobId;
  try {
    jobId = JSON.parse(event.body || "{}").jobId;
  } catch {
  }
  if (!jobId) return { statusCode: 400, body: "jobId required" };
  try {
    await processAiJob(jobId);
  } catch (e) {
    console.error("ai-jobs-background failed:", e?.message);
    return { statusCode: 500, body: "Job processing error" };
  }
  return { statusCode: 200, body: "ok" };
};
export {
  AI_JOB_KINDS,
  IMAGE_BUCKET,
  JOB_CONCURRENCY,
  MAX_CONTACTS,
  MAX_PROMPTS,
  createAiJob,
  getAdminClient,
  handler,
  processAiJob,
  validateJobInput
};
