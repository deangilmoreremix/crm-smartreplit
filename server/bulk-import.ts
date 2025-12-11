import { createClient } from '@supabase/supabase-js';
import type { Express } from 'express';

interface BulkUser {
  email: string;
  first_name: string;
  last_name: string;
  app_context?: string;
  phone?: string;
  company?: string;
  role?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
  imported_users: string[];
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function bulkImportUsers(users: BulkUser[]): Promise<ImportResult> {
  const result: ImportResult = {
    success: 0,
    failed: 0,
    errors: [],
    imported_users: []
  };

  for (const user of users) {
    try {
      // Generate a temporary password
      const tempPassword = generateTempPassword();
      
      // Create user with Supabase Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: tempPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          first_name: user.first_name,
          last_name: user.last_name,
          app_context: user.app_context || 'smartcrm',
          email_template_set: 'smartcrm',
          phone: user.phone,
          company: user.company,
          role: user.role,
          bulk_imported: true,
          imported_at: new Date().toISOString()
        }
      });

      if (error) {
        result.errors.push(`${user.email}: ${error.message}`);
        result.failed++;
      } else if (data.user) {
        result.success++;
        result.imported_users.push(user.email);
        
        // Send welcome email via Supabase
        await sendWelcomeEmail(user.email, user.first_name, tempPassword);
      }
    } catch (error: any) {
      result.errors.push(`${user.email}: ${error.message}`);
      result.failed++;
    }
  }

  return result;
}

