/**
 * Asset Management API Routes
 * Handles asset upload, retrieval, and management
 */

import { Router, Request, Response } from 'express';
import { assetManager, Asset } from '../services/whitelabel/assetManager';
import { errorLogger } from '../services/errorLogger';
import multer from 'multer';

const router = Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Max 10 files per request
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/x-icon',
      'application/pdf',
      'video/mp4',
      'video/webm'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  }
});

/**
 * POST /api/assets/upload
 * Upload single or multiple assets
 */
router.post('/upload', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    const { tenantId, category, optimize, generateThumbnail, metadata } = req.body;
    const userId = (req as any).session?.userId;

    // Validation
    if (!tenantId || !category) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['tenantId', 'category']
      });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({
        error: 'No files provided'
      });
    }

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Validate category
    const validCategories = ['logo', 'icon', 'image', 'document', 'video'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        error: 'Invalid category',
        validCategories
      });
    }

    // Upload files
    const uploadOptions = {
      tenantId,
      category,
      optimize: optimize === 'true' || optimize === true,
      generateThumbnail: generateThumbnail === 'true' || generateThumbnail === true,
      metadata: metadata ? JSON.parse(metadata) : {},
      createdBy: userId
    };

    if (files.length === 1) {
      // Single file upload
      const asset = await assetManager.uploadAsset(
        files[0].buffer,
        files[0].originalname,
        uploadOptions
      );

      res.status(201).json({
        message: 'Asset uploaded successfully',
        asset
      });
    } else {
      // Bulk upload
      const fileData = files.map(f => ({
        buffer: f.buffer,
        fileName: f.originalname
      }));

      const result = await assetManager.bulkUpload(fileData, uploadOptions);

      res.status(201).json({
        message: `Uploaded ${result.assets.length} assets`,
        assets: result.assets,
        errors: result.errors,
        summary: {
          successful: result.assets.length,
          failed: result.errors.length,
          total: files.length
        }
      });
    }

  } catch (error: any) {
    await errorLogger.logError('Asset upload failed', error, {
      endpoint: '/api/assets/upload',
      method: 'POST'
    });

    res.status(500).json({
      error: 'Failed to upload asset',
      message: error.message
    });
  }
});

/**
 * GET /api/assets
 * List assets with filtering and pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { tenantId, category, page, limit, search } = req.query;

    if (!tenantId) {
      return res.status(400).json({
        error: 'tenantId is required'
      });
    }

    const result = await assetManager.listAssets({
      tenantId: tenantId as string,
      category: category as Asset['category'],
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50,
      search: search as string
    });

    res.json(result);

  } catch (error: any) {
    await errorLogger.logError('Failed to list assets', error, {
      endpoint: '/api/assets',
      method: 'GET'
    });

    res.status(500).json({
      error: 'Failed to list assets',
      message: error.message
    });
  }
});

/**
 * GET /api/assets/:assetId
 * Get asset details
 */
router.get('/:assetId', async (req: Request, res: Response) => {
  try {
    const { assetId } = req.params;

    const asset = await assetManager.getAsset(assetId);

    res.json({ asset });

  } catch (error: any) {
    await errorLogger.logError('Failed to get asset', error, {
      endpoint: `/api/assets/${req.params.assetId}`,
      method: 'GET'
    });

    res.status(404).json({
      error: 'Asset not found',
      message: error.message
    });
  }
});

/**
 * PUT /api/assets/:assetId
 * Update asset metadata
 */
router.put('/:assetId', async (req: Request, res: Response) => {
  try {
    const { assetId } = req.params;
    const updates = req.body;

    const asset = await assetManager.updateAsset(assetId, updates);

    res.json({
      message: 'Asset updated successfully',
      asset
    });

  } catch (error: any) {
    await errorLogger.logError('Failed to update asset', error, {
      endpoint: `/api/assets/${req.params.assetId}`,
      method: 'PUT'
    });

    res.status(500).json({
      error: 'Failed to update asset',
      message: error.message
    });
  }
});

/**
 * DELETE /api/assets/:assetId
 * Delete asset
 */
router.delete('/:assetId', async (req: Request, res: Response) => {
  try {
    const { assetId } = req.params;

    await assetManager.deleteAsset(assetId);

    res.json({
      message: 'Asset deleted successfully',
      assetId
    });

  } catch (error: any) {
    await errorLogger.logError('Failed to delete asset', error, {
      endpoint: `/api/assets/${req.params.assetId}`,
      method: 'DELETE'
    });

    res.status(500).json({
      error: 'Failed to delete asset',
      message: error.message
    });
  }
});

/**
 * GET /api/assets/:assetId/versions
 * Get all versions of an asset
 */
router.get('/:assetId/versions', async (req: Request, res: Response) => {
  try {
    const { assetId } = req.params;

    const versions = await assetManager.getAssetVersions(assetId);

    res.json({
      versions,
      count: versions.length,
      latest: versions[0]
    });

  } catch (error: any) {
    await errorLogger.logError('Failed to get asset versions', error, {
      endpoint: `/api/assets/${req.params.assetId}/versions`,
      method: 'GET'
    });

    res.status(500).json({
      error: 'Failed to get asset versions',
      message: error.message
    });
  }
});

/**
 * POST /api/assets/:assetId/version
 * Create new version of an asset
 */
router.post('/:assetId/version', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { assetId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        error: 'No file provided'
      });
    }

    const newVersion = await assetManager.createAssetVersion(
      assetId,
      file.buffer,
      file.originalname
    );

    res.status(201).json({
      message: 'New asset version created',
      asset: newVersion
    });

  } catch (error: any) {
    await errorLogger.logError('Failed to create asset version', error, {
      endpoint: `/api/assets/${req.params.assetId}/version`,
      method: 'POST'
    });

    res.status(500).json({
      error: 'Failed to create asset version',
      message: error.message
    });
  }
});

/**
 * GET /api/assets/stats/:tenantId
 * Get asset usage statistics
 */
router.get('/stats/:tenantId', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;

    const stats = await assetManager.getAssetUsageStats(tenantId);

    res.json({
      stats,
      summary: {
        totalAssets: stats.totalAssets,
        totalSizeMB: (stats.totalSize / (1024 * 1024)).toFixed(2),
        categories: Object.keys(stats.byCategory).length
      }
    });

  } catch (error: any) {
    await errorLogger.logError('Failed to get asset stats', error, {
      endpoint: `/api/assets/stats/${req.params.tenantId}`,
      method: 'GET'
    });

    res.status(500).json({
      error: 'Failed to get asset statistics',
      message: error.message
    });
  }
});

/**
 * GET /api/assets/search/:tenantId
 * Search assets
 */
router.get('/search/:tenantId', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        error: 'Search query (q) is required'
      });
    }

    const assets = await assetManager.searchAssets(tenantId, q as string);

    res.json({
      assets,
      count: assets.length,
      query: q
    });

  } catch (error: any) {
    await errorLogger.logError('Asset search failed', error, {
      endpoint: `/api/assets/search/${req.params.tenantId}`,
      method: 'GET'
    });

    res.status(500).json({
      error: 'Asset search failed',
      message: error.message
    });
  }
});

export default router;
