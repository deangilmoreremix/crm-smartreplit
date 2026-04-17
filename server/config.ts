/**
 * Server Configuration
 * Centralized configuration management for environment variables and constants
 */

// Admin configuration
export const DEV_BYPASS_EMAILS = (process.env.DEV_BYPASS_EMAILS || 'dev@smartcrm.local').split(',');

// Product tier hierarchy - higher index = more access
export const TIER_HIERARCHY = [
  'ai_communication', // Level 0 - Video Email, SMS, VoIP, Invoicing
  'ai_boost_unlimited', // Level 1 - Unlimited AI credits
  'sales_maximizer', // Level 2 - AI Goals and AI Tools
  'smartcrm', // Level 3 - Dashboard, Contacts, Pipeline, Calendar
  'smartcrm_bundle', // Level 4 - All tools except whitelabel
  'whitelabel', // Level 5 - All features including whitelabel
  'super_admin', // Level 6 - All features including admin
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

// Environment variable validation
export function validateEnvironmentVariables(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Critical variables that must be set in production
  const requiredVars = [
    'DATABASE_URL',
    'SUPABASE_URL', 
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  // In production, these should be set
  if (config.nodeEnv === 'production') {
    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        errors.push(`Missing required environment variable: ${varName}`);
      }
    });
    
    // At least one AI provider should be configured
    if (!config.openaiApiKey && !config.googleAiApiKey) {
      errors.push('At least one AI provider must be configured (OPENAI_API_KEY or GOOGLE_AI_API_KEY)');
    }
  }
  
  // Validate Supabase configuration
  if (config.supabaseUrl && !config.supabaseUrl.startsWith('https://')) {
    errors.push('SUPABASE_URL must be a valid HTTPS URL');
  }
  
  if (config.supabaseServiceKey && config.supabaseServiceKey.length < 50) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY appears to be invalid (too short)');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Validate on module load
const validation = validateEnvironmentVariables();
if (!validation.valid) {
  console.error('❌ Environment variable validation failed:');
  validation.errors.forEach(error => console.error(`  - ${error}`));
  
  // In production, exit with error if validation fails
  if (config.nodeEnv === 'production') {
    console.error('💥 Exiting due to invalid configuration in production');
    process.exit(1);
  } else {
    console.warn('⚠️ Continuing with invalid configuration in development');
  }
} else {
  console.log('✅ Environment variables validated successfully');
}

