// netlify/functions/ai-proxy.js
var MIN_OUTPUT_TOKENS = 16;
var REASONING_HEADROOM = 1024;
function normalizeEffort(model, effort) {
  if (!effort) return void 0;
  if (effort === "minimal") return "low";
  if (effort === "none" && /^gpt-6(\.1)?-(astra|sol)/.test(model) && model !== "gpt-6-sol") return "low";
  return effort;
}
function buildOpenAIResponsesPayload({ model, messages, temperature, maxTokens, stream, reasoningEffort }) {
  const text = (c) => typeof c === "string" ? c : Array.isArray(c) ? c.map((p) => p?.text || "").join("") : String(c ?? "");
  const instructions = messages.filter((m) => m.role === "system" || m.role === "developer").map((m) => text(m.content)).join("\n\n");
  const input = messages.filter((m) => m.role !== "system" && m.role !== "developer").map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: text(m.content) }));
  const effort = normalizeEffort(model, reasoningEffort);
  const payload = { model, input, store: false };
  if (instructions) payload.instructions = instructions;
  if (effort) payload.reasoning = { effort };
  if (maxTokens) {
    const requested = effort && effort !== "none" ? maxTokens + REASONING_HEADROOM : maxTokens;
    payload.max_output_tokens = Math.max(MIN_OUTPUT_TOKENS, requested);
  }
  if (effort === "none" && temperature !== void 0) payload.temperature = temperature;
  if (stream) payload.stream = true;
  return payload;
}
function responsesOutputText(r) {
  if (typeof r?.output_text === "string") return r.output_text;
  let out = "";
  for (const item of r?.output || []) {
    if (item?.type !== "message") continue;
    for (const c of item.content || []) {
      if (c?.type === "output_text" && typeof c.text === "string") out += c.text;
    }
  }
  return out;
}
function responsesToChatCompletion(r, model) {
  const inTok = r?.usage?.input_tokens || 0;
  const outTok = r?.usage?.output_tokens || 0;
  return {
    id: r?.id || `openai-${Date.now()}`,
    object: "chat.completion",
    model: r?.model || model,
    choices: [{
      index: 0,
      message: { role: "assistant", content: responsesOutputText(r) },
      finish_reason: r?.status === "incomplete" ? "length" : "stop"
    }],
    usage: {
      prompt_tokens: inTok,
      completion_tokens: outTok,
      total_tokens: r?.usage?.total_tokens ?? inTok + outTok
    }
  };
}
function responsesStreamToChatStream(upstream, model) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const reader = upstream.getReader();
  let buffer = "";
  const chunk = (delta, finish) => encoder.encode(`data: ${JSON.stringify({
    object: "chat.completion.chunk",
    model,
    choices: [{ index: 0, delta, finish_reason: finish || null }]
  })}

`);
  const handleEvent = (block, controller) => {
    const dataLine = block.split("\n").find((l) => l.startsWith("data:"));
    if (!dataLine) return;
    let evt;
    try {
      evt = JSON.parse(dataLine.slice(5).trim());
    } catch {
      return;
    }
    if (evt.type === "response.output_text.delta" && evt.delta) {
      controller.enqueue(chunk({ content: evt.delta }));
    } else if (evt.type === "response.completed") {
      controller.enqueue(chunk({}, "stop"));
    } else if (evt.type === "response.incomplete") {
      controller.enqueue(chunk({}, "length"));
    }
  };
  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        if (buffer.trim()) handleEvent(buffer, controller);
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop();
      for (const b of blocks) handleEvent(b, controller);
    },
    cancel() {
      return reader.cancel();
    }
  });
}
var ai_proxy_default = async (request, context) => {
  try {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }
    const body = await request.json();
    const { provider = "openai", apiKey: userApiKey, model, messages, temperature, maxTokens, stream, reasoningEffort } = body || {};
    if (provider !== "openai") {
      return new Response(
        JSON.stringify({ error: `Unsupported provider: ${provider}. Only "openai" is supported.` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!model || !messages) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: model, messages" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const apiKey = userApiKey || process.env.SMARTCRM_OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "No OpenAI API key available. Please add your API key in Admin Settings \u2192 AI Provider Settings."
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const payload = buildOpenAIResponsesPayload({ model, messages, temperature, maxTokens, stream, reasoningEffort });
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6e4)
      // 60 second timeout
    });
    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({
          error: `Provider API error: ${response.status}`,
          details: errorText
        }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }
    if (stream) {
      return new Response(responsesStreamToChatStream(response.body, model), {
        status: 200,
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" }
      });
    }
    const responseData = await response.json();
    return new Response(
      JSON.stringify(responsesToChatCompletion(responseData, model)),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("AI proxy error:", err);
    return new Response(
      JSON.stringify({
        error: "AI proxy error",
        details: String(err)
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
export {
  ai_proxy_default as default
};
