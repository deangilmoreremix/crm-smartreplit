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
    const { text, customerId, model } = body;
    
    // Validate input
    if (!text || typeof text !== "string") {
      return c.json({ error: "Invalid or missing text" }, { status: 400, headers: corsHeaders });
    }
    
    // Get API keys from environment variables
    const googleApiKey = Deno.env.get("GOOGLE_AI_API_KEY");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    
    // Determine which API to use based on model or available keys
    const useOpenAI = model?.toLowerCase().includes("gpt") || 
                     (!googleApiKey && openaiApiKey);
    
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
              content: "You are a sentiment analysis assistant. Analyze the sentiment of the given text and respond with a JSON object containing sentiment (positive, negative, or neutral), confidence score (0-100), and key emotional tones identified."
            },
            {
              role: "user",
              content: `Analyze the sentiment of this text: ${text}`
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 150,
          temperature: 0.2
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
              text: `Analyze the sentiment of this text and respond with a JSON object containing sentiment (positive, negative, or neutral), confidence score (0-100), and key emotional tones identified. Text: ${text}`
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 150
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

    // Add any additional processing or normalization of the sentiment result here
    if (!result.sentiment) {
      result = {
        sentiment: result.sentiment || "neutral",
        score: result.confidence || result.score || 50,
        tones: result.tones || result.emotional_tones || []
      };
    }

    return c.json(result, { headers: corsHeaders });
  } catch (error) {
    console.error("Error in analyze-sentiment:", error);
    return c.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});

serve(app);