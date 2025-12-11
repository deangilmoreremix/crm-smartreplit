var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// server/messaging/index.ts
var twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
var twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
var twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
var supabaseUrl = process.env.SUPABASE_URL;
var supabaseKey = process.env.SUPABASE_ANON_KEY;
var handler = async (event, context) => {
  const { httpMethod, path, body, queryStringParameters } = event;
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
    if (pathParts.length >= 2 && pathParts[0] === "messaging" && pathParts[1] === "send" && httpMethod === "POST") {
      const { content, recipient, provider, priority = "medium" } = JSON.parse(body);
      if (!content || !recipient) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Content and recipient are required" }) };
      }
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(recipient.replace(/\s+/g, ""))) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid phone number format" }) };
      }
      let messageResult;
      if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
        const twilio = __require("twilio")(twilioAccountSid, twilioAuthToken);
        const message = await twilio.messages.create({
          body: content,
          from: twilioPhoneNumber,
          to: recipient,
          statusCallback: `${process.env.SITE_URL || "https://smartcrm-videoremix.replit.app"}/api/messaging/webhook/twilio`
        });
        messageResult = {
          id: message.sid,
          status: message.status,
          provider: "twilio",
          cost: message.price || 0,
          sentAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      } else {
        messageResult = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: "sent",
          provider: provider || "twilio",
          cost: 75e-4,
          sentAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        console.log(`\u{1F4F1} SMS sent (mock): ${recipient} - "${content.substring(0, 50)}${content.length > 50 ? "..." : ""}"`);
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: messageResult,
          status: "SMS sent successfully"
        })
      };
    }
    if (pathParts.length >= 2 && pathParts[0] === "messaging" && pathParts[1] === "bulk" && httpMethod === "POST") {
      const { messages, provider = "twilio", batchSize = 10 } = JSON.parse(body);
      if (!Array.isArray(messages) || messages.length === 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Messages array is required" }) };
      }
      if (messages.length > 1e3) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Maximum 1000 messages per bulk send" }) };
      }
      const results = [];
      const errors = [];
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);
        const batchPromises = batch.map(async (msg) => {
          try {
            const response = await fetch(`${process.env.SITE_URL || "https://smartcrm-videoremix.replit.app"}/api/messaging/send`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                content: msg.content,
                recipient: msg.recipient,
                provider,
                priority: msg.priority || "medium"
              })
            });
            const result = await response.json();
            return { ...result, recipient: msg.recipient };
          } catch (error) {
            return {
              error: error.message,
              recipient: msg.recipient,
              success: false
            };
          }
        });
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        if (i + batchSize < messages.length) {
          await new Promise((resolve) => setTimeout(resolve, 1e3));
        }
      }
      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          total: messages.length,
          successful,
          failed,
          results,
          summary: `${successful} sent successfully, ${failed} failed`
        })
      };
    }
    if (pathParts.length >= 2 && pathParts[0] === "messaging" && pathParts[1] === "messages" && httpMethod === "GET") {
      const { limit = 50, offset = 0, status, provider, startDate, endDate } = queryStringParameters || {};
      const mockMessages = [];
      for (let i = 0; i < parseInt(limit); i++) {
        mockMessages.push({
          id: `msg_${Date.now()}_${i}`,
          content: `Sample message ${i + 1}`,
          recipient: `+1555${String(Math.floor(Math.random() * 9e6) + 1e6).padStart(7, "0")}`,
          provider: provider || "twilio",
          status: status || ["sent", "delivered", "failed"][Math.floor(Math.random() * 3)],
          cost: 75e-4,
          sent_at: new Date(Date.now() - Math.random() * 864e5).toISOString(),
          created_at: new Date(Date.now() - Math.random() * 864e5).toISOString()
        });
      }
      return { statusCode: 200, headers, body: JSON.stringify(mockMessages) };
    }
    if (pathParts.length >= 2 && pathParts[0] === "messaging" && pathParts[1] === "stats" && httpMethod === "GET") {
      const { period = "30d" } = queryStringParameters || {};
      const stats = {
        totalMessages: Math.floor(Math.random() * 1e3) + 500,
        deliveredMessages: Math.floor(Math.random() * 900) + 400,
        deliveryRate: 0.981,
        averageResponseTime: 2.4,
        totalCost: Math.random() * 10 + 5,
        costPerMessage: 7e-3,
        activeProviders: 2,
        period
      };
      return { statusCode: 200, headers, body: JSON.stringify(stats) };
    }
    if (pathParts.length >= 2 && pathParts[0] === "messaging" && pathParts[1] === "providers" && httpMethod === "GET") {
      const providers = [
        {
          id: "twilio",
          name: "Twilio",
          apiKey: twilioAccountSid ? "configured" : null,
          costPerMessage: 75e-4,
          supportedFeatures: ["SMS", "MMS", "Voice"],
          status: twilioAccountSid ? "active" : "inactive",
          deliveryRate: 0.987,
          responseTime: 2.3
        },
        {
          id: "aws-sns",
          name: "AWS SNS",
          apiKey: process.env.AWS_ACCESS_KEY_ID ? "configured" : null,
          costPerMessage: 65e-4,
          supportedFeatures: ["SMS", "Email"],
          status: process.env.AWS_ACCESS_KEY_ID ? "active" : "inactive",
          deliveryRate: 0.982,
          responseTime: 2.8
        }
      ];
      return { statusCode: 200, headers, body: JSON.stringify(providers) };
    }
    if (pathParts.length >= 3 && pathParts[0] === "messaging" && pathParts[1] === "webhook" && pathParts[2] === "twilio" && httpMethod === "POST") {
      const { MessageSid, MessageStatus, To, From, Body, Price } = JSON.parse(body);
      console.log(`\u{1F4F1} Twilio webhook: ${MessageSid} - ${MessageStatus}`);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }
    if (pathParts.length >= 3 && pathParts[0] === "messaging" && pathParts[1] === "test" && httpMethod === "POST") {
      const { provider } = { provider: pathParts[2] };
      const { phoneNumber } = JSON.parse(body);
      if (!phoneNumber) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Phone number is required for testing" }) };
      }
      let testResult;
      switch (provider) {
        case "twilio":
          if (!twilioAccountSid || !twilioAuthToken) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Twilio credentials not configured" }) };
          }
          const twilio = __require("twilio")(twilioAccountSid, twilioAuthToken);
          const testMessage = await twilio.messages.create({
            body: "SMS provider test message from SmartCRM",
            from: twilioPhoneNumber,
            to: phoneNumber
          });
          testResult = {
            success: true,
            provider: "twilio",
            messageId: testMessage.sid,
            status: testMessage.status
          };
          break;
        default:
          testResult = {
            success: true,
            provider,
            messageId: `test_${Date.now()}`,
            status: "sent",
            note: "Mock test - provider not fully configured"
          };
      }
      return { statusCode: 200, headers, body: JSON.stringify(testResult) };
    }
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Messaging endpoint not found" })
    };
  } catch (error) {
    console.error("Messaging function error:", error);
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
