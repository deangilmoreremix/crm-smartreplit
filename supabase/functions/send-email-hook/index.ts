/**
 * send-email-hook - Tenant-Aware Email Renderer
 *
 * This edge function intercepts ALL Supabase auth emails (signup confirm,
 * password reset, magic link, invite, email change) and renders them with
 * the correct tenant branding from the tenant_config table.
 *
 * Architecture:
 * 1. Receive Supabase auth hook POST payload
 * 2. Look up user's tenant from user_roles table
 * 3. Fetch tenant_config row for that tenant
 * 4. Render HTML email using that tenant's colors, name, domain, support email
 * 5. Return the rendered HTML — Supabase sends it
 *
 * Key rules:
 * - ALWAYS fall back to 'videoremix' tenant if lookup fails
 * - Use SUPABASE_SERVICE_ROLE_KEY for the DB lookup
 * - The email HTML must work in all email clients (table-based layout, inline styles)
 * - Use {{ .ConfirmationURL }} as the Supabase token placeholder in templates
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Tenant configurations with fallback values
interface TenantConfig {
  tenant: string;
  brand_name: string;
  brand_url: string;
  support_email: string;
  from_email: string;
  from_name: string;
  color_primary: string;
  color_secondary: string;
  site_url: string;
  dashboard_path: string;
  reset_password_path: string;
  email_benefits: string[];
}

// Email type templates
interface EmailTemplate {
  title: string;
  cta_text: string;
  security_note: string;
  benefits_heading: string;
  benefits: string[];
}

// Get tenant configuration from database
async function getTenantConfig(tenant: string): Promise<TenantConfig> {
  const { data, error } = await supabase
    .from('tenant_config')
    .select('*')
    .eq('tenant', tenant)
    .maybeSingle();

  if (error || !data) {
    // Fall back to videoremix defaults
    return {
      tenant: 'videoremix',
      brand_name: 'VideoRemix.vip',
      brand_url: 'https://videoremix.vip',
      support_email: 'support@videoremix.vip',
      from_email: 'noreply@videoremix.vip',
      from_name: 'VideoRemix Team',
      color_primary: '#3b82f6',
      color_secondary: '#1e40af',
      site_url: 'https://videoremix.vip',
      dashboard_path: '/dashboard',
      reset_password_path: '/reset-password',
      email_benefits: [
        'AI-powered video personalization',
        'Automated video editing',
        'Multi-platform publishing',
        'Real-time analytics',
      ],
    };
  }

  return data as TenantConfig;
}

// Get user's tenant from email
async function getUserTenant(email: string): Promise<string> {
  try {
    // First try to find user in auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      console.error('Error listing users:', userError);
      return 'videoremix';
    }

    const user = userData.users.find((u) => u.email === email);

    if (!user) {
      return 'videoremix';
    }

    // Get tenant from user_roles
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('tenant')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (roleError) {
      console.error('Error getting user role:', roleError);
      return 'videoremix';
    }

    return roleData?.tenant || 'videoremix';
  } catch (err) {
    console.error('Error in getUserTenant:', err);
    return 'videoremix';
  }
}

// Generate email HTML based on type and tenant config
function generateEmailHtml(type: string, config: TenantConfig, confirmationUrl: string): string {
  // Theme colors based on tenant
  const theme = getThemeColors(config.tenant, config.color_primary, config.color_secondary);

  // Get template for email type
  const template = getEmailTemplate(type);

  // Build benefits list
  const benefitsList = template.benefits
    .map((b) => `<li style="margin-bottom: 12px; color: #cbd5e1; font-size: 15px;">${b}</li>`)
    .join('');

  // CTA button style - use dark text for yellow theme
  const ctaTextColor = config.tenant === 'ai-video-agent-studio' ? '#1a1a1a' : '#ffffff';
  const headerTextColor = config.tenant === 'ai-video-agent-studio' ? '#1a1a1a' : '#ffffff';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.title}</title>
  <!--[if mso]><style>body,table,td{font-family:Arial,sans-serif!important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${theme.bg_dark};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:${theme.bg_dark}">
    <tr><td style="padding:40px 20px">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
             style="max-width:600px;margin:0 auto;background-color:${theme.bg_card};border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5)">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,${config.color_primary} 0%,${config.color_secondary} 100%);padding:48px 32px;text-align:center">
            <h1 style="margin:0;color:${headerTextColor};font-size:32px;font-weight:700">${config.brand_name}</h1>
            <p style="margin:8px 0 0;rgba(255,255,255,0.85);font-size:14px;text-transform:uppercase;letter-spacing:0.5px">${getTagline(config.tenant)}</p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:48px 40px">
            <h2 style="margin:0 0 24px;color:#f8fafc;font-size:28px;font-weight:700">${template.title}</h2>
            <p style="margin:0 0 20px;color:#cbd5e1;font-size:16px;line-height:1.6">${getBodyText(type, config.brand_name)}</p>

            <!-- CTA BUTTON -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr><td style="text-align:center;padding:0 0 32px">
                <a href="${confirmationUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,${config.color_primary} 0%,${config.color_secondary} 100%);color:${ctaTextColor};text-decoration:none;padding:18px 48px;border-radius:12px;font-weight:600;font-size:16px">
                  ${template.cta_text}
                </a>
              </td></tr>
            </table>

            <!-- BENEFITS BOX -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                   style="background-color:#334155;border-radius:12px">
              <tr><td style="padding:32px">
                <h3 style="margin:0 0 20px;color:#f8fafc;font-size:20px;font-weight:600">${template.benefits_heading}</h3>
                <ul style="margin:0;padding:0;list-style:none">
                  ${benefitsList}
                </ul>
              </td></tr>
            </table>

            <!-- SECURITY NOTE -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                   style="margin-top:32px;background-color:#1e293b;border-left:4px solid ${config.color_primary};border-radius:8px">
              <tr><td style="padding:20px 24px">
                <p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.6">
                  <strong style="color:#e2e8f0">Security Note:</strong> ${template.security_note}
                </p>
              </td></tr>
            </table>

            <!-- FALLBACK LINK -->
            <p style="margin:32px 0 0;color:#94a3b8;font-size:13px">If the button doesn't work, copy this link:</p>
            <p style="margin:8px 0 0;color:${config.color_primary};font-size:13px;word-break:break-all">${confirmationUrl}</p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background-color:${theme.bg_dark};padding:40px;border-top:1px solid #334155;text-align:center">
            <p style="margin:0;color:#64748b;font-size:14px">
              Need help? <a href="mailto:${config.support_email}" style="color:${config.color_primary};text-decoration:none">${config.support_email}</a>
            </p>
            <p style="margin:16px 0 0;color:#475569;font-size:13px">&copy; 2025 ${config.brand_name}. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Get theme colors based on tenant
function getThemeColors(
  tenant: string,
  primary: string,
  secondary: string
): {
  bg_dark: string;
  bg_card: string;
} {
  switch (tenant) {
    case 'smartcrm':
      return {
        bg_dark: '#0f0a1e',
        bg_card: '#1a1030',
      };
    case 'ai-video-agent-studio':
      return {
        bg_dark: '#0d0d0d',
        bg_card: '#1a1a1a',
      };
    default: // videoremix
      return {
        bg_dark: '#0f172a',
        bg_card: '#1e293b',
      };
  }
}

// Get tagline based on tenant
function getTagline(tenant: string): string {
  switch (tenant) {
    case 'smartcrm':
      return 'AI-Powered CRM Platform';
    case 'ai-video-agent-studio':
      return 'Autonomous AI Video Creation';
    default:
      return 'AI-Powered Video Personalization Platform';
  }
}

// Get email template based on type
function getEmailTemplate(type: string): EmailTemplate {
  const templates: Record<string, EmailTemplate> = {
    signup: {
      title: 'Welcome to {brand_name}!',
      cta_text: 'Confirm Email Address',
      security_note: 'This link expires in 24 hours.',
      benefits_heading: "What You'll Get Access To:",
      benefits: [
        'AI-powered video personalization',
        'Automated video editing',
        'Multi-platform publishing',
        'Real-time analytics',
      ],
    },
    recovery: {
      title: 'Reset Your Password',
      cta_text: 'Reset Password',
      security_note: "This link expires in 1 hour. If you didn't request this, ignore it.",
      benefits_heading: 'Create a Strong Password:',
      benefits: [
        'Use 8+ characters',
        'Mix uppercase & lowercase',
        'Include numbers & symbols',
        'Avoid common words',
      ],
    },
    magiclink: {
      title: 'Your Secure Sign-In Link',
      cta_text: 'Sign In Now',
      security_note: "This link expires in 1 hour and works only once. Don't share it.",
      benefits_heading: 'Security Tips:',
      benefits: ['Expires in 1 hour', 'One-time use only', "Don't share this link"],
    },
    invite: {
      title: "You've Been Invited!",
      cta_text: 'Accept Invitation',
      security_note: 'This invitation expires in 7 days.',
      benefits_heading: "You'll Get Instant Access To:",
      benefits: [
        'Full platform access',
        'AI-powered features',
        'Priority support',
        'Regular updates',
      ],
    },
    email_change: {
      title: 'Confirm Your Email Change',
      cta_text: 'Confirm New Email',
      security_note:
        "This link expires in 24 hours. If you didn't request this, contact support immediately.",
      benefits_heading: "What's Next:",
      benefits: [
        'Update your profile',
        'Verify new email',
        'Set preferences',
        'Start using the platform',
      ],
    },
  };

  return templates[type] || templates['signup'];
}

// Get body text based on email type
function getBodyText(type: string, brandName: string): string {
  switch (type) {
    case 'signup':
      return `Welcome to ${brandName}! We're excited to have you on board. Click the button below to confirm your email address and get started with your account.`;
    case 'recovery':
      return `We received a request to reset your password. Click the button below to create a new password for your account.`;
    case 'magiclink':
      return `Click the button below to sign in to your ${brandName} account. This link will work immediately and only once.`;
    case 'invite':
      return `You've been invited to join ${brandName}! Click the button below to accept the invitation and create your account.`;
    case 'email_change':
      return `You requested to change your email address. Click the button below to confirm this change.`;
    default:
      return `Click the button below to continue.`;
  }
}

Deno.serve(async (req) => {
  try {
    // Only handle POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse the auth hook payload
    const payload = await req.json();

    const { email, type, confirmation_url } = payload;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Determine email type from hook
    const emailType = type || 'signup';

    // Get user's tenant (fall back to videoremix if lookup fails)
    const tenant = await getUserTenant(email);

    // Get tenant configuration
    const config = await getTenantConfig(tenant);

    // Use confirmation URL from payload or construct from tenant config
    let actionUrl = confirmation_url;
    if (!actionUrl) {
      const path = emailType === 'recovery' ? config.reset_password_path : config.dashboard_path;
      actionUrl = `${config.site_url}${path}`;
    }

    // Generate HTML email
    const html = generateEmailHtml(emailType, config, actionUrl);

    // Return the rendered HTML to Supabase
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Tenant': tenant,
      },
    });
  } catch (error) {
    console.error('Error in send-email-hook:', error);

    // Return fallback HTML on error
    return new Response(getFallbackHtml(), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
});

// Fallback HTML in case of errors
function getFallbackHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Email</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background-color:#0f172a;padding:40px;">
  <div style="max-width:600px;margin:0 auto;background-color:#1e293b;border-radius:16px;padding:48px;">
    <h1 style="color:#ffffff;margin:0 0 24px;">Welcome!</h1>
    <p style="color:#cbd5e1;font-size:16px;">Click the button below to confirm your email address.</p>
    <a href="#" style="display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;padding:18px 48px;border-radius:12px;font-weight:600;">Confirm Email</a>
  </div>
</body>
</html>`;
}
