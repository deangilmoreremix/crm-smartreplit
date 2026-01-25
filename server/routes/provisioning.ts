/**
 * Tenant Provisioning API Routes
 * Handles automated tenant creation and onboarding
 */

import { Router, Request, Response } from 'express';
import { tenantProvisioner, TenantConfig } from '../services/whitelabel/tenantProvisioner';
import { errorLogger } from '../services/errorLogger';

const router = Router();

/**
 * POST /api/provisioning/create
 * Create new tenant with automated setup
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const config: TenantConfig = req.body;

    // Validation
    if (!config.name || !config.subdomain || !config.contactEmail) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'subdomain', 'contactEmail']
      });
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
    if (!subdomainRegex.test(config.subdomain)) {
      return res.status(400).json({
        error: 'Invalid subdomain format',
        message: 'Subdomain must be lowercase alphanumeric with hyphens, 1-63 characters'
      });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(config.contactEmail)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // Create tenant
    const tenant = await tenantProvisioner.createTenant(config);

    // Get onboarding status
    const onboarding = await tenantProvisioner.getOnboardingStatus(tenant.id);

    res.status(201).json({
      message: 'Tenant created successfully',
      tenant,
      onboarding,
      nextSteps: [
        'Configure branding and theme',
        'Set up custom domain',
        'Invite team members',
        'Import initial data'
      ],
      accessUrl: `https://${tenant.subdomain}.smartcrm.vip`
    });

  } catch (error: any) {
    await errorLogger.logError('Tenant creation failed', error, {
      endpoint: '/api/provisioning/create',
      method: 'POST'
    });

    res.status(500).json({
      error: 'Failed to create tenant',
      message: error.message
    });
  }
});

/**
 * GET /api/provisioning/templates
 * List available tenant templates
 */
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const templates = await tenantProvisioner.listTemplates();

    res.json({
      templates,
      count: templates.length
    });

  } catch (error: any) {
    await errorLogger.logError('Failed to list templates', error, {
      endpoint: '/api/provisioning/templates',
      method: 'GET'
    });

    res.status(500).json({
      error: 'Failed to list templates',
      message: error.message
    });
  }
});

/**
 * POST /api/provisioning/apply-template
 * Apply template to existing tenant
 */
router.post('/apply-template', async (req: Request, res: Response) => {
  try {
    const { tenantId, templateId } = req.body;

    if (!tenantId || !templateId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['tenantId', 'templateId']
      });
    }

    const template = await tenantProvisioner.getTemplate(templateId);
    if (!template) {
      return res.status(404).json({
        error: 'Template not found'
      });
    }

    await tenantProvisioner.applyTemplate(tenantId, template);

    res.json({
      message: 'Template applied successfully',
      template: {
        id: template.id,
        name: template.name
      }
    });

  } catch (error: any) {
    await errorLogger.logError('Template application failed', error, {
      endpoint: '/api/provisioning/apply-template',
      method: 'POST'
    });

    res.status(500).json({
      error: 'Failed to apply template',
      message: error.message
    });
  }
});

/**
 * GET /api/provisioning/status/:tenantId
 * Get tenant provisioning and onboarding status
 */
router.get('/status/:tenantId', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;

    const tenant = await tenantProvisioner.getTenant(tenantId);
    const onboarding = await tenantProvisioner.getOnboardingStatus(tenantId);

    res.json({
      tenant,
      onboarding,
      progress: onboarding ? {
        percentage: Math.round((onboarding.completedSteps.length / onboarding.totalSteps) * 100),
        currentStep: onboarding.currentStep,
        totalSteps: onboarding.totalSteps
      } : null
    });

  } catch (error: any) {
    await errorLogger.logError('Failed to get provisioning status', error, {
      endpoint: `/api/provisioning/status/${req.params.tenantId}`,
      method: 'GET'
    });

    res.status(404).json({
      error: 'Tenant not found',
      message: error.message
    });
  }
});

/**
 * POST /api/provisioning/onboarding/step
 * Update onboarding step completion
 */
router.post('/onboarding/step', async (req: Request, res: Response) => {
  try {
    const { tenantId, stepId, completed } = req.body;

    if (!tenantId || !stepId || completed === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['tenantId', 'stepId', 'completed']
      });
    }

    const onboarding = await tenantProvisioner.updateOnboardingProgress(
      tenantId,
      stepId,
      completed
    );

    res.json({
      message: completed ? 'Step completed' : 'Step marked incomplete',
      onboarding,
      progress: {
        percentage: Math.round((onboarding.completedSteps.length / onboarding.totalSteps) * 100),
        remaining: onboarding.totalSteps - onboarding.completedSteps.length
      }
    });

  } catch (error: any) {
    await errorLogger.logError('Failed to update onboarding step', error, {
      endpoint: '/api/provisioning/onboarding/step',
      method: 'POST'
    });

    res.status(500).json({
      error: 'Failed to update onboarding step',
      message: error.message
    });
  }
});

