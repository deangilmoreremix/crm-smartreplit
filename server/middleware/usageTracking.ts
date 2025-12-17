import { Request, Response, NextFunction } from 'express';
import { UsageTrackingService } from '../services/usageTrackingService';

// Extend Request interface for file uploads
interface RequestWithFile extends Request {
  file?: {
    size: number;
    mimetype: string;
    originalname: string;
  };
}

/**
 * Middleware to track API usage
 */
export const trackApiUsage = (featureName: string, unit: string = 'requests') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Override res.json to capture response
    const originalJson = res.json;
    res.json = function(data: any) {
      // Record usage after response is sent
      const userId = (req as any).user?.id;
      if (userId) {
        const quantity = 1; // One API call
        const processingTime = Date.now() - startTime;

        UsageTrackingService.recordUsage({
          userId,
          eventType: 'api_call',
          featureName,
          quantity,
          unit,
          metadata: {
            method: req.method,
            path: req.path,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            processingTimeMs: processingTime,
            statusCode: res.statusCode,
            responseSize: JSON.stringify(data).length
          }
        }).catch(error => {
          console.error('Error recording API usage:', error);
        });
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Middleware to track AI usage (tokens, etc.)
 */
export const trackAiUsage = (modelName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    res.json = function(data: any) {
      const userId = (req as any).user?.id;
      if (userId && data) {
        // Extract token usage from AI response
        const inputTokens = data.usage?.prompt_tokens || data.usage?.input_tokens || 0;
        const outputTokens = data.usage?.completion_tokens || data.usage?.output_tokens || 0;
        const totalTokens = inputTokens + outputTokens;

        if (totalTokens > 0) {
          UsageTrackingService.recordUsage({
            userId,
            eventType: 'ai_generation',
            featureName: 'ai_tokens',
            quantity: totalTokens,
            unit: 'tokens',
            metadata: {
              model: modelName,
              inputTokens,
              outputTokens,
              totalTokens,
              requestType: req.body?.type || 'unknown'
            }
          }).catch(error => {
            console.error('Error recording AI usage:', error);
          });
        }
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Middleware to track storage usage
 */
export const trackStorageUsage = (operation: 'upload' | 'download' | 'delete') => {
  return async (req: RequestWithFile, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    res.json = function(data: any) {
      const userId = (req as any).user?.id;
      if (userId) {
        let quantity = 0;
        let unit = 'bytes';

        if (operation === 'upload' && req.file) {
          quantity = req.file.size;
        } else if (operation === 'download' && data) {
          // Estimate download size
          quantity = JSON.stringify(data).length;
        } else if (operation === 'delete') {
          quantity = 1; // Count deletions
          unit = 'files';
        }

        if (quantity > 0) {
          UsageTrackingService.recordUsage({
            userId,
            eventType: 'storage_operation',
            featureName: 'storage',
            quantity,
            unit,
            metadata: {
              operation,
              fileType: req.file?.mimetype || 'unknown',
              fileName: req.file?.originalname || 'unknown'
            }
          }).catch(error => {
            console.error('Error recording storage usage:', error);
          });
        }
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Generic usage tracking middleware
 */
export const trackUsage = (options: {
  eventType: string;
  featureName: string;
  quantity?: number;
  unit?: string;
  getQuantity?: (req: Request, res: Response) => number;
  getMetadata?: (req: Request, res: Response) => Record<string, any>;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    res.json = function(data: any) {
      const userId = (req as any).user?.id;
      if (userId) {
        let quantity = options.quantity || 1;
        if (options.getQuantity) {
          quantity = options.getQuantity(req, res);
        }

        let metadata = {};
        if (options.getMetadata) {
          metadata = options.getMetadata(req, res);
        }

        UsageTrackingService.recordUsage({
          userId,
          eventType: options.eventType,
          featureName: options.featureName,
          quantity,
          unit: options.unit || 'units',
          metadata: {
            ...metadata,
            path: req.path,
            method: req.method
          }
        }).catch(error => {
          console.error('Error recording usage:', error);
        });
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Middleware to enforce usage limits
 */
export const enforceUsageLimits = (featureName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      return next();
    }

    try {
      // For now, just pass through - limits are enforced at the service level
      // TODO: Implement proper limit checking based on user limits
      next();
    } catch (error) {
      console.error('Error enforcing usage limits:', error);
      // Allow request to continue if limit check fails
      next();
    }
  };
};