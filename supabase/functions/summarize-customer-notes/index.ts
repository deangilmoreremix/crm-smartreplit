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
    const { notes, customerId, model } = body;
    
    // Validate input
    if (!notes || typeof notes !== "string") {
      return c.json({ error: "Invalid or missing notes" }, { status: 400, headers: corsHeaders });
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
              content: "You are a CRM assistant that summarizes customer notes clearly and concisely. Focus on key action items, sentiments, and important details."
            },
            {
              role: "user",
              content: `Summarize these customer notes: ${notes}`
            }
          ],
          max_tokens: 300,
          temperature: 0.3
        })
      });
      
      const data = await response.json();
      result = data.choices[0].message.content;
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
              text: `Summarize these customer notes concisely, focusing on key action items, sentiments, and important details: ${notes}`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 300
          }
        })
      });
      
      const data = await response.json();
      result = data.candidates[0].content.parts[0].text;
    } else {
      return c.json({ error: "No AI API keys available" }, { status: 500, headers: corsHeaders });
    }

    // Log usage to database if customerId is provided (optional)
    if (customerId) {
      // Code to log usage to Supabase
      // This would typically involve a Supabase client call
    }

    return c.json({ summary: result }, { headers: corsHeaders });
  } catch (error) {
    console.error("Error in summarize-customer-notes:", error);
    return c.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});

serve(app);