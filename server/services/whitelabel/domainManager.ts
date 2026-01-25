/**
 * Domain Manager Service
 * Handles custom domain verification, SSL provisioning, and health monitoring
 */

import { createClient } from '@supabase/supabase-js';
import dns from 'dns/promises';
import https from 'https';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export interface DomainConfig {
  id?: string;
  tenantId: string;
  domain: string;
  subdomain?: string;
  status: 'pending' | 'verifying' | 'active' | 'failed' | 'suspended';
  dnsVerified: boolean;
  sslStatus: 'pending' | 'provisioning' | 'active' | 'expired' | 'failed';
  sslExpiresAt?: Date;
  verificationToken: string;
  verificationMethod: 'txt' | 'cname' | 'http';
  lastCheckedAt?: Date;
  errorMessage?: string;
}

export interface DomainHealth {
  domain: string;
  isAccessible: boolean;
  dnsResolved: boolean;
  sslValid: boolean;
  sslExpiresIn?: number; // days
  responseTime?: number; // ms
  lastChecked: Date;
  issues: string[];
}

export interface DNSRecord {
  type: 'TXT' | 'CNAME' | 'A' | 'AAAA';
  name: string;
  value: string;
  ttl?: number;
}

class DomainManager {
  private platformDomain: string;

  constructor() {
    this.platformDomain = process.env.PLATFORM_DOMAIN || 'smartcrm.vip';
  }

