// server/users/index.ts
import { createClient } from "@supabase/supabase-js";
var supabaseUrl = process.env.SUPABASE_URL;
var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
var supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;
var handler = async (event, context) => {
  const { httpMethod, path, body } = event;
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
    if (pathParts.length === 1 && pathParts[0] === "users" && httpMethod === "GET") {
      if (!supabase) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: "Supabase not configured" }) };
      }
      const { data: users, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify(users || []) };
    }
    if (pathParts.length === 2 && pathParts[0] === "users" && pathParts[1] === "invite" && httpMethod === "POST") {
      if (!supabase) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: "Supabase not configured" }) };
      }
      const { email, role, firstName, lastName, permissions } = JSON.parse(body);
      const validRoles = ["super_admin", "wl_user", "regular_user"];
      if (!validRoles.includes(role)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: "Invalid role",
            validRoles,
            message: "Role must be one of: super_admin, wl_user, regular_user"
          })
        };
      }
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: {
          first_name: firstName,
          last_name: lastName,
          role,
          permissions,
          app_context: "smartcrm",
          email_template_set: "smartcrm",
          invited_at: (/* @__PURE__ */ new Date()).toISOString(),
          invited_by: "admin"
        },
        redirectTo: `${process.env.SITE_URL || "https://smart-crm.videoremix.io"}/auth/callback`
      });
      if (error) throw error;
      console.log(`\u2705 User invitation sent: ${email} as ${role}`);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, user: data.user, role }) };
    }
    if (pathParts.length === 3 && pathParts[0] === "users" && pathParts[2] === "role" && httpMethod === "PATCH") {
      if (!supabase) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: "Supabase not configured" }) };
      }
      const { userId } = { userId: pathParts[1] };
      const { role } = JSON.parse(body);
      const validRoles = ["super_admin", "wl_user", "regular_user"];
      if (!validRoles.includes(role)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: "Invalid role",
            validRoles,
            message: "Role must be one of: super_admin, wl_user, regular_user"
          })
        };
      }
      const { data: profileData, error: profileError } = await supabase.from("profiles").update({ role }).eq("id", userId);
      if (profileError) throw profileError;
      const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          role,
          role_updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
      if (authError) {
        console.warn(`Warning: Failed to update auth metadata for ${userId}:`, authError.message);
      }
      console.log(`\u2705 User role updated: ${userId} \u2192 ${role}`);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, role }) };
    }
    if (pathParts.length === 3 && pathParts[0] === "users" && pathParts[2] === "status" && httpMethod === "PATCH") {
      if (!supabase) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: "Supabase not configured" }) };
      }
      const { userId } = { userId: pathParts[1] };
      const { status } = JSON.parse(body);
      const { data, error } = await supabase.from("profiles").update({ status }).eq("id", userId);
      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }
    if (pathParts.length === 2 && pathParts[0] === "users" && httpMethod === "DELETE") {
      if (!supabase) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: "Supabase not configured" }) };
      }
      const { userId } = { userId: pathParts[1] };
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) throw authError;
      const { error: profileError } = await supabase.from("profiles").delete().eq("id", userId);
      if (profileError) throw profileError;
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "Users endpoint not found" })
    };
  } catch (error) {
    console.error("Users function error:", error);
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
