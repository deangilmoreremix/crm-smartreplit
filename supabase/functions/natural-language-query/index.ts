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
    const { query, contextData, customerId, model } = body;
    
    // Validate input
    if (!query || !contextData) {
      return c.json({ error: "Invalid or missing query or context data" }, { status: 400, headers: corsHeaders });
    }
    
    // Get API keys from environment variables
    const googleApiKey = Deno.env.get("GOOGLE_AI_API_KEY");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    
    // Determine which API to use based on model or available keys
    const useOpenAI = model?.toLowerCase().includes("gpt") || 
                     (!googleApiKey && openaiApiKey);
    
    // Prepare system prompt for the natural language query
    const systemPrompt = `You are a CRM data analysis assistant that answers natural language questions about CRM data.
    You'll be given a natural language query and CRM data context. Your task is to interpret the query and provide insights based on the data.
    Respond with a JSON object containing 'response' (your answer) and 'explanation' (how you arrived at the answer).`;
    
    // Prepare the query prompt
    const queryPrompt = `Natural language query: "${query}"
    
    CRM data context:
    ${JSON.stringify(contextData, null, 2)}
    
    Analyze the data and answer the query. If the query cannot be answered with the provided data, explain why.`;
    
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
              content: systemPrompt
            },
            {
              role: "user",
              content: queryPrompt
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 800,
          temperature: 0.3
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
              text: `${systemPrompt}\n\n${queryPrompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 800
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
    if (!result.response) {
      result = {
        response: result.response || result.answer || "No clear answer could be generated",
        explanation: result.explanation || result.reasoning || "No explanation provided"
      };
    }

    return c.json(result, { headers: corsHeaders });
  } catch (error) {
    console.error("Error in natural-language-query:", error);
    return c.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});

serve(app);