  /**
   * Generate verification token for domain
   */
  generateVerificationToken(domain: string, tenantId: string): string {
    const crypto = require('crypto');
    const data = `${domain}:${tenantId}:${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
  }

  /**
   * Get DNS records required for domain verification
   */
  getRequiredDNSRecords(domain: string, verificationToken: string, method: 'txt' | 'cname' | 'http'): DNSRecord[] {
    const records: DNSRecord[] = [];

    switch (method) {
      case 'txt':
        records.push({
          type: 'TXT',
          name: `_smartcrm-verification.${domain}`,
          value: verificationToken,
          ttl: 300
        });
        break;

      case 'cname':
        records.push({
          type: 'CNAME',
          name: domain,
          value: this.platformDomain,
          ttl: 300
        });
        records.push({
          type: 'TXT',
          name: `_smartcrm-verification.${domain}`,
          value: verificationToken,
          ttl: 300
        });
        break;

      case 'http':
        // HTTP verification requires placing a file at /.well-known/smartcrm-verification.txt
        records.push({
          type: 'A',
          name: domain,
          value: process.env.PLATFORM_IP || '0.0.0.0',
          ttl: 300
        });
        break;
    }

    return records;
  }

  /**
   * Verify domain ownership via DNS
   */
  async verifyDomainDNS(domain: string, verificationToken: string, method: 'txt' | 'cname'): Promise<boolean> {
    try {
      if (method === 'txt') {
        // Check for TXT record
        const txtRecords = await dns.resolveTxt(`_smartcrm-verification.${domain}`);
        const flatRecords = txtRecords.flat();
        return flatRecords.includes(verificationToken);
      } else if (method === 'cname') {
        // Check for CNAME record
        const cnameRecords = await dns.resolveCname(domain);
        return cnameRecords.some(record => record === this.platformDomain || record.endsWith(`.${this.platformDomain}`));
      }
      return false;
    } catch (error: any) {
      console.error(`DNS verification failed for ${domain}:`, error.message);
      return false;
    }
  }

  /**
   * Verify domain ownership via HTTP
   */
  async verifyDomainHTTP(domain: string, verificationToken: string): Promise<boolean> {
    return new Promise((resolve) => {
      const url = `https://${domain}/.well-known/smartcrm-verification.txt`;
      
      https.get(url, { timeout: 5000 }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          resolve(data.trim() === verificationToken);
        });
      }).on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Initiate domain verification
   */
  async initiateDomainVerification(config: Omit<DomainConfig, 'id' | 'status' | 'dnsVerified' | 'sslStatus'>): Promise<DomainConfig> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const verificationToken = this.generateVerificationToken(config.domain, config.tenantId);
    
    const domainConfig: DomainConfig = {
      ...config,
      status: 'pending',
      dnsVerified: false,
      sslStatus: 'pending',
      verificationToken,
      lastCheckedAt: new Date()
    };

    // Save to database
    const { data, error } = await supabase
      .from('domains')
      .insert({
        tenant_id: domainConfig.tenantId,
        domain: domainConfig.domain,
        subdomain: domainConfig.subdomain,
        status: domainConfig.status,
        dns_verified: domainConfig.dnsVerified,
        ssl_status: domainConfig.sslStatus,
        verification_token: domainConfig.verificationToken,
        verification_method: domainConfig.verificationMethod,
        last_checked_at: domainConfig.lastCheckedAt
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save domain configuration: ${error.message}`);
    }

    return { ...domainConfig, id: data.id };
  }

  /**
   * Check domain verification status
   */
  async checkDomainVerification(domainId: string): Promise<DomainConfig> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data: domainData, error } = await supabase
      .from('domains')
      .select('*')
      .eq('id', domainId)
      .single();

    if (error || !domainData) {
      throw new Error('Domain not found');
    }

    const domain = domainData.domain;
    const verificationToken = domainData.verification_token;
    const verificationMethod = domainData.verification_method;

    let verified = false;

    // Perform verification based on method
    if (verificationMethod === 'http') {
      verified = await this.verifyDomainHTTP(domain, verificationToken);
    } else {
      verified = await this.verifyDomainDNS(domain, verificationToken, verificationMethod);
    }

    // Update domain status
    const newStatus = verified ? 'active' : 'verifying';
    const { data: updated, error: updateError } = await supabase
      .from('domains')
      .update({
        dns_verified: verified,
        status: newStatus,
        last_checked_at: new Date().toISOString(),
        error_message: verified ? null : 'DNS verification pending'
      })
      .eq('id', domainId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update domain status: ${updateError.message}`);
    }

    // If verified, initiate SSL provisioning
    if (verified && domainData.ssl_status === 'pending') {
      await this.provisionSSL(domainId);
    }

    return this.mapDatabaseToDomainConfig(updated);
  }

  /**
   * Provision SSL certificate for domain
   */
  async provisionSSL(domainId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Update status to provisioning
      await supabase
        .from('domains')
        .update({
          ssl_status: 'provisioning',
          updated_at: new Date().toISOString()
        })
        .eq('id', domainId);

      // In production, this would integrate with Let's Encrypt or Cloudflare
      // For now, we'll simulate SSL provisioning
      
      // Simulate SSL provisioning delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update to active with expiration date (90 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);

      await supabase
        .from('domains')
        .update({
          ssl_status: 'active',
          ssl_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', domainId);

    } catch (error: any) {
      // Update status to failed
      await supabase
        .from('domains')
        .update({
          ssl_status: 'failed',
          error_message: `SSL provisioning failed: ${error.message}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', domainId);

      throw error;
    }
  }

  /**
   * Check domain health
   */
  async checkDomainHealth(domain: string): Promise<DomainHealth> {
    const health: DomainHealth = {
      domain,
      isAccessible: false,
      dnsResolved: false,
      sslValid: false,
      lastChecked: new Date(),
      issues: []
    };

    try {
      // Check DNS resolution
      const addresses = await dns.resolve4(domain);
      health.dnsResolved = addresses.length > 0;
      if (!health.dnsResolved) {
        health.issues.push('DNS not resolved');
      }
    } catch (error) {
      health.issues.push('DNS resolution failed');
    }

    try {
      // Check HTTPS accessibility
      const startTime = Date.now();
      await new Promise<void>((resolve, reject) => {
        https.get(`https://${domain}`, { timeout: 5000 }, (res) => {
          health.isAccessible = res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302;
          health.responseTime = Date.now() - startTime;
          resolve();
        }).on('error', reject);
      });

      if (!health.isAccessible) {
        health.issues.push('Domain not accessible via HTTPS');
      }
    } catch (error) {
      health.issues.push('HTTPS connection failed');
    }

    try {
      // Check SSL certificate validity
      const cert = await this.getSSLCertificate(domain);
      if (cert) {
        health.sslValid = true;
        const expiresAt = new Date(cert.valid_to);
        const now = new Date();
        health.sslExpiresIn = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (health.sslExpiresIn < 30) {
          health.issues.push(`SSL certificate expires in ${health.sslExpiresIn} days`);
        }
      } else {
        health.issues.push('SSL certificate not found');
      }
    } catch (error) {
      health.issues.push('SSL certificate check failed');
    }

    return health;
  }

  /**
   * Get SSL certificate information
   */
  private async getSSLCertificate(domain: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const options = {
        host: domain,
        port: 443,
        method: 'GET',
        rejectUnauthorized: false
      };

      const req = https.request(options, (res) => {
        const cert = (res.socket as any).getPeerCertificate();
        resolve(cert);
      });

      req.on('error', reject);
      req.end();
    });
  }

  /**
   * Monitor domain health (scheduled task)
   */
  async monitorDomainHealth(): Promise<void> {
    if (!supabase) {
      console.warn('Supabase not configured, skipping domain health monitoring');
      return;
    }

    try {
      // Get all active domains
      const { data: domains, error } = await supabase
        .from('domains')
        .select('*')
        .in('status', ['active', 'verifying']);

      if (error) {
        throw error;
      }

      if (!domains || domains.length === 0) {
        return;
      }

      // Check health for each domain
      for (const domainData of domains) {
        try {
          const health = await this.checkDomainHealth(domainData.domain);

          // Update domain status based on health
          const updates: any = {
            last_checked_at: new Date().toISOString()
          };

          if (health.issues.length > 0) {
            updates.error_message = health.issues.join('; ');
            if (!health.isAccessible || !health.dnsResolved) {
              updates.status = 'failed';
            }
          } else {
            updates.error_message = null;
            updates.status = 'active';
          }

          // Check SSL expiration
          if (health.sslExpiresIn !== undefined && health.sslExpiresIn < 30) {
            // Trigger SSL renewal
            await this.renewSSL(domainData.id);
          }

          await supabase
            .from('domains')
            .update(updates)
            .eq('id', domainData.id);

        } catch (error: any) {
          console.error(`Health check failed for ${domainData.domain}:`, error.message);
        }
      }
    } catch (error: any) {
      console.error('Domain health monitoring failed:', error.message);
    }
  }

  /**
   * Renew SSL certificate
   */
  async renewSSL(domainId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Update status to provisioning
      await supabase
        .from('domains')
        .update({
          ssl_status: 'provisioning',
          updated_at: new Date().toISOString()
        })
        .eq('id', domainId);

      // In production, integrate with Let's Encrypt or Cloudflare
      // For now, simulate renewal
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update to active with new expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);

      await supabase
        .from('domains')
        .update({
          ssl_status: 'active',
          ssl_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', domainId);

    } catch (error: any) {
      await supabase
        .from('domains')
        .update({
          ssl_status: 'failed',
          error_message: `SSL renewal failed: ${error.message}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', domainId);

      throw error;
    }
  }

  /**
   * Remove domain configuration
   */
  async removeDomain(domainId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('domains')
      .delete()
      .eq('id', domainId);

    if (error) {
      throw new Error(`Failed to remove domain: ${error.message}`);
    }
  }

  /**
   * Get domain configuration
   */
  async getDomainConfig(domainId: string): Promise<DomainConfig> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('domains')
      .select('*')
      .eq('id', domainId)
      .single();

    if (error || !data) {
      throw new Error('Domain not found');
    }

    return this.mapDatabaseToDomainConfig(data);
  }

  /**
   * List domains for tenant
   */
  async listTenantDomains(tenantId: string): Promise<DomainConfig[]> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('domains')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list domains: ${error.message}`);
    }

    return (data || []).map(d => this.mapDatabaseToDomainConfig(d));
  }

  /**
   * Update domain configuration
   */
  async updateDomainConfig(domainId: string, updates: Partial<DomainConfig>): Promise<DomainConfig> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const dbUpdates: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.status) dbUpdates.status = updates.status;
    if (updates.subdomain !== undefined) dbUpdates.subdomain = updates.subdomain;
    if (updates.dnsVerified !== undefined) dbUpdates.dns_verified = updates.dnsVerified;
    if (updates.sslStatus) dbUpdates.ssl_status = updates.sslStatus;
    if (updates.errorMessage !== undefined) dbUpdates.error_message = updates.errorMessage;

    const { data, error } = await supabase
      .from('domains')
      .update(dbUpdates)
      .eq('id', domainId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update domain: ${error.message}`);
    }

    return this.mapDatabaseToDomainConfig(data);
  }

  /**
   * Map database record to DomainConfig
   */
  private mapDatabaseToDomainConfig(data: any): DomainConfig {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      domain: data.domain,
      subdomain: data.subdomain,
      status: data.status,
      dnsVerified: data.dns_verified,
      sslStatus: data.ssl_status,
      sslExpiresAt: data.ssl_expires_at ? new Date(data.ssl_expires_at) : undefined,
      verificationToken: data.verification_token,
      verificationMethod: data.verification_method,
      lastCheckedAt: data.last_checked_at ? new Date(data.last_checked_at) : undefined,
      errorMessage: data.error_message
    };
  }

  /**
   * Get domain by name
   */
  async getDomainByName(domain: string): Promise<DomainConfig | null> {
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from('domains')
      .select('*')
      .eq('domain', domain)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapDatabaseToDomainConfig(data);
  }

  /**
   * Check if domain is available
   */
  async isDomainAvailable(domain: string): Promise<boolean> {
    const existing = await this.getDomainByName(domain);
    return existing === null;
  }
}

// Export singleton instance
export const domainManager = new DomainManager();
