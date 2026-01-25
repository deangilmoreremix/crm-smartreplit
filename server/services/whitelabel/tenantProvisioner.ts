/**
 * Tenant Provisioning Service
 * Automates tenant creation, configuration, and onboarding
 */

import { createClient } from '@supabase/supabase-js';
import { errorLogger } from '../errorLogger';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export interface TenantConfig {
  name: string;
  subdomain: string;
  contactEmail: string;
  contactName?: string;
  plan: 'starter' | 'professional' | 'enterprise';
  type: 'customer' | 'partner' | 'reseller';
  parentPartnerId?: string;
  templateId?: string;
}

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string;
  status: 'active' | 'inactive' | 'suspended' | 'trial';
  type: 'customer' | 'partner' | 'reseller';
  plan: 'starter' | 'professional' | 'enterprise';
  contactEmail: string;
  contactName?: string;
  monthlyRevenue: number;
  userCount: number;
  parentPartnerId?: string;
  trialEndsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantTemplate {
  id: string;
  name: string;
  description: string;
  config: Record<string, any>;
  features: Record<string, boolean>;
  defaultSettings: Record<string, any>;
  onboardingSteps: OnboardingStep[];
  isDefault: boolean;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action: string;
  completed: boolean;
  order: number;
}

export interface OnboardingStatus {
  tenantId: string;
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  status: 'in_progress' | 'completed' | 'skipped';
  startedAt: Date;
  completedAt?: Date;
}

class TenantProvisioner {
  /**
   * Create new tenant with automated setup
   */
  async createTenant(config: TenantConfig): Promise<Tenant> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Validate subdomain availability
      const isAvailable = await this.isSubdomainAvailable(config.subdomain);
      if (!isAvailable) {
        throw new Error(`Subdomain '${config.subdomain}' is already taken`);
      }

      // Get template if specified
      let template: TenantTemplate | null = null;
      if (config.templateId) {
        template = await this.getTemplate(config.templateId);
      } else {
        // Get default template for plan
        template = await this.getDefaultTemplate(config.plan);
      }

      // Create tenant record
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: config.name,
          subdomain: config.subdomain,
          status: config.plan === 'starter' ? 'trial' : 'active',
          type: config.type,
          plan: config.plan,
          contact_email: config.contactEmail,
          contact_name: config.contactName,
          monthly_revenue: 0,
          user_count: 0,
          parent_partner_id: config.parentPartnerId,
          trial_ends_at: config.plan === 'starter' ? this.getTrialEndDate() : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (tenantError) {
        throw new Error(`Failed to create tenant: ${tenantError.message}`);
      }

      const tenant = this.mapDatabaseToTenant(tenantData);

      // Apply template configuration
      if (template) {
        await this.applyTemplate(tenant.id, template);
      }

      // Initialize onboarding
      await this.initializeOnboarding(tenant.id, template?.onboardingSteps || []);

      // Send welcome email
      await this.sendWelcomeEmail(tenant);

      // Seed initial data if template specifies
      if (template?.defaultSettings?.seedData) {
        await this.seedInitialData(tenant.id, template.defaultSettings.seedData);
      }

