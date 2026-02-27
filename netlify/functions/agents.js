export default async (request, context) => {
  try {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const body = await request.json();
    const { action, payload } = body || {};

    const AGENTS_BASE = process.env.AGENTS_API_BASE_URL; // e.g. https://agents.smartcrm.vip or http://localhost:8000
    const AGENTS_KEY = process.env.AGENTS_API_KEY;       // optional shared secret

    if (!AGENTS_BASE) {
      return new Response(
        JSON.stringify({ error: "Missing AGENTS_API_BASE_URL env var" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    let url = "";
    let method = "POST";
    let forwardBody = payload ?? {};

    if (action === "qualify_lead") {
      url = `${AGENTS_BASE}/api/agents/qualify-lead`;
    } else if (action === "analyze_email") {
      url = `${AGENTS_BASE}/api/agents/analyze-email`;
    } else if (action === "analyze_deal") {
      // requires deal_id in payload
      const dealId = payload?.deal_id;
      if (!dealId) {
        return new Response(
          JSON.stringify({ error: "payload.deal_id is required for analyze_deal" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      url = `${AGENTS_BASE}/api/agents/analyze-deal/${dealId}`;
      // If the endpoint only needs deal_id in path, forward body can be empty:
      forwardBody = payload?.context ?? {};
    } else if (action === "schedule_meeting") {
      url = `${AGENTS_BASE}/api/agents/schedule-meeting`;
    } else if (action === "generate_dashboard") {
      url = `${AGENTS_BASE}/api/agents/generate-dashboard`;
    } else {
      return new Response(
        JSON.stringify({ error: `Unknown action: ${action}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const headers = { "Content-Type": "application/json" };
    if (AGENTS_KEY) headers["X-SMARTCRM-KEY"] = AGENTS_KEY;

    const resp = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(forwardBody),
    });

    const text = await resp.text();
    return new Response(text, {
      status: resp.status,
      headers: { "Content-Type": resp.headers.get("content-type") || "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Agents gateway error", detail: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
