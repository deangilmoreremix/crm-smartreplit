import { Router, Request, Response } from 'express';
import { requireAuth } from './auth';
import { db } from '../db';
import { deals, contacts } from '../../shared/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { BusinessAnalysisService } from '../services/businessAnalysisService';

const router = Router();

router.get('/metrics', requireAuth(), async (req: any, res: Response) => {
  try {
    const userId = (req as any).userId;
    const metrics = await BusinessAnalysisService.getBusinessMetrics(userId);
    res.json(metrics);
  } catch (error: any) {
    console.error('Failed to fetch business metrics:', error);
    res.status(500).json({ error: 'Failed to fetch business metrics' });
  }
});

router.get('/stats', requireAuth(), async (req: any, res: Response) => {
  try {
    const userId = (req as any).userId;
    const stats = await BusinessAnalysisService.getBusinessStats(userId);
    res.json(stats);
  } catch (error: any) {
    console.error('Failed to fetch business stats:', error);
    res.status(500).json({ error: 'Failed to fetch business stats' });
  }
});

router.get('/insights', requireAuth(), async (req: any, res: Response) => {
  try {
    const userId = (req as any).userId;
    const insights = await BusinessAnalysisService.getBusinessInsights(userId);
    res.json(insights);
  } catch (error: any) {
    console.error('Failed to fetch business insights:', error);
    res.status(500).json({ error: 'Failed to fetch business insights' });
  }
});

router.get('/reports', requireAuth(), async (req: any, res: Response) => {
  try {
    const userId = (req as any).userId;
    const reports = await BusinessAnalysisService.getBusinessReports(userId);
    res.json(reports);
  } catch (error: any) {
    console.error('Failed to fetch business reports:', error);
    res.status(500).json({ error: 'Failed to fetch business reports' });
  }
});

router.post('/analyze-metrics', requireAuth(), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { metrics, context } = req.body;

    if (!Array.isArray(metrics) || metrics.length === 0) {
      return res.status(400).json({ error: 'Metrics array is required' });
    }

    const result = await BusinessAnalysisService.getBusinessMetrics(userId);
    res.json(result);
  } catch (error: any) {
    console.error('Analyze metrics error:', error);
    res.status(500).json({
      error: 'Failed to analyze business metrics',
      message: error?.message || 'Unknown error',
    });
  }
});

router.post('/generate-insights', requireAuth(), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { businessDescription, goals, constraints } = req.body;

    if (!businessDescription || typeof businessDescription !== 'string') {
      return res.status(400).json({ error: 'Business description is required' });
    }

    if (!Array.isArray(goals) || goals.length === 0) {
      return res.status(400).json({ error: 'Goals array is required' });
    }

    const result = await BusinessAnalysisService.getBusinessInsights(userId);
    res.json({ insights: result });
  } catch (error: any) {
    console.error('Generate insights error:', error);
    res.status(500).json({
      error: 'Failed to generate business insights',
      message: error?.message || 'Unknown error',
    });
  }
});

router.post('/generate-report', requireAuth(), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { reportType, data, format } = req.body;

    if (!reportType || typeof reportType !== 'string') {
      return res.status(400).json({ error: 'Report type is required' });
    }

    if (!data) {
      return res.status(400).json({ error: 'Report data is required' });
    }

    const result = await BusinessAnalysisService.getBusinessReports(userId);
    res.json(result);
  } catch (error: any) {
    console.error('Generate report error:', error);
    res.status(500).json({
      error: 'Failed to generate business report',
      message: error?.message || 'Unknown error',
    });
  }
});

router.post('/analyze-competitors', requireAuth(), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { industry, competitors, differentiators } = req.body;

    if (!industry || typeof industry !== 'string') {
      return res.status(400).json({ error: 'Industry is required' });
    }

    if (!Array.isArray(competitors) || competitors.length === 0) {
      return res.status(400).json({ error: 'Competitors array is required' });
    }

    if (!Array.isArray(differentiators) || differentiators.length === 0) {
      return res.status(400).json({ error: 'Differentiators array is required' });
    }

    res.json({
      industry,
      competitors,
      differentiators,
      analysis: {
        competitivePositioning: 'Strong',
        threats: [],
        opportunities: [],
        recommendations: [],
      },
    });
  } catch (error: any) {
    console.error('Analyze competitors error:', error);
    res.status(500).json({
      error: 'Failed to analyze competitors',
      message: error?.message || 'Unknown error',
    });
  }
});

export function registerBusinessAnalysisRoutes(app: any) {
  app.use('/api/business-analysis', router);
}

export default router;
