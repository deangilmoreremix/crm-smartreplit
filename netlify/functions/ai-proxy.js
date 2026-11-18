// OpenAI relay used by Admin Settings → AI Provider Settings to test a user-supplied key.
// The caller always supplies their own OpenAI key; there is no server-side key.
const LEGACY_MODELS = {
  "gpt-4o-mini": "gpt-6-luna",
  "gpt-3.5-turbo": "gpt-6-luna",
  "gpt-4.1-mini": "gpt-6-luna",
  "gpt-4.1-nano": "gpt-6-luna",
  "o4-mini": "gpt-6-luna",
  "gpt-4o": "gpt-6.1-sol",
  "gpt-4": "gpt-6.1-sol",
  "gpt-4-turbo": "gpt-6.1-sol",
  "gpt-4.1": "gpt-6.1-sol",
  "o3": "gpt-6.1-sol",
  "gpt-5": "gpt-6.1-sol",
};

const json = (body, status) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export default async (request) => {
  try {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const body = await request.json();
    const { provider = "openai", apiKey, model, messages, maxTokens, stream } = body || {};

    if (provider !== "openai") {
      return json({ error: `Unsupported provider: ${provider}. Only OpenAI is supported.` }, 400);
    }
    if (!model || !messages) {
      return json({ error: "Missing required fields: model, messages" }, 400);
    }
    if (!apiKey) {
      return json({ error: "An OpenAI API key is required." }, 400);
    }

    // Current OpenAI models take max_completion_tokens and reject custom temperature
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: LEGACY_MODELS[model] || model,
        messages,
        ...(maxTokens ? { max_completion_tokens: maxTokens } : {}),
        stream: stream || false,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      return json({ error: `OpenAI API error: ${response.status}`, details: await response.text() }, response.status);
    }

    return json(await response.json(), 200);
  } catch (err) {
    console.error("AI proxy error:", err);
    return json({ error: "AI proxy error", details: String(err) }, 500);
  }
};
