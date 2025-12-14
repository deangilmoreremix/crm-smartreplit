/**
 * Server Configuration
 * Centralized configuration management for environment variables and constants
 */

// Admin configuration
export const DEV_BYPASS_EMAILS = (
  process.env.DEV_BYPASS_EMAILS || 'dev@smartcrm.local,dean@smartcrm.vip,dean@videoremix.io,samuel@videoremix.io,victor@videoremix.io'
).split(',');

// Product tier hierarchy - higher index = more access
export const TIER_HIERARCHY = [
  'ai_communication',      // Level 0 - Video Email, SMS, VoIP, Invoicing
  'ai_boost_unlimited',    // Level 1 - Unlimited AI credits
  'sales_maximizer',       // Level 2 - AI Goals and AI Tools
  'smartcrm',              // Level 3 - Dashboard, Contacts, Pipeline, Calendar
  'smartcrm_bundle',       // Level 4 - All tools except whitelabel
  'whitelabel',            // Level 5 - All features including whitelabel
  'super_admin'            // Level 6 - All features including admin
] as const;

// Get tier level (returns -1 if no tier/null)
export const getTierLevel = (tier: string | null | undefined): number => {
  if (!tier) return -1;
  return TIER_HIERARCHY.indexOf(tier as any);
};

// Environment variables with defaults
export const config = {
  // Database
  databaseUrl: process.env.DATABASE_URL,

  // Supabase
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

  // AI Services
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiApiKeyFallback: process.env.OPENAI_API_KEY_FALLBACK,
  googleAiApiKey: process.env.GOOGLE_AI_API_KEY,
  elevenlabsApiKey: process.env.ELEVENLABS_API_KEY,

  // Messaging
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,

  // Webhooks
  supabaseWebhookSecret: process.env.SUPABASE_WEBHOOK_SECRET,

  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Security
  secretsScanEnabled: process.env.SECRETS_SCAN_ENABLED !== 'false',
};