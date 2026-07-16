/**
 * White-Label Settings Propagation API Routes
 * Handles propagation, syncing, history, backups, and real-time streaming
 * of white-label settings across tenant instances.
 */

import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { errorLogger } from '../services/errorLogger';
import { requireAuth } from './auth';
import { requireEntitlement } from '../middleware/entitlements';
import { FeatureKey } from '../types/entitlements';

const router = Router();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceRoleKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase =
  supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

const BACKUP_DIR = process.env.WHITELABEL_BACKUP_DIR || path.join(process.cwd(), 'backups', 'whitelabel');

const ensureBackupDir = (): string => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  return BACKUP_DIR;
};

function getTenantConfig(tenantId: string) {
  return supabase
    .from('white_label_configs')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();
}

function getAllTenantConfigs() {
  return supabase.from('white_label_configs').select('*');
}

function getChildTenants(parentTenantId: string) {
  return supabase
    .from('tenants')
    .select('id, name, subdomain, status')
    .eq('parent_partner_id', parentTenantId);
}

function insertHistoryEntry(entry: any) {
  return supabase.from('whitelabel_settings_history').insert(entry);
}

function listHistory(tenantId: string, limit = 50) {
  return supabase
    .from('whitelabel_settings_history')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('changed_at', { ascending: false })
    .limit(limit);
}

router.use(requireAuth);
router.use(requireEntitlement(FeatureKey.WHITE_LABEL_MANAGEMENT));

/**
 * POST /api/whitelabel/propagate
 * Propagate a source tenant's white-label settings to child tenants.
 * Body: { tenantId, targetTenantIds?: string[], strategy?: 'overwrite' | 'merge' | 'prefer-new' }
 */
router.post('/propagate', async (req: Request, res: Response) => {
  try {
    const { tenantId, targetTenantIds, strategy = 'merge' } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        error: 'Missing required field',
        required: ['tenantId'],
      });
    }

    const { data: sourceConfig, error: sourceErr } = await getTenantConfig(tenantId);
    if (sourceErr || !sourceConfig) {
      return res.status(404).json({
        error: 'Source tenant configuration not found',
        tenantId,
      });
    }

    let targets: string[] = [];

    if (targetTenantIds && Array.isArray(targetTenantIds) && targetTenantIds.length > 0) {
      targets = targetTenantIds;
    } else {
      const { data: children, error: childrenErr } = await getChildTenants(tenantId);
      if (childrenErr || !children) {
        return res.status(500).json({
          error: 'Failed to resolve child tenants',
          message: childrenErr?.message,
        });
      }
      targets = children.map((c: any) => c.id);
    }

    const results: any[] = [];
    for (const targetId of targets) {
      const { data: existingConfig } = await getTenantConfig(targetId);
      let mergedConfig = { ...sourceConfig };

      if (existingConfig && strategy === 'merge') {
        mergedConfig = {
          ...existingConfig,
          ...sourceConfig,
          updated_at: new Date().toISOString(),
        };
      }

      if (existingConfig) {
        const { error: updateErr } = await supabase!
          .from('white_label_configs')
          .update({ ...mergedConfig, updated_at: new Date().toISOString() })
          .eq('tenant_id', targetId);
        results.push({ tenantId: targetId, status: updateErr ? 'failed' : 'updated', error: updateErr?.message });
      } else {
        mergedConfig.tenant_id = targetId;
        mergedConfig.id = undefined;
        const { error: insertErr } = await supabase!
          .from('white_label_configs')
          .insert(mergedConfig);
        results.push({ tenantId: targetId, status: insertErr ? 'failed' : 'created', error: insertErr?.message });
      }

      await insertHistoryEntry({
        id: randomUUID(),
        tenant_id: targetId,
        action: 'propagate',
        source_tenant_id: tenantId,
        changes: mergedConfig,
        changed_by: (req as any).userEmail || (req as any).session?.userEmail || null,
        changed_at: new Date().toISOString(),
        metadata: { strategy },
      });
    }

    res.json({
      message: 'Propagation completed',
      sourceTenantId: tenantId,
      strategy,
      results,
      summary: {
        total: results.length,
        succeeded: results.filter((r) => r.status !== 'failed').length,
        failed: results.filter((r) => r.status === 'failed').length,
      },
    });
  } catch (error: any) {
    await errorLogger.logError('White-label propagation failed', error, {
      endpoint: '/api/whitelabel/propagate',
      method: 'POST',
    });
    res.status(500).json({
      error: 'Failed to propagate white-label settings',
      message: error.message,
    });
  }
});