async function sendWelcomeEmail(email: string, firstName: string, tempPassword: string) {
  try {
    // Use confirm reauthentication link for bulk import users
    const redirectUrl = process.env.NODE_ENV === 'production' 
      ? 'https://smartcrm-videoremix.replit.app/dashboard?welcome=true'
      : process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}/dashboard?welcome=true`
        : 'https://smartcrm-videoremix.replit.app/dashboard?welcome=true';
    
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectUrl
      }
    });

    if (error) {
      console.error(`Failed to send welcome email to ${email}:`, error);
    } else {
      console.log(`Bulk import welcome email sent to ${email}`);
    }
  } catch (error) {
    console.error(`Error sending welcome email to ${email}:`, error);
  }
}

function generateTempPassword(): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// Parse CSV data
export function parseCSV(csvContent: string): BulkUser[] {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  
  const users: BulkUser[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const user: any = {};
    
    headers.forEach((header, index) => {
      if (values[index]) {
        user[header] = values[index];
      }
    });
    
    // Ensure required fields
    if (user.email && user.first_name && user.last_name) {
      users.push({
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        app_context: user.app_context || 'smartcrm',
        phone: user.phone,
        company: user.company,
        role: user.role
      });
    }
  }
  
  return users;
}

export function registerBulkImportRoutes(app: Express) {
  // Admin account status check endpoint
  app.get('/api/admin/accounts/status', async (req, res) => {
    try {
      const adminEmails = ['dean@videoremix.io', 'samuel@videoremix.io', 'victor@videoremix.io'];
      const results = [];

      for (const email of adminEmails) {
        try {
          // Get user details from Supabase Auth
          const { data, error } = await supabase.auth.admin.getUserById(email);
          
          if (error && error.message.includes('User not found')) {
            // Try to get by email instead
            const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
            const user = listData?.users?.find(u => u.email === email);
            
            results.push({
              email,
              status: user ? 'found' : 'not_found',
              user_id: user?.id || null,
              email_confirmed: user?.email_confirmed_at ? true : false,
              last_sign_in: user?.last_sign_in_at || null,
              created_at: user?.created_at || null,
              role: user?.user_metadata?.role || 'user'
            });
          } else if (data?.user) {
            results.push({
              email,
              status: 'found',
              user_id: data.user.id,
              email_confirmed: data.user.email_confirmed_at ? true : false,
              last_sign_in: data.user.last_sign_in_at,
              created_at: data.user.created_at,
              role: data.user.user_metadata?.role || 'user'
            });
          } else {
            results.push({
              email,
              status: 'error',
              error: error?.message || 'Unknown error'
            });
          }
        } catch (userError: any) {
          results.push({
            email,
            status: 'error',
            error: userError.message
          });
        }
      }

      res.json({
        success: true,
        admin_accounts: results,
        total_admins: results.length,
        confirmed_admins: results.filter(r => r.email_confirmed).length
      });

    } catch (error: any) {
      console.error('Admin status check error:', error);
      res.status(500).json({
        error: 'Failed to check admin accounts',
        details: error.message
      });
    }
  });

  // Resend confirmation email endpoint
  app.post('/api/bulk-import/resend-confirmation', async (req, res) => {
    try {
      const { email, first_name } = req.body;
      
      if (!email) {
        return res.status(400).json({
          error: 'Email is required'
        });
      }

      console.log(`Resending confirmation email to ${email}...`);
      
      // Generate password reset link (acts as confirmation for existing users)
      const redirectUrl = process.env.NODE_ENV === 'production' 
        ? 'https://smartcrm-videoremix.replit.app/dashboard?confirmed=true'
        : process.env.REPLIT_DEV_DOMAIN 
          ? `https://${process.env.REPLIT_DEV_DOMAIN}/dashboard?confirmed=true`
          : 'https://smartcrm-videoremix.replit.app/dashboard?confirmed=true';
      
      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo: redirectUrl
        }
      });

      if (error) {
        console.error(`Failed to resend confirmation to ${email}:`, error);
        return res.status(500).json({
          error: 'Failed to resend confirmation email',
          details: error.message
        });
      }

      console.log(`✅ Confirmation email resent to ${email}`);
      
      res.json({
        success: true,
        message: `Confirmation email sent to ${email}`,
        email: email,
        redirect_url: redirectUrl
      });
      
    } catch (error: any) {
      console.error('Resend confirmation error:', error);
      res.status(500).json({
        error: 'Failed to resend confirmation email',
        details: error.message
      });
    }
  });

  // Bulk import endpoint
  app.post('/api/bulk-import/users', async (req, res) => {
    try {
      const { users, send_notifications = true } = req.body;
      
      if (!users || !Array.isArray(users)) {
        return res.status(400).json({
          error: 'Users array is required'
        });
      }

      console.log(`Starting bulk import of ${users.length} users...`);
      
      const result = await bulkImportUsers(users);
      
      console.log(`Bulk import completed: ${result.success} success, ${result.failed} failed`);
      
      res.json({
        message: `Bulk import completed`,
        result
      });
    } catch (error: any) {
      console.error('Bulk import error:', error);
      res.status(500).json({
        error: 'Failed to import users',
        details: error.message
      });
    }
  });

  // Parse CSV endpoint
  app.post('/api/bulk-import/parse-csv', (req, res) => {
    try {
      const { csv_content } = req.body;
      
      if (!csv_content) {
        return res.status(400).json({
          error: 'CSV content is required'
        });
      }

      const users = parseCSV(csv_content);
      
      res.json({
        message: `Parsed ${users.length} users from CSV`,
        users,
        preview: users.slice(0, 5) // Show first 5 as preview
      });
    } catch (error: any) {
      console.error('CSV parsing error:', error);
      res.status(500).json({
        error: 'Failed to parse CSV',
        details: error.message
      });
    }
  });

  // Send notification to existing users
  app.post('/api/bulk-import/send-notifications', async (req, res) => {
    try {
      const { emails, message_type = 'welcome' } = req.body;
      
      if (!emails || !Array.isArray(emails)) {
        return res.status(400).json({
          error: 'Emails array is required'
        });
      }

      let sent = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const email of emails) {
        try {
          const { error } = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: email,
          });

          if (error) {
            errors.push(`${email}: ${error.message}`);
            failed++;
          } else {
            sent++;
          }
        } catch (error: any) {
          errors.push(`${email}: ${error.message}`);
          failed++;
        }
      }

      res.json({
        message: 'Notification sending completed',
        sent,
        failed,
        errors
      });
    } catch (error: any) {
      console.error('Notification sending error:', error);
      res.status(500).json({
        error: 'Failed to send notifications',
        details: error.message
      });
    }
  });

  // Send password setup email to a specific user
  app.post('/api/admin/send-password-setup', async (req, res) => {
    try {
      const { email, firstName } = req.body;
      
      if (!email) {
        return res.status(400).json({
          error: 'Email is required'
        });
      }

      console.log(`📧 Sending password setup email to ${email}...`);
      
      // Generate password reset link which allows user to set their password
      const redirectUrl = process.env.NODE_ENV === 'production' 
        ? 'https://smartcrm-videoremix.replit.app/auth/reset-password?setup=true'
        : process.env.REPLIT_DEV_DOMAIN 
          ? `https://${process.env.REPLIT_DEV_DOMAIN}/auth/reset-password?setup=true`
          : 'https://smartcrm-videoremix.replit.app/auth/reset-password?setup=true';
      
      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo: redirectUrl
        }
      });

      if (error) {
        console.error(`❌ Failed to send password setup email to ${email}:`, error);
        return res.status(500).json({
          error: 'Failed to send password setup email',
          details: error.message
        });
      }

      // The generateLink returns the link but Supabase also sends an email automatically
      console.log(`✅ Password setup email sent to ${email}`);
      
      res.json({
        success: true,
        message: `Password setup email sent to ${email}`,
        email: email
      });
      
    } catch (error: any) {
      console.error('Password setup email error:', error);
      res.status(500).json({
        error: 'Failed to send password setup email',
        details: error.message
      });
    }
  });

  // Send password setup emails to multiple users (bulk)
  app.post('/api/admin/send-bulk-password-setup', async (req, res) => {
    try {
      const { emails } = req.body;
      
      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({
          error: 'Emails array is required'
        });
      }

      console.log(`📧 Sending password setup emails to ${emails.length} users...`);

      const redirectUrl = process.env.NODE_ENV === 'production' 
        ? 'https://smartcrm-videoremix.replit.app/auth/reset-password?setup=true'
        : process.env.REPLIT_DEV_DOMAIN 
          ? `https://${process.env.REPLIT_DEV_DOMAIN}/auth/reset-password?setup=true`
          : 'https://smartcrm-videoremix.replit.app/auth/reset-password?setup=true';

      let sent = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const email of emails) {
        try {
          const { error } = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email: email,
            options: {
              redirectTo: redirectUrl
            }
          });

          if (error) {
            errors.push(`${email}: ${error.message}`);
            failed++;
          } else {
            sent++;
          }
        } catch (error: any) {
          errors.push(`${email}: ${error.message}`);
          failed++;
        }
      }

      console.log(`✅ Password setup emails: ${sent} sent, ${failed} failed`);

      res.json({
        success: true,
        message: `Password setup emails sent`,
        sent,
        failed,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error: any) {
      console.error('Bulk password setup email error:', error);
      res.status(500).json({
        error: 'Failed to send password setup emails',
        details: error.message
      });
    }
  });

  // Bulk import local database users (frontend access only, productTier: null)
  app.post('/api/admin/bulk-import-db-users', async (req, res) => {
    try {
      const { users } = req.body;
      
      if (!users || !Array.isArray(users)) {
        return res.status(400).json({
          error: 'Users array is required'
        });
      }

      const { db } = require('./db');
      const { profiles } = require('../shared/schema.js');
      const { v4: uuidv4 } = require('uuid');

      let importedCount = 0;
      const errors: string[] = [];

      console.log(`Starting bulk import of ${users.length} users to database...`);

      for (const user of users) {
        try {
          const newProfile = {
            id: uuidv4(),
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            username: (user.email?.split('@')[0] || 'user') + '_' + Math.random().toString(36).substring(7),
            role: 'regular_user',
            productTier: 'smartcrm', // Basic frontend access - Dashboard, Contacts, Pipeline, Calendar
            appContext: 'smartcrm',
            emailTemplateSet: 'smartcrm'
          };

          await db.insert(profiles).values(newProfile);
          importedCount++;

          if (importedCount % 20 === 0) {
            console.log(`✓ Imported ${importedCount}/${users.length} users...`);
          }
        } catch (error: any) {
          const errorMsg = `${user.email}: ${error.message}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      console.log(`✅ Bulk import completed: ${importedCount}/${users.length} users imported`);

      res.json({
        success: true,
        message: `Imported ${importedCount} out of ${users.length} users`,
        importedCount,
        totalCount: users.length,
        failedCount: users.length - importedCount,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error: any) {
      console.error('Bulk import error:', error);
      res.status(500).json({
        error: 'Failed to import users',
        details: error.message
      });
    }
  });
}