import { Request, Response, NextFunction } from 'express';

// Simple audit logging middleware
export function auditLog(action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timestamp = new Date().toISOString();
    const userId = (req as any).user?.id || 'anonymous';
    const userEmail = (req as any).user?.username || 'unknown';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const method = req.method;
    const path = req.path;
    const userAgent = req.get('User-Agent') || 'unknown';

    // Log the action
    console.log(`🔍 AUDIT [${timestamp}] ${action}: ${userEmail} (${userId}) from ${ip} - ${method} ${path}`);

    // Store in response for potential database logging later
    (res as any).auditData = {
      timestamp,
      userId,
      userEmail,
      action,
      ip,
      method,
      path,
      userAgent,
      params: req.params,
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined
    };

    next();
  };
}

// Specific audit loggers for admin actions
export const auditUserCreate = auditLog('USER_CREATE');
export const auditUserUpdate = auditLog('USER_UPDATE');
export const auditUserDelete = auditLog('USER_DELETE');
export const auditBulkImport = auditLog('BULK_IMPORT');
export const auditRoleChange = auditLog('ROLE_CHANGE');
export const auditTierChange = auditLog('TIER_CHANGE');
export const auditEmailSend = auditLog('EMAIL_SEND');
export const auditSettingsChange = auditLog('SETTINGS_CHANGE');