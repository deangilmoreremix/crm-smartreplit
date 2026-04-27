export class DomainRouter {
  private static domainTenantMap: Record<string, string> = {
    'app.smartcrm.vip': 'default-tenant',
    'pipeline.smartcrm.vip': 'pipeline-tenant',
    'contacts.smartcrm.vip': 'contacts-tenant',
    'analytics.smartcrm.vip': 'analytics-tenant',
    'agency.smartcrm.vip': 'agency-tenant',
    'calendar.smartcrm.vip': 'calendar-tenant',
    'research.smartcrm.vip': 'research-tenant',
    'white-label.smartcrm.vip': 'whitelabel-tenant',
    // Development domains
    localhost: 'dev-tenant',
    '127.0.0.1': 'dev-tenant',
  };

  private static tenantDomainMap: Record<string, string> = {
    'default-tenant': 'app.smartcrm.vip',
    'pipeline-tenant': 'pipeline.smartcrm.vip',
    'contacts-tenant': 'contacts.smartcrm.vip',
    'analytics-tenant': 'analytics.smartcrm.vip',
    'agency-tenant': 'agency.smartcrm.vip',
    'calendar-tenant': 'calendar.smartcrm.vip',
    'research-tenant': 'research.smartcrm.vip',
    'whitelabel-tenant': 'white-label.smartcrm.vip',
    'dev-tenant': 'localhost',
  };

  /**
   * Get tenant ID from domain
   */
  static getTenantFromDomain(domain: string): string {
    // Handle subdomains and localhost variations
    const normalizedDomain = domain.toLowerCase();

    // Direct match
    if (this.domainTenantMap[normalizedDomain]) {
      return this.domainTenantMap[normalizedDomain];
    }

    // Check for wildcard patterns (e.g., tenant1.app.smartcrm.vip)
    for (const [pattern, tenantId] of Object.entries(this.domainTenantMap)) {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        if (regex.test(normalizedDomain)) {
          return tenantId;
        }
      }
    }

    // Default fallback
    return 'default-tenant';
  }

  /**
   * Get domain from tenant ID
   */
  static getDomainFromTenant(tenantId: string): string {
    return this.tenantDomainMap[tenantId] || 'app.smartcrm.vip';
  }

  /**
   * Check if domain is valid for our system
   */
  static isValidDomain(domain: string): boolean {
    const normalizedDomain = domain.toLowerCase();
    return Object.keys(this.domainTenantMap).some((pattern) => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(normalizedDomain);
      }
      return pattern === normalizedDomain;
    });
  }

  /**
   * Get all available domains
   */
  static getAvailableDomains(): string[] {
    return Object.keys(this.domainTenantMap);
  }

  /**
   * Register a custom domain for a tenant
   */
  static registerCustomDomain(tenantId: string, customDomain: string): void {
    this.domainTenantMap[customDomain.toLowerCase()] = tenantId;
    this.tenantDomainMap[tenantId] = customDomain.toLowerCase();
  }

  /**
   * Remove a custom domain registration
   */
  static removeCustomDomain(customDomain: string): void {
    const tenantId = this.domainTenantMap[customDomain.toLowerCase()];
    if (tenantId) {
      delete this.domainTenantMap[customDomain.toLowerCase()];
      // Revert to default domain for tenant
      this.tenantDomainMap[tenantId] = this.getDefaultDomainForTenant(tenantId);
    }
  }

  /**
   * Get default domain for a tenant
   */
  private static getDefaultDomainForTenant(tenantId: string): string {
    const defaults: Record<string, string> = {
      'pipeline-tenant': 'pipeline.smartcrm.vip',
      'contacts-tenant': 'contacts.smartcrm.vip',
      'analytics-tenant': 'analytics.smartcrm.vip',
      'agency-tenant': 'agency.smartcrm.vip',
      'calendar-tenant': 'calendar.smartcrm.vip',
      'research-tenant': 'research.smartcrm.vip',
      'whitelabel-tenant': 'white-label.smartcrm.vip',
    };
    return defaults[tenantId] || 'app.smartcrm.vip';
  }
}
