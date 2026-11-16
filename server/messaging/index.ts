const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Minimal Twilio REST client (the `twilio` package is not a dependency, and require() is not
// available in the ESM function bundle). Same messages.create / messages.list shape as the SDK.
function twilioClient(accountSid: string, authToken: string) {
  const base = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const auth = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const toMessage = (m: any) => ({
    sid: m.sid,
    body: m.body,
    to: m.to,
    status: m.status,
    price: m.price,
    dateSent: m.date_sent,
    dateCreated: m.date_created,
  });
  return {
    messages: {
      async create(params: { body: string; from?: string; to: string; statusCallback?: string }) {
        const form = new URLSearchParams({ Body: params.body, To: params.to });
        if (params.from) form.set('From', params.from);
        if (params.statusCallback) form.set('StatusCallback', params.statusCallback);
        const res = await fetch(base, {
          method: 'POST',
          headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: form.toString(),
        });
        const data: any = await res.json();
        if (!res.ok) throw new Error(data.message || `Twilio error ${res.status}`);
        return toMessage(data);
      },
      async list(params: { limit?: number; dateSentAfter?: Date; dateSentBefore?: Date }) {
        const query = new URLSearchParams({ PageSize: String(Math.min(1000, params.limit || 50)) });
        if (params.dateSentAfter) query.set('DateSent>', params.dateSentAfter.toISOString().slice(0, 10));
        if (params.dateSentBefore) query.set('DateSent<', params.dateSentBefore.toISOString().slice(0, 10));
        const res = await fetch(`${base}?${query}`, { headers: { Authorization: auth } });
        const data: any = await res.json();
        if (!res.ok) throw new Error(data.message || `Twilio error ${res.status}`);
        return (data.messages || []).map(toMessage);
      },
    },
  };
}

export const handler = async (event: any, context: any) => {
  const { httpMethod, path, body, queryStringParameters } = event;
  const pathParts = path.split('/').filter(Boolean);

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // POST /api/messaging/send - Send SMS
    if (
      pathParts.length >= 2 &&
      pathParts[0] === 'messaging' &&
      pathParts[1] === 'send' &&
      httpMethod === 'POST'
    ) {
      const { content, recipient, provider, priority = 'medium' } = JSON.parse(body);

      if (!content || !recipient) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Content and recipient are required' }),
        };
      }

      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(recipient.replace(/\s+/g, ''))) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid phone number format' }),
        };
      }

      let messageResult;

      if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
        const twilio = twilioClient(twilioAccountSid, twilioAuthToken);

        const message: any = await twilio.messages.create({
          body: content,
          from: twilioPhoneNumber,
          to: recipient,
          statusCallback: `${process.env.SITE_URL || 'https://smartcrm-videoremix.replit.app'}/api/messaging/webhook/twilio`,
        });

        messageResult = {
          id: message.sid,
          status: message.status,
          provider: 'twilio',
          cost: message.price || 0,
          sentAt: new Date().toISOString(),
        };
      } else {
        // Previously reported a fake "sent" message when no SMS provider was configured
        return {
          statusCode: 501,
          headers,
          body: JSON.stringify({ error: 'SMS is not configured: set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: messageResult,
          status: 'SMS sent successfully',
        }),
      };
    }

    // POST /api/messaging/bulk - Send bulk SMS
    if (
      pathParts.length >= 2 &&
      pathParts[0] === 'messaging' &&
      pathParts[1] === 'bulk' &&
      httpMethod === 'POST'
    ) {
      const { messages, provider = 'twilio', batchSize = 10 } = JSON.parse(body);

      if (!Array.isArray(messages) || messages.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Messages array is required' }),
        };
      }

      if (messages.length > 1000) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Maximum 1000 messages per bulk send' }),
        };
      }

      const results = [];
      const errors = [];

      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);

        const batchPromises = batch.map(async (msg: any) => {
          try {
            const response = await fetch(
              `${process.env.SITE_URL || 'https://smartcrm-videoremix.replit.app'}/api/messaging/send`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  content: msg.content,
                  recipient: msg.recipient,
                  provider,
                  priority: msg.priority || 'medium',
                }),
              }
            );

            const result = await response.json();
            return { ...result, recipient: msg.recipient };
          } catch (error: any) {
            return {
              error: error.message,
              recipient: msg.recipient,
              success: false,
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        if (i + batchSize < messages.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
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
          summary: `${successful} sent successfully, ${failed} failed`,
        }),
      };
    }

    // GET /api/messaging/messages - Get message history
    if (
      pathParts.length >= 2 &&
      pathParts[0] === 'messaging' &&
      pathParts[1] === 'messages' &&
      httpMethod === 'GET'
    ) {
      const {
        limit = 50,
        offset = 0,
        status,
        provider,
        startDate,
        endDate,
      } = queryStringParameters || {};

      if (!twilioAccountSid || !twilioAuthToken) {
        return { statusCode: 501, headers, body: JSON.stringify({ error: 'SMS is not configured (Twilio)' }) };
      }
      // Real message log from Twilio (previously generated sample messages with random numbers)
      const twilio = twilioClient(twilioAccountSid, twilioAuthToken);
      const listed = await twilio.messages.list({
        limit: Math.min(1000, parseInt(limit) + parseInt(offset)),
        ...(startDate ? { dateSentAfter: new Date(startDate) } : {}),
        ...(endDate ? { dateSentBefore: new Date(endDate) } : {}),
      });
      const messages = listed
        .filter((m: any) => !status || m.status === status)
        .slice(parseInt(offset), parseInt(offset) + parseInt(limit))
        .map((m: any) => ({
          id: m.sid,
          content: m.body,
          recipient: m.to,
          provider: 'twilio',
          status: m.status,
          cost: m.price != null ? Math.abs(Number(m.price)) : null,
          sent_at: m.dateSent ? new Date(m.dateSent).toISOString() : null,
          created_at: m.dateCreated ? new Date(m.dateCreated).toISOString() : null,
        }));

      return { statusCode: 200, headers, body: JSON.stringify(messages) };
    }

    // GET /api/messaging/stats - Get messaging statistics
    if (
      pathParts.length >= 2 &&
      pathParts[0] === 'messaging' &&
      pathParts[1] === 'stats' &&
      httpMethod === 'GET'
    ) {
      const { period = '30d' } = queryStringParameters || {};

      if (!twilioAccountSid || !twilioAuthToken) {
        return { statusCode: 501, headers, body: JSON.stringify({ error: 'SMS is not configured (Twilio)' }) };
      }
      // Computed from the Twilio message log (previously random numbers)
      const days = parseInt(String(period)) || 30;
      const twilio = twilioClient(twilioAccountSid, twilioAuthToken);
      const recent = await twilio.messages.list({
        dateSentAfter: new Date(Date.now() - days * 86400000),
        limit: 5000,
      });
      const delivered = recent.filter((m: any) => m.status === 'delivered').length;
      const totalCost = recent.reduce((sum: number, m: any) => sum + Math.abs(Number(m.price) || 0), 0);
      const stats = {
        totalMessages: recent.length,
        deliveredMessages: delivered,
        deliveryRate: recent.length ? delivered / recent.length : null,
        averageResponseTime: null, // not tracked
        totalCost,
        costPerMessage: recent.length ? totalCost / recent.length : null,
        activeProviders: 1,
        period,
      };

      return { statusCode: 200, headers, body: JSON.stringify(stats) };
    }

    // GET /api/messaging/providers - Get available providers
    if (
      pathParts.length >= 2 &&
      pathParts[0] === 'messaging' &&
      pathParts[1] === 'providers' &&
      httpMethod === 'GET'
    ) {
      // Only Twilio is integrated; no invented cost/delivery/latency figures
      const providers = [
        {
          id: 'twilio',
          name: 'Twilio',
          apiKey: twilioAccountSid ? 'configured' : null,
          supportedFeatures: ['SMS'],
          status: twilioAccountSid && twilioAuthToken && twilioPhoneNumber ? 'active' : 'inactive',
        },
      ];

      return { statusCode: 200, headers, body: JSON.stringify(providers) };
    }

    // POST /api/messaging/webhook/twilio - Twilio webhook
    if (
      pathParts.length >= 3 &&
      pathParts[0] === 'messaging' &&
      pathParts[1] === 'webhook' &&
      pathParts[2] === 'twilio' &&
      httpMethod === 'POST'
    ) {
      const { MessageSid, MessageStatus, To, From, Body, Price } = JSON.parse(body);

      console.log(`📱 Twilio webhook: ${MessageSid} - ${MessageStatus}`);

      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // POST /api/messaging/test/:provider - Test provider connection
    if (
      pathParts.length >= 3 &&
      pathParts[0] === 'messaging' &&
      pathParts[1] === 'test' &&
      httpMethod === 'POST'
    ) {
      const { provider } = { provider: pathParts[2] };
      const { phoneNumber } = JSON.parse(body);

      if (!phoneNumber) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Phone number is required for testing' }),
        };
      }

      let testResult;

      switch (provider) {
        case 'twilio':
          if (!twilioAccountSid || !twilioAuthToken) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Twilio credentials not configured' }),
            };
          }

          const twilio = twilioClient(twilioAccountSid, twilioAuthToken);
          const testMessage = await twilio.messages.create({
            body: 'SMS provider test message from SmartCRM',
            from: twilioPhoneNumber,
            to: phoneNumber,
          });

          testResult = {
            success: true,
            provider: 'twilio',
            messageId: testMessage.sid,
            status: testMessage.status,
          };
          break;

        default:
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: `Unsupported SMS provider: ${provider}` }),
          };
      }

      return { statusCode: 200, headers, body: JSON.stringify(testResult) };
    }

    // Not found
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Messaging endpoint not found' }),
    };
  } catch (error: any) {
    console.error('Messaging function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', message: error.message }),
    };
  }
};
