/**
 * Database Connection Manager
 * Provides connection pooling, retry logic, and monitoring for production readiness
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { errorLogger } from './errorLogger';

export interface DatabaseConfig {
  connectionString: string;
  maxConnections: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  retryAttempts: number;
  retryDelay: number;
}

class DatabaseManager {
  private static instance: DatabaseManager;
  private pool: Pool;
  private _isConnected: boolean = false;
  private config: DatabaseConfig;

  constructor() {
    this.config = {
      connectionString: process.env.DATABASE_URL || '',
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
      retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '3'),
      retryDelay: parseInt(process.env.DB_RETRY_DELAY || '1000')
    };

    if (!this.config.connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    this.pool = new Pool({
      connectionString: this.config.connectionString,
      max: this.config.maxConnections,
      idleTimeoutMillis: this.config.idleTimeoutMillis,
      connectionTimeoutMillis: this.config.connectionTimeoutMillis,
    });

    this.setupEventHandlers();
    this.testConnection();
  }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private setupEventHandlers(): void {
    this.pool.on('connect', (client: PoolClient) => {
      console.log('New database connection established');
    });

    this.pool.on('error', (err: Error, client: PoolClient) => {
      console.error('Unexpected database error:', err);
      errorLogger.logError('Database connection error', err);
    });

    this.pool.on('remove', (client: PoolClient) => {
      console.log('Database connection removed from pool');
    });
  }

  private async testConnection(): Promise<void> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      this._isConnected = true;
      console.log('Database connection test successful');
    } catch (error: any) {
      console.error('Database connection test failed:', error.message);
      this._isConnected = false;
      errorLogger.logError('Database connection test failed', error);
    }
  }

  /**
   * Execute query with retry logic and connection management
   */
  async query(
    text: string,
    params?: any[],
    retries: number = this.config.retryAttempts
  ): Promise<QueryResult> {
    let lastError: Error;

    for (let attempt = 1; attempt <= retries; attempt++) {
      const client = await this.getClient();

      try {
        const startTime = Date.now();
        const result = await client.query(text, params);
        const duration = Date.now() - startTime;

        // Log slow queries (>100ms)
        if (duration > 100) {
          console.warn(`Slow query (${duration}ms): ${text.substring(0, 100)}...`);
        }

        return result;
      } catch (error: any) {
        lastError = error;
        console.error(`Database query attempt ${attempt} failed:`, error.message);

        // Check if error is retryable
        if (this.isRetryableError(error) && attempt < retries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`Retrying query in ${delay}ms...`);
          await this.delay(delay);
          continue;
        }

        // Log error for non-retryable errors or final attempt
        await errorLogger.logError('Database query failed', error, {
          query: text.substring(0, 200),
          attempt,
          retries
        });

        throw error;
      } finally {
        client.release();
      }
    }

    throw lastError!;
  }

  /**
   * Execute transaction with automatic rollback on error
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
    retries: number = this.config.retryAttempts
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= retries; attempt++) {
      const client = await this.pool.connect();

      try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
      } catch (error: any) {
        await client.query('ROLLBACK');
        lastError = error;

        console.error(`Transaction attempt ${attempt} failed:`, error.message);

        if (this.isRetryableError(error) && attempt < retries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          await this.delay(delay);
          continue;
        }

        await errorLogger.logError('Database transaction failed', error, {
          attempt,
          retries
        });

        throw error;
      } finally {
        client.release();
      }
    }

    throw lastError!;
  }

  /**
   * Get client from pool with timeout
   */
  private async getClient(): Promise<PoolClient> {
    try {
      return await this.pool.connect();
    } catch (error: any) {
      console.error('Failed to get database client:', error.message);
      throw new Error('Database connection pool exhausted');
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    const retryableCodes = [
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'EAI_AGAIN',
      '57P01', // admin_shutdown
      '57P03', // cannot_connect_now
      '53300', // too_many_connections
      '40001', // serialization_failure
      '40P01'  // deadlock_detected
    ];

    return retryableCodes.includes(error.code) ||
           error.message?.includes('connection') ||
           error.message?.includes('timeout');
  }

  /**
   * Get connection pool statistics
   */
  getPoolStats(): {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  } {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    isHealthy: boolean;
    poolStats: any;
    lastError?: string;
  }> {
    const poolStats = this.getPoolStats();

    try {
      await this.query('SELECT 1');
      return {
        isHealthy: true,
        poolStats
      };
    } catch (error: any) {
      return {
        isHealthy: false,
        poolStats,
        lastError: error.message
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async close(): Promise<void> {
    console.log('Closing database connection pool...');
    await this.pool.end();
    this._isConnected = false;
    console.log('Database connection pool closed');
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if database is connected
   */
  get isConnected(): boolean {
    return this._isConnected;
  }
}

// Export singleton instance
export const db = DatabaseManager.getInstance();