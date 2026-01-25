/**
 * Theme Management API Routes
 * Handles theme creation, customization, and management
 */

import { Router, Request, Response } from 'express';
import { themeManager, ThemeConfig } from '../services/whitelabel/themeManager';
import { errorLogger } from '../services/errorLogger';

const router = Router();

/**
 * POST /api/themes
 * Create new theme
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { tenantId, name, description, config } = req.body;
    const userId = (req as any).session?.userId;

    if (!tenantId || !name || !config) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['tenantId', 'name', 'config']
      });
    }

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Validate theme configuration
    const validation = themeManager.validateThemeConfig(config);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid theme configuration',
        details: validation.errors
      });
    }

    const theme = await themeManager.createTheme(
      tenantId,
      name,
      config,
      userId,
      description
    );

    // Generate CSS for preview
    const css = themeManager.generateThemeCSS(config);

    res.status(201).json({
      message: 'Theme created successfully',
      theme,
      css
    });

  } catch (error: any) {
    await errorLogger.logError('Theme creation failed', error, {
      endpoint: '/api/themes',
      method: 'POST'
    });

    res.status(500).json({
      error: 'Failed to create theme',
      message: error.message
    });
  }
});

/**
 * GET /api/themes/tenant/:tenantId
 * List themes for tenant
 */
router.get('/tenant/:tenantId', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;

    const themes = await themeManager.listThemes(tenantId);

    res.json({
      themes,
      count: themes.length
    });

  } catch (error: any) {
    await errorLogger.logError('Failed to list themes', error, {
      endpoint: `/api/themes/tenant/${req.params.tenantId}`,
      method: 'GET'
    });

    res.status(500).json({
      error: 'Failed to list themes',
      message: error.message
    });
  }
});

/**
 * GET /api/themes/active/:tenantId
 * Get active theme for tenant
 */
router.get('/active/:tenantId', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;

    const theme = await themeManager.getActiveTheme(tenantId);

    if (!theme) {
      // Return default theme
      const defaultConfig = themeManager.getDefaultTheme();
      return res.json({
        theme: null,
        defaultConfig,
        css: themeManager.generateThemeCSS(defaultConfig)
      });
    }

    const css = themeManager.generateThemeCSS(theme.config);

    res.json({
      theme,
      css
    });

  } catch (error: any) {
    await errorLogger.logError('Failed to get active theme', error, {
      endpoint: `/api/themes/active/${req.params.tenantId}`,
      method: 'GET'
    });

    res.status(500).json({
      error: 'Failed to get active theme',
      message: error.message
    });
  }
});

/**
 * GET /api/themes/:themeId
 * Get theme by ID
 */
router.get('/:themeId', async (req: Request, res: Response) => {
  try {
    const { themeId } = req.params;

    const theme = await themeManager.getTheme(themeId);
    const css = themeManager.generateThemeCSS(theme.config);

    res.json({
      theme,
      css
    });

  } catch (error: any) {
    await errorLogger.logError('Failed to get theme', error, {
      endpoint: `/api/themes/${req.params.themeId}`,
      method: 'GET'
    });

    res.status(404).json({
      error: 'Theme not found',
      message: error.message
    });
  }
});

/**
 * PUT /api/themes/:themeId
 * Update theme
 */
router.put('/:themeId', async (req: Request, res: Response) => {
  try {
    const { themeId } = req.params;
    const updates = req.body;

    // Validate config if provided
    if (updates.config) {
      const validation = themeManager.validateThemeConfig(updates.config);
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Invalid theme configuration',
          details: validation.errors
        });
      }
    }

    const theme = await themeManager.updateTheme(themeId, updates);
    const css = themeManager.generateThemeCSS(theme.config);

    res.json({
      message: 'Theme updated successfully',
      theme,
      css
    });

  } catch (error: any) {
    await errorLogger.logError('Failed to update theme', error, {
      endpoint: `/api/themes/${req.params.themeId}`,
      method: 'PUT'
    });

    res.status(500).json({
      error: 'Failed to update theme',
      message: error.message
    });
  }
});

/**
 * DELETE /api/themes/:themeId
 * Delete theme
 */
router.delete('/:themeId', async (req: Request, res: Response) => {
  try {
    const { themeId } = req.params;

    await themeManager.deleteTheme(themeId);

    res.json({
      message: 'Theme deleted successfully',
      themeId
    });

  } catch (error: any) {
    await errorLogger.logError('Failed to delete theme', error, {
      endpoint: `/api/themes/${req.params.themeId}`,
      method: 'DELETE'
    });

    res.status(500).json({
      error: 'Failed to delete theme',
      message: error.message
    });
  }
});

