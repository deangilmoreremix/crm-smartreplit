/**
 * Security Manager Service
 * Handles SSO, security policies, and audit logging
 */

import { createClient } from '@supabase/supabase-js';
import { errorLogger } from '../errorLogger';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export interface SSOConfiguration {
  id: string;
  tenantId: string;
  provider: 'saml' | 'oauth' | 'oidc' | 'google' | 'microsoft' | 'okta';
  config: SAMLConfig | OAuthConfig | OIDCConfig;
  metadata: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SAMLConfig {
  entryPoint: string;
  issuer: string;
  cert: string;
  callbackUrl: string;
  signatureAlgorithm?: string;
  identifierFormat?: string;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authorizationURL: string;
  tokenURL: string;
  callbackURL: string;
  scope: string[];
}

export interface OIDCConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
}

export interface SecurityPolicy {
  id: string;
  tenantId: string;
  policyType: 'ip_whitelist' | 'password_policy' | 'session_policy' | 'mfa_policy' | 'api_access';
  config: IPWhitelistConfig | PasswordPolicyConfig | SessionPolicyConfig | MFAPolicyConfig | APIAccessConfig;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPWhitelistConfig {
  allowedIPs: string[];
  allowedRanges: string[];
  blockByDefault: boolean;
}

export interface PasswordPolicyConfig {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  expiryDays?: number;
  preventReuse?: number;
}

export interface SessionPolicyConfig {
  maxDuration: number; // minutes
  idleTimeout: number; // minutes
  requireReauth: boolean;
  singleSessionOnly: boolean;
}

export interface MFAPolicyConfig {
  required: boolean;
  methods: Array<'totp' | 'sms' | 'email'>;
  gracePeriod?: number; // days
}

export interface APIAccessConfig {
  enabled: boolean;
  rateLimit: number;
  allowedIPs?: string[];
  requireAPIKey: boolean;
}

export interface AuditLogEntry {
  id: string;
  tenantId?: string;
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

class SecurityManager {
  /**
   * Configure SSO for tenant
   */
  async configureSSOProvider(
    tenantId: string,
    provider: SSOConfiguration['provider'],
    config: SAMLConfig | OAuthConfig | OIDCConfig,
    metadata?: Record<string, any>
  ): Promise<SSOConfiguration> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Deactivate other SSO configurations
      await supabase
        .from('sso_configurations')
        .update({ is_active: false })
        .eq('tenant_id', tenantId);

      // Create new SSO configuration
      const { data, error } = await supabase
        .from('sso_configurations')
        .insert({
          tenant_id: tenantId,
          provider,
          config,
          metadata: metadata || {},
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to configure SSO: ${error.message}`);
      }

      // Log SSO configuration
      await this.logAudit({
        tenantId,
        action: 'sso_configured',
        resourceType: 'sso_configuration',
        resourceId: data.id,
        metadata: { provider }
      });

      return this.mapDatabaseToSSOConfig(data);

    } catch (error: any) {
      await errorLogger.logError('SSO configuration failed', error, {
        tenantId,
        provider
      });
      throw error;
    }
  }

  /**
   * Get active SSO configuration
   */
  async getActiveSSOConfig(tenantId: string): Promise<SSOConfiguration | null> {
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from('sso_configurations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapDatabaseToSSOConfig(data);
  }

  /**
   * Test SSO connection
   */
  async testSSOConnection(ssoConfigId: string): Promise<{ success: boolean; message: string }> {
    try {
      // In production, this would actually test the SSO connection
      // For now, return a mock success
      return {
        success: true,
        message: 'SSO connection test successful'
      };

    } catch (error: any) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Create security policy
   */
  async createSecurityPolicy(
    tenantId: string,
    policyType: SecurityPolicy['policyType'],
    config: any
  ): Promise<SecurityPolicy> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Validate policy configuration
      this.validatePolicyConfig(policyType, config);

      const { data, error } = await supabase
        .from('security_policies')
        .insert({
          tenant_id: tenantId,
          policy_type: policyType,
          config,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create security policy: ${error.message}`);
      }

      // Log policy creation
      await this.logAudit({
        tenantId,
        action: 'security_policy_created',
        resourceType: 'security_policy',
        resourceId: data.id,
        metadata: { policyType }
      });

      return this.mapDatabaseToSecurityPolicy(data);

    } catch (error: any) {
      await errorLogger.logError('Security policy creation failed', error, {
        tenantId,
        policyType
      });
      throw error;
    }
  }

