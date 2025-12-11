// server/auth/index.ts
var handler = async (event, context) => {
  const { httpMethod, path, body } = event;
  const pathParts = path.split("/").filter(Boolean);
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
  };
  if (httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }
  try {
    if (pathParts.length >= 2 && pathParts[0] === "auth" && pathParts[1] === "user-role" && httpMethod === "GET") {
      const devUser = {
        userId: "dev-user-12345",
        email: "dev@smartcrm.local",
        role: "super_admin"
      };
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: devUser
        })
      };
    }
    if (pathParts.length >= 2 && pathParts[0] === "auth" && pathParts[1] === "dev-bypass" && httpMethod === "POST") {
      const hostname = event.headers?.host || "";
      const isProductionDomain = hostname.includes("replit.app") || hostname.includes("smartcrm.vip");
      if (process.env.NODE_ENV !== "development" || isProductionDomain) {
        console.log("\u{1F512} Dev bypass blocked - ENV:", process.env.NODE_ENV, "Host:", hostname);
        return { statusCode: 404, headers, body: JSON.stringify({ error: "Not found" }) };
      }
      const devUser = {
        id: "dev-user-12345",
        email: "dev@smartcrm.local",
        username: "developer",
        firstName: "Development",
        lastName: "User",
        role: "super_admin",
        permissions: ["all"],
        tenantId: "development",
        status: "active",
        lastActive: (/* @__PURE__ */ new Date()).toISOString(),
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        app_context: "smartcrm"
      };
      const devSession = {
        access_token: "dev-bypass-token-" + Date.now(),
        refresh_token: "dev-bypass-refresh-" + Date.now(),
        expires_at: Date.now() + 24 * 60 * 60 * 1e3,
        user: devUser
      };
      console.log("\u2705 Dev bypass session created for:", devUser.email);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          user: devUser,
          session: devSession,
          hasAccess: true,
          permissions: ["all"]
        })
      };
    }
    if (pathParts.length === 1 && pathParts[0] === "auth-webhook" && httpMethod === "POST") {
      const { type, record } = JSON.parse(body);
      if (type === "INSERT" && record) {
        const appContext = record.raw_user_meta_data?.app_context || record.user_metadata?.app_context || "smartcrm";
        console.log(`\u{1F3AF} Email routing: ${record.email} \u2192 ${appContext} templates`, {
          userId: record.id,
          email: record.email,
          appContext,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          metadata: record.raw_user_meta_data || record.user_metadata
        });
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            appContext,
            message: `User routed to ${appContext} email templates`,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          })
        };
      } else {
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: "Event processed" }) };
      }
    }
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Auth endpoint not found" })
    };
  } catch (error) {
    console.error("Auth function error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error", message: error.message })
    };
  }
};
export {
  handler
};
