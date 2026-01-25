/**
 * Centralized Error Logging Service
 * Provides structured error logging with support for multiple backends
 * (Sentry, DataDog, custom logging services)
 */

interface ErrorContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  userAgent?: string;
  ip?: string;
  [key: string]: any;
}

interface ErrorLogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  error?: Error;
  context?: ErrorContext;
  stack?: string;
}

class ErrorLogger {
  private sentryEnabled: boolean;
  private datadogEnabled: boolean;
  private logToFile: boolean;

  constructor() {
    this.sentryEnabled = !!process.env.SENTRY_DSN;
    this.datadogEnabled = !!process.env.DATADOG_API_KEY;
    this.logToFile = process.env.LOG_TO_FILE === 'true';
  }

  /**
   * Log an error with context
   */
  async logError(
    message: string,
    error?: Error,
    context?: ErrorContext
  ): Promise<void> {
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      error,
      context,
      stack: error?.stack,
    };

    // Console logging (always enabled)
    this.logToConsole(logEntry);

    // Send to Sentry if configured
    if (this.sentryEnabled) {
      await this.sendToSentry(logEntry);
    }

    // Send to DataDog if configured
    if (this.datadogEnabled) {
      await this.sendToDataDog(logEntry);
    }

    // Log to file if enabled
    if (this.logToFile) {
      await this.writeToFile(logEntry);
    }
  }

  /**
   * Log a warning
   */
  async logWarning(message: string, context?: ErrorContext): Promise<void> {
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      context,
    };

    this.logToConsole(logEntry);

    if (this.logToFile) {
      await this.writeToFile(logEntry);
    }
  }

  /**
   * Log info message
   */
  async logInfo(message: string, context?: ErrorContext): Promise<void> {
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context,
    };

    if (process.env.NODE_ENV === 'development') {
      this.logToConsole(logEntry);
    }

    if (this.logToFile) {
      await this.writeToFile(logEntry);
    }
  }

  /**
   * Console logging with formatting
   */
  private logToConsole(entry: ErrorLogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';

    switch (entry.level) {
      case 'error':
        console.error(`${prefix} ${entry.message}${contextStr}`);
        if (entry.error) {
          console.error(entry.error);
        }
        break;
      case 'warn':
        console.warn(`${prefix} ${entry.message}${contextStr}`);
        break;
      case 'info':
        console.log(`${prefix} ${entry.message}${contextStr}`);
        break;
    }
  }

  /**
   * Send to Sentry (placeholder for actual implementation)
   */
  private async sendToSentry(entry: ErrorLogEntry): Promise<void> {
    try {
      // Sentry integration would go here
      // Example: Sentry.captureException(entry.error, { contexts: entry.context });
      
      // For now, just log that we would send to Sentry
      if (process.env.NODE_ENV === 'development') {
        console.log('[Sentry] Would send:', entry.message);
      }
    } catch (error) {
      console.error('Failed to send to Sentry:', error);
    }
  }

  /**
   * Send to DataDog (placeholder for actual implementation)
   */
  private async sendToDataDog(entry: ErrorLogEntry): Promise<void> {
    try {
      // DataDog integration would go here
      // Example: datadogLogs.logger.error(entry.message, entry.context);
      
      // For now, just log that we would send to DataDog
      if (process.env.NODE_ENV === 'development') {
        console.log('[DataDog] Would send:', entry.message);
      }
    } catch (error) {
      console.error('Failed to send to DataDog:', error);
    }
  }

  /**
   * Write to log file
   */
  private async writeToFile(entry: ErrorLogEntry): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const logDir = path.join(process.cwd(), 'logs');
      const logFile = path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`);

      // Ensure log directory exists
      try {
        await fs.mkdir(logDir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }

      // Append to log file
      const logLine = JSON.stringify(entry) + '\n';
      await fs.appendFile(logFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Create error context from Express request
   */
  createContextFromRequest(req: any): ErrorContext {
    return {
      userId: req.session?.userId || req.user?.id,
      requestId: req.id,
      endpoint: req.path,
      method: req.method,
      userAgent: req.get('user-agent'),
      ip: req.ip || req.connection.remoteAddress,
    };
  }

  /**
   * Express middleware for automatic error logging
   */
  errorMiddleware() {
    return async (err: Error, req: any, res: any, next: any) => {
      const context = this.createContextFromRequest(req);
      context.statusCode = res.statusCode || 500;

      await this.logError(
        `Unhandled error in ${req.method} ${req.path}`,
        err,
        context
      );

      // Pass to next error handler
      next(err);
    };
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();

// Export types
export type { ErrorContext, ErrorLogEntry };
