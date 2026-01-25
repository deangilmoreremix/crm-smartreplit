/**
 * Domain Management API Routes
 * Handles custom domain configuration, verification, and monitoring
 */

import { Router, Request, Response } from 'express';
import { domainManager, DomainConfig } from '../services/whitelabel/domainManager';
import { errorLogger } from '../services/errorLogger';

const router = Router();

/**
 * POST /api/domains/verify
 * Initiate domain verification
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { tenantId, domain, subdomain, verificationMethod } = req.body;

    // Validation
    if (!tenantId || !domain) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['tenantId', 'domain']
      });
    }

    // Validate domain format
    const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
    if (!domainRegex.test(domain)) {
      return res.status(400).json({
        error: 'Invalid domain format',
        domain
      });
    }

    // Check if domain is already registered
    const isAvailable = await domainManager.isDomainAvailable(domain);
    if (!isAvailable) {
      return res.status(409).json({
        error: 'Domain already registered',
        domain
      });
    }

    // Initiate verification
    const domainConfig = await domainManager.initiateDomainVerification({
      tenantId,
      domain,
      subdomain,
      verificationToken: '', // Will be generated
      verificationMethod: verificationMethod || 'txt'
    });

    // Get required DNS records
    const dnsRecords = domainManager.getRequiredDNSRecords(
      domain,
      domainConfig.verificationToken,
      domainConfig.verificationMethod
    );

    res.status(201).json({
      domainConfig,
      dnsRecords,
      instructions: {
        message: 'Add the following DNS records to verify domain ownership',
        verificationMethod: domainConfig.verificationMethod,
        estimatedTime: '5-15 minutes for DNS propagation'
      }
    });

  } catch (error: any) {
    await errorLogger.logError('Domain verification initiation failed', error, {
      endpoint: '/api/domains/verify',
      method: 'POST'
    });

    res.status(500).json({
      error: 'Failed to initiate domain verification',
      message: error.message
    });
  }
});

/**
 * GET /api/domains/:domainId
 * Get domain configuration and status
 */
router.get('/:domainId', async (req: Request, res: Response) => {
  try {
    const { domainId } = req.params;

    const domainConfig = await domainManager.getDomainConfig(domainId);

    res.json({
      domainConfig,
      dnsRecords: domainManager.getRequiredDNSRecords(
        domainConfig.domain,
        domainConfig.verificationToken,
        domainConfig.verificationMethod
      )
    });

  } catch (error: any) {
    await errorLogger.logError('Failed to get domain config', error, {
      endpoint: `/api/domains/${req.params.domainId}`,
      method: 'GET'
    });

    res.status(404).json({
      error: 'Domain not found',
      message: error.message
    });
  }
});

/**
 * POST /api/domains/:domainId/check
 * Check domain verification status
 */
router.post('/:domainId/check', async (req: Request, res: Response) => {
  try {
    const { domainId } = req.params;

    const domainConfig = await domainManager.checkDomainVerification(domainId);

    res.json({
      domainConfig,
      verified: domainConfig.dnsVerified,
      sslActive: domainConfig.sslStatus === 'active',
      message: domainConfig.dnsVerified 
        ? 'Domain verified successfully' 
        : 'Domain verification pending'
    });

  } catch (error: any) {
    await errorLogger.logError('Domain verification check failed', error, {
      endpoint: `/api/domains/${req.params.domainId}/check`,
      method: 'POST'
    });

    res.status(500).json({
      error: 'Failed to check domain verification',
      message: error.message
    });
  }
});

/**
 * GET /api/domains/health/:domain
 * Check domain health
 */
router.get('/health/:domain', async (req: Request, res: Response) => {
  try {
    const { domain } = req.params;

    const health = await domainManager.checkDomainHealth(domain);

    res.json({
      health,
      status: health.issues.length === 0 ? 'healthy' : 'issues_detected',
      recommendations: health.issues.length > 0 
        ? ['Review DNS configuration', 'Check SSL certificate', 'Verify domain accessibility']
        : ['Domain is healthy']
    });

  } catch (error: any) {
    await errorLogger.logError('Domain health check failed', error, {
      endpoint: `/api/domains/health/${req.params.domain}`,
      method: 'GET'
    });

    res.status(500).json({
      error: 'Failed to check domain health',
      message: error.message
    });
  }
});

/**
 * POST /api/domains/:domainId/ssl/renew
 * Renew SSL certificate
 */
router.post('/:domainId/ssl/renew', async (req: Request, res: Response) => {
  try {
    const { domainId } = req.params;

    await domainManager.renewSSL(domainId);

    const domainConfig = await domainManager.getDomainConfig(domainId);

    res.json({
      message: 'SSL certificate renewed successfully',
      domainConfig,
      expiresAt: domainConfig.sslExpiresAt
    });

  } catch (error: any) {
    await errorLogger.logError('SSL renewal failed', error, {
      endpoint: `/api/domains/${req.params.domainId}/ssl/renew`,
      method: 'POST'
    });

    res.status(500).json({
      error: 'Failed to renew SSL certificate',
      message: error.message
    });
  }
});

/**
 * PUT /api/domains/:domainId
 * Update domain configuration
 */
router.put('/:domainId', async (req: Request, res: Response) => {
  try {
    const { domainId } = req.params;
    const updates = req.body;

    const domainConfig = await domainManager.updateDomainConfig(domainId, updates);

    res.json({
      message: 'Domain configuration updated',
      domainConfig
    });

  } catch (error: any) {
    await errorLogger.logError('Domain update failed', error, {
      endpoint: `/api/domains/${req.params.domainId}`,
      method: 'PUT'
    });

    res.status(500).json({
      error: 'Failed to update domain configuration',
      message: error.message
    });
  }
});

/**
 * DELETE /api/domains/:domainId
 * Remove domain configuration
 */
router.delete('/:domainId', async (req: Request, res: Response) => {
  try {
    const { domainId } = req.params;

    await domainManager.removeDomain(domainId);

    res.json({
      message: 'Domain removed successfully',
      domainId
    });

  } catch (error: any) {
    await errorLogger.logError('Domain removal failed', error, {
      endpoint: `/api/domains/${req.params.domainId}`,
      method: 'DELETE'
    });

    res.status(500).json({
      error: 'Failed to remove domain',
      message: error.message
    });
  }
});

/**
 * GET /api/domains/tenant/:tenantId
 * List all domains for a tenant
 */
router.get('/tenant/:tenantId', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;

    const domains = await domainManager.listTenantDomains(tenantId);

    res.json({
      domains,
      count: domains.length
    });

  } catch (error: any) {
    await errorLogger.logError('Failed to list tenant domains', error, {
      endpoint: `/api/domains/tenant/${req.params.tenantId}`,
      method: 'GET'
    });

    res.status(500).json({
      error: 'Failed to list domains',
      message: error.message
    });
  }
});

/**
 * POST /api/domains/monitor
 * Trigger domain health monitoring (admin only)
 */
router.post('/monitor', async (req: Request, res: Response) => {
  try {
    // This would typically be called by a cron job
    await domainManager.monitorDomainHealth();

    res.json({
      message: 'Domain health monitoring completed',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    await errorLogger.logError('Domain monitoring failed', error, {
      endpoint: '/api/domains/monitor',
      method: 'POST'
    });

    res.status(500).json({
      error: 'Failed to monitor domain health',
      message: error.message
    });
  }
});

export default router;