/**
 * POST /api/whitelabel/sync
 * Sync white-label config between two tenants with conflict resolution.
 * Body: { sourceTenantId, targetTenantId, strategy?: 'source-wins' | 'target-wins' | 'merge' }
 */
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const { sourceTenantId, targetTenantId, strategy = 'merge' } = req.body;

    if (!sourceTenantId || !targetTenantId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['sourceTenantId', 'targetTenantId'],
      });
    }

    if (sourceTenantId === targetTenantId) {
      return res.status(400).json({ error: 'sourceTenantId and targetTenantId must be different' });
    }

    const { data: sourceConfig, error: sourceErr } = await getTenantConfig(sourceTenantId);
    if (sourceErr || !sourceConfig) {
      return res.status(404).json({ error: 'Source tenant configuration not found', sourceTenantId });
    }

    const { data: targetConfig, error: targetErr } = await getTenantConfig(targetTenantId);
    if (targetErr && targetErr.code !== 'PGRST116') {
      return res.status(500).json({ error: 'Failed to load target tenant configuration' });
    }

    let mergedConfig: any;
    if (!targetConfig) {
      mergedConfig = { ...sourceConfig, tenant_id: targetTenantId, id: undefined };
      const { error: insertErr } = await supabase!.from('white_label_configs').insert(mergedConfig);
      if (insertErr) {
        throw insertErr;
      }
    } else {
      if (strategy === 'source-wins') {
        mergedConfig = { ...sourceConfig, tenant_id: targetTenantId, id: targetConfig.id };
      } else if (strategy === 'target-wins') {
        mergedConfig = targetConfig;
      } else {
        mergedConfig = { ...targetConfig, ...sourceConfig, updated_at: new Date().toISOString() };
      }
      const { error: updateErr } = await supabase!
        .from('white_label_configs')
        .update({ ...mergedConfig, updated_at: new Date().toISOString() })
        .eq('tenant_id', targetTenantId);
      if (updateErr) {
        throw updateErr;
      }
    }

    await insertHistoryEntry({
      id: randomUUID(),
      tenant_id: targetTenantId,
      action: 'sync',
      source_tenant_id: sourceTenantId,
      changes: mergedConfig,
      changed_by: (req as any).userEmail || (req as any).session?.userEmail || null,
      changed_at: new Date().toISOString(),
      metadata: { strategy, sourceTenantId },
    });

    res.json({
      message: 'Sync completed successfully',
      sourceTenantId,
      targetTenantId,
      strategy,
      syncedConfig: mergedConfig,
    });
  } catch (error: any) {
    await errorLogger.logError('White-label sync failed', error, {
      endpoint: '/api/whitelabel/sync',
      method: 'POST',
    });
    res.status(500).json({
      error: 'Failed to sync white-label settings',
      message: error.message,
    });
  }
});

/**
 * GET /api/whitelabel/history/:tenantId
 * Get propagation history for a tenant.
 */
router.get('/history/:tenantId', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    const { data: history, error } = await listHistory(tenantId, limit);
    if (error) {
      throw error;
    }

    res.json({
      tenantId,
      history: history || [],
      count: history?.length || 0,
    });
  } catch (error: any) {
    await errorLogger.logError('Failed to fetch white-label history', error, {
      endpoint: `/api/whitelabel/history/${req.params.tenantId}`,
      method: 'GET',
    });
    res.status(500).json({
      error: 'Failed to fetch white-label history',
      message: error.message,
    });
  }
});

/**
 * POST /api/whitelabel/backup
 * Create a filesystem backup of a tenant's white-label configuration.
 * Body: { tenantId, label?: string }
 */
router.post('/backup', async (req: Request, res: Response) => {
  try {
    const { tenantId, label } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        error: 'Missing required field',
        required: ['tenantId'],
      });
    }

    const { data: config, error: configErr } = await getTenantConfig(tenantId);
    if (configErr || !config) {
      return res.status(404).json({
        error: 'Tenant configuration not found',
        tenantId,
      });
    }

    const backupDir = ensureBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `whitelabel-${tenantId}-${timestamp}${label ? `-${label.replace(/\s+/g, '-')}` : ''}.json`;
    const filePath = path.join(backupDir, filename);

    const backupPayload = {
      id: randomUUID(),
      tenantId,
      createdAt: new Date().toISOString(),
      createdBy: (req as any).userEmail || (req as any).session?.userEmail || null,
      label: label || null,
      config,
    };

    fs.writeFileSync(filePath, JSON.stringify(backupPayload, null, 2), 'utf-8');

    await insertHistoryEntry({
      id: randomUUID(),
      tenant_id: tenantId,
      action: 'backup',
      source_tenant_id: tenantId,
      changes: backupPayload,
      changed_by: (req as any).userEmail || (req as any).session?.userEmail || null,
      changed_at: new Date().toISOString(),
      metadata: { filename, filePath },
    });

    res.status(201).json({
      message: 'Backup created successfully',
      backup: {
        id: backupPayload.id,
        tenantId,
        filename,
        createdAt: backupPayload.createdAt,
      },
    });
  } catch (error: any) {
    await errorLogger.logError('White-label backup failed', error, {
      endpoint: '/api/whitelabel/backup',
      method: 'POST',
    });
    res.status(500).json({
      error: 'Failed to create white-label backup',
      message: error.message,
    });
  }
});

