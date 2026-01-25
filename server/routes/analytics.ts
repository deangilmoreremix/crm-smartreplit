/**
 * Analytics API Routes
 * Handles analytics metrics, reports, and data export
 */

import { Router, Request, Response } from 'express';
import { analyticsEngine } from '../services/whitelabel/analyticsEngine';
import { errorLogger } from '../services/errorLogger';

const router = Router();

/**
 * POST /api/analytics/metrics
 * Record a metric
 */
router.post('/metrics', async (req: Request, res: Response) => {
  try {
    const { tenantId, metricType, metricValue, metadata } = req.body;

    if (!tenantId || !metricType || metricValue === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['tenantId', 'metricType', 'metricValue']
      });
    }

    const metric = await analyticsEngine.recordMetric(
      tenantId,
      metricType,
      metricValue,
      metadata
    );

    res.status(201).json({
      message: 'Metric recorded successfully',
      metric
    });

  } catch (error: any) {
    await errorLogger.logError('Metric recording failed', error, {
      endpoint: '/api/analytics/metrics',
      method: 'POST'
    });

    res.status(500).json({
      error: 'Failed to record metric',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/metrics/:tenantId
 * Get metrics for tenant
 */
router.get('/metrics/:tenantId', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { metricType, startDate, endDate } = req.query;

    const metrics = await analyticsEngine.getMetrics(
      tenantId,
      metricType as string,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      metrics,
      count: metrics.length
    });

  } catch (error: any) {
    await errorLogger.logError('Failed to get metrics', error, {
      endpoint: `/api/analytics/metrics/${req.params.tenantId}`,
      method: 'GET'
    });

    res.status(500).json({
      error: 'Failed to get metrics',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/summary/:tenantId
 * Get analytics summary for tenant
 */
router.get('/summary/:tenantId', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { startDate, endDate } = req.query;

    // Default to last 30 days if not specified
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const summary = await analyticsEngine.getAnalyticsSummary(tenantId, start, end);

    res.json({
      summary,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
        days: Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
      }
    });

  } catch (error: any) {
    await errorLogger.logError('Failed to get analytics summary', error, {
      endpoint: `/api/analytics/summary/${req.params.tenantId}`,
      method: 'GET'
    });

    res.status(500).json({
      error: 'Failed to get analytics summary',
      message: error.message
    });
  }
});

/**
 * POST /api/analytics/reports
 * Create new report
 */
router.post('/reports', async (req: Request, res: Response) => {
  try {
    const { tenantId, name, description, config, schedule, recipients, format } = req.body;
    const userId = (req as any).session?.userId;

    if (!tenantId || !name || !config || !schedule || !format) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['tenantId', 'name', 'config', 'schedule', 'format']
      });
    }

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const report = await analyticsEngine.createReport(
      tenantId,
      name,
      config,
      schedule,
      recipients || [],
      format,
      userId,
      description
    );

    res.status(201).json({
      message: 'Report created successfully',
      report
    });

  } catch (error: any) {
    await errorLogger.logError('Report creation failed', error, {
      endpoint: '/api/analytics/reports',
      method: 'POST'
    });

    res.status(500).json({
      error: 'Failed to create report',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/reports/:tenantId
 * List reports for tenant
 */
router.get('/reports/:tenantId', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;

    const reports = await analyticsEngine.listReports(tenantId);

    res.json({
      reports,
      count: reports.length
    });

  } catch (error: any) {
    await errorLogger.logError('Failed to list reports', error, {
      endpoint: `/api/analytics/reports/${req.params.tenantId}`,
      method: 'GET'
    });

    res.status(500).json({
      error: 'Failed to list reports',
      message: error.message
    });
  }
});

/**
 * POST /api/analytics/reports/:reportId/generate
 * Generate report
 */
router.post('/reports/:reportId/generate', async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;

    const result = await analyticsEngine.generateReport(reportId);

    // Set appropriate content type
    const contentTypes: Record<string, string> = {
      json: 'application/json',
      csv: 'text/csv',
      pdf: 'application/pdf',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };

    res.setHeader('Content-Type', contentTypes[result.format] || 'application/json');
    
    if (result.format === 'json') {
      res.json(result.data);
    } else {
      res.send(result.data);
    }

  } catch (error: any) {
    await errorLogger.logError('Report generation failed', error, {
      endpoint: `/api/analytics/reports/${req.params.reportId}/generate`,
      method: 'POST'
    });

    res.status(500).json({
      error: 'Failed to generate report',
      message: error.message
    });
  }
});

/**
 * PUT /api/analytics/reports/:reportId
 * Update report
 */
router.put('/reports/:reportId', async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const updates = req.body;

    const report = await analyticsEngine.updateReport(reportId, updates);

    res.json({
      message: 'Report updated successfully',
      report
    });

  } catch (error: any) {
    await errorLogger.logError('Report update failed', error, {
      endpoint: `/api/analytics/reports/${req.params.reportId}`,
      method: 'PUT'
    });

    res.status(500).json({
      error: 'Failed to update report',
      message: error.message
    });
  }
});

/**
 * DELETE /api/analytics/reports/:reportId
 * Delete report
 */
router.delete('/reports/:reportId', async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;

    await analyticsEngine.deleteReport(reportId);

    res.json({
      message: 'Report deleted successfully',
      reportId
    });

  } catch (error: any) {
    await errorLogger.logError('Report deletion failed', error, {
      endpoint: `/api/analytics/reports/${req.params.reportId}`,
      method: 'DELETE'
    });

    res.status(500).json({
      error: 'Failed to delete report',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/export/:tenantId
 * Export data
 */
router.get('/export/:tenantId', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { dataType, format } = req.query;

    if (!dataType || !format) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['dataType', 'format']
      });
    }

    const validDataTypes = ['contacts', 'deals', 'tasks', 'all'];
    const validFormats = ['csv', 'json', 'excel'];

    if (!validDataTypes.includes(dataType as string)) {
      return res.status(400).json({
        error: 'Invalid dataType',
        validDataTypes
      });
    }

    if (!validFormats.includes(format as string)) {
      return res.status(400).json({
        error: 'Invalid format',
        validFormats
      });
    }

    const result = await analyticsEngine.exportData(
      tenantId,
      dataType as any,
      format as any
    );

    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    
    if (result.format === 'json') {
      res.json(result.data);
    } else {
      res.send(result.data);
    }

  } catch (error: any) {
    await errorLogger.logError('Data export failed', error, {
      endpoint: `/api/analytics/export/${req.params.tenantId}`,
      method: 'GET'
    });

    res.status(500).json({
      error: 'Failed to export data',
      message: error.message
    });
  }
});

export default router;
