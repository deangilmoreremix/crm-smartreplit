interface AppHealthStatus {
  name: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastChecked: Date;
  responseTime?: number;
  error?: string;
}

class RemoteAppHealthService {
  private healthStatus: Map<string, AppHealthStatus> = new Map();
  private checkInterval: number = 300000; // 5 minutes
  private intervalId: NodeJS.Timeout | null = null;

  // Remote apps to monitor
  private apps = [
    { name: 'Remote Pipeline', url: 'https://cheery-syrniki-b5b6ca.netlify.app' },
    { name: 'Remote Contacts', url: 'https://taupe-sprinkles-83c9ee.netlify.app' },
    { name: 'FunnelCraft AI', url: 'https://serene-valkyrie-fec320.netlify.app' },
    { name: 'ContentAI', url: 'https://capable-mermaid-3c73fa.netlify.app' },
    { name: 'White Label Platform', url: 'https://moonlit-tarsier-239e70.netlify.app' },
    { name: 'SmartCRM Closer', url: 'https://stupendous-twilight-64389a.netlify.app' }
  ];

  constructor() {
    this.startMonitoring();
  }

  private async checkAppHealth(app: { name: string; url: string }): Promise<AppHealthStatus> {
    const startTime = Date.now();

    try {
      const response = await fetch(app.url, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      const responseTime = Date.now() - startTime;
      const status: AppHealthStatus = {
        name: app.name,
        url: app.url,
        status: 'healthy',
        lastChecked: new Date(),
        responseTime
      };

      return status;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const status: AppHealthStatus = {
        name: app.name,
        url: app.url,
        status: 'unhealthy',
        lastChecked: new Date(),
        responseTime,
        error: error.message || 'Network error'
      };

      return status;
    }
  }

  private async performHealthChecks(): Promise<void> {
    const checks = this.apps.map(app => this.checkAppHealth(app));
    const results = await Promise.all(checks);

    results.forEach(result => {
      this.healthStatus.set(result.name, result);
    });

    // Log unhealthy apps
    const unhealthyApps = results.filter(app => app.status === 'unhealthy');
    if (unhealthyApps.length > 0) {
      console.warn('Unhealthy remote apps detected:', unhealthyApps);
    }

    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('remoteAppHealthUpdate', {
      detail: { healthStatus: Object.fromEntries(this.healthStatus) }
    }));
  }

  public startMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Initial check
    this.performHealthChecks();

    // Set up periodic checks
    this.intervalId = setInterval(() => {
      this.performHealthChecks();
    }, this.checkInterval);
  }

  public stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public getHealthStatus(): Map<string, AppHealthStatus> {
    return new Map(this.healthStatus);
  }

  public getAppHealth(appName: string): AppHealthStatus | undefined {
    return this.healthStatus.get(appName);
  }

  public async checkAppNow(appName: string): Promise<AppHealthStatus | null> {
    const app = this.apps.find(a => a.name === appName);
    if (!app) return null;

    const status = await this.checkAppHealth(app);
    this.healthStatus.set(appName, status);

    window.dispatchEvent(new CustomEvent('remoteAppHealthUpdate', {
      detail: { healthStatus: Object.fromEntries(this.healthStatus) }
    }));

    return status;
  }

  public getHealthyApps(): string[] {
    return Array.from(this.healthStatus.values())
      .filter(status => status.status === 'healthy')
      .map(status => status.name);
  }

  public getUnhealthyApps(): string[] {
    return Array.from(this.healthStatus.values())
      .filter(status => status.status === 'unhealthy')
      .map(status => status.name);
  }
}

// Create singleton instance
export const remoteAppHealthService = new RemoteAppHealthService();

// React hook for health monitoring
import { useState, useEffect } from 'react';

export function useRemoteAppHealth() {
  const [healthStatus, setHealthStatus] = useState<Map<string, AppHealthStatus>>(new Map());

  useEffect(() => {
    // Get initial status
    setHealthStatus(remoteAppHealthService.getHealthStatus());

    // Listen for updates
    const handleHealthUpdate = (event: CustomEvent) => {
      const newStatus = new Map(Object.entries(event.detail.healthStatus));
      setHealthStatus(newStatus);
    };

    window.addEventListener('remoteAppHealthUpdate', handleHealthUpdate as EventListener);

    return () => {
      window.removeEventListener('remoteAppHealthUpdate', handleHealthUpdate as EventListener);
    };
  }, []);

  return {
    healthStatus,
    checkAppNow: remoteAppHealthService.checkAppNow.bind(remoteAppHealthService),
    getHealthyApps: remoteAppHealthService.getHealthyApps.bind(remoteAppHealthService),
    getUnhealthyApps: remoteAppHealthService.getUnhealthyApps.bind(remoteAppHealthService)
  };
}

export type { AppHealthStatus };