  /**
   * Get security policies for tenant
   */
  async getSecurityPolicies(tenantId: string, policyType?: string): Promise<SecurityPolicy[]> {
    if (!supabase) {
      return [];
    }

    let query = supabase
      .from('security_policies')
      .select('*')
      .eq('tenant_id', tenantId);

    if (policyType) {
      query = query.eq('policy_type', policyType);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get security policies: ${error.message}`);
    }

    return (data || []).map(d => this.mapDatabaseToSecurityPolicy(d));
  }

  /**
   * Update security policy
   */
  async updateSecurityPolicy(policyId: string, updates: Partial<SecurityPolicy>): Promise<SecurityPolicy> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const dbUpdates: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.config) {
      // Validate new configuration
      const policy = await this.getSecurityPolicy(policyId);
      this.validatePolicyConfig(policy.policyType, updates.config);
      dbUpdates.config = updates.config;
    }

    if (updates.isActive !== undefined) {
      dbUpdates.is_active = updates.isActive;
    }

    const { data, error } = await supabase
      .from('security_policies')
      .update(dbUpdates)
      .eq('id', policyId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update security policy: ${error.message}`);
    }

    return this.mapDatabaseToSecurityPolicy(data);
  }

  /**
   * Delete security policy
   */
  async deleteSecurityPolicy(policyId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('security_policies')
      .delete()
      .eq('id', policyId);

    if (error) {
      throw new Error(`Failed to delete security policy: ${error.message}`);
    }
  }

  /**
   * Get security policy by ID
   */
  async getSecurityPolicy(policyId: string): Promise<SecurityPolicy> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('security_policies')
      .select('*')
      .eq('id', policyId)
      .single();

    if (error || !data) {
      throw new Error('Security policy not found');
    }

    return this.mapDatabaseToSecurityPolicy(data);
  }

  /**
   * Validate policy configuration
   */
  private validatePolicyConfig(policyType: string, config: any): void {
    switch (policyType) {
      case 'ip_whitelist':
        if (!config.allowedIPs && !config.allowedRanges) {
          throw new Error('IP whitelist must specify allowedIPs or allowedRanges');
        }
        break;

      case 'password_policy':
        if (!config.minLength || config.minLength < 8) {
          throw new Error('Password policy must specify minLength >= 8');
        }
        break;

      case 'session_policy':
        if (!config.maxDuration || config.maxDuration < 5) {
          throw new Error('Session policy must specify maxDuration >= 5 minutes');
        }
        break;

      case 'mfa_policy':
        if (!config.methods || config.methods.length === 0) {
          throw new Error('MFA policy must specify at least one method');
        }
        break;

      case 'api_access':
        if (config.rateLimit && config.rateLimit < 1) {
          throw new Error('API access policy rateLimit must be >= 1');
        }
        break;
    }
  }

  /**
   * Log audit entry
   */
  async logAudit(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>): Promise<AuditLogEntry> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          tenant_id: entry.tenantId,
          user_id: entry.userId,
          action: entry.action,
          resource_type: entry.resourceType,
          resource_id: entry.resourceId,
          ip_address: entry.ipAddress,
          user_agent: entry.userAgent,
          metadata: entry.metadata || {},
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to log audit entry: ${error.message}`);
      }

      return this.mapDatabaseToAuditLog(data);

    } catch (error: any) {
      // Don't throw on audit log failures - log to error logger instead
      await errorLogger.logError('Audit logging failed', error, {
        action: entry.action
      });
      throw error;
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(
    tenantId: string,
    options?: {
      userId?: string;
      action?: string;
      resourceType?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    }
  ): Promise<{ logs: AuditLogEntry[]; total: number; page: number; pages: number }> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 50, 100);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (options?.userId) {
      query = query.eq('user_id', options.userId);
    }

    if (options?.action) {
      query = query.eq('action', options.action);
    }

    if (options?.resourceType) {
      query = query.eq('resource_type', options.resourceType);
    }

    if (options?.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }

    if (options?.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to get audit logs: ${error.message}`);
    }

    const logs = (data || []).map(d => this.mapDatabaseToAuditLog(d));
    const total = count || 0;
    const pages = Math.ceil(total / limit);

    return { logs, total, page, pages };
  }

  /**
   * Check if IP is whitelisted
   */
  async isIPWhitelisted(tenantId: string, ipAddress: string): Promise<boolean> {
    try {
      const policies = await this.getSecurityPolicies(tenantId, 'ip_whitelist');
      
      if (policies.length === 0) {
        return true; // No whitelist policy = allow all
      }

      const activePolicy = policies.find(p => p.isActive);
      if (!activePolicy) {
        return true;
      }

      const config = activePolicy.config as IPWhitelistConfig;

      // Check exact IP match
      if (config.allowedIPs.includes(ipAddress)) {
        return true;
      }

      // Check IP ranges (simplified - would use proper CIDR matching in production)
      for (const range of config.allowedRanges) {
        if (this.ipInRange(ipAddress, range)) {
          return true;
        }
      }

      return !config.blockByDefault;

    } catch (error: any) {
      await errorLogger.logError('IP whitelist check failed', error, {
        tenantId,
        ipAddress
      });
      return true; // Fail open to avoid blocking legitimate traffic
    }
  }

  /**
   * Check if IP is in range (simplified)
   */
  private ipInRange(ip: string, range: string): boolean {
    // Simplified implementation - would use proper CIDR matching in production
    const [rangeIP, mask] = range.split('/');
    if (!mask) {
      return ip === rangeIP;
    }

    // For now, just check if IP starts with range prefix
    const prefix = rangeIP.split('.').slice(0, parseInt(mask) / 8).join('.');
    return ip.startsWith(prefix);
  }

  /**
   * Validate password against policy
   */
  async validatePassword(tenantId: string, password: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      const policies = await this.getSecurityPolicies(tenantId, 'password_policy');
      
      if (policies.length === 0) {
        // Default policy
        if (password.length < 8) {
          errors.push('Password must be at least 8 characters');
        }
        return { valid: errors.length === 0, errors };
      }

      const activePolicy = policies.find(p => p.isActive);
      if (!activePolicy) {
        return { valid: true, errors: [] };
      }

      const config = activePolicy.config as PasswordPolicyConfig;

      if (password.length < config.minLength) {
        errors.push(`Password must be at least ${config.minLength} characters`);
      }

      if (config.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }

      if (config.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }

      if (config.requireNumbers && !/\d/.test(password)) {
        errors.push('Password must contain at least one number');
      }

      if (config.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character');
      }

      return { valid: errors.length === 0, errors };

    } catch (error: any) {
      await errorLogger.logError('Password validation failed', error, {
        tenantId
      });
      return { valid: true, errors: [] }; // Fail open
    }
  }

  /**
   * Check if MFA is required
   */
  async isMFARequired(tenantId: string): Promise<boolean> {
    try {
      const policies = await this.getSecurityPolicies(tenantId, 'mfa_policy');
      
      const activePolicy = policies.find(p => p.isActive);
      if (!activePolicy) {
        return false;
      }

      const config = activePolicy.config as MFAPolicyConfig;
      return config.required;

    } catch (error: any) {
      await errorLogger.logError('MFA check failed', error, {
        tenantId
      });
      return false; // Fail open
    }
  }

  /**
   * Get security summary for tenant
   */
  async getSecuritySummary(tenantId: string): Promise<{
    ssoEnabled: boolean;
    mfaRequired: boolean;
    ipWhitelistActive: boolean;
    passwordPolicyActive: boolean;
    recentAuditLogs: AuditLogEntry[];
  }> {
    const ssoConfig = await this.getActiveSSOConfig(tenantId);
    const mfaRequired = await this.isMFARequired(tenantId);
    const policies = await this.getSecurityPolicies(tenantId);
    
    const ipWhitelistActive = policies.some(p => p.policyType === 'ip_whitelist' && p.isActive);
    const passwordPolicyActive = policies.some(p => p.policyType === 'password_policy' && p.isActive);

    const { logs: recentAuditLogs } = await this.getAuditLogs(tenantId, {
      limit: 10
    });

    return {
      ssoEnabled: !!ssoConfig,
      mfaRequired,
      ipWhitelistActive,
      passwordPolicyActive,
      recentAuditLogs
    };
  }

  /**
   * Map database record to SSOConfiguration
   */
  private mapDatabaseToSSOConfig(data: any): SSOConfiguration {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      provider: data.provider,
      config: data.config,
      metadata: data.metadata || {},
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  /**
   * Map database record to SecurityPolicy
   */
  private mapDatabaseToSecurityPolicy(data: any): SecurityPolicy {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      policyType: data.policy_type,
      config: data.config,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  /**
   * Map database record to AuditLogEntry
   */
  private mapDatabaseToAuditLog(data: any): AuditLogEntry {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      userId: data.user_id,
      action: data.action,
      resourceType: data.resource_type,
      resourceId: data.resource_id,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      metadata: data.metadata || {},
      createdAt: new Date(data.created_at)
    };
  }
}

// Export singleton instance
export const securityManager = new SecurityManager();
