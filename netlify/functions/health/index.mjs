var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  contacts: () => contacts
});
var contacts;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    contacts = pgTable("contacts", {
      id: serial("id").primaryKey(),
      firstName: text("first_name").notNull(),
      lastName: text("last_name").notNull(),
      email: text("email"),
      phone: text("phone"),
      company: text("company"),
      address: text("address"),
      city: text("city"),
      state: text("state"),
      zipCode: text("zip_code"),
      country: text("country"),
      industry: text("industry"),
      source: text("source"),
      tags: text("tags").array(),
      notes: text("notes"),
      status: text("status").default("active"),
      // AI contact enhancements
      score: decimal("score", { precision: 3, scale: 2 }).default("0.50"),
      // AI lead score (0.00-1.00)
      healthScore: integer("health_score"),
      // AI-calculated contact health (0-100)
      enrichmentData: jsonb("enrichment_data"),
      // AI enrichment data
      lastEnrichedAt: timestamp("last_enriched_at", { withTimezone: true }),
      // Last AI enrichment timestamp
      // LinkedIn integration
      linkedinUrl: text("linkedin_url"),
      linkedinData: jsonb("linkedin_data"),
      // Full LinkedIn profile data
      linkedinSyncedAt: timestamp("linkedin_synced_at"),
      // Last sync timestamp
      // Mailchimp integration
      mailchimpId: text("mailchimp_id"),
      // Mailchimp subscriber ID
      mailchimpEmailId: text("mailchimp_email_id"),
      // Mailchimp email ID
      mailchimpTags: text("mailchimp_tags").array(),
      // Tags applied to subscriber
      mailchimpStatus: text("mailchimp_status"),
      // subscribed, unsubscribed, cleaned, pending
      mailchimpMergeFields: jsonb("mailchimp_merge_fields"),
      // Merge fields (FNAME, LNAME, etc.)
      mailchimpStats: jsonb("mailchimp_stats"),
      // Open/click stats
      mailchimpSyncedAt: timestamp("mailchimp_synced_at"),
      // Last sync timestamp
      // Custom fields
      customFields: json("custom_fields"),
      // Custom field values (EAV pattern)
      position: integer("position").default(0),
      // For drag-drop ordering in Kanban
      idempotencyKey: varchar("idempotency_key", { length: 64 }),
      // For duplicate prevention
      version: integer("version").default(1),
      // Optimistic locking version
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow(),
      profileId: uuid("profile_id").references(() => profiles.id)
    });
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  db: () => db,
  initDb: () => initDb,
  isDbAvailable: () => isDbAvailable,
  pool: () => pool,
  waitForDb: () => waitForDb
});
import { drizzle } from "drizzle-orm/postgres-js";
import { Pool } from "pg";
function initDb() {
  if (!process.env.DATABASE_URL) {
    console.warn("\u26A0\uFE0F  DATABASE_URL not set \u2014 database features disabled");
    return Promise.resolve();
  }
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    try {
      pool = new Pool({ connectionString: process.env.DATABASE_URL });
      await pool.query("SELECT 1");
      db = drizzle(pool, { schema: schema_exports });
      console.log("\u2705 Database connected successfully");
    } catch (error) {
      console.error("\u274C Database connection failed:", error);
      throw error;
    }
  })();
  return dbPromise;
}
var pool, db, dbPromise, isDbAvailable, waitForDb;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    pool = null;
    db = null;
    dbPromise = null;
    if (process.env.DATABASE_URL) {
      initDb().catch(() => {
      });
    }
    isDbAvailable = () => pool !== null && db !== null;
    waitForDb = () => initDb();
  }
});

// server/supabase.ts
import { createClient } from "@supabase/supabase-js";
var supabaseUrl = process.env.SUPABASE_URL || "";
var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("Supabase server configuration missing. Some features may not work.");
}
var supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}) : null;
var isSupabaseConfigured = () => {
  return !!supabase;
};

