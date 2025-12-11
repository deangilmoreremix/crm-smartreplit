import { serve } from "npm:@hono/node-server";
import { Hono } from "npm:hono";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const app = new Hono();

// Handle CORS preflight requests
app.options("*", (c) => {
  return c.text("", { headers: corsHeaders });
});

app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { incomingEmail, context, customerId, model, tone, includeGreeting, includeSignature } = body;
    
    // Validate input
    if (!incomingEmail || typeof incomingEmail !== "string") {
      return c.json({ error: "Invalid or missing email" }, { status: 400, headers: corsHeaders });
    }
    
    // Get API keys from environment variables
    const googleApiKey = Deno.env.get("GOOGLE_AI_API_KEY");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    
    // Determine which API to use based on model or available keys
    const useOpenAI = model?.toLowerCase().includes("gpt") || 
                     (!googleApiKey && openaiApiKey);
    
    // Create email prompt with context
    const contactInfo = context?.contact ? 
      `Recipient: ${context.contact.name}
       Company: ${context.contact.company || 'N/A'}
       Position: ${context.contact.position || context.contact.title || 'N/A'}
       Relationship Status: ${context.relationship || 'New contact'}`
      : 'No contact information available';
      
    const dealsInfo = context?.deals?.length > 0 ?
      `Current Deals: ${context.deals.map((deal: any) => 
        `${deal.title} (${deal.stage}, $${deal.value})`
      ).join(', ')}`
      : 'No active deals';
    
    const emailTone = tone || 'professional';
    const withGreeting = includeGreeting === undefined ? true : includeGreeting;
    const withSignature = includeSignature === undefined ? true : includeSignature;
    
    const prompt = `Draft a ${emailTone} email response to this incoming email:
    
    "${incomingEmail}"
    
    Context about the recipient:
    ${contactInfo}
    ${dealsInfo}
    
    ${withGreeting ? 'Include a professional greeting.' : 'Skip the greeting.'}
    ${withSignature ? 'Include a professional signature.' : 'Skip the signature.'}
    
    Return your response as a JSON object with 'subject' and 'body' fields.`;
    
    let result;
    
    if (useOpenAI && openaiApiKey) {
      // Use OpenAI API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: model || "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are an email assistant that drafts professional, contextually appropriate email responses."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 1000,
          temperature: 0.5
        })
      });
      
      const data = await response.json();
      const jsonString = data.choices[0].message.content;
      result = JSON.parse(jsonString);
    } else if (googleApiKey) {
      // Use Google Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-1.5-flash"}:generateContent?key=${googleApiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an email assistant that drafts professional, contextually appropriate email responses. ${prompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 1000
          }
        })
      });
      
      const data = await response.json();
      const jsonString = data.candidates[0].content.parts[0].text;
      
      // Extract JSON from response (which might contain explanatory text)
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not extract valid JSON from AI response");
      }
    } else {
      return c.json({ error: "No AI API keys available" }, { status: 500, headers: corsHeaders });
    }

    // Ensure the result has the expected structure
    if (!result.subject || !result.body) {
      throw new Error("Invalid response format from AI service");
    }

    return c.json(result, { headers: corsHeaders });
  } catch (error) {
    console.error("Error in draft-email-response:", error);
    return c.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});

serve(app);