/**
 * POST /api/themes/:themeId/activate
 * Activate theme
 */
router.post('/:themeId/activate', async (req: Request, res: Response) => {
  try {
    const { themeId } = req.params;

    const theme = await themeManager.updateTheme(themeId, { isActive: true });
    const css = themeManager.generateThemeCSS(theme.config);

    res.json({
      message: 'Theme activated successfully',
      theme,
      css
    });

  } catch (error: any) {
    await errorLogger.logError('Failed to activate theme', error, {
      endpoint: `/api/themes/${req.params.themeId}/activate`,
      method: 'POST'
    });

    res.status(500).json({
      error: 'Failed to activate theme',
      message: error.message
    });
  }
});

/**
 * POST /api/themes/:themeId/clone
 * Clone theme
 */
router.post('/:themeId/clone', async (req: Request, res: Response) => {
  try {
    const { themeId } = req.params;
    const { name } = req.body;
    const userId = (req as any).session?.userId;

    if (!name) {
      return res.status(400).json({
        error: 'Theme name is required'
      });
    }

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const clonedTheme = await themeManager.cloneTheme(themeId, name, userId);

    res.status(201).json({
      message: 'Theme cloned successfully',
      theme: clonedTheme
    });

  } catch (error: any) {
    await errorLogger.logError('Failed to clone theme', error, {
      endpoint: `/api/themes/${req.params.themeId}/clone`,
      method: 'POST'
    });

    res.status(500).json({
      error: 'Failed to clone theme',
      message: error.message
    });
  }
});

/**
 * GET /api/themes/presets
 * Get theme presets
 */
router.get('/presets/list', async (req: Request, res: Response) => {
  try {
    const presets = themeManager.getThemePresets();

    res.json({
      presets,
      count: presets.length
    });

  } catch (error: any) {
    await errorLogger.logError('Failed to get theme presets', error, {
      endpoint: '/api/themes/presets',
      method: 'GET'
    });

    res.status(500).json({
      error: 'Failed to get theme presets',
      message: error.message
    });
  }
});

/**
 * POST /api/themes/import
 * Import theme from JSON
 */
router.post('/import', async (req: Request, res: Response) => {
  try {
    const { tenantId, themeJson } = req.body;
    const userId = (req as any).session?.userId;

    if (!tenantId || !themeJson) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['tenantId', 'themeJson']
      });
    }

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const theme = await themeManager.importTheme(tenantId, themeJson, userId);

    res.status(201).json({
      message: 'Theme imported successfully',
      theme
    });

  } catch (error: any) {
    await errorLogger.logError('Theme import failed', error, {
      endpoint: '/api/themes/import',
      method: 'POST'
    });

    res.status(400).json({
      error: 'Failed to import theme',
      message: error.message
    });
  }
});

/**
 * GET /api/themes/:themeId/export
 * Export theme as JSON
 */
router.get('/:themeId/export', async (req: Request, res: Response) => {
  try {
    const { themeId } = req.params;

    const theme = await themeManager.getTheme(themeId);
    const themeJson = themeManager.exportTheme(theme);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${theme.name.replace(/\s+/g, '-').toLowerCase()}-theme.json"`);
    res.send(themeJson);

  } catch (error: any) {
    await errorLogger.logError('Theme export failed', error, {
      endpoint: `/api/themes/${req.params.themeId}/export`,
      method: 'GET'
    });

    res.status(404).json({
      error: 'Failed to export theme',
      message: error.message
    });
  }
});

/**
 * POST /api/themes/preview
 * Generate theme preview CSS
 */
router.post('/preview', async (req: Request, res: Response) => {
  try {
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({
        error: 'Theme config is required'
      });
    }

    // Validate configuration
    const validation = themeManager.validateThemeConfig(config);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid theme configuration',
        details: validation.errors
      });
    }

    const css = themeManager.generateThemeCSS(config);
    const tailwindConfig = themeManager.generateTailwindConfig(config);

    res.json({
      css,
      tailwindConfig
    });

  } catch (error: any) {
    await errorLogger.logError('Theme preview generation failed', error, {
      endpoint: '/api/themes/preview',
      method: 'POST'
    });

    res.status(500).json({
      error: 'Failed to generate theme preview',
      message: error.message
    });
  }
});

export default router;
