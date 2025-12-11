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
    const { tasks, customerId, model, criteria } = body;
    
    // Validate input
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return c.json({ error: "Invalid or missing tasks array" }, { status: 400, headers: corsHeaders });
    }
    
    // Get API keys from environment variables
    const googleApiKey = Deno.env.get("GOOGLE_AI_API_KEY");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    
    // Determine which API to use based on model or available keys
    const useOpenAI = model?.toLowerCase().includes("gpt") || 
                     (!googleApiKey && openaiApiKey);
    
    // Create a prompt that includes the prioritization criteria
    const criteriaDetails = criteria ? JSON.stringify(criteria, null, 2) : "Default balanced prioritization";
    
    const prompt = `Prioritize the following tasks based on these criteria: ${criteriaDetails}
    
    Tasks:
    ${JSON.stringify(tasks, null, 2)}
    
    Return a JSON object with:
    1. 'prioritizedTasks': An array of the tasks in priority order, with each task containing its original data plus a 'priority_score' (0-100) and 'priority_reason' explaining why it got that priority.
    2. 'reasoning': An array of strings explaining the overall prioritization logic.`;
    
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
              content: "You are a task prioritization assistant that helps organize and prioritize tasks based on various criteria."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 1000,
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
              text: `You are a task prioritization assistant. ${prompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
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
    if (!result.prioritizedTasks || !Array.isArray(result.prioritizedTasks)) {
      throw new Error("Invalid response format from AI service");
    }

    return c.json(result, { headers: corsHeaders });
  } catch (error) {
    console.error("Error in prioritize-tasks:", error);
    return c.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});

serve(app);