export default async (request, context) => {
  try {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const body = await request.json();
    const { provider, apiKey: userApiKey, model, messages, temperature, maxTokens, stream } = body || {};

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

    // Get the API key - prefer user-provided key, fall back to environment variable
    let apiKey = userApiKey;
    
    if (!apiKey) {
      // If no user-provided key, try environment variable
      const envVarName = `SMARTCRM_${provider.toUpperCase()}_API_KEY`;
      apiKey = process.env[envVarName];
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: `No API key available for provider: ${provider}. Please add your API key in Admin Settings → AI Provider Settings.`
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Route to appropriate provider
    let apiUrl = "";
    let headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    };

    switch (provider) {
      case "openai":
        apiUrl = "https://api.openai.com/v1/chat/completions";
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

    // Prepare request payload based on provider
    let payload = {};

    if (provider === "anthropic") {
      payload = {
        model,
        max_tokens: maxTokens || 4096,
        temperature: temperature || 0.7,
        messages
      };
    } else if (provider === "google") {
      payload = {
        contents: messages.map(msg => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }]
        })),
        generationConfig: {
          temperature: temperature || 0.7,
          maxOutputTokens: maxTokens || 4096
        }
      };
    } else {
      // OpenAI-compatible format (OpenAI, OpenRouter, Together, Groq)
      payload = {
        model,
        messages,
        temperature: temperature || 0.7,
        max_tokens: maxTokens,
        stream: stream || false
      };
    }

    // Make the API request
    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60000) // 60 second timeout
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

    const responseData = await response.json();

    // Normalize response format
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
    } else {
      // OpenAI-compatible format
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
