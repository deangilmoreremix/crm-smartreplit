/**
 * Domain Manager Service
 * Handles custom domain verification, SSL provisioning, and health monitoring
 */

import { createClient } from '@supabase/supabase-js';
import dns from 'dns/promises';
import https from 'https';
import { withCache, CACHE_TTL } from '../services/cache';

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

export interface DomainValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  normalizedDomain?: string;
  isIdn?: boolean;
}

export interface DomainAvailabilityResult {
  domain: string;
  available: boolean;
  reason?: string;
  suggestions?: string[];
  cached?: boolean;
}

export interface BulkAvailabilityResult {
  results: DomainAvailabilityResult[];
  checkedAt: Date;
}

export interface SubdomainProvisioningResult {
  subdomain: string;
  tenantId: string;
  domain: string;
  dnsRecords: DNSRecord[];
  accessUrl: string;
  status: 'active' | 'pending';
}

export interface DNSProviderInstructions {
  provider: string;
  records: DNSRecord[];
  steps: string[];
  ttlRecommendation: number;
  estimatedPropagation: string;
}

class DomainManager {
  private platformDomain: string;

  constructor() {
    this.platformDomain = process.env.PLATFORM_DOMAIN || 'smartcrm.vip';
  }

  getPlatformDomain(): string {
    return this.platformDomain;
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
  getRequiredDNSRecords(
    domain: string,
    verificationToken: string,
    method: 'txt' | 'cname' | 'http'
  ): DNSRecord[] {
    const records: DNSRecord[] = [];

    switch (method) {
      case 'txt':
        records.push({
          type: 'TXT',
          name: `_smartcrm-verification.${domain}`,
          value: verificationToken,
          ttl: 300,
        });
        break;

      case 'cname':
        records.push({
          type: 'CNAME',
          name: domain,
          value: this.platformDomain,
          ttl: 300,
        });
        records.push({
          type: 'TXT',
          name: `_smartcrm-verification.${domain}`,
          value: verificationToken,
          ttl: 300,
        });
        break;

      case 'http':
        // HTTP verification requires placing a file at /.well-known/smartcrm-verification.txt
        records.push({
          type: 'A',
          name: domain,
          value: process.env.PLATFORM_IP || '0.0.0.0',
          ttl: 300,
        });
        break;
    }

    return records;
  }

  /**
   * Verify domain ownership via DNS
   */
  async verifyDomainDNS(
    domain: string,
    verificationToken: string,
    method: 'txt' | 'cname'
  ): Promise<boolean> {
    try {
      if (method === 'txt') {
        // Check for TXT record
        const txtRecords = await dns.resolveTxt(`_smartcrm-verification.${domain}`);
        const flatRecords = txtRecords.flat();
        return flatRecords.includes(verificationToken);
      } else if (method === 'cname') {
        // Check for CNAME record
        const cnameRecords = await dns.resolveCname(domain);
        return cnameRecords.some(
          (record) => record === this.platformDomain || record.endsWith(`.${this.platformDomain}`)
        );
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

      https
        .get(url, { timeout: 5000 }, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            resolve(data.trim() === verificationToken);
          });
        })
        .on('error', () => {
          resolve(false);
        });
    });
  }

  /**
   * Initiate domain verification
   */
  async initiateDomainVerification(
    config: Omit<DomainConfig, 'id' | 'status' | 'dnsVerified' | 'sslStatus'>
  ): Promise<DomainConfig> {
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
      lastCheckedAt: new Date(),
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
        last_checked_at: domainConfig.lastCheckedAt,
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
        error_message: verified ? null : 'DNS verification pending',
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', domainId);

      // In production, this would integrate with Let's Encrypt or Cloudflare
      // For now, we'll simulate SSL provisioning

      // Simulate SSL provisioning delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update to active with expiration date (90 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);

      await supabase
        .from('domains')
        .update({
          ssl_status: 'active',
          ssl_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', domainId);
    } catch (error: any) {
      // Update status to failed
      await supabase
        .from('domains')
        .update({
          ssl_status: 'failed',
          error_message: `SSL provisioning failed: ${error.message}`,
          updated_at: new Date().toISOString(),
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
      issues: [],
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
        https
          .get(`https://${domain}`, { timeout: 5000 }, (res) => {
            health.isAccessible =
              res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302;
            health.responseTime = Date.now() - startTime;
            resolve();
          })
          .on('error', reject);
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
        health.sslExpiresIn = Math.floor(
          (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

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
        rejectUnauthorized: false,
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
            last_checked_at: new Date().toISOString(),
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

          await supabase.from('domains').update(updates).eq('id', domainData.id);
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', domainId);

      // In production, integrate with Let's Encrypt or Cloudflare
      // For now, simulate renewal
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update to active with new expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);

      await supabase
        .from('domains')
        .update({
          ssl_status: 'active',
          ssl_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', domainId);
    } catch (error: any) {
      await supabase
        .from('domains')
        .update({
          ssl_status: 'failed',
          error_message: `SSL renewal failed: ${error.message}`,
          updated_at: new Date().toISOString(),
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

    const { error } = await supabase.from('domains').delete().eq('id', domainId);

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

    const { data, error } = await supabase.from('domains').select('*').eq('id', domainId).single();

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

    return (data || []).map((d) => this.mapDatabaseToDomainConfig(d));
  }

  /**
   * Update domain configuration
   */
  async updateDomainConfig(
    domainId: string,
    updates: Partial<DomainConfig>
  ): Promise<DomainConfig> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const dbUpdates: any = {
      updated_at: new Date().toISOString(),
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
      errorMessage: data.error_message,
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
   * Common reserved subdomain/domain words
   */
  private static readonly RESERVED_WORDS = new Set([
    'www', 'mail', 'ftp', 'admin', 'api', 'app', 'blog', 'cdn', 'dev', 'docs',
    'email', 'help', 'info', 'login', 'm', 'mobile', 'news', 'ns1', 'ns2', 'old',
    'portal', 'secure', 'shop', 'smtp', 'stage', 'staging', 'static', 'test', 'testing',
    'web', 'www1', 'www2', 'www3', 'mail1', 'mail2', 'ns', 'dns', 'cloud', 'auth',
    'account', 'accounts', 'billing', 'support', 'status', 'dashboard', 'stg', 'prod',
    'production', 'demo', 'sandbox', 'internal', 'external', 'public', 'private',
    'localhost', 'local', 'server', 'host', 'gateway', 'proxy', 'vpn', 'ssh', 'sftp',
    'db', 'database', 'sql', 'mysql', 'postgres', 'mongodb', 'redis', 'cache',
    'queue', 'worker', 'job', 'task', 'cron', 'schedule', 'monitor', 'metrics',
    'logs', 'log', 'alert', 'alerts', 'notifications', 'push', 'ws', 'socket',
    'stream', 'media', 'video', 'audio', 'image', 'img', 'pic', 'photo', 'cdn1', 'cdn2',
    'edge', 'origin', 'source', 'build', 'ci', 'cd', 'deploy', 'release', 'version',
    'git', 'svn', 'repo', 'repository', 'code', 'src', 'source', 'assets', 'static',
    'public', 'private', 'secret', 'key', 'token', 'oauth', 'sso', 'saml', 'ldap',
    'ad', 'active', 'directory', 'ldap', 'kerberos', 'radius', 'tacacs',
  ]);

  private static readonly COMMON_TLDS = new Set([
    'com', 'net', 'org', 'io', 'co', 'ai', 'app', 'dev', 'me', 'tv', 'cc', 'ly',
    'info', 'biz', 'name', 'pro', 'mobi', 'tel', 'xxx', 'xyz', 'club', 'online',
    'site', 'store', 'tech', 'space', 'live', 'news', 'blog', 'cloud', 'digital',
    'agency', 'solutions', 'services', 'consulting', 'academy', 'education', 'training',
    'shop', 'store', 'sale', 'deals', 'coupons', 'marketing', 'seo', 'design', 'graphics',
    'photography', 'video', 'media', 'music', 'audio', 'game', 'games', 'play', 'fun',
    'life', 'world', 'global', 'international', 'usa', 'uk', 'eu', 'asia', 'africa',
    'ca', 'uk', 'us', 'fr', 'de', 'es', 'it', 'nl', 'se', 'no', 'dk', 'fi', 'au', 'nz',
  ]);

  private static readonly SUGGESTION_PREFIXES = ['my', 'the', 'get', 'try', 'use', 'go', 'hello', 'hi', 'hey'];
  private static readonly SUGGESTION_SUFFIXES = ['app', 'hq', 'co', 'get', 'now', 'today', 'hub', 'lab', 'box', 'base'];

  /**
   * Validate domain format with IDN and TLD support
   */
  async validateDomainFormat(domain: string): Promise<DomainValidationResult> {
    const result: DomainValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    if (!domain || typeof domain !== 'string') {
      result.isValid = false;
      result.errors.push('Domain is required');
      return result;
    }

    const trimmed = domain.trim().toLowerCase();

    // IDN normalization
    let normalizedDomain = trimmed;
    let isIdn = false;

    try {
      // Check if it contains non-ASCII characters
      if (/[^\x00-\x7F]/.test(trimmed)) {
        isIdn = true;
        // Convert IDN to punycode
        const url = new URL(`http://${trimmed}`);
        normalizedDomain = url.hostname.toLowerCase();
      } else {
        // Still validate via URL parsing to catch edge cases
        const url = new URL(`http://${trimmed}`);
        normalizedDomain = url.hostname.toLowerCase();
      }
    } catch {
      result.isValid = false;
      result.errors.push('Invalid domain format');
      return result;
    }

    result.normalizedDomain = normalizedDomain;
    result.isIdn = isIdn;

    // Length checks
    if (normalizedDomain.length > 253) {
      result.isValid = false;
      result.errors.push('Domain name exceeds maximum length of 253 characters');
    }

    const labels = normalizedDomain.split('.');
    if (labels.length < 2) {
      result.isValid = false;
      result.errors.push('Domain must have at least a second-level domain and TLD');
    }

    // Validate each label
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];

      if (label.length === 0) {
        result.isValid = false;
        result.errors.push('Domain contains empty labels (consecutive dots)');
        break;
      }

      if (label.length > 63) {
        result.isValid = false;
        result.errors.push(`Label "${label}" exceeds maximum length of 63 characters`);
      }

      if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(label)) {
        result.isValid = false;
        result.errors.push(`Label "${label}" contains invalid characters or starts/ends with hyphen`);
      }

      if (label.startsWith('-') || label.endsWith('-')) {
        result.isValid = false;
        result.errors.push(`Label "${label}" cannot start or end with a hyphen`);
      }
    }

    // TLD validation
    const tld = labels[labels.length - 1];
    if (tld && !DomainManager.COMMON_TLDS.has(tld)) {
      result.warnings.push(`TLD ".${tld}" is not in the common TLDs list`);
    }

    // Reserved words check (only for the main/second-level domain for subdomains)
    const sld = labels[0];
    if (sld && DomainManager.RESERVED_WORDS.has(sld)) {
      result.warnings.push(`"${sld}" is a reserved word and may not be available`);
    }

    return result;
  }

  /**
   * Check if subdomain is available (real-time)
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
   * Check domain/subdomain availability with caching
   */
  async checkDomainAvailability(domain: string): Promise<DomainAvailabilityResult> {
    const cacheKey = `domain:availability:${domain}`;

    return withCache<DomainAvailabilityResult>(cacheKey, async () => {
      const existing = await this.getDomainByName(domain);
      if (existing) {
        return {
          domain,
          available: false,
          reason: 'Domain is already registered in the system',
        };
      }

      // Also check DNS to see if it resolves somewhere
      try {
        await dns.resolve4(domain);
        return {
          domain,
          available: false,
          reason: 'Domain already exists and resolves to an IP address',
        };
      } catch {
        // Domain does not resolve - likely available
        return {
          domain,
          available: true,
        };
      }
    }, CACHE_TTL.SHORT);
  }

  /**
   * Bulk availability checking for multiple domains
   */
  async checkBulkAvailability(domains: string[]): Promise<BulkAvailabilityResult> {
    const results = await Promise.all(
      domains.map((domain) => this.checkDomainAvailability(domain))
    );

    return {
      results,
      checkedAt: new Date(),
    };
  }

  /**
   * Get alternative domain suggestions
   */
  async suggestDomains(domain: string, count: number = 5): Promise<string[]> {
    const suggestions: string[] = [];
    const normalized = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const parts = normalized.split('.');
    const sld = parts[0];
    const tld = parts.length > 1 ? parts.slice(1).join('.') : 'com';

    // Prefix variations
    for (const prefix of DomainManager.SUGGESTION_PREFIXES) {
      if (suggestions.length >= count) break;
      const candidate = `${prefix}${sld}`;
      if (candidate !== sld && !suggestions.includes(candidate)) {
        const available = await this.isDomainAvailable(candidate);
        if (available) {
          suggestions.push(`${candidate}.${tld}`);
        }
      }
    }

    // Suffix variations
    for (const suffix of DomainManager.SUGGESTION_SUFFIXES) {
      if (suggestions.length >= count) break;
      const candidate = `${sld}${suffix}`;
      if (!suggestions.includes(candidate)) {
        const available = await this.isDomainAvailable(candidate);
        if (available) {
          suggestions.push(`${candidate}.${tld}`);
        }
      }
    }

    // Hyphen variations
    if (!sld.includes('-')) {
      if (suggestions.length < count) {
        const candidate = `${sld}-${DomainManager.SUGGESTION_PREFIXES[0]}`;
        const available = await this.isDomainAvailable(candidate);
        if (available) {
          suggestions.push(`${candidate}.${tld}`);
        }
      }
      if (suggestions.length < count && sld.length > 3) {
        const mid = Math.floor(sld.length / 2);
        const candidate = `${sld.slice(0, mid)}-${sld.slice(mid)}`;
        const available = await this.isDomainAvailable(candidate);
        if (available) {
          suggestions.push(`${candidate}.${tld}`);
        }
      }
    }

    // TLD variations
    if (suggestions.length < count) {
      for (const altTld of Array.from(DomainManager.COMMON_TLDS).slice(0, 10)) {
        if (altTld === tld) continue;
        if (suggestions.length >= count) break;
        const candidate = `${sld}.${altTld}`;
        const available = await this.isDomainAvailable(candidate);
        if (available) {
          suggestions.push(candidate);
        }
      }
    }

    return suggestions;
  }

  /**
   * Auto-provision subdomain for tenant
   */
  async provisionSubdomainForTenant(tenantId: string, preferredSubdomain?: string): Promise<SubdomainProvisioningResult> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    // Get tenant info
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('name, subdomain')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      throw new Error('Tenant not found');
    }

    let subdomain = preferredSubdomain || tenant.subdomain;

    // Generate subdomain from tenant name if not provided
    if (!subdomain) {
      const baseName = tenant.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 30);
      subdomain = baseName;
    }

    // Sanitize subdomain
    subdomain = subdomain
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-+|-+$/g, '')
      .substring(0, 63);

    if (!subdomain) {
      throw new Error('Unable to generate valid subdomain from tenant name');
    }

    // Check availability and find alternative if needed
    let isAvailable = await this.isSubdomainAvailable(subdomain);
    if (!isAvailable) {
      const suggestions = await this.suggestSubdomains(subdomain);
      if (suggestions.length === 0) {
        throw new Error(`Subdomain "${subdomain}" is not available and no alternatives found`);
      }
      subdomain = suggestions[0];
    }

    const domain = `${subdomain}.${this.platformDomain}`;

    // Create domain config
    const domainConfig = await this.initiateDomainVerification({
      tenantId,
      domain,
      subdomain,
      verificationMethod: 'txt',
    });

    const dnsRecords = this.getRequiredDNSRecords(domain, domainConfig.verificationToken, 'txt');

    // Update tenant with subdomain if needed
    if (!preferredSubdomain || preferredSubdomain !== subdomain) {
      await supabase
        .from('tenants')
        .update({ subdomain, updated_at: new Date().toISOString() })
        .eq('id', tenantId);
    }

    return {
      subdomain,
      tenantId,
      domain,
      dnsRecords,
      accessUrl: `https://${domain}`,
      status: domainConfig.status as 'active' | 'pending',
    };
  }

  /**
   * Suggest available subdomains
   */
  private async suggestSubdomains(baseSubdomain: string): Promise<string[]> {
    const suggestions: string[] = [];
    const cleanBase = baseSubdomain.replace(/[^a-z0-9]/g, '').toLowerCase();

    const suffixes = ['', '1', '2', '3', 'hq', 'app', 'co', 'io'];

    for (const suffix of suffixes) {
      if (suggestions.length >= 5) break;
      const candidate = suffix ? `${cleanBase}${suffix}` : cleanBase;
      if (await this.isSubdomainAvailable(candidate)) {
        suggestions.push(candidate);
      }
    }

    return suggestions;
  }

  /**
   * Generate DNS configuration instructions for different providers
   */
  getDNSProviderInstructions(
    domain: string,
    provider: 'cloudflare' | 'godaddy' | 'namecheap' | 'route53' | 'google' | 'generic'
  ): DNSProviderInstructions {
    const records = this.getRequiredDNSRecords(domain, 'YOUR_VERIFICATION_TOKEN', 'txt');

    const providerInstructions: Record<string, { steps: string[]; ttlRecommendation: number; estimatedPropagation: string }> = {
      cloudflare: {
        steps: [
          'Log in to Cloudflare Dashboard',
          'Select your domain',
          'Go to DNS > Records',
          'Click "Add record"',
          'Select "TXT" as the record type',
          `Enter ${records[0]?.name || '_smartcrm-verification'} as the Name`,
          `Enter your verification token as the Content`,
          'Set TTL to 5 minutes (or "Auto")',
          'Save the record',
          'Wait 5-10 minutes for propagation',
        ],
        ttlRecommendation: 300,
        estimatedPropagation: '5-10 minutes',
      },
      godaddy: {
        steps: [
          'Log in to GoDaddy Domain Portfolio',
          'Select your domain and click "DNS"',
          'Scroll to "Records" section',
          'Click "Add" to create a new record',
          'Select "TXT" as the Type',
          `Enter ${records[0]?.name || '@'} as the Host`,
          `Enter your verification token as the TXT Value`,
          'Set TTL to 1/2 hour (or lowest available)',
          'Save the record',
          'Wait 10-30 minutes for propagation',
        ],
        ttlRecommendation: 1800,
        estimatedPropagation: '10-30 minutes',
      },
      namecheap: {
        steps: [
          'Log in to Namecheap account',
          'Go to Domain List > Manage > Advanced DNS',
          'Under "Host Records", click "Add New Record"',
          'Select "TXT Record" from the Type dropdown',
          `Enter ${records[0]?.name || '@'} as the Host`,
          `Enter your verification token as the Value`,
          'Set TTL to 1 min (or 60 seconds)',
          'Save changes',
          'Wait 5-15 minutes for propagation',
        ],
        ttlRecommendation: 60,
        estimatedPropagation: '5-15 minutes',
      },
      route53: {
        steps: [
          'Log in to AWS Route 53 Console',
          'Select your hosted zone',
          'Click "Create record"',
          'Choose "Simple record"',
          'Select "TXT - Text" as the Record type',
          `Enter ${records[0]?.name || domain} in the Record name field`,
          `Enter your verification token in the Value field (wrap in quotes)`,
          'Set TTL to 300 seconds',
          'Create records',
          'Wait 30-60 seconds for propagation (Route53 is usually fast)',
        ],
        ttlRecommendation: 300,
        estimatedPropagation: '30-60 seconds',
      },
      google: {
        steps: [
          'Log in to Google Domains',
          'Select your domain',
          'Click "DNS" in the left sidebar',
          'Scroll to "Custom resource records"',
          'In the first field, enter the subdomain/prefix',
          `Select "TXT" from the Type dropdown`,
          `Enter your verification token in the Data field`,
          'Set TTL to 1 hour (or 3600 seconds)',
          'Add the record',
          'Wait 5-15 minutes for propagation',
        ],
        ttlRecommendation: 3600,
        estimatedPropagation: '5-15 minutes',
      },
      generic: {
        steps: [
          'Log in to your domain registrar or DNS provider',
          'Find the DNS management or Zone Editor section',
          'Create a new TXT record',
          `Set the host/name to: ${records[0]?.name || domain}`,
          `Set the value/content to your verification token`,
          'Set TTL to 300 seconds (5 minutes) if available',
          'Save the DNS record',
          'Wait 15 minutes to 48 hours for global propagation',
        ],
        ttlRecommendation: 300,
        estimatedPropagation: '15 minutes - 48 hours',
      },
    };

    const instructions = providerInstructions[provider] || providerInstructions.generic;

    return {
      provider,
      records,
      steps: instructions.steps,
      ttlRecommendation: instructions.ttlRecommendation,
      estimatedPropagation: instructions.estimatedPropagation,
    };
  }

  /**
   * Check DNS propagation status
   */
  async checkPropagationStatus(domain: string): Promise<{ propagated: boolean; nameservers?: string[] }> {
    try {
      const nameservers = await dns.resolveNs(domain);

      // Check if TXT record exists
      try {
        await dns.resolveTxt(`_smartcrm-verification.${domain}`);
        return { propagated: true, nameservers: nameservers.map((ns) => ns.replace(/\.$/, '')) };
      } catch {
        return { propagated: false, nameservers: nameservers.map((ns) => ns.replace(/\.$/, '')) };
      }
    } catch {
      return { propagated: false };
    }
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