/**
 * POST /api/provisioning/complete
 * Mark onboarding as complete
 */
router.post('/complete', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        error: 'tenantId is required'
      });
    }

    // Get onboarding status
    const onboarding = await tenantProvisioner.getOnboardingStatus(tenantId);
    if (!onboarding) {
      return res.status(404).json({
        error: 'Onboarding not found'
      });
    }

    // Mark all steps as completed
    const allSteps = onboarding.completedSteps;
    for (let i = 1; i <= onboarding.totalSteps; i++) {
      if (!allSteps.includes(`step_${i}`)) {
        allSteps.push(`step_${i}`);
      }
    }

    const updatedOnboarding = await tenantProvisioner.updateOnboardingProgress(
      tenantId,
      'final',
      true
    );

    res.json({
      message: 'Onboarding completed successfully',
      onboarding: updatedOnboarding
    });

  } catch (error: any) {
    await errorLogger.logError('Failed to complete onboarding', error, {
      endpoint: '/api/provisioning/complete',
      method: 'POST'
    });

    res.status(500).json({
      error: 'Failed to complete onboarding',
      message: error.message
    });
  }
});

/**
 * GET /api/provisioning/tenants
 * List tenants with filtering
 */
router.get('/tenants', async (req: Request, res: Response) => {
  try {
    const { status, type, parentPartnerId, page, limit } = req.query;

    const result = await tenantProvisioner.listTenants({
      status: status as string,
      type: type as string,
      parentPartnerId: parentPartnerId as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50
    });

    res.json(result);

  } catch (error: any) {
    await errorLogger.logError('Failed to list tenants', error, {
      endpoint: '/api/provisioning/tenants',
      method: 'GET'
    });

    res.status(500).json({
      error: 'Failed to list tenants',
      message: error.message
    });
  }
});

/**
 * GET /api/provisioning/tenants/:tenantId
 * Get tenant details
 */
router.get('/tenants/:tenantId', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;

    const tenant = await tenantProvisioner.getTenant(tenantId);

    res.json({ tenant });

  } catch (error: any) {
    await errorLogger.logError('Failed to get tenant', error, {
      endpoint: `/api/provisioning/tenants/${req.params.tenantId}`,
      method: 'GET'
    });

    res.status(404).json({
      error: 'Tenant not found',
      message: error.message
    });
  }
});

/**
 * PUT /api/provisioning/tenants/:tenantId
 * Update tenant configuration
 */
router.put('/tenants/:tenantId', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const updates = req.body;

    const tenant = await tenantProvisioner.updateTenant(tenantId, updates);

    res.json({
      message: 'Tenant updated successfully',
      tenant
    });

  } catch (error: any) {
    await errorLogger.logError('Failed to update tenant', error, {
      endpoint: `/api/provisioning/tenants/${req.params.tenantId}`,
      method: 'PUT'
    });

    res.status(500).json({
      error: 'Failed to update tenant',
      message: error.message
    });
  }
});

/**
 * POST /api/provisioning/tenants/:tenantId/suspend
 * Suspend tenant
 */
router.post('/tenants/:tenantId/suspend', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { reason } = req.body;

    await tenantProvisioner.suspendTenant(tenantId, reason);

    res.json({
      message: 'Tenant suspended successfully',
      tenantId
    });

  } catch (error: any) {
    await errorLogger.logError('Failed to suspend tenant', error, {
      endpoint: `/api/provisioning/tenants/${req.params.tenantId}/suspend`,
      method: 'POST'
    });

    res.status(500).json({
      error: 'Failed to suspend tenant',
      message: error.message
    });
  }
});

/**
 * POST /api/provisioning/tenants/:tenantId/activate
 * Activate tenant
 */
router.post('/tenants/:tenantId/activate', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;

    await tenantProvisioner.activateTenant(tenantId);

    res.json({
      message: 'Tenant activated successfully',
      tenantId
    });

  } catch (error: any) {
    await errorLogger.logError('Failed to activate tenant', error, {
      endpoint: `/api/provisioning/tenants/${req.params.tenantId}/activate`,
      method: 'POST'
    });

    res.status(500).json({
      error: 'Failed to activate tenant',
      message: error.message
    });
  }
});

/**
 * DELETE /api/provisioning/tenants/:tenantId
 * Delete tenant (soft delete)
 */
router.delete('/tenants/:tenantId', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;

    await tenantProvisioner.deleteTenant(tenantId);

    res.json({
      message: 'Tenant deleted successfully',
      tenantId
    });

  } catch (error: any) {
    await errorLogger.logError('Failed to delete tenant', error, {
      endpoint: `/api/provisioning/tenants/${req.params.tenantId}`,
      method: 'DELETE'
    });

    res.status(500).json({
      error: 'Failed to delete tenant',
      message: error.message
    });
  }
});

export default router;
