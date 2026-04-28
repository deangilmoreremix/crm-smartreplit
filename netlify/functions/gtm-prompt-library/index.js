// netlify/functions/gtm-prompt-library/index.mjs
import { createClient } from "@supabase/supabase-js";
var supabase = null;
function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabase;
}
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
function createResponse(data, statusCode = 200) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(data)
  };
}
async function getUserFromToken(token) {
  try {
    const supabase2 = getSupabaseClient();
    const { data: { user }, error } = await supabase2.auth.getUser(token);
    if (error || !user) {
      throw new Error("Invalid token");
    }
    return user;
  } catch (error) {
    throw new Error("Authentication failed");
  }
}
async function handler(event, context) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ""
    };
  }
  if (event.httpMethod !== "POST") {
    return createResponse({ error: "Method not allowed" }, 405);
  }
  try {
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return createResponse({ error: "Missing or invalid authorization header" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");
    const user = await getUserFromToken(token);
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (error) {
      return createResponse({ error: "Invalid JSON in request body" }, 400);
    }
    const { action } = requestBody;
    if (!action) {
      return createResponse({ error: "Missing action parameter" }, 400);
    }
    switch (action) {
      case "dashboard":
        return await handleDashboard(user.id);
      case "performance":
        return await handlePerformance(user.id, requestBody);
      case "revenue":
        return await handleRevenue(user.id, requestBody);
      case "create_ab_test":
        return await handleCreateABTest(user.id, requestBody);
      case "get_ab_tests":
        return await handleGetABTests(user.id);
      case "update_ab_test":
        return await handleUpdateABTest(user.id, requestBody);
      case "track_response":
        return await handleTrackResponse(user.id, requestBody);
      default:
        return createResponse({ error: "Unknown action" }, 400);
    }
  } catch (error) {
    console.error("Function error:", error);
    return createResponse({
      error: error.message || "Internal server error"
    }, 500);
  }
}
async function handleDashboard(userId) {
  try {
    const supabase2 = getSupabaseClient();
    const { data: performanceData, error: perfError } = await supabase2.from("prompt_performance_metrics").select("performance_score, tokens_used, cost, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(100);
    if (perfError) {
      console.error("Performance query error:", perfError);
      return createResponse({ error: "Failed to fetch performance data" }, 500);
    }
    const { data: responseData, error: respError } = await supabase2.from("prompt_responses").select("quality_score, revenue_attributed, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(100);
    if (respError) {
      console.error("Response query error:", respError);
      return createResponse({ error: "Failed to fetch response data" }, 500);
    }
    const totalPrompts = performanceData?.length || 0;
    const avgPerformanceScore = performanceData?.length > 0 ? performanceData.reduce((sum, item) => sum + (item.performance_score || 0), 0) / performanceData.length : 0;
    const totalTokens = performanceData?.reduce((sum, item) => sum + (item.tokens_used || 0), 0) || 0;
    const totalCost = performanceData?.reduce((sum, item) => sum + (item.cost || 0), 0) || 0;
    const totalResponses = responseData?.length || 0;
    const avgQualityScore = responseData?.length > 0 ? responseData.reduce((sum, item) => sum + (item.quality_score || 0), 0) / responseData.length : 0;
    const totalRevenue = responseData?.reduce((sum, item) => sum + (item.revenue_attributed || 0), 0) || 0;
    const sevenDaysAgo = /* @__PURE__ */ new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentPerformance = performanceData?.filter(
      (item) => new Date(item.created_at) > sevenDaysAgo
    ) || [];
    const recentResponses = responseData?.filter(
      (item) => new Date(item.created_at) > sevenDaysAgo
    ) || [];
    const threeDaysAgo = /* @__PURE__ */ new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const last3Days = performanceData?.filter(
      (item) => new Date(item.created_at) > threeDaysAgo
    ) || [];
    const prev4Days = performanceData?.filter((item) => {
      const date = new Date(item.created_at);
      return date <= threeDaysAgo && date > sevenDaysAgo;
    }) || [];
    const recentAvgScore = last3Days.length > 0 ? last3Days.reduce((sum, item) => sum + (item.performance_score || 0), 0) / last3Days.length : 0;
    const prevAvgScore = prev4Days.length > 0 ? prev4Days.reduce((sum, item) => sum + (item.performance_score || 0), 0) / prev4Days.length : 0;
    const scoreTrend = prevAvgScore > 0 ? (recentAvgScore - prevAvgScore) / prevAvgScore * 100 : 0;
    return createResponse({
      dashboard: {
        overview: {
          totalPrompts,
          totalResponses,
          avgPerformanceScore: Number(avgPerformanceScore.toFixed(2)),
          avgQualityScore: Number(avgQualityScore.toFixed(2)),
          totalTokens,
          totalCost: Number(totalCost.toFixed(4)),
          totalRevenue: Number(totalRevenue.toFixed(2))
        },
        recentActivity: {
          promptsLast7Days: recentPerformance.length,
          responsesLast7Days: recentResponses.length,
          scoreTrend: Number(scoreTrend.toFixed(1))
        },
        recentData: {
          performance: performanceData?.slice(0, 10) || [],
          responses: responseData?.slice(0, 10) || []
        }
      }
    });
  } catch (error) {
    console.error("Dashboard handler error:", error);
    return createResponse({ error: "Internal server error" }, 500);
  }
}
async function handlePerformance(userId, requestBody) {
  try {
    const supabase2 = getSupabaseClient();
    const { timeRange = "30d" } = requestBody;
    const now = /* @__PURE__ */ new Date();
    let startDate;
    switch (timeRange) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1e3);
        break;
      default:
        return createResponse({ error: "Invalid timeRange. Use 7d, 30d, or 90d" }, 400);
    }
    const { data: performanceData, error: perfError } = await supabase2.from("prompt_performance_metrics").select("performance_score, tokens_used, cost, category, created_at").eq("user_id", userId).gte("created_at", startDate.toISOString()).order("created_at", { ascending: false });
    if (perfError) {
      console.error("Performance query error:", perfError);
      return createResponse({ error: "Failed to fetch performance data" }, 500);
    }
    const { data: responseData, error: respError } = await supabase2.from("prompt_responses").select("quality_score, revenue_attributed, category, created_at").eq("user_id", userId).gte("created_at", startDate.toISOString()).order("created_at", { ascending: false });
    if (respError) {
      console.error("Response query error:", respError);
      return createResponse({ error: "Failed to fetch response data" }, 500);
    }
    const totalPrompts = performanceData?.length || 0;
    const avgPerformanceScore = totalPrompts > 0 ? performanceData.reduce((sum, item) => sum + (item.performance_score || 0), 0) / totalPrompts : 0;
    const totalTokens = performanceData?.reduce((sum, item) => sum + (item.tokens_used || 0), 0) || 0;
    const totalCost = performanceData?.reduce((sum, item) => sum + (item.cost || 0), 0) || 0;
    const totalResponses = responseData?.length || 0;
    const avgQualityScore = totalResponses > 0 ? responseData.reduce((sum, item) => sum + (item.quality_score || 0), 0) / totalResponses : 0;
    const totalRevenue = responseData?.reduce((sum, item) => sum + (item.revenue_attributed || 0), 0) || 0;
    const dailyStats = {};
    const categoryStats = {};
    performanceData?.forEach((item) => {
      const date = new Date(item.created_at).toISOString().split("T")[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          prompts: 0,
          avgScore: 0,
          totalTokens: 0,
          totalCost: 0,
          scores: []
        };
      }
      dailyStats[date].prompts++;
      dailyStats[date].totalTokens += item.tokens_used || 0;
      dailyStats[date].totalCost += item.cost || 0;
      if (item.performance_score !== null) {
        dailyStats[date].scores.push(item.performance_score);
      }
      const category = item.category || "uncategorized";
      if (!categoryStats[category]) {
        categoryStats[category] = {
          category,
          count: 0,
          avgScore: 0,
          totalTokens: 0,
          totalCost: 0,
          scores: []
        };
      }
      categoryStats[category].count++;
      categoryStats[category].totalTokens += item.tokens_used || 0;
      categoryStats[category].totalCost += item.cost || 0;
      if (item.performance_score !== null) {
        categoryStats[category].scores.push(item.performance_score);
      }
    });
    responseData?.forEach((item) => {
      const date = new Date(item.created_at).toISOString().split("T")[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          responses: 0,
          avgQuality: 0,
          totalRevenue: 0,
          qualityScores: []
        };
      }
      dailyStats[date].responses = (dailyStats[date].responses || 0) + 1;
      dailyStats[date].totalRevenue = (dailyStats[date].totalRevenue || 0) + (item.revenue_attributed || 0);
      if (item.quality_score !== null) {
        dailyStats[date].qualityScores = dailyStats[date].qualityScores || [];
        dailyStats[date].qualityScores.push(item.quality_score);
      }
    });
    Object.values(dailyStats).forEach((day) => {
      if (day.scores && day.scores.length > 0) {
        day.avgScore = day.scores.reduce((sum, score) => sum + score, 0) / day.scores.length;
      }
      if (day.qualityScores && day.qualityScores.length > 0) {
        day.avgQuality = day.qualityScores.reduce((sum, score) => sum + score, 0) / day.qualityScores.length;
      }
      delete day.scores;
      delete day.qualityScores;
    });
    Object.values(categoryStats).forEach((cat) => {
      if (cat.scores && cat.scores.length > 0) {
        cat.avgScore = cat.scores.reduce((sum, score) => sum + score, 0) / cat.scores.length;
      }
      delete cat.scores;
    });
    return createResponse({
      performance: {
        timeRange,
        summary: {
          totalPrompts,
          avgPerformanceScore: Number(avgPerformanceScore.toFixed(2)),
          totalTokens,
          totalCost: Number(totalCost.toFixed(4)),
          totalResponses,
          avgQualityScore: Number(avgQualityScore.toFixed(2)),
          totalRevenue: Number(totalRevenue.toFixed(2))
        },
        trends: {
          daily: Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date)),
          categories: Object.values(categoryStats)
        }
      }
    });
  } catch (error) {
    console.error("Performance handler error:", error);
    return createResponse({ error: "Internal server error" }, 500);
  }
}
async function handleRevenue(userId, requestBody) {
  try {
    const supabase2 = getSupabaseClient();
    const { timeRange = "30d" } = requestBody;
    const now = /* @__PURE__ */ new Date();
    let startDate;
    switch (timeRange) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1e3);
        break;
      default:
        return createResponse({ error: "Invalid timeRange. Use 7d, 30d, or 90d" }, 400);
    }
    const { data: responseData, error: respError } = await supabase2.from("prompt_responses").select("revenue_attributed, quality_score, category, created_at").eq("user_id", userId).gte("created_at", startDate.toISOString()).order("created_at", { ascending: false });
    if (respError) {
      console.error("Response query error:", respError);
      return createResponse({ error: "Failed to fetch response data" }, 500);
    }
    const { data: performanceData, error: perfError } = await supabase2.from("prompt_performance_metrics").select("cost, tokens_used, category, created_at").eq("user_id", userId).gte("created_at", startDate.toISOString()).order("created_at", { ascending: false });
    if (perfError) {
      console.error("Performance query error:", perfError);
      return createResponse({ error: "Failed to fetch performance data" }, 500);
    }
    const totalRevenue = responseData?.reduce((sum, item) => sum + (item.revenue_attributed || 0), 0) || 0;
    const totalResponses = responseData?.length || 0;
    const avgRevenuePerResponse = totalResponses > 0 ? totalRevenue / totalResponses : 0;
    const totalCost = performanceData?.reduce((sum, item) => sum + (item.cost || 0), 0) || 0;
    const totalTokens = performanceData?.reduce((sum, item) => sum + (item.tokens_used || 0), 0) || 0;
    const roi = totalCost > 0 ? (totalRevenue - totalCost) / totalCost * 100 : 0;
    const profit = totalRevenue - totalCost;
    const revenueByCategory = {};
    responseData?.forEach((item) => {
      const category = item.category || "uncategorized";
      if (!revenueByCategory[category]) {
        revenueByCategory[category] = {
          category,
          revenue: 0,
          responses: 0,
          avgRevenue: 0
        };
      }
      revenueByCategory[category].revenue += item.revenue_attributed || 0;
      revenueByCategory[category].responses++;
    });
    Object.values(revenueByCategory).forEach((cat) => {
      cat.avgRevenue = cat.responses > 0 ? cat.revenue / cat.responses : 0;
    });
    const costByCategory = {};
    performanceData?.forEach((item) => {
      const category = item.category || "uncategorized";
      if (!costByCategory[category]) {
        costByCategory[category] = {
          category,
          cost: 0,
          tokens: 0,
          prompts: 0
        };
      }
      costByCategory[category].cost += item.cost || 0;
      costByCategory[category].tokens += item.tokens_used || 0;
      costByCategory[category].prompts++;
    });
    const highValueResponses = responseData?.filter((item) => (item.revenue_attributed || 0) > avgRevenuePerResponse) || [];
    const highQualityResponses = responseData?.filter((item) => (item.quality_score || 0) > 0.8) || [];
    let qualityRevenueCorrelation = 0;
    if (responseData && responseData.length > 1) {
      const qualityScores = responseData.map((item) => item.quality_score || 0);
      const revenues = responseData.map((item) => item.revenue_attributed || 0);
      const qualityMean = qualityScores.reduce((sum, val) => sum + val, 0) / qualityScores.length;
      const revenueMean = revenues.reduce((sum, val) => sum + val, 0) / revenues.length;
      const numerator = qualityScores.reduce((sum, q, i) => sum + (q - qualityMean) * (revenues[i] - revenueMean), 0);
      const qualityVariance = qualityScores.reduce((sum, q) => sum + Math.pow(q - qualityMean, 2), 0);
      const revenueVariance = revenues.reduce((sum, r) => sum + Math.pow(r - revenueMean, 2), 0);
      const denominator = Math.sqrt(qualityVariance * revenueVariance);
      qualityRevenueCorrelation = denominator > 0 ? numerator / denominator : 0;
    }
    return createResponse({
      revenue: {
        timeRange,
        summary: {
          totalRevenue: Number(totalRevenue.toFixed(2)),
          totalCost: Number(totalCost.toFixed(4)),
          profit: Number(profit.toFixed(2)),
          roi: Number(roi.toFixed(2)),
          totalResponses,
          avgRevenuePerResponse: Number(avgRevenuePerResponse.toFixed(2)),
          totalTokens
        },
        attribution: {
          highValueResponses: highValueResponses.length,
          highQualityResponses: highQualityResponses.length,
          qualityRevenueCorrelation: Number(qualityRevenueCorrelation.toFixed(3))
        },
        breakdown: {
          byCategory: {
            revenue: Object.values(revenueByCategory),
            cost: Object.values(costByCategory)
          }
        }
      }
    });
  } catch (error) {
    console.error("Revenue handler error:", error);
    return createResponse({ error: "Internal server error" }, 500);
  }
}
async function handleCreateABTest(userId, requestBody) {
  try {
    const supabase2 = getSupabaseClient();
    const { name, description, promptA, promptB, category } = requestBody;
    if (!name || !promptA || !promptB) {
      return createResponse({
        error: "Missing required fields: name, promptA, promptB are required"
      }, 400);
    }
    if (name.length > 100) {
      return createResponse({ error: "Name must be 100 characters or less" }, 400);
    }
    if (description && description.length > 500) {
      return createResponse({ error: "Description must be 500 characters or less" }, 400);
    }
    if (promptA.length > 1e4 || promptB.length > 1e4) {
      return createResponse({ error: "Prompts must be 10,000 characters or less" }, 400);
    }
    const { data, error } = await supabase2.from("prompt_ab_tests").insert({
      user_id: userId,
      name: name.trim(),
      description: description?.trim(),
      prompt_a: promptA.trim(),
      prompt_b: promptB.trim(),
      category: category?.trim(),
      status: "active"
    }).select().single();
    if (error) {
      console.error("Create A/B test error:", error);
      return createResponse({ error: "Failed to create A/B test" }, 500);
    }
    return createResponse({
      ab_test: data
    });
  } catch (error) {
    console.error("Create A/B test handler error:", error);
    return createResponse({ error: "Internal server error" }, 500);
  }
}
async function handleGetABTests(userId) {
  try {
    const supabase2 = getSupabaseClient();
    const { data, error } = await supabase2.from("prompt_ab_tests").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) {
      console.error("Get A/B tests error:", error);
      return createResponse({ error: "Failed to fetch A/B tests" }, 500);
    }
    return createResponse({
      ab_tests: data || []
    });
  } catch (error) {
    console.error("Get A/B tests handler error:", error);
    return createResponse({ error: "Internal server error" }, 500);
  }
}
async function handleUpdateABTest(userId, requestBody) {
  try {
    const supabase2 = getSupabaseClient();
    const { testId, updates } = requestBody;
    if (!testId || !updates) {
      return createResponse({
        error: "Missing required fields: testId and updates are required"
      }, 400);
    }
    const { data: existingTest, error: fetchError } = await supabase2.from("prompt_ab_tests").select("id").eq("id", testId).eq("user_id", userId).single();
    if (fetchError || !existingTest) {
      return createResponse({ error: "A/B test not found or access denied" }, 404);
    }
    const allowedFields = ["name", "description", "status", "winner", "a_responses", "b_responses", "a_score", "b_score"];
    const filteredUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (!allowedFields.includes(key)) {
        return createResponse({ error: `Invalid field: ${key}` }, 400);
      }
      if (key === "name" && (typeof value !== "string" || value.length > 100)) {
        return createResponse({ error: "Name must be a string of 100 characters or less" }, 400);
      }
      if (key === "description" && (typeof value !== "string" || value.length > 500)) {
        return createResponse({ error: "Description must be a string of 500 characters or less" }, 400);
      }
      if (key === "status" && !["active", "completed", "paused"].includes(value)) {
        return createResponse({ error: "Status must be active, completed, or paused" }, 400);
      }
      if (key === "winner" && value !== null && !["a", "b"].includes(value)) {
        return createResponse({ error: 'Winner must be null, "a", or "b"' }, 400);
      }
      if (["a_responses", "b_responses"].includes(key) && (typeof value !== "number" || value < 0)) {
        return createResponse({ error: `${key} must be a non-negative number` }, 400);
      }
      if (["a_score", "b_score"].includes(key) && (typeof value !== "number" || value < 0 || value > 1)) {
        return createResponse({ error: `${key} must be a number between 0 and 1` }, 400);
      }
      filteredUpdates[key] = value;
    }
    filteredUpdates.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    const { data, error } = await supabase2.from("prompt_ab_tests").update(filteredUpdates).eq("id", testId).eq("user_id", userId).select().single();
    if (error) {
      console.error("Update A/B test error:", error);
      return createResponse({ error: "Failed to update A/B test" }, 500);
    }
    return createResponse({
      ab_test: data
    });
  } catch (error) {
    console.error("Update A/B test handler error:", error);
    return createResponse({ error: "Internal server error" }, 500);
  }
}
async function handleTrackResponse(userId, requestBody) {
  try {
    const supabase2 = getSupabaseClient();
    const { promptId, responseText, qualityScore, revenueAttributed, category } = requestBody;
    if (!responseText || responseText.trim().length === 0) {
      return createResponse({ error: "responseText is required and cannot be empty" }, 400);
    }
    if (responseText.length > 5e4) {
      return createResponse({ error: "Response text must be 50,000 characters or less" }, 400);
    }
    if (qualityScore !== void 0 && (typeof qualityScore !== "number" || qualityScore < 0 || qualityScore > 1)) {
      return createResponse({ error: "qualityScore must be a number between 0 and 1" }, 400);
    }
    if (revenueAttributed !== void 0 && (typeof revenueAttributed !== "number" || revenueAttributed < 0)) {
      return createResponse({ error: "revenueAttributed must be a non-negative number" }, 400);
    }
    if (category && category.length > 100) {
      return createResponse({ error: "Category must be 100 characters or less" }, 400);
    }
    const { data, error } = await supabase2.from("prompt_responses").insert({
      user_id: userId,
      prompt_id: promptId,
      response_text: responseText.trim(),
      quality_score: qualityScore,
      revenue_attributed: revenueAttributed || 0,
      category: category?.trim()
    }).select().single();
    if (error) {
      console.error("Track response error:", error);
      return createResponse({ error: "Failed to track response" }, 500);
    }
    return createResponse({
      response: data
    });
  } catch (error) {
    console.error("Track response handler error:", error);
    return createResponse({ error: "Internal server error" }, 500);
  }
}
export {
  handler
};
