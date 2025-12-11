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
    const { leadData, customerId, model, pitchStyle } = body;
    
    // Validate input
    if (!leadData) {
      return c.json({ error: "Invalid or missing lead data" }, { status: 400, headers: corsHeaders });
    }
    
    // Get API keys from environment variables
    const googleApiKey = Deno.env.get("GOOGLE_AI_API_KEY");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    
    // Determine which API to use based on model or available keys
    const useOpenAI = model?.toLowerCase().includes("gpt") || 
                     (!googleApiKey && openaiApiKey);
    
    // Create prompt based on lead data and pitch style
    const style = pitchStyle || "professional";
    const prompt = `Create a personalized ${style} sales pitch for a lead with the following information:
      Name: ${leadData.name || 'Unknown'}
      Company: ${leadData.company || 'Unknown'}
      Position: ${leadData.position || 'Unknown'}
      Industry: ${leadData.industry || 'Unknown'}
      Pain points: ${leadData.painPoints || 'Unknown'}
      Interests: ${leadData.interests || 'Unknown'}
      Previous interactions: ${leadData.interactions || 'None'}
      
      The pitch should be concise, engaging, and highlight how our solution addresses their specific needs.`;
    
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
              content: "You are a skilled sales consultant creating personalized pitches based on lead information."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
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
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500
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
    }

    return c.json({ pitch: result }, { headers: corsHeaders });
  } catch (error) {
    console.error("Error in generate-sales-pitch:", error);
    return c.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});

serve(app);