/**
 * POST /api/whitelabel/restore
 * Restore a tenant's white-label configuration from a filesystem backup file.
 * Body: { tenantId, filename }
 */
router.post('/restore', async (req: Request, res: Response) => {
  try {
    const { tenantId, filename } = req.body;

    if (!tenantId || !filename) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['tenantId', 'filename'],
      });
    }

    const backupDir = ensureBackupDir();
    const filePath = path.join(backupDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'Backup file not found',
        filename,
      });
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const backupPayload = JSON.parse(raw);

    if (backupPayload.tenantId !== tenantId) {
      return res.status(400).json({
        error: 'Backup tenantId does not match requested tenantId',
      });
    }

    const config = backupPayload.config;
    const { data: existingConfig } = await getTenantConfig(tenantId);

    if (existingConfig) {
      const { error: updateErr } = await supabase!
        .from('white_label_configs')
        .update({ ...config, updated_at: new Date().toISOString() })
        .eq('tenant_id', tenantId);
      if (updateErr) {
        throw updateErr;
      }
    } else {
      const { error: insertErr } = await supabase!
        .from('white_label_configs')
        .insert({ ...config, tenant_id: tenantId, id: undefined });
      if (insertErr) {
        throw insertErr;
      }
    }

    await insertHistoryEntry({
      id: randomUUID(),
      tenant_id: tenantId,
      action: 'restore',
      source_tenant_id: tenantId,
      changes: config,
      changed_by: (req as any).userEmail || (req as any).session?.userEmail || null,
      changed_at: new Date().toISOString(),
      metadata: { filename, restoredFrom: filePath },
    });

    res.json({
      message: 'Configuration restored successfully',
      tenantId,
      filename,
      restoredConfig: config,
    });
  } catch (error: any) {
    await errorLogger.logError('White-label restore failed', error, {
      endpoint: '/api/whitelabel/restore',
      method: 'POST',
    });
    res.status(500).json({
      error: 'Failed to restore white-label configuration',
      message: error.message,
    });
  }
});

/**
 * GET /api/whitelabel/backups/:tenantId
 * List available filesystem backups for a tenant.
 */
router.get('/backups/:tenantId', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const backupDir = ensureBackupDir();

    const files = fs
      .readdirSync(backupDir)
      .filter((f) => f.startsWith(`whitelabel-${tenantId}-`) && f.endsWith('.json'))
      .map((filename) => {
        const fullPath = path.join(backupDir, filename);
        const stats = fs.statSync(fullPath);
        return {
          filename,
          size: stats.size,
          createdAt: stats.birthtime.toISOString(),
          modifiedAt: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      tenantId,
      backups: files,
      count: files.length,
    });
  } catch (error: any) {
    await errorLogger.logError('Failed to list white-label backups', error, {
      endpoint: `/api/whitelabel/backups/${req.params.tenantId}`,
      method: 'GET',
    });
    res.status(500).json({
      error: 'Failed to list backups',
      message: error.message,
    });
  }
});

/**
 * GET /api/whitelabel/stream/:tenantId
 * SSE stream of real-time white-label config changes for a tenant.
 * Polls the database and streams change events to connected clients.
 */
router.get('/stream/:tenantId', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const pollIntervalMs = parseInt((req.query.interval as string) || '5000', 10);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    res.write(`data: ${JSON.stringify({ type: 'connected', tenantId, timestamp: new Date().toISOString() })}\n\n`);

    let lastTimestamp = new Date().toISOString();
    const interval = setInterval(async () => {
      try {
        const { data: newEntries, error } = await supabase!
          .from('whitelabel_settings_history')
          .select('*')
          .eq('tenant_id', tenantId)
          .gt('changed_at', lastTimestamp)
          .order('changed_at', { ascending: true });

        if (error) {
          res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
          return;
        }

        if (newEntries && newEntries.length > 0) {
          for (const entry of newEntries) {
            res.write(`data: ${JSON.stringify({ type: 'change', payload: entry })}\n\n`);
          }
          lastTimestamp = newEntries[newEntries.length - 1].changed_at;
        }

        res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`);
      } catch (err: any) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
      }
    }, pollIntervalMs);

    req.on('close', () => {
      clearInterval(interval);
    });
  } catch (error: any) {
    await errorLogger.logError('White-label stream setup failed', error, {
      endpoint: `/api/whitelabel/stream/${req.params.tenantId}`,
      method: 'GET',
    });
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to establish stream',
        message: error.message,
      });
    }
  }
});

export default router;