// server/health/index.ts
async function checkDatabase() {
  const start = Date.now();
  try {
    const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    await db2.execute("SELECT 1 as health_check");
    return {
      name: "database",
      status: "healthy",
      message: "Database connection successful",
      responseTime: Date.now() - start
    };
  } catch (error) {
    return {
      name: "database",
      status: "unhealthy",
      message: `Database connection failed: ${error.message}`,
      responseTime: Date.now() - start,
      details: { error: error.message }
    };
  }
}
async function checkSupabase() {
  const start = Date.now();
  try {
    if (!isSupabaseConfigured() || !supabase) {
      return {
        name: "supabase",
        status: "warning",
        message: "Supabase not configured (using mock data)",
        responseTime: Date.now() - start
      };
    }
    const { data, error } = await supabase.from("profiles").select("count").limit(1).single();
    if (error && error.code !== "PGRST116") {
      throw error;
    }
    return {
      name: "supabase",
      status: "healthy",
      message: "Supabase connection successful",
      responseTime: Date.now() - start
    };
  } catch (error) {
    return {
      name: "supabase",
      status: "unhealthy",
      message: `Supabase connection failed: ${error.message}`,
      responseTime: Date.now() - start,
      details: { error: error.message }
    };
  }
}
async function checkExternalAPIs() {
  const start = Date.now();
  const results = [];
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      results.push({ service: "openai", status: "warning", message: "API key not configured" });
    } else {
      results.push({ service: "openai", status: "healthy", message: "API key configured" });
    }
  } catch (error) {
    results.push({ service: "openai", status: "unhealthy", message: error.message });
  }
  try {
    const googleKey = process.env.GOOGLE_AI_API_KEY;
    if (!googleKey) {
      results.push({ service: "google_ai", status: "warning", message: "API key not configured" });
    } else {
      results.push({ service: "google_ai", status: "healthy", message: "API key configured" });
    }
  } catch (error) {
    results.push({ service: "google_ai", status: "unhealthy", message: error.message });
  }
  const hasUnhealthy = results.some((r) => r.status === "unhealthy");
  const hasWarning = results.some((r) => r.status === "warning");
  return {
    name: "external_apis",
    status: hasUnhealthy ? "unhealthy" : hasWarning ? "warning" : "healthy",
    message: `External APIs: ${results.filter((r) => r.status === "healthy").length} healthy, ${results.filter((r) => r.status === "warning").length} warnings, ${results.filter((r) => r.status === "unhealthy").length} unhealthy`,
    responseTime: Date.now() - start,
    details: { apis: results }
  };
}
function checkMemory() {
  const memUsage = process.memoryUsage();
  const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const usagePercent = Math.round(usedMB / totalMB * 100);
  let status = "healthy";
  let message = `Memory usage: ${usedMB}MB / ${totalMB}MB (${usagePercent}%)`;
  if (usagePercent > 90) {
    status = "unhealthy";
    message += " - Critical memory usage";
  } else if (usagePercent > 80) {
    status = "warning";
    message += " - High memory usage";
  }
  return {
    name: "memory",
    status,
    message,
    details: {
      heapTotal: totalMB,
      heapUsed: usedMB,
      usagePercent,
      external: Math.round(memUsage.external / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024)
    }
  };
}
function checkSystem() {
  const uptime = process.uptime();
  const uptimeHours = Math.round(uptime / 3600);
  const loadAverage = process.platform === "linux" ? __require("os").loadavg() : [0, 0, 0];
  return {
    name: "system",
    status: "healthy",
    message: `System uptime: ${uptimeHours} hours`,
    details: {
      uptime: uptimeHours,
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      loadAverage: loadAverage.map((load) => Math.round(load * 100) / 100)
    }
  };
}
async function performHealthCheck() {
  const checks = await Promise.all([
    checkDatabase(),
    checkSupabase(),
    checkExternalAPIs(),
    checkMemory(),
    checkSystem()
  ]);
  const summary = {
    total: checks.length,
    healthy: checks.filter((c) => c.status === "healthy").length,
    unhealthy: checks.filter((c) => c.status === "unhealthy").length,
    warning: checks.filter((c) => c.status === "warning").length
  };
  let overallStatus = "healthy";
  if (summary.unhealthy > 0) {
    overallStatus = "unhealthy";
  } else if (summary.warning > 0) {
    overallStatus = "degraded";
  }
  return {
    status: overallStatus,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    uptime: Math.round(process.uptime()),
    version: process.env.npm_package_version || "1.0.0",
    checks,
    summary
  };
}
async function healthCheckMiddleware(req, res) {
  try {
    const health = await performHealthCheck();
    let statusCode = 200;
    if (health.status === "unhealthy") {
      statusCode = 503;
    } else if (health.status === "degraded") {
      statusCode = 200;
    }
    res.status(statusCode).json(health);
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({
      status: "unhealthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      error: "Health check failed",
      message: error.message
    });
  }
}
async function handler(event, context) {
  try {
    const health = await performHealthCheck();
    let statusCode = 200;
    if (health.status === "unhealthy") {
      statusCode = 503;
    } else if (health.status === "degraded") {
      statusCode = 200;
    }
    return {
      statusCode,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
      },
      body: JSON.stringify(health)
    };
  } catch (error) {
    console.error("Health check failed:", error);
    return {
      statusCode: 503,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        status: "unhealthy",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        error: "Health check failed",
        message: error.message
      })
    };
  }
}
export {
  handler,
  healthCheckMiddleware,
  performHealthCheck
};
