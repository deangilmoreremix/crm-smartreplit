import { Request, Response } from 'express';
import { db } from './db';
import { profiles } from '../shared/schema';

// User role configurations
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  WL_USER: 'wl_user', 
  REGULAR_USER: 'regular_user'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Super admin email addresses
export const SUPER_ADMIN_EMAILS = [
  'dean@videoremix.io',
  'victor@videoremix.io',
  'samuel@videoremix.io'
];

// Email template configurations by role
export const EMAIL_TEMPLATES = {
  [USER_ROLES.SUPER_ADMIN]: {
    templateType: 'admin',
    subject: 'Welcome to SmartCRM Admin',
    features: ['User Management', 'System Settings', 'All CRM Features', 'AI Tools'],
    dashboardUrl: 'https://smart-crm.videoremix.io/admin'
  },
  [USER_ROLES.WL_USER]: {
    templateType: 'premium',
    subject: 'Welcome to SmartCRM Premium',
    features: ['Full CRM', 'AI Tools', 'Advanced Features', 'Premium Support'],
    dashboardUrl: 'https://smart-crm.videoremix.io/dashboard'
  },
  [USER_ROLES.REGULAR_USER]: {
    templateType: 'basic',
    subject: 'Welcome to SmartCRM',
    features: ['Contacts', 'Pipeline', 'Calendar', 'Communication', 'CSV Import'],
    dashboardUrl: 'https://smart-crm.videoremix.io/dashboard'
  }
};

// Determine user role based on email and metadata
export function determineUserRole(email: string, metadata?: any): UserRole {
  // Super admins are determined by email address
  if (SUPER_ADMIN_EMAILS.includes(email.toLowerCase())) {
    return USER_ROLES.SUPER_ADMIN;
  }
  
  // Check metadata for explicit role assignment
  if (metadata?.role) {
    return metadata.role as UserRole;
  }
  
  // Default to regular user
  return USER_ROLES.REGULAR_USER;
}

// Create user metadata for Supabase
export function createUserMetadata(email: string, role?: UserRole): any {
  const finalRole = role || determineUserRole(email);
  const template = EMAIL_TEMPLATES[finalRole];
  
  return {
    role: finalRole,
    app_context: 'smartcrm',
    email_template_type: template.templateType,
    access_level: getAccessLevel(finalRole),
    features: template.features,
    dashboard_url: template.dashboardUrl
  };
}

// Get access level description by role
function getAccessLevel(role: UserRole): string {
  switch (role) {
    case USER_ROLES.SUPER_ADMIN:
      return 'Full Administrative Access';
    case USER_ROLES.WL_USER:
      return 'Premium CRM Access';
    case USER_ROLES.REGULAR_USER:
      return 'Core CRM Access';
    default:
      return 'Basic Access';
  }
}

// Send welcome email based on user role
export async function sendRoleBasedWelcomeEmail(
  email: string, 
  role: UserRole,
  userData?: any
): Promise<boolean> {
  try {
    const template = EMAIL_TEMPLATES[role];
    
    console.log(`Sending ${template.templateType} welcome email to ${email}`);
    
    // This would integrate with your email service (SendGrid, etc.)
    const emailData = {
      to: email,
      subject: template.subject,
      template: template.templateType,
      data: {
        user_role: role,
        access_level: getAccessLevel(role),
        dashboard_url: template.dashboardUrl,
        features: template.features,
        app_context: 'smartcrm',
        ...userData
      }
    };
    
    // Log for now - replace with actual email service
    console.log('Email data to send:', JSON.stringify(emailData, null, 2));
    
    return true;
  } catch (error) {
    console.error('Failed to send role-based welcome email:', error);
    return false;
  }
}

// Map role to product tier
function mapRoleToProductTier(role: UserRole): string | null {
  switch (role) {
    case USER_ROLES.SUPER_ADMIN:
      return 'super_admin'; // Super admins get full access
    case USER_ROLES.WL_USER:
      return 'whitelabel'; // WL users get whitelabel tier
    case USER_ROLES.REGULAR_USER:
    default:
      return null; // Regular users have no tier until they purchase
  }
}

// Supabase webhook handler for user authentication events
export async function handleAuthWebhook(req: Request, res: Response) {
  try {
    const { type, record } = req.body;
    
    console.log('Auth webhook received:', { type, email: record?.email });
    
    if (type === 'INSERT' && record) {
      const email = record.email;
      const userId = record.id;
      const metadata = record.raw_user_meta_data || {};
      
      // Determine role and send appropriate welcome email
      const role = determineUserRole(email, metadata);
      const productTier = mapRoleToProductTier(role);
      
      // Create profile in database with appropriate tier
      try {
        await db.insert(profiles).values({
          id: userId,
          firstName: metadata.firstName || metadata.first_name || null,
          lastName: metadata.lastName || metadata.last_name || null,
          role: role,
          productTier: productTier, // null for regular users (no access until purchase), super_admin/whitelabel for special users
          appContext: metadata.app_context || 'smartcrm',
          emailTemplateSet: metadata.email_template_set || 'smartcrm'
        });
        
        console.log(`✅ Created profile for ${email} with tier: ${productTier || 'none (pending purchase)'}, role: ${role}`);
      } catch (dbError: any) {
        // Profile might already exist (race condition), log but don't fail
        console.warn(`Profile creation warning for ${email}:`, dbError.message);
      }
      
      // Send role-based welcome email
      await sendRoleBasedWelcomeEmail(email, role, {
        firstName: metadata.firstName || metadata.first_name,
        lastName: metadata.lastName || metadata.last_name
      });
      
      console.log(`Processed auth webhook for ${email} with role ${role} and tier ${productTier}`);
    }
    
    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error: any) {
    console.error('Auth webhook error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

// Update existing user role and email preferences
export async function updateUserEmailPreferences(
  userId: string, 
  newRole: UserRole,
  supabaseClient: any
): Promise<boolean> {
  try {
    const metadata = createUserMetadata('', newRole);
    
    // Update user metadata in Supabase
    const { error } = await supabaseClient.auth.admin.updateUserById(
      userId,
      { 
        user_metadata: metadata 
      }
    );
    
    if (error) {
      console.error('Failed to update user metadata:', error);
      return false;
    }
    
    console.log(`Updated user ${userId} email preferences for role ${newRole}`);
    return true;
  } catch (error: any) {
    console.error('Error updating user email preferences:', error);
    return false;
  }
}

export default {
  USER_ROLES,
  SUPER_ADMIN_EMAILS,
  EMAIL_TEMPLATES,
  determineUserRole,
  createUserMetadata,
  sendRoleBasedWelcomeEmail,
  handleAuthWebhook,
  updateUserEmailPreferences
};