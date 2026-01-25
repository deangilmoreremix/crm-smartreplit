/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascade failures and provides graceful degradation
 */

import { errorLogger } from './errorLogger';

export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half-open'
}

export interface CircuitBreakerConfig {
  failureThreshold: number;     // Number of failures before opening
  recoveryTimeout: number;      // Time to wait before trying half-open (ms)
  monitoringPeriod: number;     // Time window for failure counting (ms)
  successThreshold: number;     // Successes needed to close circuit in half-open
  timeout: number;             // Request timeout (ms)
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime: number = 0;
  private lastSuccessTime: number = 0;
  private totalRequests: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;

  private config: CircuitBreakerConfig;

  constructor(
    private name: string,
    config: Partial<CircuitBreakerConfig> = {}
  ) {
    this.config = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringPeriod: 60000, // 1 minute
      successThreshold: 3,
      timeout: 5000, // 5 seconds
      ...config
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        console.log(`Circuit breaker ${this.name}: Attempting reset`);
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }

    try {
      // Add timeout to the function
      const result = await this.withTimeout(fn(), this.config.timeout);

      this.onSuccess();
      return result;

    } catch (error: any) {
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Execute with timeout
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      promise
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timeout));
    });
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.successes++;
    this.totalSuccesses++;
    this.lastSuccessTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.successes >= this.config.successThreshold) {
        this.reset();
      }
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(error: Error): void {
    this.failures++;
    this.totalFailures++;
    this.lastFailureTime = Date.now();

    // Reset successes on failure
    this.successes = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      // Immediately go back to open on half-open failure
      this.state = CircuitState.OPEN;
      console.log(`Circuit breaker ${this.name}: Half-open attempt failed, returning to OPEN`);
    } else if (this.failures >= this.config.failureThreshold) {
      this.trip();
    }

    // Log the failure
    errorLogger.logError(`Circuit breaker ${this.name} failure`, error, {
      state: this.state,
      failures: this.failures,
      totalFailures: this.totalFailures
    });
  }

  /**
   * Check if we should attempt to reset the circuit
   */
  private shouldAttemptReset(): boolean {
    return Date.now() - this.lastFailureTime >= this.config.recoveryTimeout;
  }

  /**
   * Trip the circuit breaker (open it)
   */
  private trip(): void {
    this.state = CircuitState.OPEN;
    console.log(`Circuit breaker ${this.name}: TRIPPED - Opening circuit`);

    // Log circuit breaker trip
    errorLogger.logError(`Circuit breaker ${this.name} tripped`, new Error('Circuit breaker opened'), {
      failures: this.failures,
      failureThreshold: this.config.failureThreshold
    });
  }

  /**
   * Reset the circuit breaker (close it)
   */
  private reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    console.log(`Circuit breaker ${this.name}: RESET - Closing circuit`);
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  manualReset(): void {
    this.reset();
    console.log(`Circuit breaker ${this.name}: Manually reset`);
  }

  /**
   * Manually trip the circuit breaker
   */
  manualTrip(): void {
    this.trip();
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Check if circuit is available for requests
   */
  isAvailable(): boolean {
    return this.state === CircuitState.CLOSED ||
           (this.state === CircuitState.HALF_OPEN && this.shouldAttemptReset());
  }
}

// Circuit breaker registry for managing multiple breakers
class CircuitBreakerRegistry {
  private breakers = new Map<string, CircuitBreaker>();

  /**
   * Get or create a circuit breaker
   */
  getBreaker(
    name: string,
    config?: Partial<CircuitBreakerConfig>
  ): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, config));
    }
    return this.breakers.get(name)!;
  }

  /**
   * Get all circuit breaker stats
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    for (const [name, breaker] of this.breakers) {
      stats[name] = breaker.getStats();
    }
    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.manualReset();
    }
  }

  /**
   * Get circuit breaker health summary
   */
  getHealthSummary(): {
    total: number;
    open: number;
    halfOpen: number;
    closed: number;
    issues: string[];
  } {
    let open = 0;
    let halfOpen = 0;
    let closed = 0;
    const issues: string[] = [];

    for (const [name, breaker] of this.breakers) {
      const state = breaker.getState();
      switch (state) {
        case CircuitState.OPEN:
          open++;
          issues.push(`${name} circuit is OPEN`);
          break;
        case CircuitState.HALF_OPEN:
          halfOpen++;
          issues.push(`${name} circuit is HALF-OPEN`);
          break;
        case CircuitState.CLOSED:
          closed++;
          break;
      }
    }

    return {
      total: this.breakers.size,
      open,
      halfOpen,
      closed,
      issues
    };
  }
}

// Export singleton registry
export const circuitBreakerRegistry = new CircuitBreakerRegistry();

// Pre-configured circuit breakers for common services
export const dnsCircuitBreaker = circuitBreakerRegistry.getBreaker('dns', {
  failureThreshold: 3,
  recoveryTimeout: 30000, // 30 seconds
  timeout: 5000
});

export const sslCircuitBreaker = circuitBreakerRegistry.getBreaker('ssl', {
  failureThreshold: 5,
  recoveryTimeout: 60000, // 1 minute
  timeout: 10000
});

export const aiCircuitBreaker = circuitBreakerRegistry.getBreaker('ai', {
  failureThreshold: 10,
  recoveryTimeout: 120000, // 2 minutes
  timeout: 30000 // 30 seconds
});

export const emailCircuitBreaker = circuitBreakerRegistry.getBreaker('email', {
  failureThreshold: 5,
  recoveryTimeout: 60000,
  timeout: 10000
});

export const storageCircuitBreaker = circuitBreakerRegistry.getBreaker('storage', {
  failureThreshold: 3,
  recoveryTimeout: 30000,
  timeout: 15000
});

// Utility function to execute with circuit breaker
export async function withCircuitBreaker<T>(
  breaker: CircuitBreaker,
  fn: () => Promise<T>,
  fallback?: () => T
): Promise<T> {
  try {
    return await breaker.execute(fn);
  } catch (error) {
    if (fallback) {
      console.warn(`Circuit breaker failed, using fallback: ${(error as Error).message}`);
      return fallback();
    }
    throw error;
  }
}

// Health check function for circuit breakers
export function getCircuitBreakerHealth(): {
  healthy: boolean;
  summary: any;
  details: Record<string, CircuitBreakerStats>;
} {
  const summary = circuitBreakerRegistry.getHealthSummary();
  const details = circuitBreakerRegistry.getAllStats();

  const healthy = summary.open === 0 && summary.halfOpen === 0;

  return {
    healthy,
    summary,
    details
  };
}