      return tenant;

    } catch (error: any) {
      await errorLogger.logError('Tenant creation failed', error, {
        subdomain: config.subdomain
      });
      throw error;
    }
  }

  /**
   * Check if subdomain is available
   */
  async isSubdomainAvailable(subdomain: string): Promise<boolean> {
    if (!supabase) {
      return true;
    }

    const { data, error } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', subdomain)
      .single();

    return !data;
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<TenantTemplate | null> {
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from('tenant_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapDatabaseToTemplate(data);
  }

  /**
   * Get default template for plan
   */
  async getDefaultTemplate(plan: string): Promise<TenantTemplate | null> {
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from('tenant_templates')
      .select('*')
      .eq('is_default', true)
      .single();

    if (error || !data) {
      // Return a basic default template
      return {
        id: 'default',
        name: 'Default Template',
        description: 'Basic tenant configuration',
        config: {},
        features: {},
        defaultSettings: {},
        onboardingSteps: this.getDefaultOnboardingSteps(),
        isDefault: true
      };
    }

    return this.mapDatabaseToTemplate(data);
  }

  /**
   * Apply template to tenant
   */
  async applyTemplate(tenantId: string, template: TenantTemplate): Promise<void> {
    if (!supabase) {
      return;
    }

    try {
      // Create white label configuration
      await supabase
        .from('white_label_configs')
        .insert({
          tenant_id: tenantId,
          ...template.config,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      // Set feature flags
      if (template.features && Object.keys(template.features).length > 0) {
        const featureEntries = Object.entries(template.features).map(([feature, enabled]) => ({
          tenant_id: tenantId,
          feature_key: feature,
          enabled,
          created_at: new Date().toISOString()
        }));

        await supabase
          .from('tenant_features')
          .insert(featureEntries);
      }

    } catch (error: any) {
      await errorLogger.logError('Template application failed', error, {
        tenantId,
        templateId: template.id
      });
      throw error;
    }
  }

  /**
   * Initialize onboarding for tenant
   */
  async initializeOnboarding(tenantId: string, steps: OnboardingStep[]): Promise<void> {
    if (!supabase) {
      return;
    }

    try {
      const onboardingSteps = steps.length > 0 ? steps : this.getDefaultOnboardingSteps();

      await supabase
        .from('tenant_onboarding')
        .insert({
          tenant_id: tenantId,
          current_step: 1,
          total_steps: onboardingSteps.length,
          completed_steps: [],
          status: 'in_progress',
          started_at: new Date().toISOString(),
          metadata: { steps: onboardingSteps }
        });

    } catch (error: any) {
      await errorLogger.logError('Onboarding initialization failed', error, {
        tenantId
      });
      // Don't throw - onboarding is not critical for tenant creation
    }
  }

  /**
   * Get default onboarding steps
   */
  private getDefaultOnboardingSteps(): OnboardingStep[] {
    return [
      {
        id: 'welcome',
        title: 'Welcome to SmartCRM',
        description: 'Get started with your new CRM platform',
        action: 'view_dashboard',
        completed: false,
        order: 1
      },
      {
        id: 'branding',
        title: 'Customize Your Branding',
        description: 'Upload your logo and set your brand colors',
        action: 'configure_branding',
        completed: false,
        order: 2
      },
      {
        id: 'domain',
        title: 'Set Up Custom Domain',
        description: 'Configure your custom domain for white label access',
        action: 'configure_domain',
        completed: false,
        order: 3
      },
      {
        id: 'users',
        title: 'Invite Team Members',
        description: 'Add users to your CRM instance',
        action: 'invite_users',
        completed: false,
        order: 4
      },
      {
        id: 'data',
        title: 'Import Your Data',
        description: 'Import contacts, deals, and other data',
        action: 'import_data',
        completed: false,
        order: 5
      }
    ];
  }

  /**
   * Send welcome email to tenant
   */
  private async sendWelcomeEmail(tenant: Tenant): Promise<void> {
    try {
      // In production, integrate with email service (SendGrid, etc.)
      console.log(`Welcome email would be sent to: ${tenant.contactEmail}`);
      
      // Log for monitoring
      await errorLogger.logInfo('Welcome email sent', {
        tenantId: tenant.id,
        email: tenant.contactEmail
      });

    } catch (error: any) {
      await errorLogger.logWarning('Welcome email failed', {
        tenantId: tenant.id,
        error: error.message
      });
      // Don't throw - email failure shouldn't block tenant creation
    }
  }

  /**
   * Seed initial data for tenant
   */
  private async seedInitialData(tenantId: string, seedData: any): Promise<void> {
    if (!supabase) {
      return;
    }

    try {
      // Seed sample contacts if specified
      if (seedData.contacts && Array.isArray(seedData.contacts)) {
        const contacts = seedData.contacts.map((contact: any) => ({
          ...contact,
          profile_id: tenantId, // Link to tenant
          created_at: new Date().toISOString()
        }));

        await supabase.from('contacts').insert(contacts);
      }

      // Seed sample deals if specified
      if (seedData.deals && Array.isArray(seedData.deals)) {
        const deals = seedData.deals.map((deal: any) => ({
          ...deal,
          profile_id: tenantId,
          created_at: new Date().toISOString()
        }));

        await supabase.from('deals').insert(deals);
      }

    } catch (error: any) {
      await errorLogger.logWarning('Initial data seeding failed', {
        tenantId,
        error: error.message
      });
      // Don't throw - seeding failure shouldn't block tenant creation
    }
  }

  /**
   * Get trial end date (14 days from now)
   */
  private getTrialEndDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString();
  }

  /**
   * Get tenant by ID
   */
  async getTenant(tenantId: string): Promise<Tenant> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (error || !data) {
      throw new Error('Tenant not found');
    }

    return this.mapDatabaseToTenant(data);
  }

  /**
   * List tenants with filtering
   */
  async listTenants(options: {
    status?: string;
    type?: string;
    parentPartnerId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ tenants: Tenant[]; total: number; page: number; pages: number }> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const page = options.page || 1;
    const limit = Math.min(options.limit || 50, 100);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('tenants')
      .select('*', { count: 'exact' });

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.type) {
      query = query.eq('type', options.type);
    }

    if (options.parentPartnerId) {
      query = query.eq('parent_partner_id', options.parentPartnerId);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to list tenants: ${error.message}`);
    }

    const tenants = (data || []).map(d => this.mapDatabaseToTenant(d));
    const total = count || 0;
    const pages = Math.ceil(total / limit);

    return { tenants, total, page, pages };
  }

  /**
   * Update tenant
   */
  async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Tenant> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const dbUpdates: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.name) dbUpdates.name = updates.name;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.plan) dbUpdates.plan = updates.plan;
    if (updates.contactEmail) dbUpdates.contact_email = updates.contactEmail;
    if (updates.contactName) dbUpdates.contact_name = updates.contactName;
    if (updates.customDomain !== undefined) dbUpdates.custom_domain = updates.customDomain;

    const { data, error } = await supabase
      .from('tenants')
      .update(dbUpdates)
      .eq('id', tenantId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update tenant: ${error.message}`);
    }

    return this.mapDatabaseToTenant(data);
  }

  /**
   * Suspend tenant
   */
  async suspendTenant(tenantId: string, reason?: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    await supabase
      .from('tenants')
      .update({
        status: 'suspended',
        updated_at: new Date().toISOString()
      })
      .eq('id', tenantId);

    // Log suspension
    await errorLogger.logInfo('Tenant suspended', {
      tenantId,
      reason
    });
  }

  /**
   * Activate tenant
   */
  async activateTenant(tenantId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    await supabase
      .from('tenants')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', tenantId);

    // Log activation
    await errorLogger.logInfo('Tenant activated', {
      tenantId
    });
  }

  /**
   * Delete tenant (soft delete)
   */
  async deleteTenant(tenantId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    // Soft delete by setting status to inactive
    await supabase
      .from('tenants')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', tenantId);

    // Log deletion
    await errorLogger.logInfo('Tenant deleted (soft)', {
      tenantId
    });
  }

  /**
   * Get onboarding status
   */
  async getOnboardingStatus(tenantId: string): Promise<OnboardingStatus | null> {
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from('tenant_onboarding')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      tenantId: data.tenant_id,
      currentStep: data.current_step,
      totalSteps: data.total_steps,
      completedSteps: data.completed_steps || [],
      status: data.status,
      startedAt: new Date(data.started_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined
    };
  }

  /**
   * Update onboarding progress
   */
  async updateOnboardingProgress(
    tenantId: string,
    stepId: string,
    completed: boolean
  ): Promise<OnboardingStatus> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    // Get current status
    const status = await this.getOnboardingStatus(tenantId);
    if (!status) {
      throw new Error('Onboarding not found');
    }

    // Update completed steps
    const completedSteps = completed
      ? [...status.completedSteps, stepId]
      : status.completedSteps.filter(s => s !== stepId);

    // Check if all steps completed
    const allCompleted = completedSteps.length === status.totalSteps;

    const { data, error } = await supabase
      .from('tenant_onboarding')
      .update({
        completed_steps: completedSteps,
        current_step: completedSteps.length + 1,
        status: allCompleted ? 'completed' : 'in_progress',
        completed_at: allCompleted ? new Date().toISOString() : null
      })
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update onboarding: ${error.message}`);
    }

    return {
      tenantId: data.tenant_id,
      currentStep: data.current_step,
      totalSteps: data.total_steps,
      completedSteps: data.completed_steps || [],
      status: data.status,
      startedAt: new Date(data.started_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined
    };
  }

  /**
   * List available templates
   */
  async listTemplates(): Promise<TenantTemplate[]> {
    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from('tenant_templates')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Failed to list templates: ${error.message}`);
    }

    return (data || []).map(d => this.mapDatabaseToTemplate(d));
  }

  /**
   * Create template
   */
  async createTemplate(template: Omit<TenantTemplate, 'id'>): Promise<TenantTemplate> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('tenant_templates')
      .insert({
        name: template.name,
        description: template.description,
        config: template.config,
        features: template.features,
        default_settings: template.defaultSettings,
        onboarding_steps: template.onboardingSteps,
        is_default: template.isDefault,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create template: ${error.message}`);
    }

    return this.mapDatabaseToTemplate(data);
  }

  /**
   * Map database record to Tenant
   */
  private mapDatabaseToTenant(data: any): Tenant {
    return {
      id: data.id,
      name: data.name,
      subdomain: data.subdomain,
      customDomain: data.custom_domain,
      status: data.status,
      type: data.type,
      plan: data.plan,
      contactEmail: data.contact_email,
      contactName: data.contact_name,
      monthlyRevenue: parseFloat(data.monthly_revenue || 0),
      userCount: data.user_count || 0,
      parentPartnerId: data.parent_partner_id,
      trialEndsAt: data.trial_ends_at ? new Date(data.trial_ends_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  /**
   * Map database record to Template
   */
  private mapDatabaseToTemplate(data: any): TenantTemplate {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      config: data.config || {},
      features: data.features || {},
      defaultSettings: data.default_settings || {},
      onboardingSteps: data.onboarding_steps || [],
      isDefault: data.is_default || false
    };
  }
}

// Export singleton instance
export const tenantProvisioner = new TenantProvisioner();
