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
    const { provider, apiKey: userApiKey, model, messages, temperature, maxTokens, stream, reasoningEffort } = body || {};
    if (!provider || !model || !messages) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: provider, model, messages"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    let apiKey = userApiKey;
    if (!apiKey) {
      const envVarName = `SMARTCRM_${provider.toUpperCase()}_API_KEY`;
      apiKey = process.env[envVarName];
    }
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: `No API key available for provider: ${provider}. Please add your API key in Admin Settings \u2192 AI Provider Settings.`
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    let apiUrl = "";
    let headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    };
    switch (provider) {
      case "openai":
        apiUrl = "https://api.openai.com/v1/responses";
        break;
      case "openrouter":
        apiUrl = "https://openrouter.ai/api/v1/chat/completions";
        break;
      case "anthropic":
        apiUrl = "https://api.anthropic.com/v1/messages";
        headers = {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        };
        break;
      case "google":
        apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        headers = { "Content-Type": "application/json" };
        break;
      case "together":
        apiUrl = "https://api.together.xyz/v1/chat/completions";
        break;
      case "groq":
        apiUrl = "https://api.groq.com/openai/v1/chat/completions";
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Unsupported provider: ${provider}` }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
    }
    let payload = {};
    if (provider === "anthropic") {
      payload = {
        model,
        max_tokens: maxTokens || 4096,
        temperature: temperature || 0.7,
        messages
      };
    } else if (provider === "openai") {
      payload = buildOpenAIResponsesPayload({ model, messages, temperature, maxTokens, stream, reasoningEffort });
    } else if (provider === "google") {
      payload = {
        contents: messages.map((msg) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }]
        })),
        generationConfig: {
          temperature: temperature || 0.7,
          maxOutputTokens: maxTokens || 4096
        }
      };
    } else {
      payload = {
        model,
        messages,
        temperature: temperature || 0.7,
        max_tokens: maxTokens,
        stream: stream || false
      };
    }
    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
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
        {
          status: response.status,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    if (provider === "openai" && stream) {
      return new Response(responsesStreamToChatStream(response.body, model), {
        status: 200,
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" }
      });
    }
    const responseData = await response.json();
    let normalizedResponse = {};
    if (provider === "anthropic") {
      normalizedResponse = {
        id: responseData.id || `anthropic-${Date.now()}`,
        model: responseData.model,
        choices: [{
          index: 0,
          message: {
            role: "assistant",
            content: responseData.content?.[0]?.text || ""
          },
          finish_reason: responseData.stop_reason
        }],
        usage: {
          prompt_tokens: responseData.usage?.input_tokens || 0,
          completion_tokens: responseData.usage?.output_tokens || 0,
          total_tokens: (responseData.usage?.input_tokens || 0) + (responseData.usage?.output_tokens || 0)
        }
      };
    } else if (provider === "google") {
      normalizedResponse = {
        id: `google-${Date.now()}`,
        model,
        choices: [{
          index: 0,
          message: {
            role: "assistant",
            content: responseData.candidates?.[0]?.content?.parts?.[0]?.text || ""
          },
          finish_reason: responseData.candidates?.[0]?.finishReason || "stop"
        }],
        usage: {
          prompt_tokens: responseData.usageMetadata?.promptTokenCount || 0,
          completion_tokens: responseData.usageMetadata?.candidatesTokenCount || 0,
          total_tokens: responseData.usageMetadata?.totalTokenCount || 0
        }
      };
    } else if (provider === "openai") {
      normalizedResponse = responsesToChatCompletion(responseData, model);
    } else {
      normalizedResponse = responseData;
    }
    return new Response(
      JSON.stringify(normalizedResponse),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (err) {
    console.error("AI proxy error:", err);
    return new Response(
      JSON.stringify({
        error: "AI proxy error",
        details: String(err)
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
export {
  ai_proxy_default as default
};
